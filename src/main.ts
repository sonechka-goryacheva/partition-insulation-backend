import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { readdirSync, readFileSync } from 'fs';
import { AppModule } from './app.module';

const hbs = require('hbs');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Каталог статических файлов: таблица стилей приложения
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Каталог шаблонов и шаблонизатор Handlebars
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  // Частичные шаблоны регистрируем синхронно, до запуска сервера
  const partialsDir = join(__dirname, '..', 'views', 'partials');
  for (const partialFile of readdirSync(partialsDir)) {
    if (!partialFile.endsWith('.hbs')) continue;
    const partialName = partialFile.replace('.hbs', '');
    const partialBody = readFileSync(join(partialsDir, partialFile), 'utf8');
    hbs.registerPartial(partialName, partialBody);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
