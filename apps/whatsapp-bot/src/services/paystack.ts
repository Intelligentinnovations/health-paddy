import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { randomUUID } from 'crypto';

import { SecretsService } from '../secrets/secrets.service';

@Injectable()
export class PaymentService {
  constructor(private readonly secretsService: SecretsService) { }

  private readonly instance = axios.create({
    baseURL: 'https://api.paystack.co/transaction/',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.secretsService.get('PAYSTACK_SECRET_KEY')}`,
    },
  });

  async initializePaystackPayment({
    email,
    amountInNaira,
    metaData,
    callbackUrl,
  }: {
    email: string;
    amountInNaira: number;
    metaData: object;
    callbackUrl: string;
  }) {
    const url = 'initialize';
    return this.instance.post(url, {
      reference: randomUUID(),
      email,
      amount: `${amountInNaira * 100}`,
      callback_url: callbackUrl,
      metadata: {
        custom_fields: [
          {
            ...metaData,
          },
        ],
      },
    });
  }

  async verifyPaystackTransaction(reference: string) {
    const url = `verify/${reference}`;
    return this.instance(url);
  }

  async chargePaystackCard({ amount, cardEmail, authorizationCode }: { amount: number; cardEmail: string; authorizationCode: string }) {
    const url = 'charge_authorization';
    return this.instance.post(url, {
      amount: amount * 100,
      email: cardEmail,
      authorization_code: authorizationCode,
    });
  }
}
