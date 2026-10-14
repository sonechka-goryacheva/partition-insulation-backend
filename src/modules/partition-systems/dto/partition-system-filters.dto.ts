import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Фильтр списка: GET /api/partitions?rwFrom=45&rwTo=60
export class PartitionSystemFiltersDto {
  @ApiPropertyOptional({ description: 'Индекс звукоизоляции Rw от, дБ', minimum: 0, maximum: 100, example: 45 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  rwFrom?: number;

  @ApiPropertyOptional({ description: 'Индекс звукоизоляции Rw до, дБ', minimum: 0, maximum: 100, example: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  rwTo?: number;
}
