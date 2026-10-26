import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartitionSystemEntity } from '../../entities/partition-system.entity';
import { PartitionLikeEntity } from '../../entities/partition-like.entity';
import { PartitionAttributeEntity } from '../../entities/partition-attribute.entity';
import { PartitionAttributeValueEntity } from '../../entities/partition-attribute-value.entity';
import { PartitionSystemsController } from './controllers/partition-systems.controller';
import { PartitionSystemsService } from './services/partition-systems.service';
import { TypeORMPartitionSystemsRepository } from './repositories/typeorm-partition-systems.repository';
import { TypeORMPartitionLikesRepository } from './repositories/typeorm-partition-likes.repository';
import { TypeORMPartitionAttributesRepository } from './repositories/typeorm-partition-attributes.repository';
import { PartitionMinioService } from './services/partition-minio.service';
import { PartitionUsersModule } from '../partition-users/partition-users.module';

@Module({
  imports: [TypeOrmModule.forFeature([
      PartitionSystemEntity,
      PartitionLikeEntity,
      PartitionAttributeEntity,
      PartitionAttributeValueEntity,
    ]), PartitionUsersModule],
  controllers: [PartitionSystemsController],
  providers: [
    PartitionSystemsService,
    TypeORMPartitionSystemsRepository,
    TypeORMPartitionLikesRepository,
    TypeORMPartitionAttributesRepository,
    PartitionMinioService,
  ],
})
export class PartitionSystemsModule {}
