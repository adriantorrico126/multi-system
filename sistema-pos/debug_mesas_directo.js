const { Pool } = require('pg');

// Configuración directa para PostgreSQL local
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres', // Base de datos por defecto
  user: 'postgres',
  password: 'postgres'
});

async function debugMesasDirecto() {
  try {
    console.log('🔍 [DEBUG] Verificando estado de mesas y ventas...\n');

    // Primero, listar todas las bases de datos
    console.log('📊 Bases de datos disponibles:');
    const dbsQuery = 'SELECT datname FROM pg_database WHERE datistemplate = false;';
    const dbsResult = await pool.query(dbsQuery);
    console.table(dbsResult.rows);

    // Intentar con diferentes nombres de base de datos
    const possibleDbs = ['sitemm_db', 'sitemm', 'postgres', 'restaurant_db'];
    
    for (const dbName of possibleDbs) {
      try {
        console.log(`\n🔍 Probando base de datos: ${dbName}`);
        
        // Crear nueva conexión para esta base de datos
        const testPool = new Pool({
          host: 'localhost',
          port: 5432,
          database: dbName,
          user: 'postgres',
          password: 'postgres'
        });

        // Verificar si existe la tabla mesas
        const tableCheck = await testPool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'mesas'
          );
        `);

        if (tableCheck.rows[0].exists) {
          console.log(`✅ Tabla 'mesas' encontrada en ${dbName}`);
          
          // Verificar mesas
          const mesasQuery = `
            SELECT 
              m.id_mesa,
              m.numero,
              m.estado,
              m.total_acumulado,
              m.id_venta_actual,
              m.hora_apertura
            FROM mesas m
            WHERE m.id_restaurante = 1
            ORDER BY m.numero
            LIMIT 5
          `;
          const mesasResult = await testPool.query(mesasQuery);
          console.log('📋 Mesas encontradas:');
          console.table(mesasResult.rows);

          // Verificar ventas activas
          const ventasQuery = `
            SELECT 
              v.id_venta,
              v.mesa_numero,
              v.estado,
              v.total,
              v.fecha
            FROM ventas v
            WHERE v.id_restaurante = 1 
              AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro')
            ORDER BY v.fecha DESC
            LIMIT 5
          `;
          const ventasResult = await testPool.query(ventasQuery);
          console.log('💰 Ventas activas:');
          console.table(ventasResult.rows);

          await testPool.end();
          break; // Salir del loop si encontramos la base de datos correcta
        } else {
          console.log(`❌ Tabla 'mesas' no encontrada en ${dbName}`);
          await testPool.end();
        }
      } catch (error) {
        console.log(`❌ Error con base de datos ${dbName}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    await pool.end();
  }
}

debugMesasDirecto();
