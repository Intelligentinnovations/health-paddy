import { loadSecrets } from '@backend-template/secrets';
import { z } from 'zod';

const secretsSchema = z.object({
  PORT: z.number().optional(),
  BUCKET_NAME: z.string(),
  TABLE_NAME: z.string(),
  CLOUDFRONT_KEYPAIR_ID: z.string(),
  CLOUDFRONT_PRIVATE_KEY: z.string(),
  BASE_ROUTE: z.string(),
  DOMAIN: z.string(),
});

export let secrets: z.infer<typeof secretsSchema>;

export async function getSecrets() {
  const fetchedSecrets = await loadSecrets(secretsSchema, ['']);
  if (fetchedSecrets) {
    secrets = fetchedSecrets;
  }
}
