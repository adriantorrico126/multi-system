const { Pool } = require('pg');
const dbConfig = require('./config_db_local');

const pool = new Pool(dbConfig);

async function createPOSSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 CREANDO SISTEMA COMPLETO DEL POS\n');
    console.log('=' .repeat(60));
    
    // 1. CREAR TABLA RESTAURANTES
    console.log('\n🏪 1. CREANDO TABLA RESTAURANTES...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurantes (
        id_restaurante SERIAL PRIMARY KEY,
        nombre VARCHAR(200) NOT NULL,
        descripcion TEXT,
        direccion TEXT,
        telefono VARCHAR(20),
        email VARCHAR(150),
        logo_url TEXT,
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabla restaurantes creada');
    
    // 2. CREAR TABLA SUCURSALES
    console.log('\n🏢 2. CREANDO TABLA SUCURSALES...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sucursales (
        id_sucursal SERIAL PRIMARY KEY,
        nombre VARCHAR(200) NOT NULL,
        direccion TEXT,
        ciudad VARCHAR(100),
        telefono VARCHAR(20),
        email VARCHAR(150),
        id_restaurante INTEGER NOT NULL,
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_sucursales_restaurante 
            FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante)
      )
    `);
    console.log('✅ Tabla sucursales creada');
    
    // 3. CREAR TABLA VENDEDORES
    console.log('\n👥 3. CREANDO TABLA VENDEDORES...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendedores (
        id_vendedor SERIAL PRIMARY KEY,
        nombre VARCHAR(200) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        rol VARCHAR(50) NOT NULL DEFAULT 'vendedor',
        activo BOOLEAN DEFAULT true,
        id_sucursal INTEGER NOT NULL,
        id_restaurante INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_vendedores_sucursal 
            FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal),
        CONSTRAINT fk_vendedores_restaurante 
            FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante)
      )
    `);
    console.log('✅ Tabla vendedores creada');
    
    // 4. CREAR TABLA MESAS
    console.log('\n🪑 4. CREANDO TABLA MESAS...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS mesas (
        id_mesa SERIAL PRIMARY KEY,
        numero_mesa INTEGER NOT NULL,
        capacidad INTEGER DEFAULT 4,
        estado VARCHAR(50) DEFAULT 'libre',
        id_sucursal INTEGER NOT NULL,
        id_restaurante INTEGER NOT NULL,
        activa BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_mesas_sucursal 
            FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal),
        CONSTRAINT fk_mesas_restaurante 
            FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante),
        CONSTRAINT uk_mesa_sucursal 
            UNIQUE (numero_mesa, id_sucursal)
      )
    `);
    console.log('✅ Tabla mesas creada');
    
    // 5. CREAR TABLA CATEGORIAS
    console.log('\n📂 5. CREANDO TABLA CATEGORIAS...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id_categoria SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        icono VARCHAR(50) DEFAULT 'tag',
        activa BOOLEAN DEFAULT true,
        id_restaurante INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_categorias_restaurante 
            FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante)
      )
    `);
    console.log('✅ Tabla categorias creada');
    
    // 6. CREAR TABLA PRODUCTOS
    console.log('\n🍽️ 6. CREANDO TABLA PRODUCTOS...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id_producto SERIAL PRIMARY KEY,
        nombre VARCHAR(200) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL CHECK (precio > 0),
        precio_especial DECIMAL(10,2),
        stock_actual INTEGER DEFAULT 0,
        stock_minimo INTEGER DEFAULT 0,
        id_categoria INTEGER NOT NULL,
        id_restaurante INTEGER NOT NULL,
        activo BOOLEAN DEFAULT true,
        imagen_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_productos_categoria 
            FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
        CONSTRAINT fk_productos_restaurante 
            FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante)
      )
    `);
    console.log('✅ Tabla productos creada');
    
    // 7. CREAR TABLA COMANDAS
    console.log('\n📋 7. CREANDO TABLA COMANDAS...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS comandas (
        id_comanda SERIAL PRIMARY KEY,
        numero_comanda VARCHAR(50) UNIQUE NOT NULL,
        id_mesa INTEGER NOT NULL,
        id_vendedor INTEGER NOT NULL,
        id_sucursal INTEGER NOT NULL,
        id_restaurante INTEGER NOT NULL,
        estado VARCHAR(50) DEFAULT 'abierta',
        total DECIMAL(10,2) DEFAULT 0,
        notas TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_comandas_mesa 
            FOREIGN KEY (id_mesa) REFERENCES mesas(id_mesa),
        CONSTRAINT fk_comandas_vendedor 
            FOREIGN KEY (id_vendedor) REFERENCES vendedores(id_vendedor),
        CONSTRAINT fk_comandas_sucursal 
            FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal),
        CONSTRAINT fk_comandas_restaurante 
            FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante)
      )
    `);
    console.log('✅ Tabla comandas creada');
    
    // 8. CREAR TABLA DETALLE_COMANDAS
    console.log('\n🍽️ 8. CREANDO TABLA DETALLE_COMANDAS...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS detalle_comandas (
        id_detalle SERIAL PRIMARY KEY,
        id_comanda INTEGER NOT NULL,
        id_producto INTEGER NOT NULL,
        cantidad INTEGER NOT NULL CHECK (cantidad > 0),
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        notas TEXT,
        estado VARCHAR(50) DEFAULT 'pendiente',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_detalle_comanda 
            FOREIGN KEY (id_comanda) REFERENCES comandas(id_comanda),
        CONSTRAINT fk_detalle_producto 
            FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
      )
    `);
    console.log('✅ Tabla detalle_comandas creada');
    
    // 9. CREAR TABLA VENTAS
    console.log('\n💰 9. CREANDO TABLA VENTAS...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ventas (
        id_venta SERIAL PRIMARY KEY,
        numero_venta VARCHAR(50) UNIQUE NOT NULL,
        id_comanda INTEGER,
        id_mesa INTEGER NOT NULL,
        id_vendedor INTEGER NOT NULL,
        id_sucursal INTEGER NOT NULL,
        id_restaurante INTEGER NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        descuento DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) NOT NULL,
        metodo_pago VARCHAR(50) DEFAULT 'efectivo',
        estado VARCHAR(50) DEFAULT 'completada',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_ventas_comanda 
            FOREIGN KEY (id_comanda) REFERENCES comandas(id_comanda),
        CONSTRAINT fk_ventas_mesa 
            FOREIGN KEY (id_mesa) REFERENCES mesas(id_mesa),
        CONSTRAINT fk_ventas_vendedor 
            FOREIGN KEY (id_vendedor) REFERENCES vendedores(id_vendedor),
        CONSTRAINT fk_ventas_sucursal 
            FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal),
        CONSTRAINT fk_ventas_restaurante 
            FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante)
      )
    `);
    console.log('✅ Tabla ventas creada');
    
    // 10. CREAR ÍNDICES PARA MEJOR RENDIMIENTO
    console.log('\n🔍 10. CREANDO ÍNDICES...');
    const indices = [
      'CREATE INDEX IF NOT EXISTS idx_restaurantes_activo ON restaurantes(activo)',
      'CREATE INDEX IF NOT EXISTS idx_sucursales_restaurante ON sucursales(id_restaurante)',
      'CREATE INDEX IF NOT EXISTS idx_sucursales_activo ON sucursales(activo)',
      'CREATE INDEX IF NOT EXISTS idx_vendedores_sucursal ON vendedores(id_sucursal)',
      'CREATE INDEX IF NOT EXISTS idx_vendedores_restaurante ON vendedores(id_restaurante)',
      'CREATE INDEX IF NOT EXISTS idx_vendedores_username ON vendedores(username)',
      'CREATE INDEX IF NOT EXISTS idx_vendedores_email ON vendedores(email)',
      'CREATE INDEX IF NOT EXISTS idx_mesas_sucursal ON mesas(id_sucursal)',
      'CREATE INDEX IF NOT EXISTS idx_mesas_estado ON mesas(estado)',
      'CREATE INDEX IF NOT EXISTS idx_categorias_restaurante ON categorias(id_restaurante)',
      'CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(id_categoria)',
      'CREATE INDEX IF NOT EXISTS idx_productos_restaurante ON productos(id_restaurante)',
      'CREATE INDEX IF NOT EXISTS idx_comandas_mesa ON comandas(id_mesa)',
      'CREATE INDEX IF NOT EXISTS idx_comandas_estado ON comandas(estado)',
      'CREATE INDEX IF NOT EXISTS idx_comandas_vendedor ON comandas(id_vendedor)',
      'CREATE INDEX IF NOT EXISTS idx_detalle_comandas_comanda ON detalle_comandas(id_comanda)',
      'CREATE INDEX IF NOT EXISTS idx_ventas_comanda ON ventas(id_comanda)',
      'CREATE INDEX IF NOT EXISTS idx_ventas_mesa ON ventas(id_mesa)',
      'CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON ventas(id_vendedor)',
      'CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(created_at)'
    ];
    
    for (const index of indices) {
      await client.query(index);
    }
    console.log('✅ Índices creados');
    
    // 11. INSERTAR DATOS BÁSICOS DEL SISTEMA
    console.log('\n📝 11. INSERTANDO DATOS BÁSICOS DEL SISTEMA...');
    
    // Insertar restaurante por defecto
    const restauranteResult = await client.query(`
      INSERT INTO restaurantes (nombre, descripcion, direccion, telefono, email)
      VALUES ('Restaurante Demo', 'Restaurante de demostración del sistema POS', 'Dirección Demo', '+591 123456789', 'demo@restaurante.com')
      RETURNING id_restaurante
    `);
    const id_restaurante = restauranteResult.rows[0].id_restaurante;
    console.log(`   ✅ Restaurante creado: ID ${id_restaurante}`);
    
    // Insertar sucursal por defecto
    const sucursalResult = await client.query(`
      INSERT INTO sucursales (nombre, direccion, ciudad, telefono, email, id_restaurante)
      VALUES ('Sucursal Principal', 'Dirección Sucursal', 'La Paz', '+591 123456789', 'sucursal@restaurante.com', $1)
      RETURNING id_sucursal
    `, [id_restaurante]);
    const id_sucursal = sucursalResult.rows[0].id_sucursal;
    console.log(`   ✅ Sucursal creada: ID ${id_sucursal}`);
    
    // Insertar vendedor por defecto
    const vendedorResult = await client.query(`
      INSERT INTO vendedores (nombre, username, email, password_hash, rol, id_sucursal, id_restaurante)
      VALUES ('Admin Demo', 'admin', 'admin@restaurante.com', '$2b$10$demo.hash.for.testing', 'admin', $1, $2)
      RETURNING id_vendedor
    `, [id_sucursal, id_restaurante]);
    const id_vendedor = vendedorResult.rows[0].id_vendedor;
    console.log(`   ✅ Vendedor creado: ID ${id_vendedor}`);
    
    // Insertar categorías por defecto
    const categoriasDefault = [
      { nombre: 'Platos Principales', descripcion: 'Platos principales del menú', color: '#3B82F6', icono: 'utensils' },
      { nombre: 'Bebidas', descripcion: 'Bebidas y refrescos', color: '#10B981', icono: 'glass' },
      { nombre: 'Postres', descripcion: 'Postres y dulces', color: '#F59E0B', icono: 'cake' },
      { nombre: 'Entradas', descripcion: 'Entradas y aperitivos', color: '#EF4444', icono: 'appetizer' }
    ];
    
    for (const categoria of categoriasDefault) {
      await client.query(`
        INSERT INTO categorias (nombre, descripcion, color, icono, id_restaurante)
        VALUES ($1, $2, $3, $4, $5)
      `, [categoria.nombre, categoria.descripcion, categoria.color, categoria.icono, id_restaurante]);
      console.log(`   ✅ Categoría creada: ${categoria.nombre}`);
    }
    
    // Insertar mesas por defecto
    for (let i = 1; i <= 10; i++) {
      await client.query(`
        INSERT INTO mesas (numero_mesa, capacidad, id_sucursal, id_restaurante)
        VALUES ($1, $2, $3, $4)
      `, [i, 4, id_sucursal, id_restaurante]);
    }
    console.log(`   ✅ 10 mesas creadas`);
    
    // 12. VERIFICAR CREACIÓN
    console.log('\n🔍 12. VERIFICANDO CREACIÓN DEL SISTEMA...');
    const tables = ['restaurantes', 'sucursales', 'vendedores', 'mesas', 'categorias', 'productos', 'comandas', 'detalle_comandas', 'ventas'];
    
    for (const table of tables) {
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   📊 ${table}: ${countResult.rows[0].count} registros`);
    }
    
    console.log('\n🎉 ¡SISTEMA POS COMPLETAMENTE CREADO!');
    console.log('💡 Ahora puedes ejecutar: node migrate_egresos_simple_local.js');
    
  } catch (error) {
    console.error('❌ Error durante la creación del sistema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar creación
if (require.main === module) {
  createPOSSystem()
    .then(() => {
      console.log('\n✅ Creación del sistema POS finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Creación falló:', error);
      process.exit(1);
    });
}

module.exports = { createPOSSystem };
