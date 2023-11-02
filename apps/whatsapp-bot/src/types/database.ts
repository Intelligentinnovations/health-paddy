import type { ColumnType } from 'kysely';
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type User = {
  id: Generated<string>;
  email: string;
  phone: string;
  name: string;
  age: number | null;
  sex: string | null;
  height: string | null;
  weight: string | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type DB = {
  User: User;
};
