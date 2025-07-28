import request from 'supertest';
import express from 'express';
import routes from '../routes';

const app = express();
app.use(express.json());
app.use('/api', routes);

let token: string;
let restauranteId: number;
let sucursalId: number;

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  token = loginRes.body.token;
  // Buscar restaurante y sucursal existentes
  const resRest = await request(app)
    .get('/api/restaurantes')
    .set('Authorization', `Bearer ${token}`);
  if (resRest.body.data.length > 0) restauranteId = resRest.body.data[0].id_restaurante;
  const resSuc = await request(app)
    .get('/api/sucursales')
    .set('Authorization', `Bearer ${token}`);
  if (resSuc.body.data.length > 0) sucursalId = resSuc.body.data[0].id_sucursal;
});

describe('Reportes API', () => {
  const startDate = '2020-01-01';
  const endDate = '2100-01-01';

  it('debe obtener ventas globales', async () => {
    const res = await request(app)
      .get(`/api/reportes/ventas-global?startDate=${startDate}&endDate=${endDate}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('debe obtener ventas por restaurante', async () => {
    if (!restauranteId) return;
    const res = await request(app)
      .get(`/api/reportes/ventas-restaurante/${restauranteId}?startDate=${startDate}&endDate=${endDate}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('debe obtener ventas por sucursal', async () => {
    if (!sucursalId) return;
    const res = await request(app)
      .get(`/api/reportes/ventas-sucursal/${sucursalId}?startDate=${startDate}&endDate=${endDate}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('debe exportar ventas a CSV', async () => {
    const res = await request(app)
      .get(`/api/reportes/exportar-csv?startDate=${startDate}&endDate=${endDate}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('text/csv');
  });
}); 