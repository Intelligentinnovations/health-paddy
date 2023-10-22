import { MessageBody } from '@backend-template/types';

export interface Messaging {
  send(data: Array<MessageBody> | MessageBody): Promise<void>;
}
