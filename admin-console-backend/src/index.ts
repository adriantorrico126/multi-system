import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { initAdminUsersTable, initPagosRestaurantesTable, initRestaurantesTable, initConfiguracionesSistemaTable, initServiciosRestauranteTable } from './config/database';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';

console.log('ENV TEST:', process.env.DB_USER, process.env.DB_DATABASE, process.env.DB_HOST, process.env.DB_PASSWORD, process.env.DB_PORT);

const app = express();
// Respetar PORT (plataformas PaaS) y permitir ADMIN_PORT como override
const PORT = Number(process.env.PORT || process.env.ADMIN_PORT || 4000);

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://pos.forkast.vip',
      'https://admin.forkast.vip',
      'https://forkast.vip',
      'https://www.forkast.vip'
    ];

    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:4000'
      );
    }

    if (!origin) {
      // Permitir peticiones sin origin (Postman, curl, backend)
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log(`🚫 CORS bloqueado: ${origin}`);
    return callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));
app.use(helmet());
app.use(express.json());
app.use('/api', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Healthcheck básico (no toca la BD)
app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get('/', (req, res) => {
  res.send('Admin Console Backend funcionando');
});

// Aquí se agregarán las rutas de la consola admin

(async () => {
  try {
    await initAdminUsersTable();
    await initRestaurantesTable();
    await initPagosRestaurantesTable();
    await initConfiguracionesSistemaTable();
    await initServiciosRestauranteTable();
  } catch (err) {
    console.error('Error inicializando tablas (continuando de todos modos):', err);
  } finally {
    app.listen(PORT, () => {
      console.log(`Admin Console Backend escuchando en el puerto ${PORT}`);
    });
  }
})(); 