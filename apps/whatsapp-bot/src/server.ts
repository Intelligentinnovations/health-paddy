import { httpBootstrap } from '@backend-template/server';

import { AppModule } from './app.module';

httpBootstrap(AppModule, 'whatsapp').then((serverApp) =>
  serverApp.listen(process.env.PORT ?? 3000)
);
