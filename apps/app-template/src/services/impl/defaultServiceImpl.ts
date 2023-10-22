import { Messaging, Sqs } from '@backend-template/messaging';
import { Pagination } from '@backend-template/server';
import { UserData } from '@backend-template/types';

import { DefaultRepo } from '../../repo';
import { DefaultRepoImpl } from '../../repo/impl';
import { DefaultService } from '../defaultService';

export class DefaultServiceImpl implements DefaultService {
  readonly #defaultRepo: DefaultRepo;
  readonly #messaging: Messaging;

  constructor(
    defaultRepo: DefaultRepo = new DefaultRepoImpl(),
    messaging: Messaging = new Sqs()
  ) {
    this.#defaultRepo = defaultRepo;
    this.#messaging = messaging;
  }

  async getUser(pagination: Pagination, userData: UserData | null) {
    const user = await this.#defaultRepo
      .fetchUser('festusyuma@gmail.com')
      .unwrapOrThrow();

    await this.#messaging.send({
      action: 'NOTIFICATION',
      body: {
        templateId: 'resetLink',
        templateData: {
          url: 'https://google.com',
        },
        emailRecipients: ['fes'],
        smsRecipients: [''],
        pushNotificationRecipients: [''],
      },
    });

    console.log({ userData, pagination });

    return user;
  }
}
