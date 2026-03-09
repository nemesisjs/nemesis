import { createHttpApp } from '@nemesis-js/http';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await createHttpApp(AppModule);
  await app.listen(3000);

  console.log(`NemesisJS server running at ${app.getUrl()}`);
}

bootstrap();
