export const FileState = {
  PENDING: 'PENDING',
  UPLOADED: 'UPLOADED',
  PROCESSING: 'PROCESSING',
  DELETED: 'DELETED',
} as const;

export type FileState = typeof FileState[keyof typeof FileState];

export type FileData = {
  key: string;
  url: string;
  state: FileState;
  transcode: boolean;
  uploadUrl?: string;
};
