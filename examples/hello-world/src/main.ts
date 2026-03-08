import { NemesisApp } from '@nemesisjs/http';
import { AppModule } from './app.module';


const app = await NemesisApp.createHttp(AppModule, {
});
await app.listen(3000);

