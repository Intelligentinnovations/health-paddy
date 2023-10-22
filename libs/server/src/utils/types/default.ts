import type { MessageBody, ScheduleType } from '@backend-template/types';
import type { Application } from 'express';

import { HttpStatusCode } from './controller';

export type AppHandlerTypes = {
  app?: Application;
  eventHandler?: (event: MessageBody) => Promise<void>;
  scheduleHandler?: (scheduleType: ScheduleType) => Promise<void>;
};

export interface IRes<T = unknown> {
  message: string;
  success: boolean;
  status: HttpStatusCode;
  data?: T;
  getData: () => IResData<T>;
}

export interface IResData<T> {
  message: string;
  success: boolean;
  data?: T;
}

export type ServerRes<T = unknown> = Promise<IRes<T>>;

export interface IOptional<T> {
  unwrapOrNull: () => Promise<T | null>;
  unwrapOrThrow: (error?: IRes) => Promise<T>;
}

export interface IOptionalSync<T> {
  unwrapOrNull: () => T | null;
  unwrapOrThrow: (error?: IRes) => T;
}

export interface Pagination {
  page: number;
  size: number;
  totalPages?: number;
  totalItems?: number;
}

export interface PaginatedData<T = unknown> {
  results: T[];
  pagination: Pagination;
}
