import './env';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DevSeedService } from './database/dev-seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.get(DevSeedService).seedIfEnabled();
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Fastfood Kitchen API running on http://localhost:${port}`);
}

bootstrap();
