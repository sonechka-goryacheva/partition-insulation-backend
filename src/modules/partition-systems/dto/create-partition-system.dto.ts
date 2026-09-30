import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

// Создание черновика (multipart/form-data): текстовое поле формы.
// Фото и видео приходят файлами partitionPhoto и partitionVideo.
// Статус, создатель и дата вычисляются на бэкенде.
export class CreatePartitionSystemDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  partitionName: string;
}
