import { NotificationData } from '@backend-template/types';

export interface NotificationService {
  send(data: NotificationData): Promise<void>;
}
