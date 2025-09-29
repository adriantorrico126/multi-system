const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'vegetarian_restaurant',
  password: 'postgres', // Cambia por tu contraseña
  port: 5432,
});

async function createTables() {
  console.log('🚀 Creando tablas del sistema de planes...\n');
  
  try {
    // Verificar conexión
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión a la base de datos establecida\n');
    
    // 1. Crear tabla de planes
    console.log('📋 Creando tabla de planes...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS planes (
        id_plan SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        descripcion TEXT,
        precio_mensual DECIMAL(10,2) NOT NULL,
        precio_anual DECIMAL(10,2),
        
        -- LÍMITES CUANTITATIVOS
        max_sucursales INTEGER DEFAULT 1,
        max_usuarios INTEGER DEFAULT 5,
        max_productos INTEGER DEFAULT 100,
        max_transacciones_mes INTEGER DEFAULT 500,
        almacenamiento_gb INTEGER DEFAULT 1,
        
        -- FUNCIONALIDADES BOOLEANAS
        incluye_pos BOOLEAN DEFAULT true,
        incluye_inventario_basico BOOLEAN DEFAULT true,
        incluye_inventario_avanzado BOOLEAN DEFAULT false,
        incluye_promociones BOOLEAN DEFAULT false,
        incluye_reservas BOOLEAN DEFAULT false,
        incluye_arqueo_caja BOOLEAN DEFAULT false,
        incluye_egresos BOOLEAN DEFAULT false,
        incluye_egresos_avanzados BOOLEAN DEFAULT false,
        incluye_reportes_avanzados BOOLEAN DEFAULT false,
        incluye_analytics BOOLEAN DEFAULT false,
        incluye_delivery BOOLEAN DEFAULT false,
        incluye_impresion BOOLEAN DEFAULT true,
        incluye_soporte_24h BOOLEAN DEFAULT false,
        incluye_api BOOLEAN DEFAULT false,
        incluye_white_label BOOLEAN DEFAULT false,
        
        -- CONFIGURACIÓN
        activo BOOLEAN DEFAULT true,
        orden_display INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla planes creada');
    
    // 2. Crear tabla de suscripciones
    console.log('📋 Creando tabla de suscripciones...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suscripciones (
        id_suscripcion SERIAL PRIMARY KEY,
        id_restaurante INTEGER NOT NULL,
        id_plan INTEGER NOT NULL REFERENCES planes(id_plan),
        estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'suspendida', 'cancelada', 'expirada')),
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE,
        fecha_renovacion DATE,
        precio_pagado DECIMAL(10,2),
        metodo_pago VARCHAR(50),
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla suscripciones creada');
    
    // 3. Crear tabla de contadores de uso
    console.log('📋 Creando tabla de contadores de uso...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contadores_uso (
        id_contador SERIAL PRIMARY KEY,
        id_restaurante INTEGER NOT NULL,
        id_plan INTEGER NOT NULL REFERENCES planes(id_plan),
        recurso VARCHAR(50) NOT NULL,
        uso_actual INTEGER DEFAULT 0,
        limite_plan INTEGER NOT NULL,
        fecha_medicion DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(id_restaurante, recurso, fecha_medicion)
      );
    `);
    console.log('✅ Tabla contadores_uso creada');
    
    // 4. Crear tabla de alertas de límites
    console.log('📋 Creando tabla de alertas de límites...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alertas_limites (
        id_alerta SERIAL PRIMARY KEY,
        id_restaurante INTEGER NOT NULL,
        id_plan INTEGER NOT NULL REFERENCES planes(id_plan),
        recurso VARCHAR(50) NOT NULL,
        tipo_alerta VARCHAR(20) NOT NULL CHECK (tipo_alerta IN ('bajo', 'medio', 'alto', 'critico')),
        mensaje TEXT NOT NULL,
        porcentaje_uso DECIMAL(5,2) NOT NULL,
        estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'resuelta', 'ignorada')),
        fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_resolucion TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla alertas_limites creada');
    
    // 5. Crear tabla de auditoría de planes
    console.log('📋 Creando tabla de auditoría de planes...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auditoria_planes (
        id_auditoria SERIAL PRIMARY KEY,
        id_restaurante INTEGER NOT NULL,
        id_plan_anterior INTEGER REFERENCES planes(id_plan),
        id_plan_nuevo INTEGER REFERENCES planes(id_plan),
        tipo_cambio VARCHAR(20) NOT NULL CHECK (tipo_cambio IN ('upgrade', 'downgrade', 'renovacion', 'cancelacion')),
        motivo TEXT,
        fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        usuario_cambio VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla auditoria_planes creada');
    
    // 6. Crear tabla de historial de uso mensual
    console.log('📋 Creando tabla de historial de uso mensual...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historial_uso_mensual (
        id_historial SERIAL PRIMARY KEY,
        id_restaurante INTEGER NOT NULL,
        id_plan INTEGER NOT NULL REFERENCES planes(id_plan),
        mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
        año INTEGER NOT NULL,
        recurso VARCHAR(50) NOT NULL,
        uso_total INTEGER DEFAULT 0,
        limite_plan INTEGER NOT NULL,
        porcentaje_uso DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(id_restaurante, mes, año, recurso)
      );
    `);
    console.log('✅ Tabla historial_uso_mensual creada');
    
    // 7. Insertar datos iniciales de planes
    console.log('📊 Insertando planes iniciales...');
    
    // Verificar si ya existen planes
    const existingPlans = await pool.query('SELECT COUNT(*) FROM planes');
    if (existingPlans.rows[0].count === '0') {
      await pool.query(`
        INSERT INTO planes (nombre, descripcion, precio_mensual, precio_anual, max_sucursales, max_usuarios, max_productos, max_transacciones_mes, almacenamiento_gb, incluye_pos, incluye_inventario_basico, incluye_inventario_avanzado, incluye_promociones, incluye_reservas, incluye_arqueo_caja, incluye_egresos, incluye_egresos_avanzados, incluye_reportes_avanzados, incluye_analytics, incluye_delivery, incluye_impresion, incluye_soporte_24h, incluye_api, incluye_white_label, orden_display) VALUES
        ('Básico', 'Plan ideal para pequeños restaurantes', 29.99, 299.99, 1, 3, 50, 200, 1, true, true, false, false, false, false, false, false, false, false, false, true, false, false, false, 1),
        ('Profesional', 'Plan completo para restaurantes en crecimiento', 59.99, 599.99, 3, 10, 200, 1000, 5, true, true, true, true, true, true, true, false, true, false, false, true, false, false, false, 2),
        ('Avanzado', 'Plan para restaurantes con múltiples sucursales', 99.99, 999.99, 10, 25, 500, 5000, 20, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, 3),
        ('Enterprise', 'Plan completo para grandes cadenas', 199.99, 1999.99, -1, -1, -1, -1, 100, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, 4);
      `);
      console.log('✅ Planes iniciales insertados');
    } else {
      console.log('⚠️  Los planes ya existen, omitiendo inserción');
    }
    
    // 8. Verificar tablas creadas
    console.log('\n🔍 Verificando tablas creadas...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('planes', 'suscripciones', 'contadores_uso', 'alertas_limites', 'auditoria_planes', 'historial_uso_mensual')
      ORDER BY table_name;
    `);
    
    console.log('📋 Tablas del sistema de planes:');
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    // 9. Verificar datos de planes
    console.log('\n📊 Planes disponibles:');
    const planes = await pool.query('SELECT nombre, precio_mensual FROM planes ORDER BY orden_display');
    planes.rows.forEach(plan => {
      console.log(`  • ${plan.nombre}: $${plan.precio_mensual}/mes`);
    });
    
    console.log('\n🎉 ¡Configuración de la base de datos completada!');
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTables();
}

module.exports = { createTables };
