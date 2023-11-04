import { httpBootstrap } from '@backend-template/server';

import { AppModule } from './app.module';

httpBootstrap(AppModule, 'auth').then((serverApp) =>
  serverApp.listen(process.env.PORT ?? 3000)
);
