import { Router } from 'express';
import { BusinessRuleError } from '../../../lib/errors/specific-errors';
import { AuthService } from '../../../domains/auth/services/auth.service';
import { AuthenticationError } from '../../../lib/errors/specific-errors';

const router = Router();

// ==========================================
// AUTHENTICATION ENDPOINTS - PROPER DI USAGE
// ==========================================

// POST /api/v1/auth/login
// User login with auto-detection and permission loading
router.post('/login', async (req, res, next) => {
  const { email, password, restaurantId } = req.body;
  const correlationId = req.correlationId;

  if (!email || !password) {
    return next(
      new BusinessRuleError(
        'Email and password are required',
        correlationId
      )
    );
  }

  try {
    // ✅ SIMPLE DI RESOLUTION - Direct AuthService resolution
    console.log('🔍 Resolving AuthService from container...');
    const authService = req.container.resolve('authService') as AuthService;

    if (!authService) {
      console.error('🚨 AuthService not resolved from container!');
      throw new AuthenticationError('Service configuration error', correlationId);
    }

    console.log('✅ AuthService resolved successfully');

    console.log('🔍 Attempting login for:', { email, restaurantId, correlationId });

    const result = await authService.login({
      email,
      password,
      restaurantId, // Now optional - will auto-detect if not provided
      correlationId
    });

    console.log('✅ Login successful:', { email, correlationId });

    res.status(200).json({
      success: true,
      data: result,
      correlationId
    });
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
    // ✅ SIMPLE DI RESOLUTION - Direct AuthService resolution
    console.log('🔍 Resolving AuthService from container...');
    const authService = req.container.resolve('authService') as AuthService;

    if (!authService) {
      console.error('🚨 AuthService not resolved from container!');
      throw new AuthenticationError('Service configuration error', correlationId);
    }

    console.log('✅ AuthService resolved successfully');

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
    // ✅ SIMPLE DI RESOLUTION - Direct AuthService resolution
    console.log('🔍 Resolving AuthService from container...');
    const authService = req.container.resolve('authService') as AuthService;

    if (!authService) {
      console.error('🚨 AuthService not resolved from container!');
      throw new AuthenticationError('Service configuration error', correlationId);
    }

    console.log('✅ AuthService resolved successfully');
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

// POST /api/v1/auth/logout
// User logout
router.post('/logout', async (req, res, next) => {
  const correlationId = req.correlationId;

  try {
    // Note: logout method doesn't exist yet, this is a placeholder
    // const authService = req.container.resolve('authService') as AuthService;
    // await authService.logout(refreshToken);

    res.json({
      success: true,
      message: 'Logged out successfully (logout method to be implemented)',
      correlationId
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/reset-password
// Password reset request
router.post('/reset-password', async (req, res, next) => {
  const { email, restaurantId } = req.body;
  const correlationId = req.correlationId;

  if (!email || !restaurantId) {
    return next(new BusinessRuleError('Email and restaurant ID are required', correlationId));
  }

  try {
    // ✅ SIMPLE DI RESOLUTION - Direct AuthService resolution
    console.log('🔍 Resolving AuthService from container...');
    const authService = req.container.resolve('authService') as AuthService;

    if (!authService) {
      console.error('🚨 AuthService not resolved from container!');
      throw new AuthenticationError('Service configuration error', correlationId);
    }

    console.log('✅ AuthService resolved successfully');
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

// POST /api/v1/auth/reset-password/confirm
// Password reset confirmation
router.post('/reset-password/confirm', async (req, res, next) => {
  const { token, newPassword } = req.body;
  const correlationId = req.correlationId;

  if (!token || !newPassword) {
    return next(new BusinessRuleError('Token and new password are required', correlationId));
  }

  try {
    // ✅ SIMPLE DI RESOLUTION - Direct AuthService resolution
    console.log('🔍 Resolving AuthService from container...');
    const authService = req.container.resolve('authService') as AuthService;

    if (!authService) {
      console.error('🚨 AuthService not resolved from container!');
      throw new AuthenticationError('Service configuration error', correlationId);
    }

    console.log('✅ AuthService resolved successfully');
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

// GET /api/v1/auth/status
// Check authentication status (public endpoint for frontend integration)
router.get('/status', async (req, res, next) => {
  const correlationId = req.correlationId;

  try {
    // Check if there's a valid authorization header
    const authHeader = req.headers.authorization;
    let isAuthenticated = false;
    let user = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const authService = req.container.resolve('authService') as AuthService;

        if (authService) {
          const decoded = await authService.verifyToken(token);
          if (decoded) {
            isAuthenticated = true;
            user = {
              id: decoded.userId,
              email: decoded.email,
              role: decoded.role,
              restaurantId: decoded.restaurantId
            };
          }
        }
      } catch (error) {
        // Token is invalid, but don't throw error - just return unauthenticated status
        console.log('Invalid token provided:', error.message);
      }
    }

    res.json({
      success: true,
      data: {
        isAuthenticated,
        user,
        features: {
          authentication: true,
          userManagement: true,
          roleHierarchy: true,
          permissions: true
        }
      },
      correlationId
    });
  } catch (error) {
    next(error);
  }
});

export default router;
