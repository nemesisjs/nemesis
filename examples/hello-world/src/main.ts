import { createHttpApp } from '@nemesisjs/http';
import { AppModule } from './app.module';

const startTime = performance.now();

const app = await createHttpApp(AppModule);
await app.listen(3000);

const bootTime = (performance.now() - startTime).toFixed(2);
console.log(`NemesisJS server running at ${app.getUrl()} (boot: ${bootTime}ms)`);
