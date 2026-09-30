import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

// Лента: GET /api/partitions/feed/:partitionSystemId?next=true
export class PartitionFeedQueryDto {
  // Строка из URL: 'true' → true, 'false' → false, остальное не пройдёт @IsBoolean
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  next?: boolean;
}
