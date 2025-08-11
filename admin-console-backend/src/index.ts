import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { initAdminUsersTable, initPagosRestaurantesTable, initRestaurantesTable } from './config/database';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';

console.log('ENV TEST:', process.env.POS_DB_USER, process.env.POS_DB_NAME, process.env.POS_DB_HOST, process.env.POS_DB_PASSWORD, process.env.POS_DB_PORT);

const app = express();
const PORT = process.env.ADMIN_PORT || 4000;

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use('/api', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
  res.send('Admin Console Backend funcionando');
});

// Aquí se agregarán las rutas de la consola admin

(async () => {
  await initAdminUsersTable();
  await initRestaurantesTable();
  await initPagosRestaurantesTable();
  app.listen(PORT, () => {
    console.log(`Admin Console Backend escuchando en el puerto ${PORT}`);
  });
})(); 