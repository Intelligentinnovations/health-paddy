import { Sqs } from "@backend-template/messaging";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { Cache } from "cache-manager";
import { EventType } from "libs/types/src/lib/types/event";

import { UserRepo } from "../repo";
import { State } from "../types";

interface IncomingMessageBody {
  object: unknown;
  entry?: Array<{
    changes?: Array<{
      value: {
        messages?: Array<{
          from: string;
          text: {
            body: string;
          };
        }>;
        contacts?: Array<{
          profile: {
            name: string;
          };
        }>;
      };
    }>;
  }>;
}


@Injectable()
export class AppService {
  private readonly sqs: Sqs;

  constructor(
    private userRepo: UserRepo,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
    this.sqs = new Sqs()
  }


  async handleIncomingMessage(body: IncomingMessageBody) {
    try {
      if (body.object) {
        if (
          body.entry?.[0]?.changes?.[0]?.value.messages?.[0] &&
          body.entry[0].changes[0].value.contacts?.[0]
        ) {
          const sender = body.entry[0].changes[0].value.messages[0].from;
          const messageBody = body.entry[0].changes[0].value.messages[0].text.body;
          const profileName =
            body.entry[0].changes[0].value.contacts[0].profile.name;

          const isProcessingCacheKey = `${sender}-is-processing`
          const isProcessing = await this.cacheManager.get(isProcessingCacheKey)

          if (isProcessing) return {
            status: "success"
          }
          let state = await this.cacheManager.get<State>(sender);
          if (!state?.user?.id) {
            const initialState: State = {
              stage: state?.stage || "landing",
              user: undefined,
              data: state?.data
            };
            const user = await this.userRepo.findUserByPhoneNumber(sender);
            state = { ...initialState, user }
            await this.cacheManager.set(sender, state);
          }
          await this.sqs.send({
            eventType: EventType.MESSAGE,
            data: {
              input: messageBody,
              phoneNumber: sender,
              profileName,
              state
            }
          }, process.env.QUEUE_URL)
          return {
            status: "success"
          }
        }
      } else {
        return {
          status: "not-found",
        };
      }
    } catch (error) {
      console.log({ error });

    }
  }

  async handlePaystackEvents(reference: string) {
    await this.sqs.send({
      eventType: EventType.PAYMENT,
      reference
    }, process.env.QUEUE_URL)

    return {
      status: "success"
    }
  }
}
