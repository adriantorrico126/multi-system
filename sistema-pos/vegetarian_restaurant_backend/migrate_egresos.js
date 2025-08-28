const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: { rejectUnauthorized: false }
});

async function migrateEgresos() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando migración del sistema de egresos...');
    
    // Leer el esquema SQL corregido
    const schemaPath = path.join(__dirname, 'sql', 'sistema_egresos_simple.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📖 Esquema SQL leído correctamente');
    
    // Dividir el SQL en comandos individuales
    const commands = schemaSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`🔧 Ejecutando ${commands.length} comandos SQL...`);
    
    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
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
    }
    
    // Insertar categorías de egresos por defecto
    console.log('📝 Insertando categorías de egresos por defecto...');
    
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
    
    // Verificar que las tablas se crearon correctamente
    console.log('🔍 Verificando tablas creadas...');
    
    const tables = ['categorias_egresos', 'egresos', 'presupuestos_egresos'];
    for (const table of tables) {
      const result = await client.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_name = $1
      `, [table]);
      
      if (result.rows[0].count > 0) {
        console.log(`✅ Tabla ${table} existe`);
        
        // Contar registros
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   📊 Registros en ${table}: ${countResult.rows[0].count}`);
      } else {
        console.log(`❌ Tabla ${table} NO existe`);
      }
    }
    
    console.log('🎉 Migración del sistema de egresos completada exitosamente!');
    
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
  migrateEgresos()
    .then(() => {
      console.log('✅ Migración completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migración falló:', error);
      process.exit(1);
    });
}

module.exports = { migrateEgresos };
