import { Controller, Get, Post, Body, Param, Inject } from '@nemesisjs/common';
import { NotFoundException } from '@nemesisjs/common';
import type { RequestContext } from '@nemesisjs/http';
import { UserService } from './user.service.js';

@Controller('/users')
export class UserController {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  @Get('/')
  findAll(ctx: RequestContext) {
    return ctx.json(this.userService.findAll());
  }

  @Get('/:id')
  findOne(@Param('id') id: string, ctx: RequestContext) {
    const user = this.userService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return ctx.json(user);
  }

  @Post('/')
  create(@Body() body: { name: string; email: string }, ctx: RequestContext) {
    const user = this.userService.create(body);
    return ctx.json(user, 201);
  }
}
