import { Injectable } from '@nemesisjs/common';

interface User {
  id: string;
  name: string;
  email: string;
}

@Injectable()
export class UserService {
  private readonly users: User[] = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
  ];

  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

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
