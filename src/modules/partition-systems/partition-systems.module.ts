import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartitionSystemEntity } from '../../entities/partition-system.entity';
import { PartitionLikeEntity } from '../../entities/partition-like.entity';
import { PartitionSystemsController } from './controllers/partition-systems.controller';
import { PartitionSystemsService } from './services/partition-systems.service';
import { TypeORMPartitionSystemsRepository } from './repositories/typeorm-partition-systems.repository';
import { TypeORMPartitionLikesRepository } from './repositories/typeorm-partition-likes.repository';
import { PartitionMinioService } from './services/partition-minio.service';

@Module({
  imports: [TypeOrmModule.forFeature([PartitionSystemEntity, PartitionLikeEntity])],
  controllers: [PartitionSystemsController],
  providers: [
    PartitionSystemsService,
    TypeORMPartitionSystemsRepository,
    TypeORMPartitionLikesRepository,
    PartitionMinioService,
  ],
})
export class PartitionSystemsModule {}
