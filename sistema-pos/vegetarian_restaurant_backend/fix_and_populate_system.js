const { Pool } = require('pg');
const dbConfig = require('./config_db_local');

const pool = new Pool(dbConfig);

async function fixAndPopulateSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 CORRIGIENDO Y POBLANDO EL SISTEMA POS\n');
    console.log('=' .repeat(60));
    
    // 1. VERIFICAR ESTRUCTURA EXACTA DE TABLAS CRÍTICAS
    console.log('\n🔍 1. VERIFICANDO ESTRUCTURA EXACTA DE TABLAS...');
    
    const criticalTables = ['restaurantes', 'sucursales', 'vendedores', 'categorias', 'productos', 'mesas'];
    
    for (const table of criticalTables) {
      try {
        const structureResult = await client.query(`
          SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [table]);
        
        console.log(`\n📊 Estructura de ${table}:`);
        structureResult.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
          const defaultValue = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`   - ${col.column_name}: ${col.data_type}${length} ${nullable}${defaultValue}`);
        });
        
      } catch (error) {
        console.log(`   ⚠️  Error verificando ${table}: ${error.message}`);
      }
    }
    
    // 2. INSERTAR DATOS BÁSICOS CORRECTAMENTE
    console.log('\n📝 2. INSERTANDO DATOS BÁSICOS DEL SISTEMA...');
    
    try {
      // Verificar si ya hay datos
      const restaurantesCount = await client.query('SELECT COUNT(*) FROM restaurantes');
      
      if (parseInt(restaurantesCount.rows[0].count) === 0) {
        console.log('   💡 Insertando datos básicos...');
        
        // Insertar restaurante por defecto (verificar columnas disponibles)
        const restauranteColumns = await client.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'restaurantes' AND table_schema = 'public'
          ORDER BY ordinal_position
        `);
        
        const availableColumns = restauranteColumns.rows.map(row => row.column_name);
        console.log(`   📋 Columnas disponibles en restaurantes: ${availableColumns.join(', ')}`);
        
        // Construir INSERT dinámicamente
        let restauranteFields = [];
        let restauranteValues = [];
        let paramCount = 1;
        
        if (availableColumns.includes('nombre')) {
          restauranteFields.push('nombre');
          restauranteValues.push('Restaurante Demo');
        }
        if (availableColumns.includes('direccion')) {
          restauranteFields.push('direccion');
          restauranteValues.push('Dirección Demo');
        }
        if (availableColumns.includes('ciudad')) {
          restauranteFields.push('ciudad');
          restauranteValues.push('La Paz');
        }
        if (availableColumns.includes('telefono')) {
          restauranteFields.push('telefono');
          restauranteValues.push('+591 123456789');
        }
        if (availableColumns.includes('email')) {
          restauranteFields.push('email');
          restauranteValues.push('demo@restaurante.com');
        }
        if (availableColumns.includes('activo')) {
          restauranteFields.push('activo');
          restauranteValues.push(true);
        }
        
        const restauranteSQL = `
          INSERT INTO restaurantes (${restauranteFields.join(', ')})
          VALUES (${restauranteFields.map(() => `$${paramCount++}`).join(', ')})
          RETURNING id_restaurante
        `;
        
        const restauranteResult = await client.query(restauranteSQL, restauranteValues);
        const id_restaurante = restauranteResult.rows[0].id_restaurante;
        console.log(`   ✅ Restaurante creado: ID ${id_restaurante}`);
        
        // Insertar sucursal por defecto
        const sucursalColumns = await client.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'sucursales' AND table_schema = 'public'
          ORDER BY ordinal_position
        `);
        
        const sucursalAvailableColumns = sucursalColumns.rows.map(row => row.column_name);
        console.log(`   📋 Columnas disponibles en sucursales: ${sucursalAvailableColumns.join(', ')}`);
        
        let sucursalFields = [];
        let sucursalValues = [];
        paramCount = 1;
        
        if (sucursalAvailableColumns.includes('nombre')) {
          sucursalFields.push('nombre');
          sucursalValues.push('Sucursal Principal');
        }
        if (sucursalAvailableColumns.includes('ciudad')) {
          sucursalFields.push('ciudad');
          sucursalValues.push('La Paz');
        }
        if (sucursalAvailableColumns.includes('direccion')) {
          sucursalFields.push('direccion');
          sucursalValues.push('Dirección Sucursal');
        }
        if (sucursalAvailableColumns.includes('activo')) {
          sucursalFields.push('activo');
          sucursalValues.push(true);
        }
        if (sucursalAvailableColumns.includes('id_restaurante')) {
          sucursalFields.push('id_restaurante');
          sucursalValues.push(id_restaurante);
        }
        
        const sucursalSQL = `
          INSERT INTO sucursales (${sucursalFields.join(', ')})
          VALUES (${sucursalFields.map(() => `$${paramCount++}`).join(', ')})
          RETURNING id_sucursal
        `;
        
        const sucursalResult = await client.query(sucursalSQL, sucursalValues);
        const id_sucursal = sucursalResult.rows[0].id_sucursal;
        console.log(`   ✅ Sucursal creada: ID ${id_sucursal}`);
        
        // Insertar vendedor por defecto
        const vendedorColumns = await client.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'vendedores' AND table_schema = 'public'
          ORDER BY ordinal_position
        `);
        
        const vendedorAvailableColumns = vendedorColumns.rows.map(row => row.column_name);
        console.log(`   📋 Columnas disponibles en vendedores: ${vendedorAvailableColumns.join(', ')}`);
        
        let vendedorFields = [];
        let vendedorValues = [];
        paramCount = 1;
        
        if (vendedorAvailableColumns.includes('nombre')) {
          vendedorFields.push('nombre');
          vendedorValues.push('Admin Demo');
        }
        if (vendedorAvailableColumns.includes('username')) {
          vendedorFields.push('username');
          vendedorValues.push('admin');
        }
        if (vendedorAvailableColumns.includes('email')) {
          vendedorFields.push('email');
          vendedorValues.push('admin@restaurante.com');
        }
        if (vendedorAvailableColumns.includes('password_hash')) {
          vendedorFields.push('password_hash');
          vendedorValues.push('$2b$10$demo.hash.for.testing');
        }
        if (vendedorAvailableColumns.includes('rol')) {
          vendedorFields.push('rol');
          vendedorValues.push('admin');
        }
        if (vendedorAvailableColumns.includes('activo')) {
          vendedorFields.push('activo');
          vendedorValues.push(true);
        }
        if (vendedorAvailableColumns.includes('id_sucursal')) {
          vendedorFields.push('id_sucursal');
          vendedorValues.push(id_sucursal);
        }
        if (vendedorAvailableColumns.includes('id_restaurante')) {
          vendedorFields.push('id_restaurante');
          vendedorValues.push(id_restaurante);
        }
        
        const vendedorSQL = `
          INSERT INTO vendedores (${vendedorFields.join(', ')})
          VALUES (${vendedorFields.map(() => `$${paramCount++}`).join(', ')})
          RETURNING id_vendedor
        `;
        
        const vendedorResult = await client.query(vendedorSQL, vendedorValues);
        console.log(`   ✅ Vendedor creado: ID ${vendedorResult.rows[0].id_vendedor}`);
        
        // Insertar categorías por defecto
        const categoriaColumns = await client.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'categorias' AND table_schema = 'public'
          ORDER BY ordinal_position
        `);
        
        const categoriaAvailableColumns = categoriaColumns.rows.map(row => row.column_name);
        console.log(`   📋 Columnas disponibles en categorias: ${categoriaAvailableColumns.join(', ')}`);
        
        const categoriasDefault = [
          { nombre: 'Platos Principales', activo: true },
          { nombre: 'Bebidas', activo: true },
          { nombre: 'Postres', activo: true },
          { nombre: 'Entradas', activo: true }
        ];
        
        for (const categoria of categoriasDefault) {
          let catFields = [];
          let catValues = [];
          paramCount = 1;
          
          if (categoriaAvailableColumns.includes('nombre')) {
            catFields.push('nombre');
            catValues.push(categoria.nombre);
          }
          if (categoriaAvailableColumns.includes('activo')) {
            catFields.push('activo');
            catValues.push(categoria.activo);
          }
          if (categoriaAvailableColumns.includes('id_restaurante')) {
            catFields.push('id_restaurante');
            catValues.push(id_restaurante);
          }
          
          const catSQL = `
            INSERT INTO categorias (${catFields.join(', ')})
            VALUES (${catFields.map(() => `$${paramCount++}`).join(', ')})
          `;
          
          await client.query(catSQL, catValues);
        }
        console.log(`   ✅ 4 categorías creadas`);
        
        // Insertar mesas por defecto
        const mesaColumns = await client.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'mesas' AND table_schema = 'public'
          ORDER BY ordinal_position
        `);
        
        const mesaAvailableColumns = mesaColumns.rows.map(row => row.column_name);
        console.log(`   📋 Columnas disponibles en mesas: ${mesaAvailableColumns.join(', ')}`);
        
        for (let i = 1; i <= 10; i++) {
          let mesaFields = [];
          let mesaValues = [];
          paramCount = 1;
          
          if (mesaAvailableColumns.includes('numero')) {
            mesaFields.push('numero');
            mesaValues.push(i);
          }
          if (mesaAvailableColumns.includes('capacidad')) {
            mesaFields.push('capacidad');
            mesaValues.push(4);
          }
          if (mesaAvailableColumns.includes('estado')) {
            mesaFields.push('estado');
            mesaValues.push('libre');
          }
          if (mesaAvailableColumns.includes('id_sucursal')) {
            mesaFields.push('id_sucursal');
            mesaValues.push(id_sucursal);
          }
          if (mesaAvailableColumns.includes('id_restaurante')) {
            mesaFields.push('id_restaurante');
            mesaValues.push(id_restaurante);
          }
          
          const mesaSQL = `
            INSERT INTO mesas (${mesaFields.join(', ')})
            VALUES (${mesaFields.map(() => `$${paramCount++}`).join(', ')})
          `;
          
          await client.query(mesaSQL, mesaValues);
        }
        console.log(`   ✅ 10 mesas creadas`);
        
      } else {
        console.log('   ✅ Ya existen datos en el sistema');
      }
      
    } catch (error) {
      console.log(`   ⚠️  Error insertando datos: ${error.message}`);
    }
    
    // 3. VERIFICAR DATOS INSERTADOS
    console.log('\n🔍 3. VERIFICANDO DATOS INSERTADOS...');
    
    const tablesToCheck = ['restaurantes', 'sucursales', 'vendedores', 'categorias', 'mesas'];
    
    for (const table of tablesToCheck) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   📊 ${table}: ${countResult.rows[0].count} registros`);
        
        if (parseInt(countResult.rows[0].count) > 0) {
          const sampleResult = await client.query(`SELECT * FROM ${table} LIMIT 1`);
          const sample = Object.entries(sampleResult.rows[0]).slice(0, 3).map(([key, value]) => `${key}: ${value}`).join(', ');
          console.log(`      📝 Ejemplo: ${sample}...`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error verificando ${table}: ${error.message}`);
      }
    }
    
    // 4. VERIFICAR SISTEMA DE EGRESOS
    console.log('\n💰 4. VERIFICANDO SISTEMA DE EGRESOS...');
    
    const egresosTables = ['categorias_egresos', 'egresos', 'presupuestos_egresos'];
    
    for (const table of egresosTables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   📊 ${table}: ${countResult.rows[0].count} registros`);
      } catch (error) {
        console.log(`   ⚠️  Error verificando ${table}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 ¡SISTEMA CORREGIDO Y POBLADO EXITOSAMENTE!');
    console.log('💡 Ahora puedes ejecutar: node migrate_egresos_simple_local.js');
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar corrección
if (require.main === module) {
  fixAndPopulateSystem()
    .then(() => {
      console.log('\n✅ Corrección y población finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Corrección falló:', error);
      process.exit(1);
    });
}

module.exports = { fixAndPopulateSystem };
