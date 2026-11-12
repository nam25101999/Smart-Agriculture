import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { NotFoundError } from '../../../../shared/errors/app-error.js';

export class GetProfileUseCase {
  constructor(private userRepository: UserRepository) {}

  public async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Không tìm thấy tài khoản người dùng');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      status: user.status,
      roles: user.userRoles.map((ur) => ur.role.code),
      farmMemberships: user.farmMemberships.map((fm) => ({
        farmId: fm.farmId,
        farmName: fm.farm.name,
        role: fm.role.code,
      })),
      createdAt: user.createdAt,
    };
  }
}

