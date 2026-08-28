import { NestFactory } from '@nestjs/core';
import { GatewayServiceModule } from './gateway-service.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(GatewayServiceModule);

  app.enableCors();
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Gateway Service')
    .setDescription('Gateway Service API')
    .setVersion('1.0')
    .addBearerAuth()
    .setContact('Przemysław Chudziński', '', 'p.chudzinski.spectreit@gmail.com')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customJsStr: 'document.querySelector("html").classList.add("dark-mode")',
  });

  await app.listen(process.env.port ?? 3000);
}
bootstrap().catch((e) => console.error(e));
