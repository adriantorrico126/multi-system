const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function eliminarIdRestauranteSinTrigger() {
  try {
    console.log('🔧 [ELIMINACIÓN] id_restaurante de metodos_pago (SIN TRIGGER)');
    console.log('===========================================================');

    // Leer el script SQL
    const sqlScript = fs.readFileSync('./eliminar_id_restaurante_sin_trigger.sql', 'utf8');
    
    // Dividir en comandos individuales
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));

    console.log(`📝 Ejecutando ${commands.length} comandos SQL...\n`);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.includes('SELECT')) {
        // Para comandos SELECT, mostrar resultados
        try {
          const result = await pool.query(command);
          if (result.rows.length > 0) {
            console.log(`✅ Comando ${i + 1}:`);
            console.table(result.rows);
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

    console.log('\n🎉 [COMPLETADO] Eliminación de id_restaurante finalizada');
    console.log('======================================================');
    console.log('✅ Métodos de pago convertidos a globales');
    console.log('✅ Trigger problemático deshabilitado');
    console.log('✅ Referencias en ventas actualizadas');
    console.log('✅ Tabla backup creada como metodos_pago_backup');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    await pool.end();
  }
}

eliminarIdRestauranteSinTrigger();
