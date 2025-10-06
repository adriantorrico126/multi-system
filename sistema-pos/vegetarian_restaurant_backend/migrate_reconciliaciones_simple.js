const { Pool } = require('pg');
const dbConfig = require('./config_db_local');

const pool = new Pool(dbConfig);

async function migrateReconciliacionesSimple() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 MIGRANDO SISTEMA DE RECONCILIACIONES DE CAJA (SIMPLIFICADO)\n');
    console.log('=' .repeat(60));
    
    // 1. CREAR TABLA PRINCIPAL
    console.log('\n📖 1. CREANDO TABLA PRINCIPAL...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS reconciliaciones_caja (
        id_reconciliacion SERIAL PRIMARY KEY,
        id_restaurante INTEGER NOT NULL,
        id_sucursal INTEGER NOT NULL,
        id_vendedor INTEGER NOT NULL,
        fecha DATE NOT NULL DEFAULT CURRENT_DATE,
        hora TIME NOT NULL DEFAULT CURRENT_TIME,
        tipo_reconciliacion VARCHAR(20) NOT NULL CHECK (tipo_reconciliacion IN ('efectivo', 'completa')),
        monto_inicial NUMERIC(12,2),
        efectivo_esperado NUMERIC(12,2),
        efectivo_fisico NUMERIC(12,2),
        diferencia_efectivo NUMERIC(12,2),
        total_esperado NUMERIC(12,2),
        total_registrado NUMERIC(12,2),
        diferencia_total NUMERIC(12,2),
        datos_por_metodo JSONB DEFAULT '{}',
        diferencias_por_metodo JSONB DEFAULT '{}',
        estado VARCHAR(20) NOT NULL DEFAULT 'completada' CHECK (estado IN ('cuadrada', 'sobrante', 'faltante')),
        observaciones TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabla reconciliaciones_caja creada');
    
    // 2. CREAR TABLA DE DETALLES
    console.log('\n📖 2. CREANDO TABLA DE DETALLES...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS reconciliaciones_metodos_pago (
        id_detalle SERIAL PRIMARY KEY,
        id_reconciliacion INTEGER NOT NULL,
        id_restaurante INTEGER NOT NULL,
        id_sucursal INTEGER NOT NULL,
        metodo_pago VARCHAR(50) NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'cheque', 'otros')),
        monto_esperado NUMERIC(12,2) NOT NULL DEFAULT 0,
        monto_registrado NUMERIC(12,2) NOT NULL DEFAULT 0,
        diferencia NUMERIC(12,2) NOT NULL DEFAULT 0,
        estado VARCHAR(20) NOT NULL DEFAULT 'cuadrado' CHECK (estado IN ('cuadrado', 'sobrante', 'faltante')),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (id_reconciliacion, metodo_pago)
      )
    `);
    console.log('✅ Tabla reconciliaciones_metodos_pago creada');
    
    // 3. CREAR TABLA DE HISTORIAL
    console.log('\n📖 3. CREANDO TABLA DE HISTORIAL...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS reconciliaciones_historial (
        id_historial SERIAL PRIMARY KEY,
        id_reconciliacion INTEGER NOT NULL,
        id_restaurante INTEGER NOT NULL,
        id_sucursal INTEGER NOT NULL,
        accion VARCHAR(50) NOT NULL,
        datos_anteriores JSONB,
        datos_nuevos JSONB,
        id_usuario INTEGER NOT NULL,
        nombre_usuario VARCHAR(100),
        fecha_cambio TIMESTAMP DEFAULT NOW(),
        ip_origen INET,
        user_agent TEXT
      )
    `);
    console.log('✅ Tabla reconciliaciones_historial creada');
    
    // 4. CREAR ÍNDICES
    console.log('\n📖 4. CREANDO ÍNDICES...');
    
    const indices = [
      'CREATE INDEX IF NOT EXISTS idx_reconciliaciones_restaurante_sucursal ON reconciliaciones_caja(id_restaurante, id_sucursal)',
      'CREATE INDEX IF NOT EXISTS idx_reconciliaciones_fecha ON reconciliaciones_caja(fecha DESC)',
      'CREATE INDEX IF NOT EXISTS idx_reconciliaciones_vendedor ON reconciliaciones_caja(id_vendedor)',
      'CREATE INDEX IF NOT EXISTS idx_reconciliaciones_tipo_estado ON reconciliaciones_caja(tipo_reconciliacion, estado)',
      'CREATE INDEX IF NOT EXISTS idx_reconciliaciones_metodos_reconciliacion ON reconciliaciones_metodos_pago(id_reconciliacion)',
      'CREATE INDEX IF NOT EXISTS idx_reconciliaciones_historial_reconciliacion ON reconciliaciones_historial(id_reconciliacion)'
    ];
    
    for (const indice of indices) {
      await client.query(indice);
    }
    console.log('✅ Índices creados');
    
    // 5. CREAR VISTAS
    console.log('\n📖 5. CREANDO VISTAS...');
    
    await client.query(`
      CREATE OR REPLACE VIEW vista_reconciliaciones_resumen AS
      SELECT 
        r.id_restaurante,
        r.id_sucursal,
        r.fecha,
        COUNT(*) as total_reconciliaciones,
        COUNT(CASE WHEN r.estado = 'cuadrada' THEN 1 END) as reconciliaciones_cuadradas,
        COUNT(CASE WHEN r.estado = 'sobrante' THEN 1 END) as reconciliaciones_sobrantes,
        COUNT(CASE WHEN r.estado = 'faltante' THEN 1 END) as reconciliaciones_faltantes,
        SUM(CASE WHEN r.tipo_reconciliacion = 'efectivo' THEN r.diferencia_efectivo ELSE 0 END) as diferencia_efectivo_total,
        SUM(CASE WHEN r.tipo_reconciliacion = 'completa' THEN r.diferencia_total ELSE 0 END) as diferencia_total_general,
        AVG(CASE WHEN r.tipo_reconciliacion = 'efectivo' THEN r.diferencia_efectivo ELSE NULL END) as diferencia_efectivo_promedio,
        AVG(CASE WHEN r.tipo_reconciliacion = 'completa' THEN r.diferencia_total ELSE NULL END) as diferencia_total_promedio
      FROM reconciliaciones_caja r
      GROUP BY r.id_restaurante, r.id_sucursal, r.fecha
      ORDER BY r.fecha DESC
    `);
    console.log('✅ Vista vista_reconciliaciones_resumen creada');
    
    // 6. VERIFICAR TABLAS
    console.log('\n🔍 6. VERIFICANDO TABLAS CREADAS...');
    
    const tables = ['reconciliaciones_caja', 'reconciliaciones_metodos_pago', 'reconciliaciones_historial'];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Tabla '${table}' existe`);
      } else {
        console.log(`❌ Tabla '${table}' NO existe`);
      }
    }
    
    // 7. INSERTAR DATOS DE EJEMPLO
    console.log('\n📝 7. INSERTANDO DATOS DE EJEMPLO...');
    
    try {
      // Verificar datos base
      const restaurantes = await client.query('SELECT id_restaurante FROM restaurantes LIMIT 1');
      const sucursales = await client.query('SELECT id_sucursal FROM sucursales LIMIT 1');
      const vendedores = await client.query('SELECT id_vendedor FROM vendedores LIMIT 1');
      
      if (restaurantes.rows.length > 0 && sucursales.rows.length > 0 && vendedores.rows.length > 0) {
        const idRestaurante = restaurantes.rows[0].id_restaurante;
        const idSucursal = sucursales.rows[0].id_sucursal;
        const idVendedor = vendedores.rows[0].id_vendedor;
        
        // Insertar reconciliación de ejemplo
        const result = await client.query(`
          INSERT INTO reconciliaciones_caja (
            id_restaurante, id_sucursal, id_vendedor, tipo_reconciliacion,
            monto_inicial, efectivo_esperado, efectivo_fisico,
            total_esperado, total_registrado,
            datos_por_metodo, observaciones
          ) VALUES (
            $1, $2, $3, 'completa',
            100.00, 550.00, 545.00,
            1100.00, 1095.00,
            $4, 'Reconciliación de ejemplo - sistema migrado correctamente'
          ) RETURNING id_reconciliacion
        `, [
          idRestaurante, 
          idSucursal, 
          idVendedor,
          JSON.stringify({
            efectivo: 300.00,
            tarjeta_debito: 500.00,
            tarjeta_credito: 200.00,
            transferencia: 95.00
          })
        ]);
        
        console.log(`✅ Reconciliación de ejemplo insertada con ID: ${result.rows[0].id_reconciliacion}`);
      } else {
        console.log('⚠️ No se encontraron datos base para insertar ejemplo');
      }
    } catch (error) {
      console.log('⚠️ Error insertando datos de ejemplo:', error.message);
    }
    
    console.log('\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('=' .repeat(60));
    console.log('✅ Sistema de reconciliaciones de caja implementado');
    console.log('✅ Tablas, índices y vistas creados');
    console.log('✅ Sistema listo para usar');
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA MIGRACIÓN:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar migración
migrateReconciliacionesSimple()
  .then(() => {
    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en la migración:', error);
    process.exit(1);
  });

