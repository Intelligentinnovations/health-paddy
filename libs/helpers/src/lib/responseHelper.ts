
import { IServiceHelper } from "@backend-template/types";

import { CustomRes } from "./custom-res";

export const convertAndSendResponse = (data: IServiceHelper) => {
  switch (data.status) {
    case "successful":
      return CustomRes.success(data.data, data.message)
    case "created":
      return CustomRes.created (data.message, data.data)
      case "forbidden":
      return CustomRes.forbidden(data.message)
    case "deleted":
      return CustomRes.success(data.data)
    case "not-found":
      return CustomRes.success({}, data.message)
    case "conflict":
      return CustomRes.failed(data.message,{
        data: data.data
      })
    case "bad-request":
      return CustomRes.badRequest(data.message)
    default:
      return CustomRes.serverError(data.message)
  }
}
