const { Pool } = require('pg');
const dbConfig = require('./config_db');

// Configuración de la base de datos
const pool = new Pool(dbConfig);

async function migrateEgresosSimple() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando migración simplificada del sistema de egresos...\n');
    
    // Comandos SQL individuales para evitar problemas de parsing
    const commands = [
      // 1. Crear tabla categorias_egresos
      `CREATE TABLE IF NOT EXISTS categorias_egresos (
        id_categoria_egreso SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        color VARCHAR(7) DEFAULT '#6B7280',
        icono VARCHAR(50) DEFAULT 'DollarSign',
        activo BOOLEAN DEFAULT TRUE,
        id_restaurante INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_categorias_egresos_restaurante 
            FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
        CONSTRAINT uk_categorias_egresos_nombre_restaurante 
            UNIQUE (nombre, id_restaurante)
      )`,
      
      // 2. Crear tabla egresos
      `CREATE TABLE IF NOT EXISTS egresos (
        id_egreso SERIAL PRIMARY KEY,
        concepto VARCHAR(200) NOT NULL,
        descripcion TEXT,
        monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
        fecha_egreso DATE NOT NULL DEFAULT CURRENT_DATE,
        id_categoria_egreso INTEGER NOT NULL,
        metodo_pago VARCHAR(50) NOT NULL DEFAULT 'efectivo',
        proveedor_nombre VARCHAR(150),
        proveedor_documento VARCHAR(50),
        proveedor_telefono VARCHAR(20),
        proveedor_email VARCHAR(100),
        numero_factura VARCHAR(50),
        numero_recibo VARCHAR(50),
        numero_comprobante VARCHAR(50),
        estado VARCHAR(30) DEFAULT 'pendiente',
        registrado_por VARCHAR(100) NOT NULL,
        id_sucursal INTEGER NOT NULL,
        id_restaurante INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_egresos_categoria 
            FOREIGN KEY (id_categoria_egreso) REFERENCES categorias_egresos(id_categoria_egreso),
        CONSTRAINT fk_egresos_sucursal 
            FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal),
        CONSTRAINT fk_egresos_restaurante 
            FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
        CONSTRAINT ck_egresos_estado 
            CHECK (estado IN ('pendiente', 'aprobado', 'pagado', 'cancelado', 'rechazado')),
        CONSTRAINT ck_egresos_metodo_pago 
            CHECK (metodo_pago IN ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'cheque', 'otros'))
      )`,
      
      // 3. Crear tabla presupuestos_egresos
      `CREATE TABLE IF NOT EXISTS presupuestos_egresos (
        id_presupuesto SERIAL PRIMARY KEY,
        anio INTEGER NOT NULL,
        mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
        id_categoria_egreso INTEGER NOT NULL,
        monto_presupuestado DECIMAL(12,2) NOT NULL CHECK (monto_presupuestado >= 0),
        monto_ejecutado DECIMAL(12,2) DEFAULT 0,
        id_restaurante INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_presupuestos_categoria 
            FOREIGN KEY (id_categoria_egreso) REFERENCES categorias_egresos(id_categoria_egreso),
        CONSTRAINT fk_presupuestos_restaurante 
            FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
        CONSTRAINT uk_presupuestos_anio_mes_categoria_restaurante 
            UNIQUE (anio, mes, id_categoria_egreso, id_restaurante)
      )`,
      
      // 4. Crear índices
      `CREATE INDEX IF NOT EXISTS idx_categorias_egresos_restaurante ON categorias_egresos(id_restaurante)`,
      `CREATE INDEX IF NOT EXISTS idx_egresos_restaurante ON egresos(id_restaurante)`,
      `CREATE INDEX IF NOT EXISTS idx_egresos_fecha ON egresos(fecha_egreso)`,
      `CREATE INDEX IF NOT EXISTS idx_presupuestos_egresos_restaurante ON presupuestos_egresos(id_restaurante)`
    ];
    
    console.log(`🔧 Ejecutando ${commands.length} comandos SQL...\n`);
    
    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      try {
        await client.query(command);
        console.log(`✅ Comando ${i + 1} ejecutado correctamente`);
      } catch (error) {
        if (error.code === '42P07') {
          console.log(`⚠️  Tabla ya existe, continuando...`);
        } else {
          console.error(`❌ Error en comando ${i + 1}:`, error.message);
          throw error;
        }
      }
    }
    
    // Insertar categorías de egresos por defecto
    console.log('\n📝 Insertando categorías de egresos por defecto...');
    
    const categoriasDefault = [
      { nombre: 'Servicios Públicos', descripcion: 'Agua, luz, gas, internet', color: '#EF4444', icono: 'Zap' },
      { nombre: 'Alquiler', descripcion: 'Alquiler del local', color: '#8B5CF6', icono: 'Building' },
      { nombre: 'Personal', descripcion: 'Salarios, bonificaciones', color: '#06B6D4', icono: 'Users' },
      { nombre: 'Insumos', descripcion: 'Productos de limpieza, papelería', color: '#10B981', icono: 'Package' },
      { nombre: 'Mantenimiento', descripcion: 'Reparaciones y mantenimiento', color: '#F59E0B', icono: 'Wrench' },
      { nombre: 'Marketing', descripcion: 'Publicidad y promociones', color: '#EC4899', icono: 'Megaphone' },
      { nombre: 'Impuestos', descripcion: 'Impuestos municipales y estatales', color: '#6B7280', icono: 'FileText' },
      { nombre: 'Otros', descripcion: 'Otros gastos operativos', color: '#9CA3AF', icono: 'MoreHorizontal' }
    ];
    
    // Obtener el primer restaurante
    const restauranteResult = await client.query('SELECT id_restaurante FROM restaurantes LIMIT 1');
    if (restauranteResult.rows.length === 0) {
      throw new Error('No se encontró ningún restaurante en la base de datos');
    }
    
    const id_restaurante = restauranteResult.rows[0].id_restaurante;
    console.log(`🏪 Usando restaurante ID: ${id_restaurante}`);
    
    // Insertar categorías
    for (const categoria of categoriasDefault) {
      try {
        await client.query(`
          INSERT INTO categorias_egresos (nombre, descripcion, color, icono, id_restaurante)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (nombre, id_restaurante) DO NOTHING
        `, [categoria.nombre, categoria.descripcion, categoria.color, categoria.icono, id_restaurante]);
        
        console.log(`✅ Categoría "${categoria.nombre}" insertada/verificada`);
      } catch (error) {
        console.log(`⚠️  Categoría "${categoria.nombre}" ya existe`);
      }
    }
    
    console.log('\n🎉 Migración simplificada del sistema de egresos completada exitosamente!');
    
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
  migrateEgresosSimple()
    .then(() => {
      console.log('✅ Migración completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migración falló:', error);
      process.exit(1);
    });
}

module.exports = { migrateEgresosSimple };
