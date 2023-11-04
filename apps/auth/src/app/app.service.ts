import {
  AuthFlowType,
  ChangePasswordCommand,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  InitiateAuthCommandOutput,
  NotAuthorizedException,
  ResendConfirmationCodeCommand,
  SignUpCommand,
  UsernameExistsException,
  UserNotConfirmedException,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoService } from '@backend-template/authorizer';
import { CustomRes } from '@backend-template/helpers';
import { Injectable, Logger } from '@nestjs/common';

import { HelperService } from '../libraries/helper.service';
import { SecretsService } from '../secrets/secrets.service';
import {
  AuthenticateData,
  ChangePasswordData,
  ResetPasswordData,
} from '../utils/schema';
import { ConfirmAccountData } from '../utils/schema';

@Injectable()
export class AppService {
  private readonly clientId: string;

  constructor(
    private secrets: SecretsService,
    private cognitoService: CognitoService,
    private helper: HelperService
  ) {
    this.clientId = this.secrets.get('USER_POOL_CLIENT_ID');
  }

  async signup(data: AuthenticateData) {
    Logger.log(data);
    const command = new SignUpCommand({
      ClientId: this.clientId,
      Username: data.email,
      Password: data.password,
      SecretHash: this.helper.createHash(data.email),
    });

    try {
      await this.cognitoService.send(command);
    } catch (e) {
      if (e instanceof UsernameExistsException)
        throw CustomRes.badRequest('user with email already exist');
      else if (e instanceof Error) {
        throw CustomRes.serverError(e.message);
      }

      Logger.error(e);
      throw CustomRes.serverError();
    }
  }

  async confirmEmail(data: ConfirmAccountData) {
    const command = new ConfirmSignUpCommand({
      ClientId: this.clientId,
      ConfirmationCode: data.code,
      SecretHash: this.helper.createHash(data.email),
      Username: data.email,
    });

    const res = await this.cognitoService.send(command);
    Logger.log(res);
  }

  async login(data: AuthenticateData) {
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: data.email,
        PASSWORD: data.password,
        SECRET_HASH: this.helper.createHash(data.email),
      },
    });

    let res: InitiateAuthCommandOutput;

    try {
      res = await this.cognitoService.send(command);
    } catch (e: unknown) {
      console.log(e instanceof NotAuthorizedException);

      if (
        e instanceof NotAuthorizedException ||
        e instanceof UserNotFoundException
      ) {
        throw CustomRes.unauthorized('email or password incorrect');
      } else if (e instanceof UserNotConfirmedException) {
        throw CustomRes.forbidden('email has not been verified');
      } else if (e instanceof Error) {
        console.log(e.name);
        throw CustomRes.serverError(e.message);
      }

      Logger.error(e);
      throw CustomRes.serverError();
    }

    if (res.AuthenticationResult) {
      return {
        accessToken: res.AuthenticationResult.AccessToken,
        refreshToken: res.AuthenticationResult.RefreshToken,
        expiresIn: res.AuthenticationResult.ExpiresIn,
        tokenType: res.AuthenticationResult.TokenType,
      };
    }
  }

  async resendConfirmationCode(email: string) {
    const command = new ResendConfirmationCodeCommand({
      Username: email,
      ClientId: this.clientId,
      SecretHash: this.helper.createHash(email),
    });

    try {
      await this.cognitoService.send(command);
    } catch (e) {
      if (e instanceof UserNotFoundException)
        throw CustomRes.badRequest('email does not exist');

      Logger.error(e);
      throw CustomRes.serverError();
    }
  }

  async forgotPassword(email: string) {
    const command = new ForgotPasswordCommand({
      Username: email,
      ClientId: this.clientId,
      SecretHash: this.helper.createHash(email),
    });

    try {
      await this.cognitoService.send(command);
    } catch (e) {
      if (e instanceof UserNotFoundException) {
        throw CustomRes.badRequest('user with email does not exist');
      }

      Logger.error(e);
      throw CustomRes.serverError();
    }
  }

  async resetPassword(data: ResetPasswordData) {
    const command = new ConfirmForgotPasswordCommand({
      Username: data.email,
      Password: data.newPassword,
      ConfirmationCode: data.code,
      ClientId: this.clientId,
      SecretHash: this.helper.createHash(data.email),
    });

    await this.cognitoService.send(command);
  }

  async changePassword(token: string, data: ChangePasswordData) {
    const command = new ChangePasswordCommand({
      AccessToken: token,
      PreviousPassword: data.oldPassword,
      ProposedPassword: data.newPassword,
    });

    try {
      await this.cognitoService.send(command);
    } catch (e) {
      if (e instanceof NotAuthorizedException) {
        throw CustomRes.unauthorized('old password is incorrect');
      }

      Logger.error(e);
      throw CustomRes.serverError();
    }
  }
}
