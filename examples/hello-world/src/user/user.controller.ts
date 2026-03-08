import { Controller, Get, Post, Inject, Param, Body, Req } from '@nemesisjs/common';
import { NotFoundException } from '@nemesisjs/common';
import type { RequestContext } from '@nemesisjs/platform-bun';
import type { UserService, User } from './user.service.js';

/**
 * @class UserController
 * @classdesc Handles HTTP requests for the /users resource.
 */
@Controller('/users')
export class UserController {
  constructor(@Inject('UserService') private readonly userService: UserService) {}

  /**
   * List all users.
   *
   * @returns {User[]} Array of all users (serialized to JSON by the pipeline)
   */
  @Get('/')
  findAll(): User[] {
    return this.userService.findAll();
  }

  /**
   * Find a single user by ID.
   *
   * @param {string} id - Route parameter: the user ID
   * @returns {User} The found user
   * @throws {NotFoundException} When the user does not exist
   */
  @Get('/:id')
  findOne(@Param('id') id: string): User {
    const user = this.userService.findOne(id);
    if (!user) throw new NotFoundException(`User with id "${id}" not found`);
    return user;
  }

  /**
   * Create a new user and respond with 201 Created.
   *
   * @param {{ name: string; email: string }} body - The user data
   * @param {RequestContext} ctx - The request context (for setting status 201)
   * @returns {Promise<Response>} The created user with 201 status
   */
  @Post('/')
  async create(
    @Body() body: { name: string; email: string },
    @Req() ctx: RequestContext,
  ): Promise<Response> {
    const user = this.userService.create(body);
    return ctx.json(user, 201);
  }
}
