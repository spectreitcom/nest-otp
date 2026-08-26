import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { OtpChallenge, OtpStore } from '../../appliacation/ports/otp-store';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisOtpStore implements OtpStore, OnModuleDestroy {
  private readonly redis: Redis;

  constructor(configService: ConfigService) {
    this.redis = new Redis(configService.getOrThrow<string>('REDIS_URL'));
  }

  async create(data: Pick<OtpChallenge, 'codeHash' | 'email'>): Promise<void> {
    const key = this.getKey(data.email);
    const payload: OtpChallenge = {
      email: data.email,
      codeHash: data.codeHash,
      attempts: 0,
      createdAt: Date.now(),
    };
    await this.redis.setex(key, 300, JSON.stringify(payload));
  }

  async get(challengeId: string): Promise<OtpChallenge | null> {
    try {
      const data = await this.redis.get(this.getKey(challengeId));
      return data ? (JSON.parse(data) as OtpChallenge) : null;
    } catch {
      return null;
    }
  }

  async delete(challengeId: string): Promise<void> {
    await this.redis.del(this.getKey(challengeId));
  }

  async incrementAttempts(challengeId: string): Promise<number> {
    const key = this.getKey(challengeId);
    const data = await this.get(challengeId);

    if (!data) {
      return 0;
    }

    const updatedOtpChallenge: OtpChallenge = {
      ...data,
      attempts: data.attempts + 1,
    };

    await this.redis.set(key, JSON.stringify(updatedOtpChallenge));

    return updatedOtpChallenge.attempts;
  }

  private getKey(challengeId: string): string {
    return `auth:otp:${challengeId}`;
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
