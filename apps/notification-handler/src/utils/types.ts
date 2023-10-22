import { NotificationTemplateData } from '@backend-template/types';

export type SendEmailData = {
  templateId: string;
  templateData: Record<string, NotificationTemplateData>;
  recipients: string[];
};

export type EmailTemplate = {
  subject: string;
  from?: string;
  body: HandlebarsTemplateDelegate;
};

export type Template = {
  body: HandlebarsTemplateDelegate;
  subject?: string;
  from?: string;
};
