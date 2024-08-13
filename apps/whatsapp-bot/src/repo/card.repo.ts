import { KyselyService } from "@backend-template/database";
import { Injectable } from "@nestjs/common";

import {DB} from "../types";

@Injectable()
export class CardRepo {
  constructor(
    private client: KyselyService<DB>
  ) { }

  async findUserExistingCard({ last4Digits, userId }: { last4Digits: string, userId: string }) {
    return await this.client
      .selectFrom("Card")
      .select("id")
      .where("last4Digits", "=", last4Digits)
      .where("userId", "=", userId)
      .executeTakeFirst()
  }

  async fetchUserCards(userId: string) {
    return await this.client
      .selectFrom("Card")
      .selectAll()
      .where("userId", "=", userId)
      .execute()
  }

  async fetchUserDefaultCard(userId: string) {
    return await this.client
      .selectFrom("Card")
      .selectAll()
      .where("userId", "=", userId)
      .executeTakeFirstOrThrow()
  }

}
