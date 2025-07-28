import request from 'supertest';
import express from 'express';
import routes from '../routes';

const app = express();
app.use(express.json());
app.use('/api', routes);

let token: string;

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  token = loginRes.body.token;
});

describe('Sucursales API', () => {
  let sucursalId: number;

  it('debe listar sucursales', async () => {
    const res = await request(app)
      .get('/api/sucursales')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) sucursalId = res.body.data[0].id_sucursal;
  });

  it('debe ver detalle de una sucursal', async () => {
    if (!sucursalId) return;
    const res = await request(app)
      .get(`/api/sucursales/${sucursalId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id_sucursal).toBe(sucursalId);
  });

  it('debe desactivar y reactivar una sucursal', async () => {
    if (!sucursalId) return;
    // Desactivar
    let res = await request(app)
      .patch(`/api/sucursales/${sucursalId}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ activo: false });
    expect(res.status).toBe(200);
    expect(res.body.data.activo).toBe(false);
    // Reactivar
    res = await request(app)
      .patch(`/api/sucursales/${sucursalId}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ activo: true });
    expect(res.status).toBe(200);
    expect(res.body.data.activo).toBe(true);
  });
}); 