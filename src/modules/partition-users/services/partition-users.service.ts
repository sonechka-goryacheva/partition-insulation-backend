import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { TypeORMPartitionUsersRepository } from '../repositories/typeorm-partition-users.repository';
import { PartitionSessionService } from '../../partition-sessions/services/partition-session.service';
import { RegisterPartitionUserDto } from '../dto/register-partition-user.dto';
import { LoginPartitionUserDto } from '../dto/login-partition-user.dto';
import { PartitionUserResponseDto } from '../dto/partition-user-response.dto';
import { PartitionUserEntity } from '../../../entities/partition-user.entity';

// Код PostgreSQL для нарушения уникальности (логин уже занят)
const POSTGRES_UNIQUE_VIOLATION = '23505';

// Сложность хеширования пароля bcrypt
const PARTITION_PASSWORD_SALT_ROUNDS = 10;

// Результат входа: id новой сессии (для куки) и данные пользователя (для ответа)
export interface PartitionLoginResult {
  sessionId: string;
  partitionUser: PartitionUserResponseDto;
}

@Injectable()
export class PartitionUsersService {
  constructor(
    private readonly partitionUsersRepository: TypeORMPartitionUsersRepository,
    private readonly partitionSessionService: PartitionSessionService,
  ) {}

  // Регистрация: id назначается в БД, пароль сохраняется только в виде хеша
  async register(registerDto: RegisterPartitionUserDto): Promise<PartitionUserResponseDto> {
    const existingUser = await this.partitionUsersRepository.findByLogin(registerDto.partitionUserLogin);
    if (existingUser) {
      throw new NotFoundException();
    }

    const passwordHash = await bcrypt.hash(registerDto.partitionUserPassword, PARTITION_PASSWORD_SALT_ROUNDS);

    try {
      const partitionUser = await this.partitionUsersRepository.create({
        partitionUserLogin: registerDto.partitionUserLogin,
        partitionUserName: registerDto.partitionUserName,
        partitionUserPassword: passwordHash,
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

  // Аутентификация: проверка логина и пароля, создание сессии в Redis.
  // Неверный логин или пароль — 401
  async login(loginDto: LoginPartitionUserDto): Promise<PartitionLoginResult> {
    const partitionUser = await this.partitionUsersRepository.findByLogin(loginDto.partitionUserLogin);
    if (
      !partitionUser ||
      !(await bcrypt.compare(loginDto.partitionUserPassword, partitionUser.partitionUserPassword))
    ) {
      throw new UnauthorizedException();
    }

    const sessionId = randomUUID();
    await this.partitionSessionService.create(sessionId, {
      partitionUserId: partitionUser.partitionUserId,
      partitionUserLogin: partitionUser.partitionUserLogin,
    });
    return { sessionId, partitionUser: this.toResponseDto(partitionUser) };
  }

  // Деавторизация: сессия удаляется из Redis
  async logout(sessionId: string): Promise<void> {
    await this.partitionSessionService.destroy(sessionId);
  }

  // Пользователь по сессии; нет сессии или пользователя — 401
  async validateSession(sessionId: string): Promise<PartitionUserEntity> {
    const partitionUserId = await this.partitionSessionService.getUserId(sessionId);
    if (!partitionUserId) {
      throw new UnauthorizedException();
    }
    const partitionUser = await this.partitionUsersRepository.findById(partitionUserId);
    if (!partitionUser) {
      throw new UnauthorizedException();
    }
    return partitionUser;
  }

  private toResponseDto(partitionUser: PartitionUserEntity): PartitionUserResponseDto {
    return new PartitionUserResponseDto({
      partitionUserId: partitionUser.partitionUserId,
      partitionUserLogin: partitionUser.partitionUserLogin,
      partitionUserName: partitionUser.partitionUserName,
    });
  }
}
