/**
 * Módulo de creación de administrador
 */

const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');

/**
 * Validar datos del administrador
 */
function validarDatosAdministrador(datos) {
    const errores = [];
    
    if (!datos.nombre || datos.nombre.trim().length === 0) {
        errores.push('El nombre del administrador es obligatorio');
    }
    
    if (!datos.username || datos.username.trim().length < 3) {
        errores.push('El username debe tener al menos 3 caracteres');
    }
    
    if (!datos.email || !datos.email.includes('@')) {
        errores.push('El email debe ser válido');
    }
    
    if (!datos.password || datos.password.length < 6) {
        errores.push('La contraseña debe tener al menos 6 caracteres');
    }
    
    return errores;
}

/**
 * Crear usuario administrador del restaurante
 */
async function crearAdministrador(client, idRestaurante, idSucursal, datos) {
    // Validar datos
    const errores = validarDatosAdministrador(datos);
    if (errores.length > 0) {
        throw new Error(`Datos de administrador inválidos:\n${errores.join('\n')}`);
    }
    
    logger.debug('Preparando usuario administrador...');
    logger.data('Nombre', datos.nombre);
    logger.data('Username', datos.username);
    logger.data('Email', datos.email);
    
    // Verificar si el username ya existe
    const checkUsername = await client.query(
        'SELECT id_vendedor FROM vendedores WHERE username = $1',
        [datos.username.trim().toLowerCase()]
    );
    
    if (checkUsername.rows.length > 0) {
        throw new Error(`El username "${datos.username}" ya está en uso`);
    }
    
    // Verificar si el email ya existe
    const checkEmail = await client.query(
        'SELECT id_vendedor FROM vendedores WHERE email = $1',
        [datos.email.trim().toLowerCase()]
    );
    
    if (checkEmail.rows.length > 0) {
        throw new Error(`El email "${datos.email}" ya está en uso`);
    }
    
    // Obtener el rol de administrador
    const rolResult = await client.query(
        "SELECT id_rol FROM roles_admin WHERE nombre = 'Administrador'"
    );
    
    if (rolResult.rows.length === 0) {
        throw new Error('No se encontró el rol de Administrador en la base de datos');
    }
    
    const idRolAdmin = rolResult.rows[0].id_rol;
    
    // Hash de la contraseña
    logger.debug('Encriptando contraseña...');
    const passwordHash = await bcrypt.hash(datos.password, 10);
    
    // Insertar administrador
    logger.debug('Insertando administrador en BD...');
    const query = `
        INSERT INTO vendedores (
            nombre,
            username,
            email,
            password_hash,
            rol,
            activo,
            id_sucursal,
            id_restaurante,
            rol_admin_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id_vendedor, nombre, username, email, rol
    `;
    
    const valores = [
        datos.nombre.trim(),
        datos.username.trim().toLowerCase(),
        datos.email.trim().toLowerCase(),
        passwordHash,
        'administrador',
        true,
        idSucursal,
        idRestaurante,
        idRolAdmin
    ];
    
    const resultado = await client.query(query, valores);
    
    return resultado.rows[0];
}

module.exports = {
    crearAdministrador,
    validarDatosAdministrador
};

