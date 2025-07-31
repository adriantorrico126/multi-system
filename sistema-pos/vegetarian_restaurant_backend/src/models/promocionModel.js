const { pool } = require('../config/database');
const logger = require('../config/logger');

const PromocionModel = {
  // Crear una nueva promoción
  async crearPromocion(promocionData) {
    const {
      nombre,
      tipo,
      valor,
      fecha_inicio,
      fecha_fin,
      id_producto,
      id_restaurante,
      sucursales = [] // Array de IDs de sucursales
    } = promocionData;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Crear la promoción
      const promocionQuery = `
        INSERT INTO promociones (nombre, tipo, valor, fecha_inicio, fecha_fin, id_producto, id_restaurante)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const promocionValues = [nombre, tipo, valor, fecha_inicio, fecha_fin, id_producto, id_restaurante];
      const { rows: promocion } = await client.query(promocionQuery, promocionValues);
      
      // 2. Asignar la promoción a las sucursales especificadas
      if (sucursales.length > 0) {
        const asignacionQuery = `
          INSERT INTO promociones_sucursales (id_promocion, id_sucursal)
          VALUES ($1, $2)
        `;
        
        for (const id_sucursal of sucursales) {
          await client.query(asignacionQuery, [promocion[0].id_promocion, id_sucursal]);
        }
      }
      
      await client.query('COMMIT');
      return promocion[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Obtener promociones activas para un restaurante/sucursal
  async getPromocionesActivas(id_restaurante, id_sucursal = null) {
    let query = `
      SELECT 
        p.*,
        pr.nombre as nombre_producto,
        pr.precio as precio_original,
        CASE 
          WHEN p.fecha_inicio <= CURRENT_DATE AND p.fecha_fin >= CURRENT_DATE 
          THEN 'activa'
          WHEN p.fecha_inicio > CURRENT_DATE 
          THEN 'pendiente'
          ELSE 'expirada'
        END as estado_promocion
      FROM promociones p
      LEFT JOIN productos pr ON p.id_producto = pr.id_producto
      WHERE p.id_restaurante = $1
        AND p.activa = true
        AND p.fecha_inicio <= CURRENT_DATE 
        AND p.fecha_fin >= CURRENT_DATE
    `;
    
    let values = [id_restaurante];
    
    // Si se especifica una sucursal, filtrar por ella
    if (id_sucursal) {
      query += `
        AND EXISTS (
          SELECT 1 FROM promociones_sucursales ps 
          WHERE ps.id_promocion = p.id_promocion 
          AND ps.id_sucursal = $2
        )
      `;
      values.push(id_sucursal);
    }
    
    query += ` ORDER BY p.valor DESC`;
    
    const { rows } = await pool.query(query, values);
    return rows;
  },

  // Obtener promociones por producto
  async getPromocionesPorProducto(id_producto, id_restaurante, id_sucursal = null) {
    let query = `
      SELECT 
        p.*,
        pr.nombre as nombre_producto,
        pr.precio as precio_original
      FROM promociones p
      LEFT JOIN productos pr ON p.id_producto = pr.id_producto
      WHERE p.id_producto = $1 
        AND p.id_restaurante = $2
        AND p.activa = true
        AND p.fecha_inicio <= CURRENT_DATE 
        AND p.fecha_fin >= CURRENT_DATE
    `;
    
    let values = [id_producto, id_restaurante];
    
    if (id_sucursal) {
      query += `
        AND EXISTS (
          SELECT 1 FROM promociones_sucursales ps 
          WHERE ps.id_promocion = p.id_promocion 
          AND ps.id_sucursal = $3
        )
      `;
      values.push(id_sucursal);
    }
    
    query += ` ORDER BY p.valor DESC`;
    
    const { rows } = await pool.query(query, values);
    return rows;
  },

  // Calcular descuento para un producto
  async calcularDescuento(id_producto, precio_original, id_restaurante, id_sucursal = null) {
    const promociones = await this.getPromocionesPorProducto(id_producto, id_restaurante, id_sucursal);
    
    if (promociones.length === 0) {
      return {
        precio_original: precio_original,
        precio_final: precio_original,
        descuento_aplicado: 0,
        promocion_aplicada: null
      };
    }

    // Tomar la promoción con mayor descuento
    const mejorPromocion = promociones[0];
    let descuento_aplicado = 0;
    let precio_final = precio_original;

    switch (mejorPromocion.tipo) {
      case 'porcentaje':
        descuento_aplicado = (precio_original * mejorPromocion.valor) / 100;
        precio_final = precio_original - descuento_aplicado;
        break;
      case 'monto_fijo':
        descuento_aplicado = Math.min(mejorPromocion.valor, precio_original);
        precio_final = precio_original - descuento_aplicado;
        break;
      case 'precio_fijo':
        descuento_aplicado = Math.max(0, precio_original - mejorPromocion.valor);
        precio_final = mejorPromocion.valor;
        break;
      case 'x_uno_gratis':
        // Para 2x1, el descuento es el precio de un producto
        descuento_aplicado = precio_original;
        precio_final = precio_original; // El cliente paga por uno, recibe dos
        break;
    }

    return {
      precio_original: precio_original,
      precio_final: precio_final,
      descuento_aplicado: descuento_aplicado,
      promocion_aplicada: mejorPromocion
    };
  },

  // Aplicar descuentos a una lista de productos
  async aplicarDescuentosAProductos(productos, id_restaurante, id_sucursal = null) {
    const productosConDescuento = [];

    for (const producto of productos) {
      const descuento = await this.calcularDescuento(
        producto.id_producto,
        producto.precio,
        id_restaurante,
        id_sucursal
      );

      productosConDescuento.push({
        ...producto,
        precio_original: producto.precio,
        precio_final: descuento.precio_final,
        descuento_aplicado: descuento.descuento_aplicado,
        promocion_aplicada: descuento.promocion_aplicada
      });
    }

    return productosConDescuento;
  },

  // Actualizar promoción
  async actualizarPromocion(id_promocion, datosActualizados, id_restaurante) {
    const campos = [];
    const valores = [];
    let contador = 1;

    for (const [campo, valor] of Object.entries(datosActualizados)) {
      if (valor !== undefined && campo !== 'id_restaurante' && campo !== 'sucursales') {
        campos.push(`${campo} = $${contador}`);
        valores.push(valor);
        contador++;
      }
    }

    if (campos.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    valores.push(id_promocion, id_restaurante);

    const query = `
      UPDATE promociones 
      SET ${campos.join(', ')}
      WHERE id_promocion = $${contador} AND id_restaurante = $${contador + 1}
      RETURNING *
    `;

    const { rows } = await pool.query(query, valores);
    return rows[0];
  },

  // Eliminar promoción
  async eliminarPromocion(id_promocion, id_restaurante) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verificar que la promoción pertenece al restaurante
      const checkQuery = `
        SELECT COUNT(*) as total
        FROM promociones 
        WHERE id_promocion = $1 AND id_restaurante = $2
      `;
      
      const { rows: check } = await client.query(checkQuery, [id_promocion, id_restaurante]);
      
      if (check[0].total === 0) {
        throw new Error('Promoción no encontrada o no autorizada');
      }
      
      // Eliminar asignaciones primero
      await client.query(
        'DELETE FROM promociones_sucursales WHERE id_promocion = $1',
        [id_promocion]
      );
      
      // Eliminar la promoción
      const { rows } = await client.query(
        'DELETE FROM promociones WHERE id_promocion = $1 RETURNING *',
        [id_promocion]
      );
      
      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Obtener todas las promociones de un restaurante
  async getTodasPromociones(id_restaurante) {
    const query = `
      SELECT 
        p.*,
        pr.nombre as nombre_producto,
        pr.precio as precio_original,
        CASE 
          WHEN p.fecha_inicio <= CURRENT_DATE AND p.fecha_fin >= CURRENT_DATE 
          THEN 'activa'
          WHEN p.fecha_inicio > CURRENT_DATE 
          THEN 'pendiente'
          ELSE 'expirada'
        END as estado_promocion,
        ARRAY_AGG(ps.id_sucursal) FILTER (WHERE ps.id_sucursal IS NOT NULL) as sucursales_asignadas
      FROM promociones p
      LEFT JOIN productos pr ON p.id_producto = pr.id_producto
      LEFT JOIN promociones_sucursales ps ON p.id_promocion = ps.id_promocion
      WHERE p.id_restaurante = $1
      GROUP BY p.id_promocion, pr.nombre, pr.precio
      ORDER BY p.fecha_inicio DESC
    `;
    
    const { rows } = await pool.query(query, [id_restaurante]);
    return rows;
  },

  // Verificar si un producto tiene promociones activas
  async tienePromocionesActivas(id_producto, id_restaurante, id_sucursal = null) {
    let query = `
      SELECT COUNT(*) as total
      FROM promociones 
      WHERE id_producto = $1 
        AND id_restaurante = $2
        AND activa = true
        AND fecha_inicio <= CURRENT_DATE 
        AND fecha_fin >= CURRENT_DATE
    `;
    
    let values = [id_producto, id_restaurante];
    
    if (id_sucursal) {
      query += `
        AND EXISTS (
          SELECT 1 FROM promociones_sucursales ps 
          WHERE ps.id_promocion = promociones.id_promocion 
          AND ps.id_sucursal = $3
        )
      `;
      values.push(id_sucursal);
    }
    
    const { rows } = await pool.query(query, values);
    return rows[0].total > 0;
  },

  // Obtener sucursales disponibles para asignar promociones
  async getSucursalesDisponibles(id_restaurante) {
    const query = `
      SELECT id_sucursal, nombre
      FROM sucursales
      WHERE id_restaurante = $1
      ORDER BY nombre
    `;
    
    const { rows } = await pool.query(query, [id_restaurante]);
    return rows;
  }
};

module.exports = PromocionModel; 