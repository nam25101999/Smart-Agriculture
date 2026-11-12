import bcrypt from 'bcryptjs';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { ChangePasswordDto } from '../dtos/auth.dto.js';
import { BadRequestError, NotFoundError } from '../../../../shared/errors/app-error.js';

export class ChangePasswordUseCase {
  constructor(private userRepository: UserRepository) {}

  public async execute(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Không tìm thấy thông tin người dùng');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestError('Mật khẩu hiện tại không chính xác');
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(dto.newPassword, salt);

    await this.userRepository.updatePassword(userId, newHash);
    // Revoke all existing refresh sessions for safety
    await this.userRepository.revokeAllUserTokens(userId);

    return { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại trên các thiết bị.' };
  }
}

