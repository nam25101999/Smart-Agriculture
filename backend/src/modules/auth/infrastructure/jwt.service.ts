import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../../shared/config/env.js';
import { AuthUserPayload } from '../../../shared/types/express.d.js';
import { UnauthorizedError } from '../../../shared/errors/app-error.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export class JwtService {
  public static generateTokens(user: AuthUserPayload): TokenPair {
    const payload = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.globalRoles,
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    };
  }

  public static verifyAccessToken(token: string): AuthUserPayload {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
      return {
        id: decoded.sub,
        email: decoded.email,
        fullName: decoded.fullName,
        globalRoles: decoded.roles || [],
      };
    } catch {
      throw new UnauthorizedError('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  public static verifyRefreshToken(token: string): { userId: string } {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as any;
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return { userId: decoded.sub };
    } catch {
      throw new UnauthorizedError('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

