import bcrypt from 'bcryptjs';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { LoginDto } from '../dtos/auth.dto.js';
import { UnauthorizedError, ForbiddenError } from '../../../../shared/errors/app-error.js';
import { JwtService } from '../../infrastructure/jwt.service.js';

export class LoginUseCase {
  constructor(private userRepository: UserRepository) {}

  public async execute(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Email hoặc mật khẩu không chính xác');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Tài khoản đã bị tạm khóa hoặc vô hiệu hóa');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Email hoặc mật khẩu không chính xác');
    }

    const globalRoles = user.userRoles.map((ur) => ur.role.code);

    const tokens = JwtService.generateTokens({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      globalRoles,
    });

    // Hash refresh token and save in database (expires in 7 days)
    const tokenHash = JwtService.hashToken(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.userRepository.saveRefreshToken(user.id, tokenHash, expiresAt);

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: globalRoles,
      },
    };
  }
}

