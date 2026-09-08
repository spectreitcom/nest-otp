import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import {
  REDIS_MODULE_OPTIONS,
  type RedisModuleConfigOptions,
} from './redis.constants';

@Injectable()
export class RedisClient {
  readonly client: Redis;

  constructor(
    @Inject(REDIS_MODULE_OPTIONS)
    private readonly options: RedisModuleConfigOptions,
  ) {
    this.client = new Redis(this.options.url);
  }
}
