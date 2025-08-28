const { Pool } = require('pg');
const dbConfig = require('./config_db_local');
const fs = require('fs');
const path = require('path');

const pool = new Pool(dbConfig);

async function restoreCompleteStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 RESTAURANDO ESTRUCTURA COMPLETA DEL SISTEMA POS\n');
    console.log('=' .repeat(60));
    
    // 1. LEER ARCHIVO ESTRUCTURA.SQL
    console.log('\n📖 1. LEYENDO ARCHIVO ESTRUCTURA.SQL...');
    const estructuraPath = path.join(__dirname, '../../estructuradb/estructura.sql');
    
    if (!fs.existsSync(estructuraPath)) {
      throw new Error(`No se encontró el archivo: ${estructuraPath}`);
    }
    
    const estructuraContent = fs.readFileSync(estructuraPath, 'utf8');
    console.log('✅ Archivo estructura.sql leído correctamente');
    
    // 2. PARSEAR ESTRUCTURA Y CREAR TABLAS
    console.log('\n🏗️ 2. CREANDO TABLAS DEL SISTEMA...');
    
    // Dividir por líneas y procesar
    const lines = estructuraContent.split('\n').filter(line => line.trim());
    
    // Agrupar campos por tabla
    const tableStructures = {};
    let currentTable = null;
    
    for (const line of lines) {
      if (line.includes('\t')) {
        const [tableName, fieldName, fieldType, ...rest] = line.split('\t');
        
        if (!tableStructures[tableName]) {
          tableStructures[tableName] = [];
        }
        
        tableStructures[tableName].push({
          name: fieldName,
          type: fieldType,
          rest: rest.join('\t')
        });
      }
    }
    
    console.log(`📊 Se encontraron ${Object.keys(tableStructures).length} tablas para crear`);
    
    // 3. CREAR TABLAS EN ORDEN CORRECTO
    console.log('\n🔧 3. CREANDO TABLAS EN ORDEN DE DEPENDENCIAS...');
    
    // Orden de creación basado en dependencias
    const tableOrder = [
      'restaurantes',
      'sucursales', 
      'vendedores',
      'usuarios',
      'categorias',
      'productos',
      'mesas',
      'ventas',
      'detalle_ventas',
      'categorias_egresos',
      'egresos',
      'presupuestos_egresos',
      'arqueos_caja',
      'auditoria_pos',
      'auditoria_admin',
      'admin_users',
      'roles_admin',
      'configuraciones_restaurante',
      'configuraciones_sistema',
      'metodos_pago',
      'clientes',
      'reservas',
      'promociones',
      'productos_modificadores',
      'detalle_ventas_modificadores',
      'inventario_lotes',
      'categorias_almacen',
      'movimientos_inventario',
      'transferencias_almacen',
      'alertas_inventario',
      'archivos_egresos',
      'flujo_aprobaciones_egresos',
      'grupos_mesas',
      'mesas_en_grupo',
      'prefacturas',
      'facturas',
      'pagos_restaurantes',
      'servicios_restaurante',
      'soporte_tickets',
      'system_tasks',
      'integrity_logs',
      'dim_tiempo'
    ];
    
    // Crear tablas en orden
    for (const tableName of tableOrder) {
      if (tableStructures[tableName]) {
        try {
          console.log(`\n📋 Creando tabla: ${tableName}`);
          
          // Construir CREATE TABLE
          const fields = tableStructures[tableName];
          const fieldDefinitions = fields.map(field => {
            let definition = `${field.name} ${field.type}`;
            
            // Agregar restricciones básicas
            if (field.rest.includes('NOT NULL')) {
              definition += ' NOT NULL';
            }
            if (field.rest.includes('DEFAULT')) {
              const defaultMatch = field.rest.match(/DEFAULT\s+([^\s]+)/);
              if (defaultMatch) {
                definition += ` DEFAULT ${defaultMatch[1]}`;
              }
            }
            if (field.rest.includes('PRIMARY KEY')) {
              definition += ' PRIMARY KEY';
            }
            
            return definition;
          });
          
          const createTableSQL = `
            CREATE TABLE IF NOT EXISTS ${tableName} (
              ${fieldDefinitions.join(',\n              ')}
            )
          `;
          
          await client.query(createTableSQL);
          console.log(`   ✅ Tabla ${tableName} creada`);
          
        } catch (error) {
          console.log(`   ⚠️  Error creando ${tableName}: ${error.message}`);
        }
      }
    }
    
    // 4. CREAR ÍNDICES Y CONSTRAINTS
    console.log('\n🔍 4. CREANDO ÍNDICES Y CONSTRAINTS...');
    
    // Índices básicos para rendimiento
    const basicIndices = [
      'CREATE INDEX IF NOT EXISTS idx_restaurantes_activo ON restaurantes(activo)',
      'CREATE INDEX IF NOT EXISTS idx_sucursales_restaurante ON sucursales(id_restaurante)',
      'CREATE INDEX IF NOT EXISTS idx_vendedores_sucursal ON vendedores(id_sucursal)',
      'CREATE INDEX IF NOT EXISTS idx_vendedores_restaurante ON vendedores(id_restaurante)',
      'CREATE INDEX IF NOT EXISTS idx_mesas_sucursal ON mesas(id_sucursal)',
      'CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(id_categoria)',
      'CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha)',
      'CREATE INDEX IF NOT EXISTS idx_egresos_fecha ON egresos(fecha_egreso)',
      'CREATE INDEX IF NOT EXISTS idx_egresos_categoria ON egresos(id_categoria_egreso)'
    ];
    
    for (const index of basicIndices) {
      try {
        await client.query(index);
        console.log(`   ✅ Índice creado`);
      } catch (error) {
        console.log(`   ⚠️  Error creando índice: ${error.message}`);
      }
    }
    
    // 5. INSERTAR DATOS BÁSICOS
    console.log('\n📝 5. INSERTANDO DATOS BÁSICOS DEL SISTEMA...');
    
    try {
      // Verificar si ya hay datos
      const restaurantesCount = await client.query('SELECT COUNT(*) FROM restaurantes');
      
      if (parseInt(restaurantesCount.rows[0].count) === 0) {
        console.log('   💡 Insertando datos básicos...');
        
        // Insertar restaurante por defecto
        const restauranteResult = await client.query(`
          INSERT INTO restaurantes (nombre, direccion, ciudad, telefono, email, activo)
          VALUES ('Restaurante Demo', 'Dirección Demo', 'La Paz', '+591 123456789', 'demo@restaurante.com', true)
          RETURNING id_restaurante
        `);
        const id_restaurante = restauranteResult.rows[0].id_restaurante;
        console.log(`   ✅ Restaurante creado: ID ${id_restaurante}`);
        
        // Insertar sucursal por defecto
        const sucursalResult = await client.query(`
          INSERT INTO sucursales (nombre, ciudad, direccion, activo, id_restaurante)
          VALUES ('Sucursal Principal', 'La Paz', 'Dirección Sucursal', true, $1)
          RETURNING id_sucursal
        `, [id_restaurante]);
        const id_sucursal = sucursalResult.rows[0].id_sucursal;
        console.log(`   ✅ Sucursal creada: ID ${id_sucursal}`);
        
        // Insertar vendedor por defecto
        const vendedorResult = await client.query(`
          INSERT INTO vendedores (nombre, username, email, password_hash, rol, activo, id_sucursal, id_restaurante)
          VALUES ('Admin Demo', 'admin', 'admin@restaurante.com', '$2b$10$demo.hash.for.testing', 'admin', true, $1, $2)
          RETURNING id_vendedor
        `, [id_sucursal, id_restaurante]);
        console.log(`   ✅ Vendedor creado: ID ${vendedorResult.rows[0].id_vendedor}`);
        
        // Insertar categorías por defecto
        const categoriasDefault = [
          { nombre: 'Platos Principales', activo: true },
          { nombre: 'Bebidas', activo: true },
          { nombre: 'Postres', activo: true },
          { nombre: 'Entradas', activo: true }
        ];
        
        for (const categoria of categoriasDefault) {
          await client.query(`
            INSERT INTO categorias (nombre, activo, id_restaurante)
            VALUES ($1, $2, $3)
          `, [categoria.nombre, categoria.activo, id_restaurante]);
        }
        console.log(`   ✅ 4 categorías creadas`);
        
        // Insertar mesas por defecto
        for (let i = 1; i <= 10; i++) {
          await client.query(`
            INSERT INTO mesas (numero, capacidad, estado, id_sucursal, id_restaurante)
            VALUES ($1, $2, $3, $4, $5)
          `, [i, 4, 'libre', id_sucursal, id_restaurante]);
        }
        console.log(`   ✅ 10 mesas creadas`);
        
      } else {
        console.log('   ✅ Ya existen datos en el sistema');
      }
      
    } catch (error) {
      console.log(`   ⚠️  Error insertando datos: ${error.message}`);
    }
    
    // 6. VERIFICAR RESTAURACIÓN
    console.log('\n🔍 6. VERIFICANDO RESTAURACIÓN DEL SISTEMA...');
    
    const expectedTables = [
      'restaurantes', 'sucursales', 'vendedores', 'usuarios', 'categorias',
      'productos', 'mesas', 'ventas', 'detalle_ventas', 'categorias_egresos',
      'egresos', 'presupuestos_egresos'
    ];
    
    let tablesCreated = 0;
    for (const table of expectedTables) {
      try {
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1 AND table_schema = 'public'
          ) as exists
        `, [table]);
        
        if (tableExists.rows[0].exists) {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`   📊 ${table}: ${countResult.rows[0].count} registros`);
          tablesCreated++;
        } else {
          console.log(`   ❌ ${table}: NO EXISTE`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${table}: Error - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Total de tablas creadas: ${tablesCreated}/${expectedTables.length}`);
    
    if (tablesCreated >= expectedTables.length * 0.8) {
      console.log('\n🎉 ¡ESTRUCTURA DEL SISTEMA POS RESTAURADA EXITOSAMENTE!');
      console.log('💡 Ahora puedes ejecutar: node migrate_egresos_simple_local.js');
    } else {
      console.log('\n⚠️  Algunas tablas no se crearon correctamente');
      console.log('💡 Revisa los errores y ejecuta nuevamente');
    }
    
  } catch (error) {
    console.error('❌ Error durante la restauración:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar restauración
if (require.main === module) {
  restoreCompleteStructure()
    .then(() => {
      console.log('\n✅ Restauración de estructura finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Restauración falló:', error);
      process.exit(1);
    });
}

module.exports = { restoreCompleteStructure };
