type NotificationDataValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | boolean[];

export interface NotificationTemplateData {
  [x: string]: NotificationDataValue | NotificationTemplateData;
}

export type NotificationData = {
  templateId: string;
  templateData: NotificationTemplateData;
  emailRecipients?: string[];
  smsRecipients?: string[];
  pushNotificationRecipients?: string[];
};
