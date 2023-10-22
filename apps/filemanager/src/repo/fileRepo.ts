import { IOptional } from '@backend-template/server';

import { FileData } from '../utils';

export interface FileRepo {
  createFile(data: FileData): Promise<void>;
  fetchFile(key: string): IOptional<FileData>;
  updateFile(data: FileData): Promise<void>;
}
