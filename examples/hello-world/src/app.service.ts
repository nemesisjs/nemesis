import { Injectable } from '@nemesisjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello from NemesisJS!';
  }

  getStatus(): Record<string, string> {
    return {
      framework: 'NemesisJS',
      runtime: 'Bun',
      status: 'running',
    };
  }
}
