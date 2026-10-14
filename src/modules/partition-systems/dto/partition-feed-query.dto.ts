import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Лента: GET /api/partitions/feed/:partitionSystemId?next=true
export class PartitionFeedQueryDto {
  @ApiPropertyOptional({ description: 'true — следующая конструкция после указанной (после последней — снова первая); без параметра или false — сама указанная', example: true })
  // Строка из URL: 'true' → true, 'false' → false, остальное не пройдёт @IsBoolean
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  next?: boolean;
}
