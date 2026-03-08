/**
 * @nemesisjs/common - HTTP Exceptions
 *
 * Base HttpException and common HTTP error classes.
 * All exceptions carry a status code and message for automatic HTTP response conversion.
 */

import { HTTP_STATUS, type HttpStatusCode } from '../constants.js';

/**
 * Base exception class for all HTTP errors.
 * The exception handler converts these into proper HTTP responses.
 */
export class HttpException extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly response: string | Record<string, any>;

  constructor(response: string | Record<string, any>, statusCode: HttpStatusCode) {
    const message = typeof response === 'string' ? response : JSON.stringify(response);
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.response = response;
  }

  getStatus(): HttpStatusCode {
    return this.statusCode;
  }

  getResponse(): string | Record<string, any> {
    return this.response;
  }
}

// ─── 4xx Client Errors ───────────────────────────────────────────────────────

export class BadRequestException extends HttpException {
  constructor(message: string | Record<string, any> = 'Bad Request') {
    super(message, HTTP_STATUS.BAD_REQUEST);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string | Record<string, any> = 'Unauthorized') {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string | Record<string, any> = 'Forbidden') {
    super(message, HTTP_STATUS.FORBIDDEN);
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string | Record<string, any> = 'Not Found') {
    super(message, HTTP_STATUS.NOT_FOUND);
  }
}

export class MethodNotAllowedException extends HttpException {
  constructor(message: string | Record<string, any> = 'Method Not Allowed') {
    super(message, HTTP_STATUS.METHOD_NOT_ALLOWED);
  }
}

export class ConflictException extends HttpException {
  constructor(message: string | Record<string, any> = 'Conflict') {
    super(message, HTTP_STATUS.CONFLICT);
  }
}

export class UnprocessableEntityException extends HttpException {
  constructor(message: string | Record<string, any> = 'Unprocessable Entity') {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }
}

export class TooManyRequestsException extends HttpException {
  constructor(message: string | Record<string, any> = 'Too Many Requests') {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS);
  }
}

// ─── 5xx Server Errors ───────────────────────────────────────────────────────

export class InternalServerErrorException extends HttpException {
  constructor(message: string | Record<string, any> = 'Internal Server Error') {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export class NotImplementedException extends HttpException {
  constructor(message: string | Record<string, any> = 'Not Implemented') {
    super(message, HTTP_STATUS.NOT_IMPLEMENTED);
  }
}

export class BadGatewayException extends HttpException {
  constructor(message: string | Record<string, any> = 'Bad Gateway') {
    super(message, HTTP_STATUS.BAD_GATEWAY);
  }
}

export class ServiceUnavailableException extends HttpException {
  constructor(message: string | Record<string, any> = 'Service Unavailable') {
    super(message, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }
}

export class GatewayTimeoutException extends HttpException {
  constructor(message: string | Record<string, any> = 'Gateway Timeout') {
    super(message, HTTP_STATUS.GATEWAY_TIMEOUT);
  }
}
