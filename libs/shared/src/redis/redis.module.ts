import { DynamicModule, Module, Provider } from '@nestjs/common';
import { RedisClient } from './redis-client';
import {
  REDIS_MODULE_OPTIONS,
  RedisModuleAsyncOptions,
  RedisModuleConfigOptions,
} from './redis.constants';

@Module({})
export class RedisModule {
  static register(options: RedisModuleConfigOptions): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: REDIS_MODULE_OPTIONS,
          useValue: options,
        },
        RedisClient,
      ],
      exports: [RedisClient],
    };
  }

  static registerAsync(options: RedisModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: REDIS_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    return {
      module: RedisModule,
      imports: options.imports ?? [],
      providers: [optionsProvider, RedisClient],
      exports: [RedisClient],
    };
  }
}
