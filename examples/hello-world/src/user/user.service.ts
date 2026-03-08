/**
 * User entity type.
 * Exported so controllers and tests can reference it without re-declaring.
 */
export interface User {
  /** Unique identifier */
  id: string;
  /** Full name */
  name: string;
  /** Email address */
  email: string;
}

import { Injectable } from '@nemesisjs/common';

/**
 * @class UserService
 * @classdesc In-memory user repository for the hello-world example.
 */
@Injectable()
export class UserService {
  /** @private In-memory list of users */
  private readonly users: User[] = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
  ];

  /**
   * Return all users.
   *
   * @returns {User[]} All stored users
   */
  findAll(): User[] {
    return this.users;
  }

  /**
   * Find a single user by ID.
   *
   * @param {string} id - The user ID to search for
   * @returns {User | undefined} The matching user, or undefined if not found
   */
  findOne(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  /**
   * Create a new user and add it to the store.
   *
   * @param {{ name: string; email: string }} data - The user's name and email
   * @returns {User} The newly created user with an assigned ID
   */
  create(data: { name: string; email: string }): User {
    const user: User = {
      id: String(this.users.length + 1),
      name: data.name,
      email: data.email,
    };
    this.users.push(user);
    return user;
  }
}
