import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartitionsController } from './partitions.controller';
import { PartitionsService } from './partitions.service';
import { PartitionSystemEntity } from './entities/partition-system.entity';
import { PartitionUserEntity } from './entities/partition-user.entity';
import { PartitionLikeEntity } from './entities/partition-like.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PartitionSystemEntity,
      PartitionUserEntity,
      PartitionLikeEntity,
    ]),
  ],
  controllers: [PartitionsController],
  providers: [PartitionsService],
})
export class PartitionsModule {}
