const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function pruebaMetodosPagoDB() {
  try {
    console.log('🧪 [PRUEBA] Métodos de Pago desde Base de Datos');
    console.log('==============================================');

    // Obtener métodos de pago activos
    console.log('\n💳 MÉTODOS DE PAGO ACTIVOS:');
    const metodosQuery = `
      SELECT id_pago, descripcion, activo
      FROM metodos_pago 
      WHERE id_restaurante = 1 AND activo = true
      ORDER BY id_pago
    `;
    const metodosResult = await pool.query(metodosQuery);
    console.table(metodosResult.rows);

    // Filtrar métodos excluyendo "Pago Diferido"
    console.log('\n💳 MÉTODOS PARA MODAL (excluyendo Pago Diferido):');
    const metodosParaModal = metodosResult.rows.filter(metodo => 
      !metodo.descripcion.toLowerCase().includes('diferido')
    );
    console.table(metodosParaModal);

    // Simular la lógica de iconos y colores
    console.log('\n🎨 SIMULACIÓN DE ICONOS Y COLORES:');
    metodosParaModal.forEach(metodo => {
      const desc = metodo.descripcion.toLowerCase();
      let icono = 'Wallet';
      let color = 'bg-orange-500 hover:bg-orange-600';
      
      if (desc.includes('efectivo')) {
        icono = 'Banknote';
        color = 'bg-green-500 hover:bg-green-600';
      } else if (desc.includes('tarjeta') || desc.includes('crédito') || desc.includes('débito')) {
        icono = 'CreditCard';
        color = 'bg-blue-500 hover:bg-blue-600';
      } else if (desc.includes('transferencia') || desc.includes('móvil')) {
        icono = 'Smartphone';
        color = 'bg-purple-500 hover:bg-purple-600';
      }
      
      console.log(`• ${metodo.descripcion} → Icono: ${icono}, Color: ${color}`);
    });

    console.log('\n✅ VERIFICACIÓN COMPLETADA');
    console.log('\n📝 CONFIGURACIÓN DEL MODAL:');
    console.log('• Se cargan métodos desde la base de datos');
    console.log('• Solo se muestran métodos activos');
    console.log('• Se excluye "Pago Diferido"');
    console.log('• Iconos y colores se asignan automáticamente');
    console.log('• Se envía la descripción del método al backend');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

pruebaMetodosPagoDB();

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function pruebaMetodosPagoDB() {
  try {
    console.log('🧪 [PRUEBA] Métodos de Pago desde Base de Datos');
    console.log('==============================================');

    // Obtener métodos de pago activos
    console.log('\n💳 MÉTODOS DE PAGO ACTIVOS:');
    const metodosQuery = `
      SELECT id_pago, descripcion, activo
      FROM metodos_pago 
      WHERE id_restaurante = 1 AND activo = true
      ORDER BY id_pago
    `;
    const metodosResult = await pool.query(metodosQuery);
    console.table(metodosResult.rows);

    // Filtrar métodos excluyendo "Pago Diferido"
    console.log('\n💳 MÉTODOS PARA MODAL (excluyendo Pago Diferido):');
    const metodosParaModal = metodosResult.rows.filter(metodo => 
      !metodo.descripcion.toLowerCase().includes('diferido')
    );
    console.table(metodosParaModal);

    // Simular la lógica de iconos y colores
    console.log('\n🎨 SIMULACIÓN DE ICONOS Y COLORES:');
    metodosParaModal.forEach(metodo => {
      const desc = metodo.descripcion.toLowerCase();
      let icono = 'Wallet';
      let color = 'bg-orange-500 hover:bg-orange-600';
      
      if (desc.includes('efectivo')) {
        icono = 'Banknote';
        color = 'bg-green-500 hover:bg-green-600';
      } else if (desc.includes('tarjeta') || desc.includes('crédito') || desc.includes('débito')) {
        icono = 'CreditCard';
        color = 'bg-blue-500 hover:bg-blue-600';
      } else if (desc.includes('transferencia') || desc.includes('móvil')) {
        icono = 'Smartphone';
        color = 'bg-purple-500 hover:bg-purple-600';
      }
      
      console.log(`• ${metodo.descripcion} → Icono: ${icono}, Color: ${color}`);
    });

    console.log('\n✅ VERIFICACIÓN COMPLETADA');
    console.log('\n📝 CONFIGURACIÓN DEL MODAL:');
    console.log('• Se cargan métodos desde la base de datos');
    console.log('• Solo se muestran métodos activos');
    console.log('• Se excluye "Pago Diferido"');
    console.log('• Iconos y colores se asignan automáticamente');
    console.log('• Se envía la descripción del método al backend');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

pruebaMetodosPagoDB();
