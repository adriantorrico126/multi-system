/**
 * Módulo de creación de suscripción
 */

const { logger } = require('../utils/logger');

/**
 * Crear suscripción y asignar plan al restaurante
 */
async function crearSuscripcion(client, idRestaurante, datosPlan) {
    logger.debug('Configurando suscripción...');
    
    // Obtener información del plan
    const idPlan = datosPlan.id_plan || 3; // Plan Avanzado por defecto
    
    const planQuery = await client.query(
        'SELECT * FROM planes WHERE id_plan = $1',
        [idPlan]
    );
    
    if (planQuery.rows.length === 0) {
        throw new Error(`No se encontró el plan con ID ${idPlan}`);
    }
    
    const plan = planQuery.rows[0];
    logger.data('Plan seleccionado', `${plan.nombre} (ID: ${plan.id_plan})`);
    logger.data('Precio', `Bs ${plan.precio_mensual}`);
    logger.data('Usuarios', plan.max_usuarios);
    logger.data('Sucursales', plan.max_sucursales);
    logger.data('Productos', plan.max_productos);
    
    // Calcular fechas
    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setFullYear(fechaFin.getFullYear() + 1); // 1 año de suscripción
    
    logger.data('Fecha inicio', fechaInicio.toISOString().split('T')[0]);
    logger.data('Fecha fin', fechaFin.toISOString().split('T')[0]);
    
    // Insertar suscripción
    const query = `
        INSERT INTO suscripciones (
            id_restaurante,
            id_plan,
            fecha_inicio,
            fecha_fin,
            estado,
            auto_renovacion
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id_suscripcion, id_plan, fecha_inicio, fecha_fin, estado
    `;
    
    const valores = [
        idRestaurante,
        idPlan,
        fechaInicio,
        fechaFin,
        'activa',
        true
    ];
    
    const resultado = await client.query(query, valores);
    
    return {
        ...resultado.rows[0],
        nombre_plan: plan.nombre,
        precio: plan.precio_mensual
    };
}

module.exports = {
    crearSuscripcion
};

