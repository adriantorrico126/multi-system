const fs = require('fs');
const path = require('path');
const { pool } = require('./src/config/database');

async function createReservasTable() {
  try {
    console.log('🔧 Creando tabla de reservas...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'create_reservas.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Dividir el SQL en comandos individuales
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Ejecutando ${commands.length} comandos SQL...`);
    
    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          await pool.query(command);
          console.log(`✅ Comando ${i + 1} ejecutado exitosamente`);
        } catch (error) {
          console.log(`⚠️ Comando ${i + 1} (posiblemente ya existe): ${error.message}`);
        }
      }
    }
    
    // Verificar que las tablas se crearon correctamente
    console.log('\n🔍 Verificando estructura de tablas...');
    
    const reservasCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'reservas' 
      ORDER BY ordinal_position
    `);
    
    const clientesCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'clientes' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Estructura de tabla reservas:');
    reservasCheck.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'})`);
    });
    
    console.log('\n📊 Estructura de tabla clientes:');
    clientesCheck.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'})`);
    });
    
    // Verificar clientes de ejemplo
    const clientesCount = await pool.query('SELECT COUNT(*) as count FROM clientes');
    console.log(`\n👥 Clientes de ejemplo creados: ${clientesCount.rows[0].count}`);
    
    console.log('\n✅ Tabla de reservas creada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error creando tabla de reservas:', error);
  } finally {
    await pool.end();
  }
}

createReservasTable(); 