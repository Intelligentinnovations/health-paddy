import { loadSecrets } from '@backend-template/secrets';
import { z } from 'zod';

const secretsSchema = z.object({
  MAIL_FROM: z.string(),
});

export let secrets: z.infer<typeof secretsSchema>;

export async function getSecrets() {
  const fetchedSecrets = await loadSecrets(secretsSchema, ['']);
  if (fetchedSecrets) secrets = fetchedSecrets;
}
