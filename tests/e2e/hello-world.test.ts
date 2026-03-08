import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { createHttpApp } from '@nemesisjs/http';
import { TestClient } from '@nemesisjs/testing';
import { AppModule } from '../../examples/hello-world/src/app.module.js';

describe('Hello World E2E', () => {
  let client: TestClient;

  beforeAll(async () => {
    const app = await createHttpApp(AppModule);
    client = new TestClient(app);
    await client.listen();
  });

  afterAll(async () => {
    await client.close();
  });

  describe('GET /', () => {
    it('should return hello message', async () => {
      const res = await client.get('/');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe('Hello from NemesisJS!');
    });
  });

  describe('GET /status', () => {
    it('should return framework status', async () => {
      const res = await client.get('/status');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.framework).toBe('NemesisJS');
      expect(body.runtime).toBe('Bun');
    });
  });

  describe('GET /users', () => {
    it('should return list of users', async () => {
      const res = await client.get('/users');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const res = await client.post('/users', {
        name: 'Charlie',
        email: 'charlie@example.com',
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.name).toBe('Charlie');
      expect(body.email).toBe('charlie@example.com');
      expect(body.id).toBeDefined();
    });
  });

  describe('GET /users/:id', () => {
    it('should return a specific user', async () => {
      const res = await client.get('/users/1');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe('1');
      expect(body.name).toBe('Alice');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await client.get('/users/999');
      expect(res.status).toBe(404);
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await client.get('/nonexistent');
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.statusCode).toBe(404);
    });
  });
});
