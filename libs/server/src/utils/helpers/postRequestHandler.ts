import { expireItem, setItem } from '@backend-template/cache';
import { NextFunction, Request, Response } from 'express';
import { DateTime } from 'luxon';

export async function postRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let key = `${process.env.STACK_NAME}:${req.originalUrl ?? req.url}`;
  if (req.user) key += `:${req.token}`;

  const result = req.result;
  if (!result) return next();

  if (req.cacheExpiration && result.success) {
    await setItem(key, JSON.stringify(result));
    await expireItem(key, req.cacheExpiration);
  }

  const resData = result.getData();

  console.info(
    `response (${DateTime.now().toISO()}) ${result.status}: ${JSON.stringify(
      resData
    )}`
  );

  return res.status(result.status).send(resData);
}
