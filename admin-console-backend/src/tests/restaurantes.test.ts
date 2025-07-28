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

describe('Restaurantes API', () => {
  let restauranteId: number;

  it('debe listar restaurantes', async () => {
    const res = await request(app)
      .get('/api/restaurantes')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) restauranteId = res.body.data[0].id_restaurante;
  });

  it('debe ver detalle de un restaurante', async () => {
    if (!restauranteId) return;
    const res = await request(app)
      .get(`/api/restaurantes/${restauranteId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id_restaurante).toBe(restauranteId);
  });

  it('debe suspender y reactivar un restaurante', async () => {
    if (!restauranteId) return;
    // Suspender
    let res = await request(app)
      .patch(`/api/restaurantes/${restauranteId}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ activo: false });
    expect(res.status).toBe(200);
    expect(res.body.data.activo).toBe(false);
    // Reactivar
    res = await request(app)
      .patch(`/api/restaurantes/${restauranteId}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ activo: true });
    expect(res.status).toBe(200);
    expect(res.body.data.activo).toBe(true);
  });
}); 