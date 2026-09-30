import { IsIn, IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { PARTITION_TYPES } from '../../../entities/partition-system.entity';
import type { PartitionType } from '../../../entities/partition-system.entity';

// Публикация черновика: обязательные поля по теме.
// Статус и дата формирования вычисляются на бэкенде.
export class PublishPartitionSystemDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  partitionDescription: string;

  @IsIn(PARTITION_TYPES)
  partitionType: PartitionType;

  // Индекс изоляции воздушного шума Rw, дБ
  @IsInt()
  @Min(0)
  @Max(100)
  soundIndexRw: number;
}
