import { describe, it, expect } from 'bun:test';
import {
  HttpException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '../src/index';

describe('@nemesis-js/common - Exceptions', () => {
  it('HttpException should carry status and message', () => {
    const err = new HttpException('Test error', 400);
    expect(err.getStatus()).toBe(400);
    expect(err.getResponse()).toBe('Test error');
    expect(err.message).toBe('Test error');
  });

  it('HttpException should support object responses', () => {
    const err = new HttpException({ error: 'Validation failed', fields: ['name'] }, 422);
    expect(err.getStatus()).toBe(422);
    expect(err.getResponse()).toEqual({ error: 'Validation failed', fields: ['name'] });
  });

  it('BadRequestException should default to 400', () => {
    const err = new BadRequestException();
    expect(err.getStatus()).toBe(400);
    expect(err.getResponse()).toBe('Bad Request');
  });

  it('UnauthorizedException should default to 401', () => {
    const err = new UnauthorizedException();
    expect(err.getStatus()).toBe(401);
  });

  it('ForbiddenException should default to 403', () => {
    const err = new ForbiddenException();
    expect(err.getStatus()).toBe(403);
  });

  it('NotFoundException should default to 404', () => {
    const err = new NotFoundException();
    expect(err.getStatus()).toBe(404);
  });

  it('InternalServerErrorException should default to 500', () => {
    const err = new InternalServerErrorException();
    expect(err.getStatus()).toBe(500);
  });

  it('should support custom messages', () => {
    const err = new NotFoundException('User not found');
    expect(err.getStatus()).toBe(404);
    expect(err.getResponse()).toBe('User not found');
  });
});
