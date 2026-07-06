import request from 'supertest';
import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Part from '../src/models/Part.js';

let mongoServer;
let token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  token = jwt.sign({ id: 'parts-admin', role: 'admin' }, process.env.JWT_SECRET || 'your-secret-key');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('Part routes', () => {
  it('deletes a part through the registered deletePart route handler', async () => {
    const part = await Part.create({ name: 'Brake pad', quantity: 4, price: 49.99 });

    const res = await request(app)
      .delete(`/api/parts/${part._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/part deleted/i);
    await expect(Part.findById(part._id)).resolves.toBeNull();
  });
});
