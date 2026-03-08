import { Controller, Get, Inject } from '@nemesisjs/common';
import type { RequestContext } from '@nemesisjs/http';
import type { AppService } from './app.service';

@Controller('/')
export class AppController {
  constructor(@Inject('AppService') private readonly appService: AppService) {}

  @Get('/')
  getHello(ctx: RequestContext) {
    return ctx.json({ message: this.appService.getHello() });
  }

  @Get('/status')
  getStatus(ctx: RequestContext) {
    return ctx.json(this.appService.getStatus());
  }
}
