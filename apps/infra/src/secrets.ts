import { loadSecrets } from '@backend-template/secrets';
import { z, ZodObject } from 'zod';

const secretsSchema = {
  APP_NAME: z.string().max(32),
  ENV: z.string().max(32),
  CLOUDFRONT_PUBLIC_KEY: z.string(),
  CLOUDFRONT_PRIVATE_KEY: z.string(),
  MAIL_FROM: z.string().default('example@mail.com'),
};

export let secrets: z.infer<ZodObject<typeof secretsSchema>>;
export const layerVersionParam = 'layer/version';

export async function getSecrets() {
  const fetchedSecrets = await loadSecrets(secretsSchema, []);
  if (fetchedSecrets) {
    secrets = fetchedSecrets;
  }
}
