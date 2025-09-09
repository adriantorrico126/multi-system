const { pool } = require('../config/database');
const logger = require('../config/logger');

async function ensureArqueoTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS arqueos_caja (
      id_arqueo SERIAL PRIMARY KEY,
      id_restaurante INTEGER NOT NULL,
      id_sucursal INTEGER,
      id_vendedor INTEGER,
      monto_inicial NUMERIC(12,2) NOT NULL,
      fecha_apertura TIMESTAMP NOT NULL DEFAULT NOW(),
      monto_final NUMERIC(12,2),
      fecha_cierre TIMESTAMP,
      diferencia NUMERIC(12,2),
      estado VARCHAR(20) NOT NULL DEFAULT 'abierto',
      observaciones TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_arqueo_rest_suc_estado ON arqueos_caja(id_restaurante, id_sucursal, estado);
  `);
}

exports.getArqueoActual = async (req, res, next) => {
  try {
    logger.info('Consultando arqueo actual - req.user:', req.user);
    
    await ensureArqueoTable();
    
    // Verificar que req.user existe
    if (!req.user) {
      logger.error('req.user no está definido en getArqueoActual');
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    
    const { id_restaurante, id_sucursal, rol } = req.user;
    
    if (!id_restaurante) {
      logger.error('id_restaurante no está definido en req.user:', req.user);
      return res.status(400).json({ message: 'id_restaurante es requerido' });
    }
    
    const sucursalId = rol === 'super_admin' ? (req.query.id_sucursal || null) : id_sucursal;
    const params = [];
    let where = 'estado = \'abierto\'';
    
    if (id_restaurante) { 
      params.push(id_restaurante); 
      where += ` AND id_restaurante = $${params.length}`; 
    }
    if (sucursalId) { 
      params.push(sucursalId); 
      where += ` AND id_sucursal = $${params.length}`; 
    }
    
    logger.info('Query arqueo - where:', where, 'params:', params);
    
    const { rows } = await pool.query(`SELECT * FROM arqueos_caja WHERE ${where} ORDER BY fecha_apertura DESC LIMIT 1`, params);
    const abierto = rows[0] || null;
    
    if (abierto) {
      const hoy = new Date();
      const fa = new Date(abierto.fecha_apertura);
      const sameDay = fa.getFullYear() === hoy.getFullYear() && fa.getMonth() === hoy.getMonth() && fa.getDate() === hoy.getDate();
      
      if (!sameDay) {
        // Autocerrar arqueo del día anterior
        logger.info('Autocerrando arqueo del día anterior:', abierto.id_arqueo);
        await pool.query(
          `UPDATE arqueos_caja SET estado = 'cerrado', fecha_cierre = COALESCE(fecha_cierre, NOW()) WHERE id_arqueo = $1`,
          [abierto.id_arqueo]
        );
        return res.json({ data: null });
      }
    }
    
    logger.info('Arqueo actual encontrado:', abierto);
    return res.json({ data: abierto });
    
  } catch (e) {
    logger.error('Error al consultar arqueo actual:', e.message || e);
    logger.error('Stack trace:', e.stack);
    next(e);
  }
};

exports.abrirArqueo = async (req, res, next) => {
  const client = await pool.connect();
  try {
    // Logging detallado para debugging
    logger.info('Iniciando apertura de arqueo - req.user:', req.user);
    logger.info('Body recibido:', req.body);
    
    await ensureArqueoTable();
    
    // Verificar que req.user existe y tiene los campos necesarios
    if (!req.user) {
      logger.error('req.user no está definido');
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    
    const { id_restaurante, id_sucursal, id_vendedor } = req.user;
    
    // Verificar campos requeridos
    if (!id_restaurante) {
      logger.error('id_restaurante no está definido en req.user:', req.user);
      return res.status(400).json({ message: 'id_restaurante es requerido' });
    }
    
    const { monto_inicial, observaciones } = req.body || {};
    
    // Validación más robusta del monto_inicial
    if (monto_inicial === undefined || monto_inicial === null) {
      logger.error('monto_inicial no proporcionado en body:', req.body);
      return res.status(400).json({ message: 'monto_inicial es requerido' });
    }
    
    const montoNumerico = Number(monto_inicial);
    if (isNaN(montoNumerico) || montoNumerico < 0) {
      logger.error('monto_inicial inválido:', monto_inicial);
      return res.status(400).json({ message: 'monto_inicial debe ser un número válido mayor o igual a 0' });
    }
    
    logger.info('Datos validados - id_restaurante:', id_restaurante, 'id_sucursal:', id_sucursal, 'id_vendedor:', id_vendedor, 'monto:', montoNumerico);
    
    await client.query('BEGIN');
    
    // Verificar cajas abiertas existentes
    const { rows: abiertos } = await client.query(
      `SELECT id_arqueo FROM arqueos_caja WHERE id_restaurante = $1 AND (id_sucursal = $2 OR $2 IS NULL) AND estado = 'abierto' LIMIT 1`,
      [id_restaurante, id_sucursal || null]
    );
    
    if (abiertos.length) {
      await client.query('ROLLBACK');
      logger.warn('Ya existe una caja abierta para esta sucursal:', abiertos[0]);
      return res.status(409).json({ message: 'Ya existe una caja abierta para esta sucursal.' });
    }
    
    // Insertar nueva caja
    const insert = await client.query(
      `INSERT INTO arqueos_caja (id_restaurante, id_sucursal, id_vendedor, monto_inicial, fecha_apertura, estado, observaciones)
       VALUES ($1, $2, $3, $4, NOW(), 'abierto', $5) RETURNING *`,
      [id_restaurante, id_sucursal || null, id_vendedor || null, montoNumerico, observaciones || null]
    );
    
    await client.query('COMMIT');
    
    logger.info('Caja abierta exitosamente:', insert.rows[0]);
    res.status(201).json({ data: insert.rows[0] });
    
  } catch (e) {
    await client.query('ROLLBACK');
    logger.error('Error al abrir arqueo:', e.message || e);
    logger.error('Stack trace:', e.stack);
    next(e);
  } finally {
    client.release();
  }
};

exports.cerrarArqueo = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await ensureArqueoTable();
    const { id_restaurante, id_sucursal } = req.user;
    const { monto_final, observaciones } = req.body || {};
    if (monto_final === undefined || monto_final === null || isNaN(Number(monto_final))) {
      return res.status(400).json({ message: 'monto_final es requerido' });
    }
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT * FROM arqueos_caja WHERE id_restaurante = $1 AND (id_sucursal = $2 OR $2 IS NULL) AND estado = 'abierto' ORDER BY fecha_apertura DESC LIMIT 1`,
      [id_restaurante, id_sucursal || null]
    );
    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'No existe una caja abierta.' });
    }
    const actual = rows[0];
    const diferencia = Number(monto_final) - Number(actual.monto_inicial || 0);
    const upd = await client.query(
      `UPDATE arqueos_caja SET monto_final = $1, fecha_cierre = NOW(), diferencia = $2, estado = 'cerrado', observaciones = COALESCE($3, observaciones)
       WHERE id_arqueo = $4 RETURNING *`,
      [Number(monto_final), diferencia, observaciones || null, actual.id_arqueo]
    );
    await client.query('COMMIT');
    res.json({ data: upd.rows[0] });
  } catch (e) {
    await client.query('ROLLBACK');
    logger.error('Error al cerrar arqueo: %s', e.message || e);
    next(e);
  } finally {
    client.release();
  }
};


