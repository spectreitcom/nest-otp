import { Injectable } from '@nestjs/common';
import { OtpChallenge, OtpStore } from '../../application/ports/otp-store';
import { RedisClient } from '@app/shared';

@Injectable()
export class RedisOtpStore implements OtpStore {
  constructor(private readonly redisClient: RedisClient) {}

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

  async consume(challengeId: string): Promise<boolean> {
    try {
      const deleted = await this.redisClient.client.del(
        this.getKey(challengeId),
      );
      return deleted > 0;
    } catch {
      return false;
    }
  }

  async incrementAttempts(challengeId: string): Promise<number> {
    const key = this.getKey(challengeId);

    const currentAttempts = await this.redisClient.client.hget(key, 'attempts');
    if (!currentAttempts) return 0;

    return await this.redisClient.client.hincrby(key, 'attempts', 1);
  }

  private getKey(challengeId: string): string {
    return `auth:otp:${challengeId}`;
  }
}
