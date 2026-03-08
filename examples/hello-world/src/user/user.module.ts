import { Module } from '@nemesisjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [
    { provide: 'UserService', useClass: UserService },
  ],
  exports: ['UserService'],
})
export class UserModule {}
