import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

// Данные сессии: id и логин пользователя (логин нужен, чтобы видеть пользователя в Redis)
export interface PartitionSessionData {
  partitionUserId: number;
  partitionUserLogin: string;
}

// Кука с id сессии: httpOnly — недоступна из JavaScript (защита от XSS)
export const PARTITION_SESSION_COOKIE = 'partitionSessionId';

// Время жизни сессии по умолчанию — 1 час
export const PARTITION_SESSION_TTL_SECONDS = 3600;

// Ключ сессии в Redis: partition-session:<sessionId>
const PARTITION_SESSION_PREFIX = 'partition-session:';

@Injectable()
export class PartitionSessionService implements OnModuleDestroy {
  private readonly logger = new Logger(PartitionSessionService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: Number(this.configService.get<string>('REDIS_PORT')),
    });
    this.redis.on('error', (error) => {
      this.logger.error(`Ошибка Redis: ${error.message}`);
    });
  }

  // Создаёт сессию в Redis: хеш с id и логином пользователя, удаляется по истечении ttlSec
  async create(
    sessionId: string,
    sessionData: PartitionSessionData,
    ttlSec: number = PARTITION_SESSION_TTL_SECONDS,
  ): Promise<void> {
    const key = PARTITION_SESSION_PREFIX + sessionId;
    await this.redis
      .multi()
      .hset(key, {
        partitionUserId: String(sessionData.partitionUserId),
        partitionUserLogin: sessionData.partitionUserLogin,
      })
      .expire(key, ttlSec)
      .exec();
  }

  // Получает id пользователя по sessionId; null — сессии нет или она истекла
  async getUserId(sessionId: string): Promise<number | null> {
    const userIdStr = await this.redis.hget(PARTITION_SESSION_PREFIX + sessionId, 'partitionUserId');
    return userIdStr ? parseInt(userIdStr, 10) : null;
  }

  // Удаляет сессию (logout)
  async destroy(sessionId: string): Promise<void> {
    await this.redis.del(PARTITION_SESSION_PREFIX + sessionId);
  }

  // Проверяет, существует ли сессия
  async exists(sessionId: string): Promise<boolean> {
    const exists = await this.redis.exists(PARTITION_SESSION_PREFIX + sessionId);
    return exists === 1;
  }

  // Закрывает соединение с Redis при остановке приложения
  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
