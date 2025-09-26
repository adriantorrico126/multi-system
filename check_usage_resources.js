const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function checkUsageResources() {
  try {
    console.log('🔍 Verificando datos de uso de recursos...\n');

    // Verificar datos en uso_recursos para restaurante 7
    const usageQuery = `
      SELECT *
      FROM uso_recursos
      WHERE id_restaurante = 7
      ORDER BY created_at DESC
    `;
    const usageResult = await pool.query(usageQuery);
    
    console.log('📋 Datos en uso_recursos para restaurante 7:');
    usageResult.rows.forEach(usage => {
      console.log(`- Mes: ${usage.mes_medicion}/${usage.año_medicion}`);
      console.log(`  Sucursales: ${usage.sucursales_actuales}`);
      console.log(`  Usuarios: ${usage.usuarios_actuales}`);
      console.log(`  Productos: ${usage.productos_actuales}`);
      console.log(`  Transacciones: ${usage.transacciones_mes_actual}`);
      console.log(`  Creado: ${usage.created_at}`);
      console.log('');
    });

    // Verificar sucursales reales
    const sucursalesQuery = `
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN activo = true THEN 1 END) as activas
      FROM sucursales 
      WHERE id_restaurante = 7
    `;
    const sucursalesResult = await pool.query(sucursalesQuery);
    
    console.log('📊 Sucursales reales del restaurante 7:');
    console.log(`- Total: ${sucursalesResult.rows[0].total}`);
    console.log(`- Activas: ${sucursalesResult.rows[0].activas}`);
    console.log('');

    // Actualizar datos de uso si están desactualizados
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const currentUsage = usageResult.rows.find(u => 
      u.mes_medicion === currentMonth && u.año_medicion === currentYear
    );
    
    if (!currentUsage || currentUsage.sucursales_actuales !== sucursalesResult.rows[0].activas) {
      console.log('🔄 Actualizando datos de uso de recursos...');
      
      // Eliminar datos desactualizados
      const deleteQuery = `
        DELETE FROM uso_recursos 
        WHERE id_restaurante = 7
      `;
      await pool.query(deleteQuery);
      
      // Insertar datos actualizados
      const insertQuery = `
        INSERT INTO uso_recursos (
          id_restaurante, id_plan, productos_actuales, usuarios_actuales,
          sucursales_actuales, transacciones_mes_actual, almacenamiento_usado_mb,
          mes_medicion, año_medicion, created_at, updated_at
        ) VALUES (
          7, 1, 0, 1, $1, 0, 0, $2, $3, NOW(), NOW()
        )
      `;
      await pool.query(insertQuery, [
        sucursalesResult.rows[0].activas,
        currentMonth,
        currentYear
      ]);
      
      console.log('✅ Datos de uso actualizados');
    } else {
      console.log('✅ Los datos de uso están actualizados');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsageResources();
