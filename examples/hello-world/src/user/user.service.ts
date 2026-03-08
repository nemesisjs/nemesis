import { Injectable } from '@nemesisjs/common';

interface User {
  id: string;
  name: string;
  email: string;
}

@Injectable()
export class UserService {
  private users: User[] = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
  ];

  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  create(data: Omit<User, 'id'>): User {
    const user: User = { id: String(this.users.length + 1), ...data };
    this.users.push(user);
    return user;
  }
}
