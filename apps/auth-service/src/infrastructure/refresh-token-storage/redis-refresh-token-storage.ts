import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { RefreshTokenStorage } from '../../appliacation/ports/refresh-token-storage';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisRefreshTokenStorage
  implements RefreshTokenStorage, OnModuleDestroy
{
  private readonly client: Redis;

  constructor(configService: ConfigService) {
    this.client = new Redis(configService.getOrThrow<string>('REDIS_URL'));
  }

  async insert(userId: string, tokenId: string): Promise<void> {
    await this.client.set(this.getKey(userId), tokenId);
  }

  async validate(userId: string, tokenId: string): Promise<boolean> {
    const storedTokenId = await this.client.get(this.getKey(userId));
    return storedTokenId === tokenId;
  }

  async invalidate(userId: string): Promise<void> {
    await this.client.del(this.getKey(userId));
  }

  private getKey(userId: string) {
    return `auth:refreshToken:user:${userId}`;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
