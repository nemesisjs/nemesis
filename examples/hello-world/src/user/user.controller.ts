import { Controller, Get, Post, Inject, Body, Param } from '@nemesisjs/common';
import type { RequestContext } from '@nemesisjs/http';
import type { UserService } from './user.service';
import { NotFoundException } from '@nemesisjs/common';

@Controller('/users')
export class UserController {
  constructor(@Inject('UserService') private readonly userService: UserService) {}

  @Get('/')
  findAll(ctx: RequestContext) {
    const users = this.userService.findAll();
    return ctx.json(users);
  }

  @Get('/:id')
  findOne(ctx: RequestContext) {
    const id = ctx.getParam('id');
    if (!id) throw new NotFoundException('User not found');
    const user = this.userService.findOne(id);
    if (!user) throw new NotFoundException(`User with id "${id}" not found`);
    return ctx.json(user);
  }

  @Post('/')
  async create(ctx: RequestContext) {
    const body = await ctx.getBody<{ name: string; email: string }>();
    const user = this.userService.create(body);
    return ctx.json(user, 201);
  }
}
