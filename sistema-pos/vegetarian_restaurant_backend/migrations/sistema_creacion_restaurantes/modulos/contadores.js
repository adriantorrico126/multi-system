/**
 * Módulo de creación de contadores de uso
 */

const { logger } = require('../utils/logger');

/**
 * Crear contadores de uso para el restaurante
 */
async function crearContadoresUso(client, idRestaurante, idPlan) {
    logger.debug('Inicializando contadores de uso...');
    
    // Obtener límites del plan
    const planQuery = await client.query(
        'SELECT * FROM planes WHERE id_plan = $1',
        [idPlan]
    );
    
    if (planQuery.rows.length === 0) {
        throw new Error(`No se encontró el plan con ID ${idPlan}`);
    }
    
    const plan = planQuery.rows[0];
    
    // Definir recursos a monitorear
    const recursos = [
        { nombre: 'usuarios', limite: plan.max_usuarios, uso: 1 }, // Ya hay 1 admin
        { nombre: 'sucursales', limite: plan.max_sucursales, uso: 1 }, // Ya hay 1 sucursal
        { nombre: 'productos', limite: plan.max_productos, uso: 0 },
        { nombre: 'mesas', limite: plan.max_mesas || 100, uso: 0 },
        { nombre: 'pedidos_mes', limite: plan.max_pedidos_mes || 999999, uso: 0 },
        { nombre: 'categorias', limite: 100, uso: 0 }
    ];
    
    const contadoresCreados = [];
    const fechaMedicion = new Date();
    
    for (const recurso of recursos) {
        logger.debug(`  - ${recurso.nombre}: ${recurso.uso}/${recurso.limite}`);
        
        const query = `
            INSERT INTO contadores_uso (
                id_restaurante,
                id_plan,
                recurso,
                uso_actual,
                limite_plan,
                fecha_medicion
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        
        const valores = [
            idRestaurante,
            idPlan,
            recurso.nombre,
            recurso.uso,
            recurso.limite,
            fechaMedicion
        ];
        
        const resultado = await client.query(query, valores);
        contadoresCreados.push(resultado.rows[0]);
    }
    
    return contadoresCreados;
}

module.exports = {
    crearContadoresUso
};

