import { Module } from '@nestjs/common';
import { PartitionsModule } from './partitions/partitions.module';

@Module({
  imports: [PartitionsModule],
})
export class AppModule {}
