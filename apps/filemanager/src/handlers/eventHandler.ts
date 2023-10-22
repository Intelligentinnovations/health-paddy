import { S3EventObject, S3EventType } from '@backend-template/server';

import { FileService } from '../services';
import { FileServiceImpl } from '../services/impl';

export async function eventHandler(
  eventName?: S3EventType,
  eventData?: S3EventObject,
  fileService: FileService = new FileServiceImpl()
): Promise<void> {
  if (!eventData) return;

  switch (eventName) {
    case 'ObjectCreated:Put':
      return fileService.fileUploaded(eventData.key);
    default:
      return;
  }
}
