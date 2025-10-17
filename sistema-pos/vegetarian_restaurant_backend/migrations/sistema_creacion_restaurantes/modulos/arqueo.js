/**
 * Módulo de creación de arqueo inicial
 */

const { logger } = require('../utils/logger');

/**
 * Crear arqueo inicial de caja
 */
async function crearArqueoInicial(client, idRestaurante, idSucursal, idVendedor) {
    logger.debug('Inicializando arqueo de caja...');
    
    const montoInicial = 0.00; // Caja vacía al inicio
    const fechaApertura = new Date();
    
    logger.data('Monto inicial', `Bs ${montoInicial.toFixed(2)}`);
    logger.data('Fecha apertura', fechaApertura.toISOString().split('T')[0]);
    
    const query = `
        INSERT INTO arqueos_caja (
            id_restaurante,
            id_sucursal,
            id_vendedor,
            monto_inicial,
            monto_final,
            fecha_apertura,
            fecha_cierre,
            estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id_arqueo, monto_inicial, estado
    `;
    
    const valores = [
        idRestaurante,
        idSucursal,
        idVendedor,
        montoInicial,
        null, // monto_final se actualiza al cerrar
        fechaApertura,
        null, // fecha_cierre se actualiza al cerrar
        'abierto'
    ];
    
    const resultado = await client.query(query, valores);
    
    return resultado.rows[0];
}

module.exports = {
    crearArqueoInicial
};

