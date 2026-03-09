import { Controller, Get, Post, Body } from '@nemesis-js/common';
import { UseSchema } from '@nemesis-js/validation';
import type { RequestContext } from '@nemesis-js/http';
import { AppService } from './app.service.js';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  age: z.number().int().min(18, 'Must be at least 18 years old').optional(),
});

type CreateUserDto = z.infer<typeof createUserSchema>;

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  getHello(ctx: RequestContext) {
    return ctx.json({ message: this.appService.getHello() });
  }

  @Post('/users')
  createUser(@Body() @UseSchema(createUserSchema) body: CreateUserDto, ctx: RequestContext) {
    return ctx.json(
      {
        success: true,
        message: 'User created successfully',
        user: body,
      },
      201,
    );
  }
}
