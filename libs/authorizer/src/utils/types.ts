export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export type PathRule = {
  roles?: string[] | '*';
  authRequired?: boolean;
};

export type PathMethod = Partial<Record<HttpMethod | 'ALL', PathRule>>;

export interface Path {
  paths: Record<string, Path>;
  rules: PathMethod;
}
