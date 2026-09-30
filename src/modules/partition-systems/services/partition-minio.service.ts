import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as Minio from 'minio';

// Вид медиафайла конструкции перегородки
export type PartitionMediaKind = 'photo' | 'video';

// Допустимые типы файлов и расширения латиницей для имени объекта
const PARTITION_MEDIA_EXTENSIONS: Record<PartitionMediaKind, Record<string, string>> = {
  photo: {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  },
  video: {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  },
};

// Подписанная ссылка действует 7 дней
const PARTITION_SIGNED_URL_TTL_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class PartitionMinioService implements OnModuleInit {
  private readonly logger = new Logger(PartitionMinioService.name);
  private readonly minioClient: Minio.Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET')!;

    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT')!,
      // Из .env приходит строка, клиенту MinIO нужно число
      port: Number(this.configService.get<string>('MINIO_PORT')),
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY')!,
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY')!,
      // Регион задан явно: подписанные ссылки строятся без лишнего запроса к MinIO
      region: 'us-east-1',
    });
  }

  // Бакет создаётся при старте приложения, если его ещё нет
  async onModuleInit(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Бакет "${this.bucketName}" создан в MinIO`);
      }
    } catch (error) {
      this.logger.error(`Ошибка при инициализации бакета MinIO: ${(error as Error).message}`);
    }
  }

  // Подходит ли файл по типу (фото — изображение, видео — видеоролик)
  isAllowedPartitionMedia(file: Express.Multer.File, kind: PartitionMediaKind): boolean {
    return file.mimetype in PARTITION_MEDIA_EXTENSIONS[kind];
  }

  // Загрузка файла под сгенерированным латинским именем; возвращает ключ для БД
  async uploadPartitionMedia(file: Express.Multer.File, kind: PartitionMediaKind): Promise<string> {
    const extension = PARTITION_MEDIA_EXTENSIONS[kind][file.mimetype];
    const partitionMediaKey = `partition-${kind}-${randomUUID()}.${extension}`;

    await this.minioClient.putObject(
      this.bucketName,
      partitionMediaKey,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );

    return partitionMediaKey;
  }

  // Временная ссылка на файл; если ключа нет — строго null
  async getSignedUrl(partitionMediaKey: string | null): Promise<string | null> {
    if (!partitionMediaKey) {
      return null;
    }

    try {
      return await this.minioClient.presignedGetObject(
        this.bucketName,
        partitionMediaKey,
        PARTITION_SIGNED_URL_TTL_SECONDS,
      );
    } catch (error) {
      this.logger.error(`Ошибка при генерации подписанной ссылки: ${(error as Error).message}`);
      return null;
    }
  }

  // Удаление файла (откат загрузки, если запись в БД не создалась)
  async deleteFile(partitionMediaKey: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, partitionMediaKey);
    } catch (error) {
      this.logger.warn(`Не удалось удалить файл ${partitionMediaKey}: ${(error as Error).message}`);
    }
  }
}
