// Однократная загрузка файлов по умолчанию в MinIO для конструкций,
// созданных до того, как фото и видео стали обязательными.
// Запуск: npx ts-node -r dotenv/config scripts/upload-partition-default-media.ts <фото.svg> <видео.mp4>
import * as Minio from 'minio';
import { readFileSync } from 'fs';

const PARTITION_DEFAULT_MEDIA = [
  { key: 'partition-photo-default.svg', contentType: 'image/svg+xml' },
  { key: 'partition-video-default.mp4', contentType: 'video/mp4' },
];

async function run() {
  const [photoPath, videoPath] = process.argv.slice(2);
  if (!photoPath || !videoPath) {
    throw new Error('Укажите пути к фото и видео по умолчанию');
  }

  const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT!,
    port: Number(process.env.MINIO_PORT),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
    region: 'us-east-1',
  });
  const bucketName = process.env.MINIO_BUCKET!;
  if (!(await minioClient.bucketExists(bucketName))) {
    await minioClient.makeBucket(bucketName, 'us-east-1');
  }

  const paths = [photoPath, videoPath];
  for (const [index, media] of PARTITION_DEFAULT_MEDIA.entries()) {
    const buffer = readFileSync(paths[index]);
    await minioClient.putObject(bucketName, media.key, buffer, buffer.length, {
      'Content-Type': media.contentType,
    });
    console.log(`Загружен ${media.key} (${buffer.length} байт)`);
  }
}

run().catch((error) => {
  console.error('ОШИБКА:', error.message);
  process.exit(1);
});
