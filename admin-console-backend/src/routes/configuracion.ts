import { Router } from 'express';
import pool from '../config/database';
import { authenticateAdmin } from '../middlewares/authMiddleware';

const router = Router();

// GET /configuracion - obtiene la configuración global (crea por defecto si no existe)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const clave = 'global';
    const result = await pool.query(
      'SELECT valor_config FROM configuraciones_sistema WHERE clave_config = $1 LIMIT 1',
      [clave]
    );
    if (result.rows.length === 0) {
      const defaultConfig = {
        notificaciones: {
          emailAlerts: true,
          smsAlerts: false,
          systemMaintenance: true,
          paymentReminders: true,
          securityAlerts: true,
        },
        sistema: {
          maxRestaurants: 1000,
          sessionTimeout: 30,
          autoBackup: true,
          maintenanceMode: false,
          debugMode: false,
        },
      };
      await pool.query(
        `INSERT INTO configuraciones_sistema (clave_config, valor_config)
         VALUES ($1, $2)
         ON CONFLICT (clave_config) DO UPDATE SET valor_config = EXCLUDED.valor_config, actualizado_en = NOW()`,
        [clave, JSON.stringify(defaultConfig)]
      );
      return res.json(defaultConfig);
    }
    return res.json(result.rows[0].valor_config || {});
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Error al obtener configuración', detail: message });
  }
});

// POST /configuracion - guarda/actualiza la configuración global completa
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const clave = 'global';
    const config = req.body || {};
    await pool.query(
      `INSERT INTO configuraciones_sistema (clave_config, valor_config)
       VALUES ($1, $2)
       ON CONFLICT (clave_config) DO UPDATE SET valor_config = EXCLUDED.valor_config, actualizado_en = NOW()`,
      [clave, JSON.stringify(config)]
    );
    res.json({ message: 'Configuración guardada', data: config });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Error al guardar configuración', detail: message });
  }
});

export default router;


