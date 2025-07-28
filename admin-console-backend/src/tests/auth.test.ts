import request from 'supertest';
import express from 'express';
import routes from '../routes';
import { authenticateAdmin } from '../middlewares/authMiddleware';

const app = express();
app.use(express.json());
app.use('/api', routes);

// Test de login exitoso y acceso a endpoint protegido

describe('Auth API', () => {
  it('debe rechazar login con credenciales inválidas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'noexiste', password: 'incorrecto' });
    expect(res.status).toBe(401);
  });

  it('debe permitir login con credenciales válidas y acceder a endpoint protegido', async () => {
    // Usuario hardcodeado: admin / admin123
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    // Acceso a endpoint protegido
    const token = loginRes.body.token;
    const res = await request(app)
      .get('/api/admin-users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
}); 