import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CognitoService extends CognitoIdentityProviderClient {
  constructor(region?: string) {
    super({ region });
  }
}
