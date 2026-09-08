import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { OtpGenerator } from '../application/ports/otp-generator';
import { AppOtpGenerator } from './otp-generator/app-otp-generator';
import { OtpStore } from '../application/ports/otp-store';
import { RedisOtpStore } from './otp-store/redis-otp-store';
import { RefreshTokenStorage } from '../application/ports/refresh-token-storage';
import { RedisRefreshTokenStorage } from './refresh-token-storage/redis-refresh-token-storage';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../application/ports/token.service';
import { JwtTokenService } from './token-service/jwt-token.service';
import { APP_FILTER } from '@nestjs/core';
import { ErrorFilter } from './error.filter';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '1h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    PrismaService,
    { provide: OtpGenerator, useClass: AppOtpGenerator },
    { provide: OtpStore, useClass: RedisOtpStore },
    { provide: RefreshTokenStorage, useClass: RedisRefreshTokenStorage },
    { provide: TokenService, useClass: JwtTokenService },
    {
      provide: APP_FILTER,
      useClass: ErrorFilter,
    },
  ],
  exports: [
    PrismaService,
    OtpGenerator,
    OtpStore,
    RefreshTokenStorage,
    TokenService,
  ],
})
export class InfrastructureModule {}
