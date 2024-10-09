export interface IServiceHelper<T = any> {
  status: "successful" | "created" | "deleted" | "conflict" | "bad-request" | "not-found" | "forbidden"
  message: string
  data?: T
}