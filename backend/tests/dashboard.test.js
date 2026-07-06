import request from 'supertest';
import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Customer from '../src/models/Customer.js';
import VehicleCategory from '../src/models/VehicleCategory.js';
import Vehicle from '../src/models/Vehicle.js';
import MaintenanceRecord from '../src/models/MaintenanceRecord.js';
import Bill from '../src/models/Bill.js';
import Part from '../src/models/Part.js';

let mongoServer;
let token;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    token = jwt.sign({ id: 'dashboard-user' }, process.env.JWT_SECRET || 'your-secret-key');
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe('Dashboard summary API', () => {
    it('returns real counts and derived dashboard lists', async () => {
        const customer = await Customer.create({
            firstName: 'Jane',
            lastName: 'Owner',
            phone: '555-1111',
            email: 'jane@example.com',
            address: '100 Fleet Way',
        });
        const category = await VehicleCategory.create({ name: 'Truck' });
        const vehicle = await Vehicle.create({
            plateNumber: 'JD-100',
            brand: 'Ford',
            model: 'F-150',
            year: 2020,
            categoryId: category._id,
            ownerId: customer._id,
        });
        const oldDate = new Date(Date.now() - 220 * 24 * 60 * 60 * 1000);
        const maintenance = await MaintenanceRecord.create({
            vehicleId: vehicle._id,
            serviceDate: oldDate,
            services: [{ description: 'Oil change', cost: 125 }],
        });
        await Bill.create({
            vehicle: vehicle._id,
            customer: customer._id,
            maintenanceId: maintenance._id,
            services: [{ description: 'Oil change', price: 125 }],
            totalPrice: 125,
            date: oldDate,
        });
        await Part.create({ name: 'Oil filter', quantity: 2, price: 15 });

        const res = await request(app)
            .get('/api/dashboard/summary?limit=5&lowStockThreshold=5&attentionDays=180')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.counts).toEqual({
            vehicles: 1,
            customers: 1,
            maintenanceRecords: 1,
            invoices: 1,
        });
        expect(res.body.recentMaintenance).toHaveLength(1);
        expect(res.body.recentInvoices).toHaveLength(1);
        expect(res.body.lowStockParts).toHaveLength(1);
        expect(res.body.vehiclesNeedingAttention).toHaveLength(1);
        expect(res.body.vehiclesNeedingAttention[0].reason).toMatch(/No service recorded/);
    });
});
