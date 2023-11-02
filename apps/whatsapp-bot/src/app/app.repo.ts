import { KyselyService } from '@backend-template/database';
import { Injectable } from '@nestjs/common';

import { DB, UserPayload } from '../types';

@Injectable()
export class AppRepo {
  constructor(private client: KyselyService<DB>) { }

  async findUserByPhoneNumber(phoneNumber: string) {
    
    return await this.client.selectFrom('User').selectAll().where('phone', '=', phoneNumber)
      .executeTakeFirst();
  }

  async findUserByEmail(email: string) {
    return await this.client.selectFrom('User').selectAll().where('email', '=', email)
      .executeTakeFirst();
  }

  async createUser(payload: UserPayload) {
    return await this.client.insertInto("User").values({ ...payload, updatedAt: new Date() }).executeTakeFirst()
  }
}
