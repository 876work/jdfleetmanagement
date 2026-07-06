import request from 'supertest';
import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../src/models/User.js';

let mongoServer;
let adminUser;
let staffUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  adminUser = await User.create({
    username: 'admin',
    passwordHash: 'admin-password',
    role: 'admin',
  });

  staffUser = await User.create({
    username: 'staff',
    passwordHash: 'staff-password',
    role: 'staff',
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('User management routes', () => {
  it('allows an admin to list users even when the token role is stale', async () => {
    const token = jwt.sign({ id: adminUser._id, role: 'staff' }, process.env.JWT_SECRET || 'your-secret-key');

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.map((user) => user.username)).toEqual(['admin', 'staff']);
  });

  it('blocks staff users from listing users', async () => {
    const token = jwt.sign({ id: staffUser._id, role: 'staff' }, process.env.JWT_SECRET || 'your-secret-key');

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
  });
});
