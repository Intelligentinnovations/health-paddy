import { SendEmailCommand } from '@aws-sdk/client-ses';
import { CustomRes } from '@backend-template/helpers';
import { NotificationData } from '@backend-template/types';
import { Injectable } from '@nestjs/common';

import { SesService } from '../libraries/ses.service';
import { SecretsService } from '../secrets/secrets.service';
import { emailTemplates, smsTemplates } from '../utils';

@Injectable()
export class NotificationService {
  constructor(private sesClient: SesService, private secrets: SecretsService) {}

  async send(notificationData: NotificationData) {
    if (notificationData.emailRecipients?.length) {
      const template = emailTemplates[notificationData.templateId];
      if (!template) throw CustomRes.serverError('invalid template id');

      const Charset = 'UTF-8';
      const res = await this.sesClient.send(
        new SendEmailCommand({
          Source: template.from ?? this.secrets.get('MAIL_FROM'),
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

      if (!template) throw CustomRes.serverError(`invalid template`);

      console.log('send sms :: ', template);
    }
  }
}
