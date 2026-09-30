import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { PartitionHttpExceptionFilter } from './common/partition-http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Валидация DTO: лишние и системные поля с клиента отклоняются (400)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: true,
    }),
  );

  // Автоматически скрывает поля с @Exclude() (статус конструкции, пароль)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Ошибки: только HTTP-код, тело пустое
  app.useGlobalFilters(new PartitionHttpExceptionFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
