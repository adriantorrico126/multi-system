/**
 * Módulo de verificación post-creación
 */

const { logger } = require('../utils/logger');

/**
 * Verificar que todos los datos se crearon correctamente
 */
async function verificarCreacion(pool, idRestaurante) {
    logger.debug('Ejecutando verificaciones...');
    
    const verificaciones = {
        restaurante: false,
        sucursal: false,
        administrador: false,
        suscripcion: false,
        contadores: false,
        categorias: false,
        productos: false,
        mesas: false,
        arqueo: false
    };
    
    const advertencias = [];
    const detalles = {};
    
    try {
        // 1. Verificar restaurante
        const restaurante = await pool.query(
            'SELECT * FROM restaurantes WHERE id_restaurante = $1',
            [idRestaurante]
        );
        verificaciones.restaurante = restaurante.rows.length > 0;
        detalles.restaurante = restaurante.rows[0];
        logger.debug(`  ✓ Restaurante: ${restaurante.rows[0]?.nombre || 'N/A'}`);
        
        // 2. Verificar sucursal
        const sucursal = await pool.query(
            'SELECT COUNT(*) as count FROM sucursales WHERE id_restaurante = $1',
            [idRestaurante]
        );
        const countSucursales = parseInt(sucursal.rows[0].count);
        verificaciones.sucursal = countSucursales > 0;
        detalles.sucursales = countSucursales;
        logger.debug(`  ✓ Sucursales: ${countSucursales}`);
        
        // 3. Verificar administrador
        const admin = await pool.query(
            "SELECT COUNT(*) as count FROM vendedores WHERE id_restaurante = $1 AND rol = 'administrador'",
            [idRestaurante]
        );
        const countAdmins = parseInt(admin.rows[0].count);
        verificaciones.administrador = countAdmins > 0;
        detalles.administradores = countAdmins;
        logger.debug(`  ✓ Administradores: ${countAdmins}`);
        
        // 4. Verificar suscripción
        const suscripcion = await pool.query(
            "SELECT s.*, p.nombre as nombre_plan FROM suscripciones s JOIN planes p ON s.id_plan = p.id_plan WHERE s.id_restaurante = $1 AND s.estado = 'activa'",
            [idRestaurante]
        );
        verificaciones.suscripcion = suscripcion.rows.length > 0;
        detalles.suscripcion = suscripcion.rows[0];
        logger.debug(`  ✓ Suscripción: ${suscripcion.rows[0]?.nombre_plan || 'N/A'}`);
        
        if (suscripcion.rows.length === 0) {
            advertencias.push('No se encontró suscripción activa');
        }
        
        // 5. Verificar contadores de uso
        const contadores = await pool.query(
            'SELECT COUNT(*) as count FROM contadores_uso WHERE id_restaurante = $1',
            [idRestaurante]
        );
        const countContadores = parseInt(contadores.rows[0].count);
        verificaciones.contadores = countContadores >= 6; // Debe tener al menos 6 contadores básicos
        detalles.contadores = countContadores;
        logger.debug(`  ✓ Contadores de uso: ${countContadores}`);
        
        if (countContadores === 0) {
            advertencias.push('No se crearon contadores de uso');
        }
        
        // 6. Verificar categorías
        const categorias = await pool.query(
            'SELECT COUNT(*) as count FROM categorias WHERE id_restaurante = $1',
            [idRestaurante]
        );
        const countCategorias = parseInt(categorias.rows[0].count);
        verificaciones.categorias = true; // Puede no tener categorías
        detalles.categorias = countCategorias;
        logger.debug(`  ✓ Categorías: ${countCategorias}`);
        
        // 7. Verificar productos
        const productos = await pool.query(
            'SELECT COUNT(*) as count FROM productos WHERE id_restaurante = $1',
            [idRestaurante]
        );
        const countProductos = parseInt(productos.rows[0].count);
        verificaciones.productos = true; // Puede no tener productos
        detalles.productos = countProductos;
        logger.debug(`  ✓ Productos: ${countProductos}`);
        
        // 8. Verificar mesas
        const mesas = await pool.query(
            'SELECT COUNT(*) as count FROM mesas WHERE id_restaurante = $1',
            [idRestaurante]
        );
        const countMesas = parseInt(mesas.rows[0].count);
        verificaciones.mesas = countMesas > 0;
        detalles.mesas = countMesas;
        logger.debug(`  ✓ Mesas: ${countMesas}`);
        
        if (countMesas === 0) {
            advertencias.push('No se crearon mesas');
        }
        
        // 9. Verificar arqueo
        const arqueo = await pool.query(
            "SELECT COUNT(*) as count FROM arqueos_caja WHERE id_restaurante = $1 AND estado = 'abierto'",
            [idRestaurante]
        );
        const countArqueos = parseInt(arqueo.rows[0].count);
        verificaciones.arqueo = countArqueos > 0;
        detalles.arqueos = countArqueos;
        logger.debug(`  ✓ Arqueos abiertos: ${countArqueos}`);
        
        if (countArqueos === 0) {
            advertencias.push('No se creó arqueo inicial');
        }
        
        // Determinar si todo está OK
        const exitoso = Object.values(verificaciones).every(v => v === true);
        
        return {
            exitoso,
            verificaciones,
            detalles,
            advertencias
        };
        
    } catch (error) {
        logger.error(`Error en verificación: ${error.message}`);
        return {
            exitoso: false,
            error: error.message,
            verificaciones,
            advertencias
        };
    }
}

module.exports = {
    verificarCreacion
};

