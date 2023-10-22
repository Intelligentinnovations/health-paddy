import { MessageBody } from '@backend-template/types';

import { NotificationService } from '../services';
import { NotificationServiceImpl } from '../services/impl';

export async function eventHandler(
  event: MessageBody,
  notificationService: NotificationService = new NotificationServiceImpl()
): Promise<void> {
  switch (event.action) {
    case 'NOTIFICATION':
      return notificationService.send(event.body);
    default:
      return;
  }
}
