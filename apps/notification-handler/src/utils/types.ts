export type EmailTemplate = {
  subject: string;
  from?: string;
  body: HandlebarsTemplateDelegate;
};
