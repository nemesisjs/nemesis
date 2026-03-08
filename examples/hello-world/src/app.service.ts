import { Injectable } from '@nemesisjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello from NemesisJS!';
  }

  getStatus() {
    return {
      framework: 'NemesisJS',
      runtime: 'Bun',
      version: '0.1.0',
      uptime: process.uptime(),
    };
  }
}
