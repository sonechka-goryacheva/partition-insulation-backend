import { Global, Module } from '@nestjs/common';
import { PartitionSessionService } from './services/partition-session.service';

// Глобальный модуль: сервис сессий доступен в любом модуле без импорта
@Global()
@Module({
  providers: [PartitionSessionService],
  exports: [PartitionSessionService],
})
export class PartitionSessionsModule {}
