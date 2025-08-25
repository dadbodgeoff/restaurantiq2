import * as bcrypt from 'bcryptjs';
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
  restaurantId?: string; // Now optional for auto-detection
  correlationId?: string;
}

export interface RestaurantSelection {
  requiresRestaurantSelection: boolean;
  restaurants: Array<{
    id: string;
    name: string;
  }>;
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

export interface LoginResponse extends AuthResponse {
  requiresRestaurantSelection?: boolean;
  restaurants?: Array<{
    id: string;
    name: string;
  }>;
}

// Special case for auto-detection that doesn't have user yet
export interface AutoDetectionResponse {
  user?: undefined;
  tokens?: undefined;
  requiresRestaurantSelection: true;
  restaurants: Array<{
    id: string;
    name: string;
  }>;
}

// Union type for auto-detection responses
export type AutoDetectionResult = LoginResponse | AutoDetectionResponse;

export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly permissionService: PermissionService,
    private readonly passwordService: PasswordService,
    private readonly loggerService: LoggerService,
    private readonly databaseService: DatabaseService
  ) {
    // ENHANCED DEBUG LOGGING - Detailed parameter analysis
    console.log('🔧 AuthService constructor called');
    console.log('🔍 AuthService constructor parameters:');
    console.log(`   userRepository: ${typeof userRepository} - ${userRepository?.constructor?.name || 'undefined'}`);
    console.log(`   jwtService: ${typeof jwtService} - ${jwtService?.constructor?.name || 'undefined'}`);
    console.log(`   permissionService: ${typeof permissionService} - ${permissionService?.constructor?.name || 'undefined'}`);
    console.log(`   passwordService: ${typeof passwordService} - ${passwordService?.constructor?.name || 'undefined'}`);
    console.log(`   loggerService: ${typeof loggerService} - ${loggerService?.constructor?.name || 'undefined'}`);
    console.log(`   databaseService: ${typeof databaseService} - ${databaseService?.constructor?.name || 'undefined'}`);
    
    // Enhanced dependency validation
    console.log('🔍 Dependency injection status:');
    console.log('📝 LoggerService injected:', !!this.loggerService);
    console.log('👤 UserRepository injected:', !!this.userRepository);
    console.log('🔐 JwtService injected:', !!this.jwtService);
    console.log('🛡️ PermissionService injected:', !!this.permissionService);
    console.log('🔑 PasswordService injected:', !!this.passwordService);
    console.log('🗄️ DatabaseService injected:', !!this.databaseService);

    // Safety check - if any critical dependencies are missing
    if (!this.loggerService || !this.userRepository || !this.jwtService) {
      console.error('🚨 CRITICAL: Missing dependencies in AuthService!');
      console.error('   LoggerService:', !!this.loggerService);
      console.error('   UserRepository:', !!this.userRepository);
      console.error('   JwtService:', !!this.jwtService);
      console.error('   Parameter names check:');
      console.error('   - loggerService parameter:', typeof this.loggerService);
      console.error('   - jwtService parameter:', typeof this.jwtService);
    } else {
      console.log('✅ All dependencies injected successfully!');
    }
  }

  async login(request: LoginRequest): Promise<LoginResponse | AutoDetectionResponse> {
    const correlationId = request.correlationId || 'unknown';

    // VALIDATE INPUT
    if (!request.email?.trim()) {
      throw new AuthenticationError('Email is required', correlationId);
    }

    if (!request.password?.trim()) {
      throw new AuthenticationError('Password is required', correlationId);
    }

    // AUTO-DETECTION LOGIC: If restaurantId not provided, find user across all restaurants
    if (!request.restaurantId) {
      return this.handleAutoDetectionLogin(request);
    }

    // EXPLICIT RESTAURANT: If restaurantId provided, use specific restaurant
    return this.handleExplicitRestaurantLogin(request);
  }

  private async handleAutoDetectionLogin(request: LoginRequest): Promise<AutoDetectionResult> {
    const correlationId = request.correlationId || 'unknown';

    // SAFETY CHECKS - Prevent undefined errors
    console.log('🔍 Auto-detection safety checks:');
    console.log('   LoggerService:', !!this.loggerService, typeof this.loggerService);
    console.log('   UserRepository:', !!this.userRepository, typeof this.userRepository);

    if (!this.loggerService) {
      console.error('🚨 Logger not injected in AuthService!');
      throw new AuthenticationError('Logger service not available', correlationId);
    }

    if (!this.userRepository) {
      console.error('🚨 UserRepository not injected in AuthService!');
      throw new AuthenticationError('User repository not available', correlationId);
    }

    console.log('🔍 AUTO-DETECTION REQUEST:', {
      correlationId,
      email: request.email,
      emailTrimmed: request.email?.trim()
    });

    // Find all users with the given email across all restaurants
    const users = await this.userRepository.findByEmail(request.email);

    console.log('🔍 AUTO-DETECTION FOUND USERS:', {
      correlationId,
      email: request.email,
      totalUsers: users.length,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        restaurantId: u.restaurantId,
        restaurantName: u.restaurant?.name,
        isActive: u.isActive
      }))
    });

    if (users.length === 0) {
      this.loggerService.warn('Auto-Detect Login Failed', `No users found with email: ${request.email}`, {
        correlationId,
        email: request.email
      });
      throw new AuthenticationError('No account found with this email', correlationId);
    }

    // Filter active users only
    const activeUsers = users.filter(u => u.isActive);

    if (activeUsers.length === 0) {
      this.loggerService.warn('Auto-Detect Login Failed', `No active users found with email: ${request.email}`, {
        correlationId,
        email: request.email
      });
      throw new AuthenticationError('Account is not active', correlationId);
    }

    if (activeUsers.length === 1) {
      // Single active user found - use it directly
      const user = activeUsers[0];
      console.log('🔍 SINGLE USER FOUND - PROCEEDING WITH LOGIN:', {
        correlationId,
        userId: user.id,
        email: user.email,
        restaurantId: user.restaurantId,
        restaurantName: user.restaurant?.name
      });
      return this.loginWithUser(user, request.password, correlationId);
    }

    // Multiple active users found - return selection options
    console.log('🔍 MULTIPLE USERS FOUND - RETURNING SELECTION:', {
      correlationId,
      totalActiveUsers: activeUsers.length,
      restaurants: activeUsers.map(u => ({
        id: u.restaurantId,
        name: u.restaurant?.name || 'Unknown Restaurant',
        userId: u.id,
        userRole: u.role
      }))
    });

    return {
      user: undefined, // No authenticated user yet
      tokens: undefined, // No tokens yet
      requiresRestaurantSelection: true,
      restaurants: activeUsers.map(u => ({
        id: u.restaurantId,
        name: u.restaurant?.name || 'Unknown Restaurant'
      }))
    };
  }

  private async handleExplicitRestaurantLogin(request: LoginRequest): Promise<LoginResponse> {
    const correlationId = request.correlationId || 'unknown';

    // SAFETY CHECKS
    if (!this.userRepository) {
      console.error('🚨 UserRepository not injected in AuthService!');
      throw new AuthenticationError('Service configuration error', correlationId);
    }

    // VALIDATE INPUT PARAMETERS
    if (!request.email?.trim() || !request.restaurantId?.trim()) {
      console.error('🚨 INVALID REQUEST PARAMETERS:', {
        correlationId,
        hasEmail: !!request.email,
        hasRestaurantId: !!request.restaurantId,
        emailTrimmed: request.email?.trim(),
        restaurantIdTrimmed: request.restaurantId?.trim()
      });
      throw new AuthenticationError('Email and restaurant ID are required', correlationId);
    }

    // DETAILED REQUEST LOGGING
    console.log('🔐 AUTH REQUEST:', {
      correlationId,
      email: request.email,
      restaurantId: request.restaurantId,
      emailLength: request.email?.length,
      restaurantIdLength: request.restaurantId?.length,
      emailTrimmed: request.email?.trim(),
      restaurantIdTrimmed: request.restaurantId?.trim()
    });

    // Find user by email and restaurant
    console.log('🔍 Looking up user:', {
      email: request.email,
      restaurantId: request.restaurantId,
      emailTrimmed: request.email?.trim(),
      restaurantIdTrimmed: request.restaurantId?.trim()
    });

    const user = await this.userRepository.findByEmailAndRestaurant(
      request.email,
      request.restaurantId!
    );

    console.log('🔍 USER LOOKUP RESULT:', {
      correlationId,
      found: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userRestaurantId: user?.restaurantId,
      userIsActive: user?.isActive,
      hasPassword: !!user?.password,
      passwordLength: user?.password?.length
    });

    if (!user) {
      // LOG ALL USERS IN SYSTEM FOR DEBUGGING
      try {
        const allUsers = await this.userRepository.findByEmail(request.email);
        console.log('🔍 ALL USERS WITH EMAIL:', {
          correlationId,
          email: request.email,
          totalUsers: allUsers.length,
          users: allUsers.map(u => ({
            id: u.id,
            email: u.email,
            restaurantId: u.restaurantId,
            restaurantName: u.restaurant?.name,
            isActive: u.isActive
          }))
        });
      } catch (error) {
        console.error('🚨 Error fetching all users for debugging:', error);
      }

      this.loggerService.warn('Explicit Restaurant Login', `Invalid email or restaurant: ${request.email}`, {
        correlationId,
        email: request.email,
        restaurantId: request.restaurantId
      });
      throw new AuthenticationError('Invalid credentials', correlationId);
    }

    return this.loginWithUser(user, request.password, correlationId);
  }

  private async loginWithUser(user: User, password: string, correlationId: string): Promise<LoginResponse> {
    console.log('🔍 loginWithUser called with:', { 
      userId: user.id, 
      email: user.email, 
      hasPassword: !!user.password,
      passwordLength: user.password?.length 
    });
    
    // SAFETY CHECKS
    if (!this.loggerService || !this.passwordService || !this.permissionService || !this.jwtService) {
      console.error('🚨 Missing dependencies in loginWithUser!');
      console.error('   Logger:', !!this.loggerService);
      console.error('   PasswordService:', !!this.passwordService);
      console.error('   PermissionService:', !!this.permissionService);
      console.error('   JwtService:', !!this.jwtService);
      throw new AuthenticationError('Service configuration error', correlationId);
    }

    // 1. Check if account is locked
    const lockStatus = await this.permissionService.isAccountLocked(user.id);
    if (lockStatus.locked) {
      const remainingTime = lockStatus.remainingTime || 0;
      throw new AuthenticationError(
        `Account locked. Try again in ${remainingTime} minutes.`,
        correlationId
      );
    }

    // 2. Verify password
    if (!user.password) {
      console.log('🚨 No password hash found for user:', user.email);
      throw new AuthenticationError('Account not properly configured', correlationId);
    }

    console.log('🔐 About to verify password for user:', user.email);
    const isValidPassword = await this.passwordService.verifyPassword(
      password,
      user.password
    );
    console.log('🔐 Password verification completed, result:', isValidPassword);

    if (!isValidPassword) {
      // Increment failed attempts
      await this.permissionService.handleFailedLogin(user.id);

      this.loggerService.warn('Invalid Password', `Invalid password for user: ${user.email}`, {
        correlationId,
        userId: user.id,
        email: user.email
      });

      throw new AuthenticationError('Invalid credentials', correlationId);
    }

    // 3. Reset failed attempts on successful login
    if ((user.failedLoginAttempts ?? 0) > 0) {
      await this.permissionService.resetLoginAttempts(user.id);
    }

    // 4. Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // 5. Get user permissions
    const userPermissions = await this.permissionService.getUserPermissions(user.id);

    // 6. Generate tokens with permissions
    const accessToken = this.jwtService.generateAccessToken({
      userId: user.id,
      restaurantId: user.restaurantId,
      role: user.role,
      permissions: userPermissions.allPermissions
    });

    const refreshToken = this.jwtService.generateRefreshToken({
      userId: user.id,
    });

    this.loggerService.info('User Login Success', `User logged in successfully: ${user.email}`, {
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

    this.loggerService.info('User Registration', `User registered successfully: ${user.email}`, {
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

    const prisma = this.databaseService.getClient();

    // Store reset token in database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt
      }
    });

    // TODO: Send email with reset token
    this.loggerService.info('Password Reset', `Password reset initiated for user: ${user.email}`, {
      userId: user.id,
      email: user.email
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const prisma = this.databaseService.getClient();

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

    this.loggerService.info('Password Reset', `Password reset successfully for user: ${resetRecord.user.email}`, {
      userId: resetRecord.userId
    });
  }
}
