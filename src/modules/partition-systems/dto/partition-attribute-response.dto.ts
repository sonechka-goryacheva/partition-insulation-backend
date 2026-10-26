import { ApiProperty } from '@nestjs/swagger';

// Атрибут из справочника: GET /api/partitions/attributes
export class PartitionAttributeResponseDto {
  @ApiProperty({ example: 1 })
  partitionAttributeId: number;

  @ApiProperty({ example: 'Поверхностная масса' })
  partitionAttributeName: string;

  @ApiProperty({ type: String, nullable: true, description: 'Единица измерения; null — без единицы', example: 'кг/м²' })
  partitionAttributeUnit: string | null;

  constructor(fields: PartitionAttributeResponseDto) {
    Object.assign(this, fields);
  }
}

// Атрибут конструкции в карточке: название и единица из справочника + значение
export class PartitionSystemAttributeDto extends PartitionAttributeResponseDto {
  @ApiProperty({ example: '42' })
  partitionAttributeValue: string;

  constructor(fields: PartitionSystemAttributeDto) {
    super(fields);
    Object.assign(this, fields);
  }
}
