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
    await ensureArqueoTable();
    const { id_restaurante, id_sucursal, rol } = req.user;
    const sucursalId = rol === 'super_admin' ? (req.query.id_sucursal || null) : id_sucursal;
    const params = [];
    let where = 'estado = \'abierto\'';
    if (id_restaurante) { params.push(id_restaurante); where += ` AND id_restaurante = $${params.length}`; }
    if (sucursalId) { params.push(sucursalId); where += ` AND id_sucursal = $${params.length}`; }
    const { rows } = await pool.query(`SELECT * FROM arqueos_caja WHERE ${where} ORDER BY fecha_apertura DESC LIMIT 1`, params);
    const abierto = rows[0] || null;
    if (abierto) {
      const hoy = new Date();
      const fa = new Date(abierto.fecha_apertura);
      const sameDay = fa.getFullYear() === hoy.getFullYear() && fa.getMonth() === hoy.getMonth() && fa.getDate() === hoy.getDate();
      if (!sameDay) {
        // Autocerrar arqueo del día anterior
        await pool.query(
          `UPDATE arqueos_caja SET estado = 'cerrado', fecha_cierre = COALESCE(fecha_cierre, NOW()) WHERE id_arqueo = $1`,
          [abierto.id_arqueo]
        );
        return res.json({ data: null });
      }
    }
    return res.json({ data: abierto });
  } catch (e) {
    logger.error('Error al consultar arqueo actual: %s', e.message || e);
    next(e);
  }
};

exports.abrirArqueo = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await ensureArqueoTable();
    const { id_restaurante, id_sucursal, id_vendedor } = req.user;
    const { monto_inicial, observaciones } = req.body || {};
    if (monto_inicial === undefined || monto_inicial === null || isNaN(Number(monto_inicial))) {
      return res.status(400).json({ message: 'monto_inicial es requerido' });
    }
    await client.query('BEGIN');
    const { rows: abiertos } = await client.query(
      `SELECT id_arqueo FROM arqueos_caja WHERE id_restaurante = $1 AND (id_sucursal = $2 OR $2 IS NULL) AND estado = 'abierto' LIMIT 1`,
      [id_restaurante, id_sucursal || null]
    );
    if (abiertos.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Ya existe una caja abierta para esta sucursal.' });
    }
    const insert = await client.query(
      `INSERT INTO arqueos_caja (id_restaurante, id_sucursal, id_vendedor, monto_inicial, fecha_apertura, estado, observaciones)
       VALUES ($1, $2, $3, $4, NOW(), 'abierto', $5) RETURNING *`,
      [id_restaurante, id_sucursal || null, id_vendedor || null, Number(monto_inicial), observaciones || null]
    );
    await client.query('COMMIT');
    res.status(201).json({ data: insert.rows[0] });
  } catch (e) {
    await client.query('ROLLBACK');
    logger.error('Error al abrir arqueo: %s', e.message || e);
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


