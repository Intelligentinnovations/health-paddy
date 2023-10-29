import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { CustomRes } from '@backend-template/helpers';
import { Logger } from '@nestjs/common';
import { z, ZodRawShape, ZodType } from 'zod';

let secretClient: SecretsManagerClient;

export async function loadSecrets<
  TS extends ZodRawShape = Record<string, ZodType>
>(schema: TS, secretNames: string[] = []) {
  const secrets: Record<string, unknown> = {};
  if (!secretClient) {
    secretClient = new SecretsManagerClient({
      region: process.env.AWS_REGION,
    });
  }

  for (const secret in secretNames) {
    try {
      const fetchedSecrets = await secretClient.send(
        new GetSecretValueCommand({ SecretId: secretNames[secret] })
      );

      const parsedSecrets = JSON.parse(fetchedSecrets.SecretString ?? '{}');
      Object.assign(secrets, parsedSecrets);
    } catch (e) {
      Logger.error('error fetching secrets :: ', secretNames[secret]);
    }
  }

  Object.assign(secrets, process.env);

  const res = z.object(schema).safeParse(secrets);
  if (!res.success) {
    Logger.error('secrets validation error :: ', res.error);
    throw CustomRes.serverError('error validating secrets');
  }

  return res.data;
}
