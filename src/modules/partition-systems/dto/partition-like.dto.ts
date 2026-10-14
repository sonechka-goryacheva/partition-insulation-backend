import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Лайк от текущего пользователя: 1 — поставить, 0 — отменить
export class PartitionLikeDto {
  @ApiProperty({ description: '1 — поставить лайк, 0 — снять', enum: [0, 1], example: 1 })
  @IsIn([0, 1])
  partitionLike: 0 | 1;
}
