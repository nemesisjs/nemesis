import { Module } from '@nemesisjs/common';
import { ValidationModule } from '@nemesisjs/validation';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ValidationModule.forRoot({ adapter: 'zod' }),
  ],
  controllers: [AppController],
  providers: [
    { provide: 'AppService', useClass: AppService },
  ],
})
export class AppModule {}
