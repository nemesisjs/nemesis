import { Injectable } from '@nemesisjs/common';

/** Application status snapshot */
interface AppStatus {
  framework: string;
  runtime: string;
  version: string;
  uptime: number;
}

/**
 * @class AppService
 * @classdesc Root application service providing health and greeting functionality.
 */
@Injectable()
export class AppService {
  /**
   * Return a greeting message.
   *
   * @returns {string} The greeting string
   */
  getHello(): string {
    return 'Hello from NemesisJS!';
  }

  /**
   * Return a snapshot of the current application status.
   *
   * @returns {AppStatus} Framework, runtime, version, and uptime information
   */
  getStatus(): AppStatus {
    return {
      framework: 'NemesisJS',
      runtime: 'Bun',
      version: '0.1.0',
      uptime: process.uptime(),
    };
  }
}
