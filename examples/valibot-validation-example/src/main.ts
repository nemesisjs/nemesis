import { createHttpApp } from '@nemesis-js/http';
import { ValidationPipe } from '@nemesis-js/validation';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await createHttpApp(AppModule);
  app.useGlobalPipes(app.get(ValidationPipe));
  await app.listen(3000);

  console.log(`NemesisJS server running at ${app.getUrl()}`);
}

bootstrap();
