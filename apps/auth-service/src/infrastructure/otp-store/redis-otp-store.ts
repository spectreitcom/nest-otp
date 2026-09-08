import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { OtpChallenge, OtpStore } from '../../application/ports/otp-store';
import { RedisClient } from '@app/shared';

@Injectable()
export class RedisOtpStore implements OtpStore, OnModuleDestroy {
  // todo;
  // private readonly redis: Redis;

  constructor(private readonly redisClient: RedisClient) {
    // this.redis = new Redis(configService.getOrThrow<string>('REDIS_URL'));
  }

  async create(
    data: Pick<OtpChallenge, 'codeHash' | 'email'> & { challengeId: string },
  ): Promise<void> {
    const key = this.getKey(data.challengeId);
    const payload: OtpChallenge = {
      email: data.email,
      codeHash: data.codeHash,
      attempts: 0,
      createdAt: Date.now(),
    };

    // todo: remove
    // await this.redis.setex(key, 300, JSON.stringify(payload));

    await this.redisClient.client
      .multi()
      .hset(key, {
        codeHash: data.codeHash,
        email: data.email,
        attempts: payload.attempts,
        createdAt: payload.createdAt,
      })
      .expire(key, 300)
      .exec();
  }

  async get(challengeId: string): Promise<OtpChallenge | null> {
    try {
      // todo: remove it
      // const data = await this.redis.get(this.getKey(challengeId));
      // return data ? (JSON.parse(data) as OtpChallenge) : null;

      const key = this.getKey(challengeId);

      const codeHash = await this.redisClient.client.hget(key, 'codeHash');
      const email = await this.redisClient.client.hget(key, 'email');
      const attempts = await this.redisClient.client.hget(key, 'attempts');
      const createdAt = await this.redisClient.client.hget(key, 'createdAt');

      const dataExists = codeHash && email && attempts && createdAt;

      if (!dataExists) return null;

      return {
        codeHash,
        email,
        attempts: Number(attempts),
        createdAt: Number(createdAt),
      } satisfies OtpChallenge;
    } catch {
      return null;
    }
  }

  async delete(challengeId: string): Promise<void> {
    await this.redisClient.client.del(this.getKey(challengeId));
  }

  async incrementAttempts(challengeId: string): Promise<number> {
    const key = this.getKey(challengeId);

    const currentAttempts = await this.redisClient.client.hget(key, 'attempts');

    if (!currentAttempts) return 0;

    await this.redisClient.client.hincrby(key, 'attempts', 1);

    return Number(currentAttempts + 1);

    // todo: remove it
    // const data = await this.get(challengeId);
    //
    // if (!data) {
    //   return 0;
    // }
    //
    // const updatedOtpChallenge: OtpChallenge = {
    //   ...data,
    //   attempts: data.attempts + 1,
    // };
    //
    // await this.redis.set(key, JSON.stringify(updatedOtpChallenge));
    //
    // return updatedOtpChallenge.attempts;
  }

  private getKey(challengeId: string): string {
    return `auth:otp:${challengeId}`;
  }

  async onModuleDestroy() {
    await this.redisClient.client.quit();
  }
}
