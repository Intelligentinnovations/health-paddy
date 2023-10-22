import { HttpEvent, IRes, Res } from '@backend-template/server';
import { FileManagerSchema } from '@backend-template/types';

import { FileService, FileUploadService } from '../services';
import { FileServiceImpl, FileUploadServiceImpl } from '../services/impl';

export async function httpHandler(
  event?: HttpEvent,
  fileUploadService: FileUploadService = new FileUploadServiceImpl(),
  fileService: FileService = new FileServiceImpl()
): Promise<IRes> {
  if (!event) return Res.serverError('no event');

  const data = FileManagerSchema.parse(
    JSON.parse(
      event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString()
        : event.body
    )
  );

  switch (data.action) {
    case 'upload':
      return Res.success(await fileUploadService.uploadFile(data));
    case 'generateSignedUrl':
      return Res.success(fileService.generateSignedUrl(data.url));
    case 'generateSignedCookie':
      return Res.success(fileService.generateSignedCookie(data.url));
    default:
      return Res.failed('no handler for event');
  }
}
