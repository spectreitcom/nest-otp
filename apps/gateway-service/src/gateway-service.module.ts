import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { AuthenticationModule } from './authentication/authentication.module';
import { AuthModule } from './endpoints/auth/auth.module';

const envSchema = Joi.object({
  JWT_SECRET: Joi.string().required(),
  RABBITMQ_URL: Joi.string().required(),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema,
    }),
    AuthModule,
    AuthenticationModule,
  ],
})
export class GatewayServiceModule {}
