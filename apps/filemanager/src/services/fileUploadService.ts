import { UploadFileData } from '@backend-template/types';

import { FileData } from '../utils';

export interface FileUploadService {
  uploadFile(data: UploadFileData): Promise<FileData>;
}
