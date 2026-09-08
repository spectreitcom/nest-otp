import {
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
} from '@nestjs/common';

export const REDIS_MODULE_OPTIONS = Symbol('REDIS_MODULE_OPTIONS');

export interface RedisModuleConfigOptions {
  url: string;
}

export interface RedisModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
  useFactory: (
    ...args: unknown[]
  ) => Promise<RedisModuleConfigOptions> | RedisModuleConfigOptions;
}
