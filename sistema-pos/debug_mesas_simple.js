// Usar la configuración del backend directamente
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'vegetarian_restaurant_backend/.env') });

const { Pool } = require('pg');

// Configuración de la base de datos usando las mismas variables que el backend
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'sitemm_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function debugMesasSimple() {
  try {
    console.log('🔍 [DEBUG] Verificando estado de mesas y ventas...\n');
    console.log('📊 Configuración DB:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || process.env.DB_DATABASE || 'sitemm_db',
      user: process.env.DB_USER || 'postgres'
    });

    // 1. Verificar mesas
    console.log('\n📋 MESAS:');
    const mesasQuery = `
      SELECT 
        m.id_mesa,
        m.numero,
        m.estado,
        m.total_acumulado,
        m.id_venta_actual,
        m.hora_apertura
      FROM mesas m
      WHERE m.id_restaurante = 1
      ORDER BY m.numero
    `;
    const mesasResult = await pool.query(mesasQuery);
    console.table(mesasResult.rows);

    // 2. Verificar ventas activas
    console.log('\n💰 VENTAS ACTIVAS:');
    const ventasQuery = `
      SELECT 
        v.id_venta,
        v.mesa_numero,
        v.estado,
        v.total,
        v.fecha,
        v.tipo_servicio
      FROM ventas v
      WHERE v.id_restaurante = 1 
        AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro')
      ORDER BY v.fecha DESC
    `;
    const ventasResult = await pool.query(ventasQuery);
    console.table(ventasResult.rows);

    // 3. Verificar detalles de ventas
    console.log('\n📦 DETALLES DE VENTAS:');
    const detallesQuery = `
      SELECT 
        dv.id_detalle,
        dv.id_venta,
        dv.id_producto,
        dv.cantidad,
        dv.precio_unitario,
        dv.subtotal,
        p.nombre as producto_nombre
      FROM detalle_ventas dv
      LEFT JOIN productos p ON dv.id_producto = p.id_producto
      WHERE dv.id_restaurante = 1
        AND dv.id_venta IN (
          SELECT id_venta FROM ventas 
          WHERE id_restaurante = 1 
            AND estado IN ('abierta', 'en_uso', 'pendiente_cobro')
        )
      ORDER BY dv.id_venta, dv.created_at
    `;
    const detallesResult = await pool.query(detallesQuery);
    console.table(detallesResult.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugMesasSimple();
