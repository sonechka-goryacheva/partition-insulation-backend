import { ArrayMaxSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartitionAttributeValueDto } from './partition-attribute-value.dto';

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

  // Дополнительные характеристики: заменяют прежний набор атрибутов черновика
  @ApiPropertyOptional({ type: [PartitionAttributeValueDto], description: 'Значения атрибутов из справочника GET /api/partitions/attributes' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PartitionAttributeValueDto)
  partitionAttributes?: PartitionAttributeValueDto[];
}
