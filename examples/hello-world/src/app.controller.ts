import { Controller, Get } from '@nemesis-js/common';
import type { RequestContext } from '@nemesis-js/http';
import { AppService } from './app.service.js';

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  getHello(ctx: RequestContext) {
    return ctx.json({ message: this.appService.getHello() });
  }

  @Get('/status')
  getStatus(ctx: RequestContext) {
    return ctx.json(this.appService.getStatus());
  }
}
