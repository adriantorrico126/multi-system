// =====================================================
// PARCHE TEMPORAL PARA ventaController.js
// Línea 346 - Problema con abrirMesa
// =====================================================

// PROBLEMA ACTUAL (línea 346):
// mesaActualizada = await Mesa.abrirMesa(mesa.numero, sucursal.id_sucursal, vendedor.id_vendedor, id_restaurante, client);

// SOLUCIÓN TEMPORAL - REEMPLAZAR CON:

if (mesa.estado === 'libre') {
  // Si la mesa está libre, verificar si ya existe antes de abrir
  logger.info('Backend: Verificando mesa antes de abrir:', {
    numero: mesa.numero,
    id_sucursal: sucursal.id_sucursal,
    id_restaurante: id_restaurante,
    mesa_id: idMesaFinal
  });

  try {
    // Intentar actualizar directamente sin crear nueva mesa
    const updateQuery = `
      UPDATE mesas 
      SET estado = 'en_uso', 
          hora_apertura = NOW(),
          total_acumulado = 0,
          id_venta_actual = NULL,
          id_mesero_actual = $4
      WHERE id_mesa = $1 AND id_sucursal = $2 AND id_restaurante = $3
      RETURNING *
    `;
    const { rows } = await client.query(updateQuery, [idMesaFinal, sucursal.id_sucursal, id_restaurante, vendedor.id_vendedor]);
    
    if (!rows[0]) {
      await client.query('ROLLBACK');
      logger.error(`[VENTA] No se pudo actualizar la mesa ${mesa.numero} (ID: ${idMesaFinal})`);
      return res.status(400).json({
        message: `No se pudo abrir la mesa seleccionada. Verifica que esté disponible.`,
        errorType: 'MESA_NO_ACTUALIZADA',
        mesaSolicitada: mesa.numero,
        sucursal: sucursal.id_sucursal
      });
    }
    
    mesaActualizada = rows[0];
    logger.info('Backend: Mesa actualizada exitosamente:', mesaActualizada);
    
  } catch (updateError) {
    await client.query('ROLLBACK');
    logger.error('Backend: Error al actualizar mesa:', updateError);
    return res.status(500).json({
      message: 'Error interno al procesar la mesa',
      errorType: 'DATABASE_ERROR',
      details: updateError.message
    });
  }

  // Crear prefactura
  try {
    await Mesa.crearPrefactura(mesaActualizada.id_mesa, null, id_restaurante, client);
  } catch (prefacturaError) {
    // No fallar si la prefactura ya existe
    logger.warn('Backend: Error al crear prefactura (posiblemente ya existe):', prefacturaError.message);
  }
}
