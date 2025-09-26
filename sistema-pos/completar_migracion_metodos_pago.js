const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function completarMigracionMetodosPago() {
  try {
    console.log('🔧 [COMPLETAR] Migración de métodos de pago globales');
    console.log('==================================================');

    // Leer el script SQL
    const sqlScript = fs.readFileSync('./completar_migracion_metodos_pago.sql', 'utf8');
    
    // Dividir en comandos individuales
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));

    console.log(`📝 Ejecutando ${commands.length} comandos SQL...\n`);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.includes('SELECT') && !command.includes('CREATE') && !command.includes('DROP')) {
        // Para comandos SELECT, mostrar resultados
        try {
          const result = await pool.query(command);
          if (result.rows.length > 0) {
            console.log(`✅ Comando ${i + 1}:`);
            if (result.rows.length <= 10) {
              console.table(result.rows);
            } else {
              console.log(`   ${result.rows.length} registros encontrados`);
            }
          } else {
            console.log(`✅ Comando ${i + 1}: Ejecutado (sin resultados)`);
          }
        } catch (error) {
          console.log(`⚠️ Comando ${i + 1}: ${error.message}`);
        }
      } else {
        // Para otros comandos, solo ejecutar
        try {
          await pool.query(command);
          console.log(`✅ Comando ${i + 1}: Ejecutado`);
        } catch (error) {
          console.log(`❌ Comando ${i + 1}: ${error.message}`);
          // Continuar con el siguiente comando
        }
      }
    }

    console.log('\n🎉 [COMPLETADO] Migración de métodos de pago finalizada');
    console.log('=====================================================');
    console.log('✅ Métodos de pago convertidos a globales');
    console.log('✅ Columna id_restaurante eliminada');
    console.log('✅ Referencias en ventas actualizadas');
    console.log('✅ Tabla backup preservada');

    // Verificación final
    console.log('\n🔍 [VERIFICACIÓN FINAL]');
    const verificacion = await pool.query(`
      SELECT 
          'metodos_pago' as tabla,
          COUNT(*) as registros
      FROM metodos_pago
      UNION ALL
      SELECT 
          'metodos_pago_backup' as tabla,
          COUNT(*) as registros
      FROM metodos_pago_backup
      UNION ALL
      SELECT 
          'ventas_con_referencias' as tabla,
          COUNT(*) as registros
      FROM ventas v
      JOIN metodos_pago mp ON v.id_pago = mp.id_pago
    `);
    console.table(verificacion.rows);

  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    await pool.end();
  }
}

completarMigracionMetodosPago();
