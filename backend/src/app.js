import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middlewares/authMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import billRoutes from './routes/billRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import partRoutes from './routes/partRoutes.js';

import './models/index.js';

const app = express();

const parseOrigins = (value) => (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = [
    'http://localhost:5173',
    'https://jdfleetmanagement.netlify.app',
    ...parseOrigins(process.env.CLIENT_URL),
];

const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

const corsOptions = {
    origin(origin, callback) {
        // Requests without an Origin header are not browser CORS requests.
        if (!origin) return callback(null, true);

        if (uniqueAllowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
};

// Apply the same CORS policy to normal API requests and preflight OPTIONS requests.
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

//Routes without authentication
app.use('/api/auth', authRoutes);

// Routes with authentication
app.use('/api', authMiddleware);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/parts', partRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'JD Fleet Management API is running' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

export default app;
