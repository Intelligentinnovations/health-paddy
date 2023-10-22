import Handlebars from 'handlebars';

export const smsTemplates: Record<string, HandlebarsTemplateDelegate> = {
  otp: Handlebars.compile(
    "here's your one time password {{otp}}. do not give it to anybody"
  ),
};
