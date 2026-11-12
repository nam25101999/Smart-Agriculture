import bcrypt from 'bcryptjs';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { RegisterDto } from '../dtos/auth.dto.js';
import { ConflictError } from '../../../../shared/errors/app-error.js';
import { prisma } from '../../../../infrastructure/database/prisma.client.js';

export class RegisterUseCase {
  constructor(private userRepository: UserRepository) {}

  public async execute(dto: RegisterDto) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('Email này đã được sử dụng bởi tài khoản khác');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Default to FARM_OWNER role for new registrations
    const farmOwnerRole = await prisma.role.findUnique({
      where: { code: 'FARM_OWNER' },
    });

    const user = await this.userRepository.create({
      ...dto,
      passwordHash,
      defaultRoleId: farmOwnerRole?.id,
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}

