/**
 * Módulo de creación de sucursal
 */

const { logger } = require('../utils/logger');

/**
 * Validar datos de la sucursal
 */
function validarDatosSucursal(datos) {
    const errores = [];
    
    if (!datos.nombre || datos.nombre.trim().length === 0) {
        errores.push('El nombre de la sucursal es obligatorio');
    }
    
    if (!datos.ciudad || datos.ciudad.trim().length === 0) {
        errores.push('La ciudad es obligatoria');
    }
    
    return errores;
}

/**
 * Crear sucursal principal del restaurante
 */
async function crearSucursal(client, idRestaurante, datos) {
    // Validar datos
    const errores = validarDatosSucursal(datos);
    if (errores.length > 0) {
        throw new Error(`Datos de sucursal inválidos:\n${errores.join('\n')}`);
    }
    
    logger.debug('Insertando sucursal en BD...');
    logger.data('Nombre', datos.nombre);
    logger.data('Ciudad', datos.ciudad);
    logger.data('Dirección', datos.direccion || 'N/A');
    logger.data('ID Restaurante', idRestaurante);
    
    const query = `
        INSERT INTO sucursales (
            nombre,
            direccion,
            ciudad,
            id_restaurante,
            activo
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id_sucursal, nombre, ciudad
    `;
    
    const valores = [
        datos.nombre.trim(),
        datos.direccion?.trim() || '',
        datos.ciudad.trim(),
        idRestaurante,
        true
    ];
    
    const resultado = await client.query(query, valores);
    
    return resultado.rows[0];
}

module.exports = {
    crearSucursal,
    validarDatosSucursal
};

