import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartitionUserEntity } from '../../entities/partition-user.entity';
import { PartitionUsersController } from './controllers/partition-users.controller';
import { PartitionUsersService } from './services/partition-users.service';
import { TypeORMPartitionUsersRepository } from './repositories/typeorm-partition-users.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PartitionUserEntity])],
  controllers: [PartitionUsersController],
  providers: [PartitionUsersService, TypeORMPartitionUsersRepository],
})
export class PartitionUsersModule {}
