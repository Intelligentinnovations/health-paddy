import { MessageBody } from '@backend-template/types';

export async function eventHandler(event: MessageBody): Promise<void> {
  switch (event.action) {
    default:
      console.error('no handler for this event');
  }
}
