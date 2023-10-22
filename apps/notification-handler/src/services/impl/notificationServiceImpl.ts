import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Res } from '@backend-template/server';
import { NotificationData } from '@backend-template/types';

import { secrets } from '../../secrets';
import { emailTemplates, getSesClient, smsTemplates } from '../../utils';
import { NotificationService } from '../notificationService';

export class NotificationServiceImpl implements NotificationService {
  readonly #sesClient: SESClient;

  constructor(sesClient = getSesClient()) {
    this.#sesClient = sesClient;
  }

  async send(notificationData: NotificationData) {
    if (notificationData.emailRecipients?.length) {
      const template = emailTemplates[notificationData.templateId];
      if (!template) throw Res.serverError('invalid template id');

      const Charset = 'UTF-8';
      const res = await this.#sesClient.send(
        new SendEmailCommand({
          Source: template.from ?? secrets.MAIL_FROM,
          Destination: { ToAddresses: notificationData.emailRecipients },
          Message: {
            Subject: { Charset, Data: template.subject },
            Body: {
              Html: {
                Charset,
                Data: template.body(notificationData.templateData),
              },
            },
          },
        })
      );

      console.info('send email response :: ', res);
    } else if (notificationData.smsRecipients?.length) {
      const template = smsTemplates[notificationData.templateId]?.(
        notificationData.templateData
      );

      if (!template) throw Res.serverError(`invalid template`);

      console.log('send sms :: ', template);
    }
  }
}
