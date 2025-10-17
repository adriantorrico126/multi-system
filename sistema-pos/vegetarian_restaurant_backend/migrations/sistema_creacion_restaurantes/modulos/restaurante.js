/**
 * Módulo de creación de restaurante base
 */

const { logger } = require('../utils/logger');

/**
 * Validar datos del restaurante
 */
function validarDatosRestaurante(datos) {
    const errores = [];
    
    if (!datos.nombre || datos.nombre.trim().length === 0) {
        errores.push('El nombre del restaurante es obligatorio');
    }
    
    if (!datos.ciudad || datos.ciudad.trim().length === 0) {
        errores.push('La ciudad es obligatoria');
    }
    
    if (!datos.email || !datos.email.includes('@')) {
        errores.push('El email debe ser válido');
    }
    
    if (datos.telefono && datos.telefono.length < 7) {
        errores.push('El teléfono debe tener al menos 7 dígitos');
    }
    
    return errores;
}

/**
 * Crear restaurante en la base de datos
 */
async function crearRestaurante(client, datos) {
    // Validar datos
    const errores = validarDatosRestaurante(datos);
    if (errores.length > 0) {
        throw new Error(`Datos de restaurante inválidos:\n${errores.join('\n')}`);
    }
    
    logger.debug('Insertando restaurante en BD...');
    logger.data('Nombre', datos.nombre);
    logger.data('Ciudad', datos.ciudad);
    logger.data('Email', datos.email);
    logger.data('Teléfono', datos.telefono || 'N/A');
    logger.data('Dirección', datos.direccion || 'N/A');
    
    const query = `
        INSERT INTO restaurantes (
            nombre,
            direccion,
            ciudad,
            telefono,
            email,
            activo
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id_restaurante, nombre, email
    `;
    
    const valores = [
        datos.nombre.trim(),
        datos.direccion?.trim() || '',
        datos.ciudad.trim(),
        datos.telefono?.trim() || '',
        datos.email.trim().toLowerCase(),
        true
    ];
    
    const resultado = await client.query(query, valores);
    
    return resultado.rows[0];
}

module.exports = {
    crearRestaurante,
    validarDatosRestaurante
};

