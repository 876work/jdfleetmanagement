import { validateRequiredEnvVars } from './config/env.js';
import connectDB from './config/db.js';
import app from './src/app.js';

const startServer = async () => {
    try {
        validateRequiredEnvVars();
        await connectDB();

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
    } catch (err) {
        console.error('❌ Backend startup failed:', err.message);
        process.exit(1);
    }
};

if (process.env.NODE_ENV !== 'test') {
    startServer();
}
