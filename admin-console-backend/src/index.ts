import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { initAdminUsersTable, initPagosRestaurantesTable, initRestaurantesTable, initConfiguracionesSistemaTable, initServiciosRestauranteTable } from './config/database';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';

console.log('ENV TEST:', process.env.POS_DB_USER, process.env.POS_DB_NAME, process.env.POS_DB_HOST, process.env.POS_DB_PASSWORD, process.env.POS_DB_PORT);

const app = express();
// Respetar PORT (plataformas PaaS) y permitir ADMIN_PORT como override
const PORT = Number(process.env.PORT || process.env.ADMIN_PORT || 4000);

// Configuración de CORS simplificada para desarrollo
app.use(cors({
  origin: true, // Permitir todos los orígenes en desarrollo
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// CORS ya está configurado arriba, no necesitamos middleware adicional
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