import * as jwt from 'jsonwebtoken';
import { getEnvConfig } from '../../../config/env';

export interface TokenPayload {
  userId: string;
  restaurantId: string;
  role: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
  jti: string;
  permissions?: string[]; // Added for permission system
  email?: string; // Added for user context
  firstName?: string; // Added for user context
  lastName?: string; // Added for user context
}

export interface RefreshTokenPayload {
  userId: string;
  jti: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

export class JwtService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor() {
    const config = getEnvConfig();
    this.accessSecret = config.JWT_SECRET;
    this.refreshSecret = config.JWT_REFRESH_SECRET;
    this.accessExpiresIn = config.JWT_EXPIRES_IN;
    this.refreshExpiresIn = config.JWT_REFRESH_EXPIRES_IN;
  }

  generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp' | 'jti' | 'type'>): string {
    const jti = this.generateJti();
    return jwt.sign(
      { ...payload, type: 'access' as const, jti },
      this.accessSecret,
      { expiresIn: this.accessExpiresIn } as jwt.SignOptions
    );
  }

  generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp' | 'jti' | 'type'>): string {
    const jti = this.generateJti();
    return jwt.sign(
      { ...payload, type: 'refresh' as const, jti },
      this.refreshSecret,
      { expiresIn: this.refreshExpiresIn } as jwt.SignOptions
    );
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(token, this.accessSecret) as TokenPayload;
      if (payload.type !== 'access') return null;
      return payload;
    } catch {
      return null;
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.refreshSecret) as RefreshTokenPayload;
      if (payload.type !== 'refresh') return null;
      return payload;
    } catch {
      return null;
    }
  }

  private generateJti(): string {
    return require('crypto').randomBytes(16).toString('hex');
  }
}
