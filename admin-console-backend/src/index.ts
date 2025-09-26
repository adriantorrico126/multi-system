import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { initAdminUsersTable, initPagosRestaurantesTable, initRestaurantesTable, initConfiguracionesSistemaTable, initServiciosRestauranteTable, initPlanesTable, initSuscripcionesTable } from './config/database';
import { notificationService } from './services/notificationService';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';

console.log('ENV TEST:', process.env.POS_DB_USER, process.env.POS_DB_NAME, process.env.POS_DB_HOST, process.env.POS_DB_PASSWORD, process.env.POS_DB_PORT);

const app = express();
// Respetar PORT (plataformas PaaS) y permitir ADMIN_PORT como override
const PORT = Number(process.env.PORT || process.env.ADMIN_PORT || 5001);

// Configuración de CORS para desarrollo
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://127.0.0.1:8080', 'http://127.0.0.1:8081', 'http://127.0.0.1:8082'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Middleware adicional para CORS
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://127.0.0.1:8080', 'http://127.0.0.1:8081', 'http://127.0.0.1:8082'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin || '')) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

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
    await initPlanesTable();
    await initSuscripcionesTable();
    
    // Inicializar servicio de notificaciones
    notificationService.initialize(4001);
  } catch (err) {
    console.error('Error inicializando tablas (continuando de todos modos):', err);
  } finally {
    app.listen(PORT, () => {
      console.log(`Admin Console Backend escuchando en el puerto ${PORT}`);
    });
  }
})(); 