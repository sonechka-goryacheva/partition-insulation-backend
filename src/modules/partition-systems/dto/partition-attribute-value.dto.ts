import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Значение атрибута при публикации: id из справочника и значение
export class PartitionAttributeValueDto {
  @ApiProperty({ description: 'id атрибута из справочника', example: 1 })
  @IsInt()
  @Min(1)
  partitionAttributeId: number;

  @ApiProperty({ description: 'Значение атрибута', maxLength: 255, example: '42' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  partitionAttributeValue: string;
}
