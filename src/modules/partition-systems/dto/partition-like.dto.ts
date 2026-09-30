import { IsIn } from 'class-validator';

// Лайк от текущего пользователя: 1 — поставить, 0 — отменить
export class PartitionLikeDto {
  @IsIn([0, 1])
  partitionLike: 0 | 1;
}
