const { Pool } = require('pg');
const dbConfig = require('./config_db_local');

const pool = new Pool(dbConfig);

async function migrateEgresosSimpleLocal() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando migración simplificada del sistema de egresos (LOCAL)...\n');
    
    // 1. Eliminar tablas existentes si existen
    console.log('🗑️  Eliminando tablas existentes...');
    await client.query('DROP TABLE IF EXISTS presupuestos_egresos CASCADE');
    await client.query('DROP TABLE IF EXISTS egresos CASCADE');
    await client.query('DROP TABLE IF EXISTS categorias_egresos CASCADE');
    console.log('✅ Tablas eliminadas\n');
    
    // 2. Crear tabla de categorías
    console.log('📂 Creando tabla categorias_egresos...');
    await client.query(`
      CREATE TABLE categorias_egresos (
        id_categoria_egreso SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        icono VARCHAR(50) DEFAULT 'receipt',
        activo BOOLEAN DEFAULT true,
        id_restaurante INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabla categorias_egresos creada\n');
    
    // 3. Crear tabla de egresos
    console.log('💰 Creando tabla egresos...');
    await client.query(`
      CREATE TABLE egresos (
        id_egreso SERIAL PRIMARY KEY,
        concepto VARCHAR(200) NOT NULL,
        descripcion TEXT,
        monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
        fecha_egreso DATE NOT NULL,
        id_categoria_egreso INTEGER NOT NULL,
        metodo_pago VARCHAR(50) DEFAULT 'efectivo',
        proveedor_nombre VARCHAR(200),
        estado VARCHAR(30) DEFAULT 'pendiente',
        registrado_por INTEGER NOT NULL,
        id_sucursal INTEGER NOT NULL,
        id_restaurante INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_egresos_categoria 
            FOREIGN KEY (id_categoria_egreso) REFERENCES categorias_egresos(id_categoria_egreso),
        CONSTRAINT fk_egresos_registrado_por 
            FOREIGN KEY (registrado_por) REFERENCES vendedores(id_vendedor),
        CONSTRAINT fk_egresos_sucursal 
            FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal),
        CONSTRAINT fk_egresos_restaurante 
            FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante)
      )
    `);
    console.log('✅ Tabla egresos creada\n');
    
    // 4. Crear tabla de presupuestos
    console.log('📊 Creando tabla presupuestos_egresos...');
    await client.query(`
      CREATE TABLE presupuestos_egresos (
        id_presupuesto SERIAL PRIMARY KEY,
        anio INTEGER NOT NULL,
        mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
        id_categoria_egreso INTEGER NOT NULL,
        monto_presupuestado DECIMAL(10,2) NOT NULL CHECK (monto_presupuestado >= 0),
        monto_ejecutado DECIMAL(10,2) DEFAULT 0,
        id_restaurante INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_presupuestos_categoria 
            FOREIGN KEY (id_categoria_egreso) REFERENCES categorias_egresos(id_categoria_egreso),
        CONSTRAINT fk_presupuestos_restaurante 
            FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante),
        CONSTRAINT uk_presupuesto_anio_mes_categoria 
            UNIQUE (anio, mes, id_categoria_egreso, id_restaurante)
      )
    `);
    console.log('✅ Tabla presupuestos_egresos creada\n');
    
    // 5. Crear índices para mejor rendimiento
    console.log('🔍 Creando índices...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_egresos_restaurante ON egresos(id_restaurante)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_egresos_sucursal ON egresos(id_sucursal)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_egresos_categoria ON egresos(id_categoria_egreso)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_egresos_fecha ON egresos(fecha_egreso)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_egresos_estado ON egresos(estado)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_egresos_registrado_por ON egresos(registrado_por)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_categorias_restaurante ON categorias_egresos(id_restaurante)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_presupuestos_restaurante ON presupuestos_egresos(id_restaurante)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_presupuestos_anio_mes ON presupuestos_egresos(anio, mes)');
    console.log('✅ Índices creados\n');
    
    // 6. Insertar categorías por defecto
    console.log('📝 Insertando categorías por defecto...');
    const categoriasDefault = [
      {
        nombre: 'Gastos Operativos',
        descripcion: 'Gastos relacionados con la operación diaria del restaurante',
        color: '#3B82F6',
        icono: 'receipt'
      },
      {
        nombre: 'Mantenimiento',
        descripcion: 'Gastos de mantenimiento y reparación de equipos',
        color: '#EF4444',
        icono: 'wrench'
      },
      {
        nombre: 'Limpieza',
        descripcion: 'Productos y servicios de limpieza',
        color: '#10B981',
        icono: 'sparkles'
      },
      {
        nombre: 'Insumos',
        descripcion: 'Materiales y suministros de oficina',
        color: '#F59E0B',
        icono: 'archive'
      },
      {
        nombre: 'Servicios',
        descripcion: 'Servicios externos y profesionales',
        color: '#8B5CF6',
        icono: 'briefcase'
      }
    ];
    
    // Obtener el primer restaurante disponible
    const restauranteResult = await client.query('SELECT id_restaurante FROM restaurantes LIMIT 1');
    if (restauranteResult.rows.length === 0) {
      throw new Error('No hay restaurantes en la base de datos');
    }
    
    const id_restaurante = restauranteResult.rows[0].id_restaurante;
    console.log(`🏪 Usando restaurante ID: ${id_restaurante}`);
    
    for (const categoria of categoriasDefault) {
      await client.query(`
        INSERT INTO categorias_egresos (nombre, descripcion, color, icono, id_restaurante)
        VALUES ($1, $2, $3, $4, $5)
      `, [categoria.nombre, categoria.descripcion, categoria.color, categoria.icono, id_restaurante]);
      console.log(`   ✅ Categoría creada: ${categoria.nombre}`);
    }
    console.log('✅ Categorías por defecto insertadas\n');
    
    // 7. Verificar la migración
    console.log('🔍 Verificando migración...');
    const categoriasCount = await client.query('SELECT COUNT(*) FROM categorias_egresos');
    const egresosCount = await client.query('SELECT COUNT(*) FROM egresos');
    const presupuestosCount = await client.query('SELECT COUNT(*) FROM presupuestos_egresos');
    
    console.log(`📊 Resultados de la migración:`);
    console.log(`   - Categorías: ${categoriasCount.rows[0].count}`);
    console.log(`   - Egresos: ${egresosCount.rows[0].count}`);
    console.log(`   - Presupuestos: ${presupuestosCount.rows[0].count}`);
    
    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('💡 Ahora ejecuta: node verify_complete_system.js');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar migración
if (require.main === module) {
  migrateEgresosSimpleLocal()
    .then(() => {
      console.log('\n✅ Migración finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migración falló:', error);
      process.exit(1);
    });
}

module.exports = { migrateEgresosSimpleLocal };
