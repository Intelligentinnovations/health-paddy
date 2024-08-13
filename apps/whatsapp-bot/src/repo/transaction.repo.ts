import { KyselyService } from "@backend-template/database";
import { Injectable } from "@nestjs/common";

import {DB} from "../types";

@Injectable()
export class TransactionRepo {
  constructor(
    private client: KyselyService<DB>
  ) { }

  async findTransactionByReference(reference: string) {
    return await this.client
      .selectFrom("Transaction")
      .selectAll()
      .where("reference", "=", reference)
      .executeTakeFirst()
  }


}
