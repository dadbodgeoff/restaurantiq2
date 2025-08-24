import { Router } from 'express';
import { BusinessRuleError } from '../../../lib/errors/specific-errors';
import { AuthService } from '../../../domains/auth/services/auth.service';
import { UserRepository } from '../../../domains/restaurant/repositories/user.repository';

const router = Router();

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// POST /api/v1/auth/login
// User login with permission loading
router.post('/login', async (req, res, next) => {
  const { email, password, restaurantId } = req.body;
  const correlationId = req.correlationId;

  if (!email || !password || !restaurantId) {
    return next(
      new BusinessRuleError(
        'Email, password, and restaurant ID are required',
        correlationId
      )
    );
  }

  try {
    const prisma = req.container.resolve('prisma');
    const jwtService = req.container.resolve('jwtService');
    const permissionService = req.container.resolve('permissionService');
    const passwordService = req.container.resolve('passwordService');
    const loggerService = req.container.resolve('loggerService');
    const databaseService = req.container.resolve('databaseService');

    const userRepository = new UserRepository(prisma);

    const authService = new AuthService(
      userRepository,
      jwtService,
      permissionService,
      passwordService,
      loggerService,
      databaseService
    );

    try {
      const result = await authService.login({
        email,
        password,
        restaurantId,
        correlationId
      });

      res.status(200).json({
        success: true,
        data: result,
        correlationId
      });
    } catch (loginError) {
      loggerService.error('Login error', 'Authentication failed', {
        correlationId,
        error: loginError instanceof Error ? loginError.message : 'Unknown error'
      });
      next(loginError);
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/register
// User registration
router.post('/register', async (req, res, next) => {
  const { email, password, firstName, lastName, role, restaurantId } = req.body;
  const correlationId = req.correlationId;

  if (!email || !password || !firstName || !lastName || !restaurantId) {
    return next(
      new BusinessRuleError(
        'All fields are required',
        correlationId
      )
    );
  }

  try {
    const prisma = req.container.resolve('prisma');
    const jwtService = req.container.resolve('jwtService');
    const permissionService = req.container.resolve('permissionService');
    const passwordService = req.container.resolve('passwordService');
    const loggerService = req.container.resolve('loggerService');
    const databaseService = req.container.resolve('databaseService');

    const userRepository = new UserRepository(prisma);

    const authService = new AuthService(
      userRepository,
      jwtService,
      permissionService,
      passwordService,
      loggerService,
      databaseService
    );
    const user = await authService.register({
      email,
      password,
      firstName,
      lastName,
      role: role || 'STAFF',
      restaurantId,
      correlationId
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt
      },
      correlationId
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/refresh
// Token refresh
router.post('/refresh', async (req, res, next) => {
  const { refreshToken } = req.body;
  const correlationId = req.correlationId;

  if (!refreshToken) {
    return next(new BusinessRuleError('Refresh token is required', correlationId));
  }

  try {
    const prisma = req.container.resolve('prisma');
    const jwtService = req.container.resolve('jwtService');
    const permissionService = req.container.resolve('permissionService');
    const passwordService = req.container.resolve('passwordService');
    const loggerService = req.container.resolve('loggerService');
    const databaseService = req.container.resolve('databaseService');

    const userRepository = new UserRepository(prisma);

    const authService = new AuthService(
      userRepository,
      jwtService,
      permissionService,
      passwordService,
      loggerService,
      databaseService
    );

    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: result,
      correlationId
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/forgot-password
// Initiate password reset
router.post('/forgot-password', async (req, res, next) => {
  const { email, restaurantId } = req.body;
  const correlationId = req.correlationId;

  if (!email || !restaurantId) {
    return next(new BusinessRuleError('Email and restaurant ID are required', correlationId));
  }

  try {
    const prisma = req.container.resolve('prisma');
    const jwtService = req.container.resolve('jwtService');
    const permissionService = req.container.resolve('permissionService');
    const passwordService = req.container.resolve('passwordService');
    const loggerService = req.container.resolve('loggerService');
    const databaseService = req.container.resolve('databaseService');

    const userRepository = new UserRepository(prisma);

    const authService = new AuthService(
      userRepository,
      jwtService,
      permissionService,
      passwordService,
      loggerService,
      databaseService
    );

    await authService.initiatePasswordReset(email, restaurantId);

    res.json({
      success: true,
      message: 'Password reset email sent if account exists',
      correlationId
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/reset-password
// Complete password reset
router.post('/reset-password', async (req, res, next) => {
  const { token, newPassword, restaurantId } = req.body;
  const correlationId = req.correlationId;

  if (!token || !newPassword || !restaurantId) {
    return next(new BusinessRuleError('Token, new password, and restaurant ID are required', correlationId));
  }

  try {
    const prisma = req.container.resolve('prisma');
    const jwtService = req.container.resolve('jwtService');
    const permissionService = req.container.resolve('permissionService');
    const passwordService = req.container.resolve('passwordService');
    const loggerService = req.container.resolve('loggerService');
    const databaseService = req.container.resolve('databaseService');

    const userRepository = new UserRepository(prisma);

    const authService = new AuthService(
      userRepository,
      jwtService,
      permissionService,
      passwordService,
      loggerService,
      databaseService
    );

    await authService.resetPassword(token, newPassword);

    res.json({
      success: true,
      message: 'Password reset successfully',
      correlationId
    });
  } catch (error) {
    next(error);
  }
});

export default router;
