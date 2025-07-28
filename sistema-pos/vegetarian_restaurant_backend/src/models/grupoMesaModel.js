const { pool } = require('../config/database');

const GrupoMesaModel = {
  async crearGrupo({ id_restaurante, id_sucursal, id_venta_principal, mesas, id_mesero, estado = 'ABIERTO' }) {
    // Validar que todas las mesas estén libres y no agrupadas
    const checkQuery = `SELECT id_mesa, estado, id_grupo_mesa FROM mesas WHERE id_mesa = ANY($1) AND id_restaurante = $2`;
    const { rows: mesasInfo } = await pool.query(checkQuery, [mesas, id_restaurante]);
    for (const mesa of mesasInfo) {
      if (mesa.estado !== 'libre') {
        throw new Error(`La mesa ${mesa.id_mesa} no está libre (estado actual: ${mesa.estado})`);
      }
      if (mesa.id_grupo_mesa) {
        throw new Error(`La mesa ${mesa.id_mesa} ya está agrupada (grupo: ${mesa.id_grupo_mesa})`);
      }
    }
    // Crea un grupo y asocia las mesas
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const grupoRes = await client.query(
        `INSERT INTO grupos_mesas (id_restaurante, id_sucursal, id_venta_principal, id_mesero, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [id_restaurante, id_sucursal, id_venta_principal, id_mesero, estado]
      );
      const grupo = grupoRes.rows[0];
      for (const id_mesa of mesas) {
        await client.query(
          `INSERT INTO mesas_en_grupo (id_grupo_mesa, id_mesa) VALUES ($1, $2)`,
          [grupo.id_grupo_mesa, id_mesa]
        );
        await client.query(
          `UPDATE mesas SET id_grupo_mesa = $1 WHERE id_mesa = $2`,
          [grupo.id_grupo_mesa, id_mesa]
        );
      }
      await client.query('COMMIT');
      return grupo;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async agregarMesaAGrupo(id_grupo_mesa, id_mesa) {
    await pool.query(
      `INSERT INTO mesas_en_grupo (id_grupo_mesa, id_mesa) VALUES ($1, $2)`,
      [id_grupo_mesa, id_mesa]
    );
    await pool.query(
      `UPDATE mesas SET id_grupo_mesa = $1 WHERE id_mesa = $2`,
      [id_grupo_mesa, id_mesa]
    );
  },

  async removerMesaDeGrupo(id_grupo_mesa, id_mesa) {
    await pool.query(
      `DELETE FROM mesas_en_grupo WHERE id_grupo_mesa = $1 AND id_mesa = $2`,
      [id_grupo_mesa, id_mesa]
    );
    await pool.query(
      `UPDATE mesas SET id_grupo_mesa = NULL WHERE id_mesa = $1`,
      [id_mesa]
    );
  },

  async cerrarGrupo(id_grupo_mesa) {
    await pool.query(
      `UPDATE grupos_mesas SET estado = 'CERRADO', updated_at = NOW() WHERE id_grupo_mesa = $1`,
      [id_grupo_mesa]
    );
    await pool.query(
      `UPDATE mesas SET id_grupo_mesa = NULL WHERE id_grupo_mesa = $1`,
      [id_grupo_mesa]
    );
  },

  async obtenerGruposActivos(id_restaurante) {
    const res = await pool.query(
      `SELECT * FROM grupos_mesas WHERE estado = 'ABIERTO' AND id_restaurante = $1`,
      [id_restaurante]
    );
    return res.rows;
  },

  async obtenerGrupoPorMesa(id_mesa) {
    const res = await pool.query(
      `SELECT g.* FROM grupos_mesas g
       JOIN mesas_en_grupo mg ON mg.id_grupo_mesa = g.id_grupo_mesa
       WHERE mg.id_mesa = $1 AND g.estado = 'ABIERTO'`,
      [id_mesa]
    );
    return res.rows[0];
  }
};

module.exports = GrupoMesaModel; 