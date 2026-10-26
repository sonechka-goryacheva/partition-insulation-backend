import { ApiProperty } from '@nestjs/swagger';
import { PartitionSystemAttributeDto } from './partition-attribute-response.dto';

// Единый ответ для списка, ленты и черновика: набор полей всегда одинаковый,
// пустые значения приходят как null. Статус и создатель клиенту не передаются.
export class PartitionSystemResponseDto {
  @ApiProperty({ example: 1 })
  partitionSystemId: number;

  @ApiProperty({ example: 'Газобетон D600, 200 мм' })
  partitionName: string;

  @ApiProperty({ type: String, nullable: true, description: 'null до публикации', example: 'Газобетонные блоки D600 с двусторонней штукатуркой' })
  partitionDescription: string | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Толщина, мм; null до публикации', example: 200 })
  partitionThicknessMm: number | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Индекс звукоизоляции Rw, дБ; null до публикации', example: 52 })
  soundIndexRw: number | null;

  @ApiProperty({ type: String, nullable: true, description: 'Подписанная ссылка MinIO на фото (7 дней)' })
  partitionPhotoUrl: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Подписанная ссылка MinIO на видео (7 дней)' })
  partitionVideoUrl: string | null;

  @ApiProperty({ example: 3 })
  partitionLikesCount: number;

  @ApiProperty({ enum: [0, 1], description: '1 — текущий пользователь поставил лайк (у гостя всегда 0)', example: 0 })
  partitionIsLiked: 0 | 1;

  @ApiProperty({ enum: [0, 1], description: '1 — конструкция текущего пользователя (у гостя всегда 0)', example: 1 })
  partitionIsMine: 0 | 1;

  @ApiProperty({ type: [PartitionSystemAttributeDto], description: 'Дополнительные характеристики; [] — нет атрибутов' })
  partitionAttributes: PartitionSystemAttributeDto[];

  constructor(fields: PartitionSystemResponseDto) {
    Object.assign(this, fields);
  }
}
