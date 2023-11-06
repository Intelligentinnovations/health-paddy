import { GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { CognitoService } from './cognito.service';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(private cognitoService: CognitoService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      request.token = request.headers.authorization.split(' ')[1];
    } catch (e) {
      /* empty */
    }

    try {
      const command = new GetUserCommand({
        AccessToken: request.token,
      });

      const res = await this.cognitoService.send(command);
      const attributes: Record<string, unknown> = {};

      for (const attribute of res.UserAttributes ?? []) {
        const attributeName = attribute.Name;
        if (!attributeName) continue;

        attributes[attributeName] = attribute.Value;
      }

      request.user = { email: res.Username, ...attributes };
    } catch (e) {
      /* empty */
    }

    return true;
  }
}
