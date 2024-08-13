import { KyselyService } from "@backend-template/database";
import { Injectable } from "@nestjs/common";

import {DB, UserPayload} from "../types";

@Injectable()
export class UserRepo {
  constructor(
    private client: KyselyService<DB>
  ) { }

  async findUserByPhoneNumber(phoneNumber: string) {
    return await this.client.selectFrom("User").selectAll().where("phone", "=", phoneNumber)
      .executeTakeFirst();
  }
  async findUserByEmail(email: string) {
    return await this.client.selectFrom("User").selectAll().where("email", "=", email)
      .executeTakeFirst();
  }
  async createUser(payload: UserPayload) {
    return await this.client
      .insertInto("User")
      .values({ ...payload, updatedAt: new Date() })
      .executeTakeFirst()
  }


  async updateUser({ payload, userId }: { payload: any, userId: string }) {
    return await this.client
      .updateTable("User")
      .set(payload)
      .where("id", "=", userId)
      .returningAll()
      .executeTakeFirst()
  }

  async findUsersNotCreatedMealPlan() {
    const currentDate = new Date();
    const thirtyMinutesAgo = new Date(currentDate.getTime() - 30 * 60000);
    return await this.client
      .selectFrom("User")
      .selectAll()
      .where("createdAt", ">=", thirtyMinutesAgo)
      .where("isCreateMealPlanReminderSent", "=", false)
      .execute();
  }

}
