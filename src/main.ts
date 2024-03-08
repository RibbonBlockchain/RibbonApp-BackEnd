import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { GLOBAL_PREFIX } from './core/constants';
import { AppModule } from './modules/app/app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ExceptionsFilter } from './core/interceptors/exception.interceptor';
import { ResponseInterceptor } from './core/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const port = config.getOrThrow<string>('port')!;
  const validationPipeOptions = config.getOrThrow<any>('validationPipeOptions')!;

  app.enableCors({});
  app.useGlobalFilters(new ExceptionsFilter());
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
  app.setGlobalPrefix(GLOBAL_PREFIX, { exclude: ['/health-check'] });

  await app.listen(port);
}
bootstrap();
