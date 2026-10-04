import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';

// Публикация черновика: обязательные поля по теме.
// Статус и дата формирования вычисляются на бэкенде.
export class PublishPartitionSystemDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  partitionDescription: string;

  // Толщина перегородки, мм
  @IsInt()
  @Min(1)
  @Max(1000)
  partitionThicknessMm: number;

  // Индекс изоляции воздушного шума Rw, дБ
  @IsInt()
  @Min(0)
  @Max(100)
  soundIndexRw: number;
}
