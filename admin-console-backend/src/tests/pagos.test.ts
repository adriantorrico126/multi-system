import request from 'supertest';
import express from 'express';
import routes from '../routes';

const app = express();
app.use(express.json());
app.use('/api', routes);

let token: string;
let restauranteId: number;

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  token = loginRes.body.token;
  // Buscar un restaurante existente
  const res = await request(app)
    .get('/api/restaurantes')
    .set('Authorization', `Bearer ${token}`);
  if (res.body.data.length > 0) restauranteId = res.body.data[0].id_restaurante;
});

describe('Pagos API', () => {
  let pagoId: number;

  it('debe registrar un pago', async () => {
    if (!restauranteId) return;
    const res = await request(app)
      .post('/api/pagos/registrar')
      .set('Authorization', `Bearer ${token}`)
      .send({ id_restaurante: restauranteId, monto: 100, metodo_pago: 'Efectivo', observaciones: 'Test pago' });
    expect(res.status).toBe(201);
    expect(res.body.data.id_restaurante).toBe(restauranteId);
    pagoId = res.body.data.id;
  });

  it('debe listar pagos por restaurante', async () => {
    if (!restauranteId) return;
    const res = await request(app)
      .get(`/api/pagos/${restauranteId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('debe ver estado de suscripción', async () => {
    if (!restauranteId) return;
    const res = await request(app)
      .get(`/api/pagos/estado/${restauranteId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.restaurante.id_restaurante).toBe(restauranteId);
  });

  it('debe suspender y reactivar restaurante', async () => {
    if (!restauranteId) return;
    // Suspender
    let res = await request(app)
      .patch(`/api/pagos/suspender-activar/${restauranteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ activo: false });
    expect(res.status).toBe(200);
    expect(res.body.data.activo).toBe(false);
    // Reactivar
    res = await request(app)
      .patch(`/api/pagos/suspender-activar/${restauranteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ activo: true });
    expect(res.status).toBe(200);
    expect(res.body.data.activo).toBe(true);
  });
}); 