import request from 'supertest';
import app from '../src/app.js';

describe('App routing and CORS', () => {
    it('returns API status JSON at the root route instead of redirecting', async () => {
        const res = await request(app).get('/');

        expect(res.statusCode).toBe(200);
        expect(res.headers.location).toBeUndefined();
        expect(res.body).toEqual({ message: 'JD Fleet Management API is running' });
    });

    it('keeps the health endpoint working', async () => {
        const res = await request(app).get('/health');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'ok' });
    });

    it('does not redirect login API preflight traffic', async () => {
        const res = await request(app)
            .options('/api/auth/login')
            .set('Origin', 'https://jdfleetmanagement.netlify.app')
            .set('Access-Control-Request-Method', 'POST');

        expect(res.statusCode).not.toBe(301);
        expect(res.statusCode).not.toBe(302);
        expect(res.headers.location).toBeUndefined();
    });

    it('allows the Netlify frontend origin through CORS', async () => {
        const res = await request(app)
            .options('/api/auth/login')
            .set('Origin', 'https://jdfleetmanagement.netlify.app')
            .set('Access-Control-Request-Method', 'POST');

        expect(res.statusCode).toBe(204);
        expect(res.headers['access-control-allow-origin']).toBe('https://jdfleetmanagement.netlify.app');
    });

    it('allows local development origin through CORS', async () => {
        const res = await request(app)
            .options('/api/auth/login')
            .set('Origin', 'http://localhost:5173')
            .set('Access-Control-Request-Method', 'POST');

        expect(res.statusCode).toBe(204);
        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('blocks random browser origins through CORS', async () => {
        const res = await request(app)
            .options('/api/auth/login')
            .set('Origin', 'https://random.example.com')
            .set('Access-Control-Request-Method', 'POST');

        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('uses the same CORS rules for normal API requests', async () => {
        const res = await request(app)
            .get('/health')
            .set('Origin', 'https://jdfleetmanagement.netlify.app');

        expect(res.statusCode).toBe(200);
        expect(res.headers['access-control-allow-origin']).toBe('https://jdfleetmanagement.netlify.app');
    });

});
