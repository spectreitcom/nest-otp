import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { CqrsModule } from '@nestjs/cqrs';
import { commandHandlers } from './command-handlers';
import { AuthServiceController } from './auth-service.controller';
import Joi from 'joi';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EMAIL_SERVICE } from '../constants';
import { queryHandlers } from './query-handlers';

const envSchema = Joi.object({
  RABBITMQ_URL: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
  OTP_SECRET: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envSchema,
    }),
    CqrsModule.forRoot(),
    InfrastructureModule,
    ClientsModule.registerAsync({
      clients: [
        {
          name: EMAIL_SERVICE,
          useFactory: (configService: ConfigService) => ({
            transport: Transport.RMQ,
            options: {
              urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
              queue: 'email_queue',
              queueOptions: {
                durable: true,
              },
            },
          }),
          inject: [ConfigService],
        },
      ],
    }),
  ],
  controllers: [AuthServiceController],
  providers: [...commandHandlers, ...queryHandlers],
})
export class AuthServiceModule {}
