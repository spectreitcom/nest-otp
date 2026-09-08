import { Injectable } from '@nestjs/common';
import { RefreshTokenStorage } from '../../application/ports/refresh-token-storage';
import { RedisClient } from '@app/shared';

@Injectable()
export class RedisRefreshTokenStorage implements RefreshTokenStorage {
  constructor(private readonly redisClient: RedisClient) {}

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
}
