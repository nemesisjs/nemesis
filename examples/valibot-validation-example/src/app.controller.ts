import { Controller, Get, Post, Body } from '@nemesis-js/common';
import { UseSchema } from '@nemesis-js/validation';
import type { RequestContext } from '@nemesis-js/http';
import { AppService } from './app.service.js';
import * as v from 'valibot';

const createProductSchema = v.object({
  name: v.string(),
  price: v.number(),
  inStock: v.optional(v.boolean()),
});

type CreateProductDto = v.InferOutput<typeof createProductSchema>;

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  getHello(ctx: RequestContext) {
    return ctx.json({ message: this.appService.getHello() });
  }

  @Post('/products')
  createProduct(@Body() @UseSchema(createProductSchema) body: CreateProductDto, ctx: RequestContext) {
    return ctx.json(
      {
        success: true,
        message: 'Product created successfully',
        product: body,
      },
      201,
    );
  }
}
