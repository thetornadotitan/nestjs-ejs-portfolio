import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger: Logger = new Logger('Bootstrap');
  logger.verbose('Starting application...');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  logger.verbose('Configuring application...');
  const isProd = process.env.NODE_ENV === 'production';
  app.setBaseViewsDir(
    isProd ? join(__dirname, 'views') : join(process.cwd(), 'src', 'views'),
  );
  app.useStaticAssets(
    isProd ? join(__dirname, 'public') : join(process.cwd(), 'src', 'public'),
  );
  app.setViewEngine('ejs');
  logger.verbose('View engine configured to EJS.');

  logger.verbose('Application configured. Starting server...');
  await app.listen(process.env.PORT ?? 3000);
  logger.verbose(`Application is running on: ${await app.getUrl()}`);
}
void bootstrap();
