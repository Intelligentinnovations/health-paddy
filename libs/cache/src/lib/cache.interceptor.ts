import { CustomRes } from '@backend-template/helpers';
import {
  CACHE_KEY_METADATA,
  CACHE_MANAGER,
  CACHE_TTL_METADATA,
} from '@nestjs/cache-manager';
import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { map, Observable, of } from 'rxjs';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<unknown>> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse();

    try {
      const method = context.switchToHttp().getRequest().method;
      const cacheKey = Reflect.getMetadata(
        CACHE_KEY_METADATA,
        context.getHandler()
      ) as string;

      if (cacheKey && method === 'GET') {
        const cachedData = await this.cache.get(cacheKey);
        const cacheTTL =
          (Reflect.getMetadata(
            CACHE_TTL_METADATA,
            context.getHandler()
          ) as number) ?? 60000;

        if (cachedData) return of(cachedData);

        return next.handle().pipe(
          map(async (data: CustomRes) => {
            if (data.success) {
              await this.cache.set(cacheKey, data.getData(), cacheTTL);
            }

            res.statusCode = data.getStatus();
            return data.getData();
          })
        );
      }
    } catch (e) {
      Logger.error('cache interceptor error :: ', e);
    }

    return next.handle().pipe(
      map((data: CustomRes) => {
        res.statusCode = data.getStatus();
        return data.getData();
      })
    );
  }
}
