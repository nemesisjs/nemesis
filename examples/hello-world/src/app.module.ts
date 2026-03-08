import { Module } from '@nemesisjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';

@Module({
  imports: [UserModule],
  controllers: [AppController],
  providers: [
    { provide: 'AppService', useClass: AppService },
  ],
})
export class AppModule {}
