import { Module } from '@nestjs/common';
import Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { EmailServiceController } from './email-service.controller';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

const envSchema = Joi.object({
  RABBITMQ_URL: Joi.string().required(),
});

@Module({
  imports: [
    InfrastructureModule,
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envSchema,
    }),
  ],
  controllers: [EmailServiceController],
})
export class EmailServiceModule {}
