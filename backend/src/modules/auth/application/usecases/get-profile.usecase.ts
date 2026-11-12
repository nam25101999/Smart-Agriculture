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
      roles: (user as any).userRoles?.map((ur: any) => ur.role.code) || [],
      farmMemberships: (user as any).farmMemberships?.map((fm: any) => ({
        farmId: fm.farmId,
        farmName: fm.farm?.name || '',
        role: fm.role?.code || '',
      })) || [],
      createdAt: user.createdAt,
    };
  }
}

