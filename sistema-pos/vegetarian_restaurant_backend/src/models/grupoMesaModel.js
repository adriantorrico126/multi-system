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
        // Actualizar la mesa para que aparezca como ocupada y asociada al grupo
        await client.query(
          `UPDATE mesas SET id_grupo_mesa = $1, estado = 'en_uso' WHERE id_mesa = $2`,
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
      `UPDATE mesas SET id_grupo_mesa = $1, estado = 'en_uso' WHERE id_mesa = $2`,
      [id_grupo_mesa, id_mesa]
    );
  },

  async removerMesaDeGrupo(id_grupo_mesa, id_mesa) {
    await pool.query(
      `DELETE FROM mesas_en_grupo WHERE id_grupo_mesa = $1 AND id_mesa = $2`,
      [id_grupo_mesa, id_mesa]
    );
    await pool.query(
      `UPDATE mesas SET id_grupo_mesa = NULL, estado = 'libre' WHERE id_mesa = $1`,
      [id_mesa]
    );
  },

  async cerrarGrupo(id_grupo_mesa) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Actualizar el estado del grupo a CERRADO
      await client.query(
        `UPDATE grupos_mesas SET estado = 'CERRADO', updated_at = NOW() WHERE id_grupo_mesa = $1`,
        [id_grupo_mesa]
      );
      
      // Eliminar todas las referencias de mesas_en_grupo para este grupo
      await client.query(
        `DELETE FROM mesas_en_grupo WHERE id_grupo_mesa = $1`,
        [id_grupo_mesa]
      );
      
      // Limpiar las referencias en la tabla mesas y liberarlas
      await client.query(
        `UPDATE mesas SET id_grupo_mesa = NULL, estado = 'libre' WHERE id_grupo_mesa = $1`,
        [id_grupo_mesa]
      );
      
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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
  },

  // Obtener información completa de un grupo incluyendo mesas y mesero
  async obtenerGrupoCompleto(id_grupo_mesa) {
    const client = await pool.connect();
    try {
      // Obtener información del grupo
      const grupoRes = await client.query(
        `SELECT g.*, v.nombre as nombre_mesero, v.username as username_mesero
         FROM grupos_mesas g
         LEFT JOIN vendedores v ON g.id_mesero = v.id_vendedor
         WHERE g.id_grupo_mesa = $1`,
        [id_grupo_mesa]
      );
      
      if (grupoRes.rows.length === 0) {
        return null;
      }
      
      const grupo = grupoRes.rows[0];
      
      // Obtener mesas del grupo
      const mesasRes = await client.query(
        `SELECT m.id_mesa, m.numero, m.capacidad, m.estado, m.total_acumulado, m.hora_apertura
         FROM mesas m
         JOIN mesas_en_grupo mg ON m.id_mesa = mg.id_mesa
         WHERE mg.id_grupo_mesa = $1`,
        [id_grupo_mesa]
      );
      
      grupo.mesas = mesasRes.rows;
      
      // Calcular total acumulado del grupo
      const totalAcumulado = grupo.mesas.reduce((sum, mesa) => sum + (Number(mesa.total_acumulado) || 0), 0);
      grupo.total_acumulado_grupo = totalAcumulado;
      
      return grupo;
    } finally {
      client.release();
    }
  },

  // Obtener todos los grupos activos con información completa
  async obtenerGruposActivosCompletos(id_restaurante) {
    const client = await pool.connect();
    try {
      // Obtener grupos activos
      const gruposRes = await client.query(
        `SELECT g.*, v.nombre as nombre_mesero, v.username as username_mesero
         FROM grupos_mesas g
         LEFT JOIN vendedores v ON g.id_mesero = v.id_vendedor
         WHERE g.estado = 'ABIERTO' AND g.id_restaurante = $1
         ORDER BY g.created_at DESC`,
        [id_restaurante]
      );
      
      const grupos = gruposRes.rows;
      
      // Para cada grupo, obtener sus mesas
      for (let grupo of grupos) {
        const mesasRes = await client.query(
          `SELECT m.id_mesa, m.numero, m.capacidad, m.estado, m.total_acumulado, m.hora_apertura
           FROM mesas m
           JOIN mesas_en_grupo mg ON m.id_mesa = mg.id_mesa
           WHERE mg.id_grupo_mesa = $1`,
          [grupo.id_grupo_mesa]
        );
        
        grupo.mesas = mesasRes.rows;
        
        // Calcular total acumulado del grupo
        const totalAcumulado = grupo.mesas.reduce((sum, mesa) => sum + (Number(mesa.total_acumulado) || 0), 0);
        grupo.total_acumulado_grupo = totalAcumulado;
      }
      
      return grupos;
    } finally {
      client.release();
    }
  },

  // Generar prefactura para un grupo completo
  async generarPrefacturaGrupo(id_grupo_mesa) {
    const client = await pool.connect();
    try {
      // Obtener todas las mesas del grupo
      const mesasRes = await client.query(
        `SELECT m.id_mesa, m.numero
         FROM mesas m
         JOIN mesas_en_grupo mg ON m.id_mesa = mg.id_mesa
         WHERE mg.id_grupo_mesa = $1`,
        [id_grupo_mesa]
      );
      
      const mesas = mesasRes.rows;
      let productos = [];
      let totalFinal = 0;
      
      // Obtener productos de todas las mesas del grupo
      for (const mesa of mesas) {
        const productosRes = await client.query(
          `SELECT 
            p.nombre as nombre_producto,
            dv.cantidad,
            dv.precio_unitario,
            (dv.cantidad * dv.precio_unitario) as subtotal,
            dv.observaciones
           FROM detalle_ventas dv
           JOIN productos p ON dv.id_producto = p.id_producto
           JOIN ventas v ON dv.id_venta = v.id_venta
           WHERE v.id_mesa = $1 AND v.estado != 'cancelado'`,
          [mesa.id_mesa]
        );
        
        productos = productos.concat(productosRes.rows);
        totalFinal += productosRes.rows.reduce((sum, prod) => sum + Number(prod.subtotal), 0);
      }
      
      return {
        id_grupo_mesa,
        mesas: mesas.map(m => m.numero),
        productos,
        total_final: totalFinal,
        cantidad_productos: productos.length
      };
    } finally {
      client.release();
    }
  }
};

module.exports = GrupoMesaModel; 