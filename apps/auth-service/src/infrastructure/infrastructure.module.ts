import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { OtpGenerator } from '../appliacation/ports/otp-generator';
import { AppOtpGenerator } from './otp-generator/app-otp-generator';
import { OtpStore } from '../appliacation/ports/otp-store';
import { RedisOtpStore } from './otp-store/redis-otp-store';
import { RefreshTokenStorage } from '../appliacation/ports/refresh-token-storage';
import { RedisRefreshTokenStorage } from './refresh-token-storage/redis-refresh-token-storage';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../appliacation/ports/token.service';
import { JwtTokenService } from './token-service/jwt-token.service';

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
