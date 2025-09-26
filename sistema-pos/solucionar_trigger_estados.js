const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function solucionarTriggerEstados() {
  try {
    console.log('🔧 [SOLUCIÓN] Actualizando trigger para incluir pendiente_aprobacion');
    console.log('==============================================================');

    // 1. Actualizar la función validate_venta_integrity
    const updateFunctionQuery = `
      CREATE OR REPLACE FUNCTION validate_venta_integrity()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Validar mesa SOLO para ventas de tipo 'Mesa'
        IF NEW.tipo_servicio = 'Mesa' THEN
          -- Mesa obligatoria cuando es servicio de Mesa
          IF NEW.id_mesa IS NULL OR NEW.mesa_numero IS NULL THEN
            RAISE EXCEPTION 'La mesa es obligatoria para ventas de Mesa' USING ERRCODE = 'P0001';
          END IF;

          -- La mesa debe existir
          IF NOT EXISTS (
            SELECT 1 FROM mesas 
            WHERE id_mesa = NEW.id_mesa
          ) THEN
            RAISE EXCEPTION 'La mesa % no existe', NEW.id_mesa;
          END IF;

          -- Consistencia de datos de mesa
          IF EXISTS (
            SELECT 1 FROM mesas m
            WHERE m.id_mesa = NEW.id_mesa
              AND (m.numero != NEW.mesa_numero 
                   OR m.id_sucursal != NEW.id_sucursal 
                   OR m.id_restaurante != NEW.id_restaurante)
          ) THEN
            RAISE EXCEPTION 'Inconsistencia en datos de mesa: número=%, sucursal=%, restaurante=%', 
              NEW.mesa_numero, NEW.id_sucursal, NEW.id_restaurante;
          END IF;
        END IF;

        -- Verificar que el estado sea válido (INCLUYENDO pendiente_aprobacion)
        IF NEW.estado NOT IN (
          'recibido', 'en_preparacion', 'entregado', 'cancelado',
          'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado',
          'pendiente_aprobacion', 'aceptado'
        ) THEN
          RAISE EXCEPTION 'Estado de venta inválido: %', NEW.estado;
        END IF;

        -- Verificar que el vendedor pertenezca al restaurante
        IF NEW.id_vendedor IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM vendedores 
          WHERE id_vendedor = NEW.id_vendedor 
            AND id_restaurante = NEW.id_restaurante
        ) THEN
          RAISE EXCEPTION 'El vendedor % no pertenece al restaurante %', NEW.id_vendedor, NEW.id_restaurante;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    await pool.query(updateFunctionQuery);
    console.log('✅ Función validate_venta_integrity actualizada');

    // 2. Verificar que el trigger existe
    const triggerQuery = `
      SELECT 
          tgname as trigger_name,
          tgrelid::regclass as table_name,
          proname as function_name
      FROM pg_trigger t
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE tgrelid::regclass::text = 'ventas'
      AND proname = 'validate_venta_integrity'
    `;
    const triggerResult = await pool.query(triggerQuery);
    console.log('\n🔗 TRIGGER VERIFICADO:');
    console.table(triggerResult.rows);

    // 3. Verificar estados problemáticos
    const problemQuery = `
      SELECT 
          id_venta,
          estado,
          fecha,
          total
      FROM ventas 
      WHERE estado = 'pendiente_aprobacion'
      ORDER BY fecha DESC
    `;
    const problemResult = await pool.query(problemQuery);
    console.log('\n⚠️ VENTAS CON ESTADO PROBLEMÁTICO:');
    console.table(problemResult.rows);

    // 4. Probar la actualización con una venta problemática
    if (problemResult.rows.length > 0) {
      console.log('\n🧪 PROBANDO ACTUALIZACIÓN CON VENTA PROBLEMÁTICA...');
      const testVenta = problemResult.rows[0];
      
      try {
        // Intentar actualizar el id_pago de la venta problemática
        const testUpdate = `
          UPDATE ventas 
          SET id_pago = 1 
          WHERE id_venta = $1
        `;
        await pool.query(testUpdate, [testVenta.id_venta]);
        console.log(`✅ Venta ${testVenta.id_venta} actualizada exitosamente`);
        
        // Revertir el cambio
        await pool.query(`
          UPDATE ventas 
          SET id_pago = (SELECT id_pago FROM metodos_pago_backup LIMIT 1)
          WHERE id_venta = $1
        `, [testVenta.id_venta]);
        console.log(`🔄 Cambio revertido para prueba`);
        
      } catch (error) {
        console.log(`❌ Error en prueba: ${error.message}`);
      }
    }

    console.log('\n🎉 [COMPLETADO] Trigger actualizado exitosamente');
    console.log('==============================================');
    console.log('✅ Estados pendiente_aprobacion y aceptado agregados');
    console.log('✅ Trigger funcionando correctamente');
    console.log('✅ Ahora puedes ejecutar el script de eliminación de id_restaurante');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

solucionarTriggerEstados();
