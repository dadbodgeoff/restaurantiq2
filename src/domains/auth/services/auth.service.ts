import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../restaurant/repositories/user.repository';
import { JwtService } from '../../../infrastructure/security/jwt/jwt.service';
import { PermissionService } from '../../../infrastructure/security/permission.service';
import { PasswordService } from '../../../infrastructure/security/password.service';
import { LoggerService } from '../../../infrastructure/logging/logger.service';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { User } from '../../shared/types/restaurant';
import { UserRole } from '../../shared/types/permissions';
import { AuthenticationError, BusinessRuleError, ConflictError } from '../../../lib/errors/specific-errors';

export interface LoginRequest {
  email: string;
  password: string;
  restaurantId: string;
  correlationId?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  restaurantId: string;
  correlationId?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    restaurantId: string;
    permissions: string[];
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly permissionService: PermissionService,
    private readonly passwordService: PasswordService,
    private readonly logger: LoggerService,
    private readonly database: DatabaseService
  ) {}

  async login(request: LoginRequest): Promise<AuthResponse> {
    const correlationId = request.correlationId || 'unknown';

    // 1. Find user by email and restaurant
    const user = await this.userRepository.findByEmailAndRestaurant(
      request.email,
      request.restaurantId
    );

    if (!user) {
      this.logger.warn('Login Attempt', `Invalid email: ${request.email}`, {
        correlationId,
        email: request.email,
        restaurantId: request.restaurantId
      });
      throw new AuthenticationError('Invalid credentials', correlationId);
    }

    // 2. Check if account is locked
    const lockStatus = await this.permissionService.isAccountLocked(user.id);
    if (lockStatus.locked) {
      const remainingTime = lockStatus.remainingTime || 0;
      throw new AuthenticationError(
        `Account locked. Try again in ${remainingTime} minutes.`,
        correlationId
      );
    }

    // 3. Verify password
    if (!user.password) {
      throw new AuthenticationError('Account not properly configured', correlationId);
    }

    const isValidPassword = await this.passwordService.verifyPassword(
      request.password,
      user.password
    );

    if (!isValidPassword) {
      // Increment failed attempts
      await this.permissionService.handleFailedLogin(user.id);

      this.logger.warn('Login Attempt', `Invalid password for user: ${user.email}`, {
        correlationId,
        userId: user.id,
        email: user.email
      });

      throw new AuthenticationError('Invalid credentials', correlationId);
    }

    // 4. Reset failed attempts on successful login
    if ((user.failedLoginAttempts ?? 0) > 0) {
      await this.permissionService.resetLoginAttempts(user.id);
    }

    // 5. Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // 6. Get user permissions
    const userPermissions = await this.permissionService.getUserPermissions(user.id);

    // 7. Generate tokens with permissions
    const accessToken = this.jwtService.generateAccessToken({
      userId: user.id,
      restaurantId: user.restaurantId,
      role: user.role,
      permissions: userPermissions.allPermissions
    });

    const refreshToken = this.jwtService.generateRefreshToken({
      userId: user.id,
    });

    this.logger.info('User Login', `User logged in successfully: ${user.email}`, {
      correlationId,
      userId: user.id,
      restaurantId: user.restaurantId,
      role: user.role
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        restaurantId: user.restaurantId,
        permissions: userPermissions.allPermissions
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async register(request: RegisterRequest): Promise<User> {
    const correlationId = request.correlationId || 'unknown';

    // 1. Validate password strength
    if (!this.passwordService.validatePasswordStrength(request.password)) {
      throw new BusinessRuleError(
        'Password must contain at least 8 characters with uppercase, lowercase, number, and special character',
        correlationId
      );
    }

    // 2. Check if user already exists
    const existingUser = await this.userRepository.findByEmailAndRestaurant(
      request.email,
      request.restaurantId
    );

    if (existingUser) {
      throw new ConflictError('User already exists', correlationId);
    }

    // 3. Hash password
    const hashedPassword = await this.passwordService.hashPassword(request.password);

    // 4. Create user
    const user = await this.userRepository.create({
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
      role: request.role || UserRole.STAFF,
      restaurantId: request.restaurantId,
      password: hashedPassword,
      failedLoginAttempts: 0,
      isActive: true
    });

    this.logger.info('User Registration', `User registered successfully: ${user.email}`, {
      correlationId,
      userId: user.id,
      restaurantId: user.restaurantId,
      role: user.role
    });

    return user;
  }

  async validateToken(token: string): Promise<User | null> {
    const payload = this.jwtService.verifyAccessToken(token);
    if (!payload) return null;

    const user = await this.userRepository.findById(payload.userId);
    if (!user || !user.isActive) return null;

    return user;
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const payload = this.jwtService.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new AuthenticationError('Invalid refresh token', 'unknown');
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive', 'unknown');
    }

    // Get user permissions for the new token
    const userPermissions = await this.permissionService.getUserPermissions(user.id);

    const accessToken = this.jwtService.generateAccessToken({
      userId: user.id,
      restaurantId: user.restaurantId,
      role: user.role,
      permissions: userPermissions.allPermissions
    });

    return { accessToken };
  }

  // ==========================================
  // PASSWORD RESET FUNCTIONALITY
  // ==========================================

  async initiatePasswordReset(email: string, restaurantId: string): Promise<void> {
    const user = await this.userRepository.findByEmailAndRestaurant(email, restaurantId);
    if (!user) {
      // Don't reveal if user exists or not for security
      return;
    }

    const resetToken = this.passwordService.generatePasswordResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const prisma = this.database.getClient();

    // Store reset token in database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt
      }
    });

    // TODO: Send email with reset token
    this.logger.info('Password Reset', `Password reset initiated for user: ${user.email}`, {
      userId: user.id,
      email: user.email
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const prisma = this.database.getClient();

    // Find valid reset token
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
      throw new AuthenticationError('Invalid or expired reset token', 'unknown');
    }

    // Validate new password strength
    if (!this.passwordService.validatePasswordStrength(newPassword)) {
      throw new BusinessRuleError(
        'Password must contain at least 8 characters with uppercase, lowercase, number, and special character',
        'unknown'
      );
    }

    // Hash new password
    const hashedPassword = await this.passwordService.hashPassword(newPassword);

    // Update user password
    await this.userRepository.update(resetRecord.userId, {
      password: hashedPassword
    });

    // Mark token as used
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true }
    });

    this.logger.info('Password Reset', `Password reset successfully for user: ${resetRecord.user.email}`, {
      userId: resetRecord.userId
    });
  }
}
