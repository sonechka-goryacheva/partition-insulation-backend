import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Публикация черновика: обязательные поля по теме.
// Статус и дата формирования вычисляются на бэкенде.
export class PublishPartitionSystemDto {
  @ApiProperty({ description: 'Описание конструкции', maxLength: 500, example: 'Газобетонные блоки D600 с двусторонней штукатуркой' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  partitionDescription: string;

  // Толщина перегородки, мм
  @ApiProperty({ description: 'Толщина перегородки, мм', minimum: 1, maximum: 1000, example: 200 })
  @IsInt()
  @Min(1)
  @Max(1000)
  partitionThicknessMm: number;

  // Индекс изоляции воздушного шума Rw, дБ
  @ApiProperty({ description: 'Индекс звукоизоляции Rw, дБ', minimum: 0, maximum: 100, example: 52 })
  @IsInt()
  @Min(0)
  @Max(100)
  soundIndexRw: number;
}
