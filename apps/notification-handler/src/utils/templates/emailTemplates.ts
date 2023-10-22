import fs from 'fs';
import Handlebars from 'handlebars';

import { EmailTemplate } from '../types';

function getTemplate(name: string) {
  return Handlebars.compile(
    fs.readFileSync(`${__dirname}/src/assets/${name}`).toString()
  );
}

export const emailTemplates: Record<string, EmailTemplate> = {
  otp: {
    body: getTemplate('otp-email-template.html'),
    subject: 'One time Password',
  },
};
