import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { RefreshTokenDto } from '../dtos/auth.dto.js';
import { UnauthorizedError } from '../../../../shared/errors/app-error.js';
import { JwtService } from '../../infrastructure/jwt.service.js';

export class RefreshTokenUseCase {
  constructor(private userRepository: UserRepository) {}

  public async execute(dto: RefreshTokenDto) {
    // 1. Verify token signature
    JwtService.verifyRefreshToken(dto.refreshToken);

    // 2. Check token in DB
    const oldHash = JwtService.hashToken(dto.refreshToken);
    const storedToken = await this.userRepository.findRefreshToken(oldHash);

    if (!storedToken) {
      throw new UnauthorizedError('Refresh token không tồn tại, đã bị thu hồi hoặc đã hết hạn');
    }

    const { user } = storedToken;

    // 3. Token Rotation: Revoke old token
    await this.userRepository.revokeRefreshToken(oldHash);

    // 4. Issue new token pair
    const globalRoles = (user as any).userRoles.map((ur: any) => ur.role.code);
    const newTokens = JwtService.generateTokens({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      globalRoles,
    });

    // 5. Save new token hash
    const newHash = JwtService.hashToken(newTokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.userRepository.saveRefreshToken(user.id, newHash, expiresAt);

    return newTokens;
  }
}

