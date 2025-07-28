import request from 'supertest';
import express from 'express';
import routes from '../routes';

const app = express();
app.use(express.json());
app.use('/api', routes);

let token: string;

beforeAll(async () => {
  // Login para obtener token
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  token = loginRes.body.token;
});

describe('Admin Users API', () => {
  let createdId: number;

  it('debe listar administradores', async () => {
    const res = await request(app)
      .get('/api/admin-users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('debe crear un nuevo administrador', async () => {
    const res = await request(app)
      .post('/api/admin-users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'testadmin', password: 'testpass123', nombre: 'Test Admin' });
    expect(res.status).toBe(201);
    expect(res.body.data.username).toBe('testadmin');
    createdId = res.body.data.id;
  });

  it('debe actualizar el nombre del administrador', async () => {
    const res = await request(app)
      .patch(`/api/admin-users/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Admin Actualizado' });
    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Admin Actualizado');
  });

  it('debe desactivar el administrador', async () => {
    const res = await request(app)
      .delete(`/api/admin-users/${createdId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.activo).toBe(false);
  });
}); 