import { Module } from '@nemesis-js/common';
import { ValidationModule } from '@nemesis-js/validation';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ValidationModule.forRoot({ adapter: 'zod' }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
