import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { TypeORMPartitionUsersRepository } from '../repositories/typeorm-partition-users.repository';
import { RegisterPartitionUserDto } from '../dto/register-partition-user.dto';
import { LoginPartitionUserDto } from '../dto/login-partition-user.dto';
import { PartitionUserResponseDto } from '../dto/partition-user-response.dto';
import { PartitionUserEntity } from '../../../entities/partition-user.entity';

// Код PostgreSQL для нарушения уникальности (логин уже занят)
const POSTGRES_UNIQUE_VIOLATION = '23505';

@Injectable()
export class PartitionUsersService {
  constructor(private readonly partitionUsersRepository: TypeORMPartitionUsersRepository) {}

  // Регистрация: id и роль назначаются на бэкенде, новый пользователь — создатель.
  // Пароль пока хранится как есть, хеширование — в ЛР-4 вместе с авторизацией
  async register(registerDto: RegisterPartitionUserDto): Promise<PartitionUserResponseDto> {
    const existingUser = await this.partitionUsersRepository.findByLogin(registerDto.partitionUserLogin);
    if (existingUser) {
      throw new NotFoundException();
    }

    try {
      const partitionUser = await this.partitionUsersRepository.create({
        partitionUserLogin: registerDto.partitionUserLogin,
        partitionUserName: registerDto.partitionUserName,
        partitionUserPassword: registerDto.partitionUserPassword,
        partitionUserRole: 'designEngineer',
      });
      return this.toResponseDto(partitionUser);
    } catch (error) {
      // Параллельная регистрация с тем же логином: сработал уникальный индекс БД
      const driverError = error instanceof QueryFailedError
        ? (error.driverError as { code?: string })
        : undefined;
      if (driverError?.code === POSTGRES_UNIQUE_VIOLATION) {
        throw new NotFoundException();
      }
      throw error;
    }
  }

  // Аутентификация: заглушка до ЛР-4, формат запроса уже проверяется DTO
  async login(_loginDto: LoginPartitionUserDto): Promise<void> {
    return;
  }

  // Деавторизация: заглушка до ЛР-4
  async logout(): Promise<void> {
    return;
  }

  private toResponseDto(partitionUser: PartitionUserEntity): PartitionUserResponseDto {
    return new PartitionUserResponseDto({
      partitionUserId: partitionUser.partitionUserId,
      partitionUserLogin: partitionUser.partitionUserLogin,
      partitionUserName: partitionUser.partitionUserName,
      partitionUserRole: partitionUser.partitionUserRole,
    });
  }
}
