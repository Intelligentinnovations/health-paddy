import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

const errorInitialisingSecrets = 'error initializing secret values';

let secretClient: SecretsManagerClient;

export const fetchSecret = async (
  secretName?: string
): Promise<Record<string, string>> => {
  try {
    if (!secretName) return {};
    if (!secretClient)
      secretClient = new SecretsManagerClient({
        region: process.env.AWS_REGION,
      });

    const secrets = await secretClient.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );

    return JSON.parse(secrets.SecretString ?? '{}');
  } catch (e) {
    console.error(errorInitialisingSecrets, e);
    return {};
  }
};
