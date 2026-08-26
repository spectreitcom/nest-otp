import { NestFactory } from '@nestjs/core';
import { EmailServiceModule } from './appliacation/email-service.module';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    EmailServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        queue: 'email_queue',
        urls: [process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672'],
        queueOptions: {
          durable: true,
        },
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen();
}
bootstrap().catch((e) => console.log(e));
