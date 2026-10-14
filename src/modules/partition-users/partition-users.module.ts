import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartitionUserEntity } from '../../entities/partition-user.entity';
import { PartitionUsersController } from './controllers/partition-users.controller';
import { PartitionUsersService } from './services/partition-users.service';
import { TypeORMPartitionUsersRepository } from './repositories/typeorm-partition-users.repository';
import { PartitionSessionGuard } from './guards/partition-session.guard';
import { PartitionOptionalSessionGuard } from './guards/partition-optional-session.guard';

@Module({
  imports: [TypeOrmModule.forFeature([PartitionUserEntity])],
  controllers: [PartitionUsersController],
  providers: [
    PartitionUsersService,
    TypeORMPartitionUsersRepository,
    PartitionSessionGuard,
    PartitionOptionalSessionGuard,
  ],
  // Гарды и сервис нужны домену конструкций
  exports: [PartitionUsersService, PartitionSessionGuard, PartitionOptionalSessionGuard],
})
export class PartitionUsersModule {}
