import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PartitionHttpExceptionFilter } from './common/partition-http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Разбор куки: id сессии читается из req.cookies
  app.use(cookieParser());

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

  // Swagger: описание API; методы создателя помечены замком (кука partitionSessionId)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Partition Insulation API')
    .setDescription('Расчёт звукоизоляции перегородок: конструкции, лента, лайки, пользователи')
    .setVersion('1.0')
    .addCookieAuth('partitionSessionId')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swaggerDocument);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`Swagger: http://localhost:${port}/api`);
}
bootstrap();
