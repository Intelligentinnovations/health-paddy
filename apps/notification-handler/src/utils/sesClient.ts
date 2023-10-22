import { SESClient } from '@aws-sdk/client-ses';

let sesClient: SESClient;

export function getSesClient() {
  if (!sesClient) sesClient = new SESClient({ region: process.env.AWS_REGION });

  return sesClient;
}
