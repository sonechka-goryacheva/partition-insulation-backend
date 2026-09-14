import { Module } from '@nestjs/common';
import { PartitionsController } from './partitions.controller';
import { PartitionsService } from './partitions.service';

@Module({
  controllers: [PartitionsController],
  providers: [PartitionsService],
})
export class PartitionsModule {}
