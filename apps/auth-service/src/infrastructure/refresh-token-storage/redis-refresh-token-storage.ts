import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { RefreshTokenStorage } from '../../application/ports/refresh-token-storage';
import { RedisClient } from '@app/shared';

@Injectable()
export class RedisRefreshTokenStorage
  implements RefreshTokenStorage, OnModuleDestroy
{
  // todo;
  // private readonly client: Redis;

  constructor(private readonly redisClient: RedisClient) {
    // this.client = new Redis(configService.getOrThrow<string>('REDIS_URL'));
  }

  async insert(userId: string, tokenId: string): Promise<void> {
    await this.redisClient.client.set(this.getKey(userId), tokenId);
  }

  async validate(userId: string, tokenId: string): Promise<boolean> {
    const storedTokenId = await this.redisClient.client.get(
      this.getKey(userId),
    );
    return storedTokenId === tokenId;
  }

  async invalidate(userId: string): Promise<void> {
    await this.redisClient.client.del(this.getKey(userId));
  }

  private getKey(userId: string) {
    return `auth:refreshToken:user:${userId}`;
  }

  async onModuleDestroy() {
    await this.redisClient.client.quit();
  }
}
