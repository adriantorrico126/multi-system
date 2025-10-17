/**
 * Módulo de creación de mesas
 */

const { logger } = require('../utils/logger');

/**
 * Crear mesas para la sucursal
 */
async function crearMesas(client, idRestaurante, idSucursal, datosMesas) {
    logger.debug('Creando mesas...');
    
    const cantidad = datosMesas.cantidad || 10;
    const capacidadDefault = datosMesas.capacidad || 4;
    const mesasPersonalizadas = datosMesas.mesas || []; // Mesas con configuración específica
    
    const mesasCreadas = [];
    
    // Si hay mesas personalizadas, usarlas
    if (mesasPersonalizadas.length > 0) {
        logger.data('Mesas personalizadas', mesasPersonalizadas.length);
        
        for (const mesa of mesasPersonalizadas) {
            const query = `
                INSERT INTO mesas (
                    numero,
                    capacidad,
                    estado,
                    id_sucursal,
                    id_restaurante
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING id_mesa, numero, capacidad, estado
            `;
            
            const valores = [
                mesa.numero || mesasCreadas.length + 1,
                mesa.capacidad || capacidadDefault,
                'libre',
                idSucursal,
                idRestaurante
            ];
            
            const resultado = await client.query(query, valores);
            mesasCreadas.push(resultado.rows[0]);
            
            logger.debug(`  🪑 Mesa ${resultado.rows[0].numero} - Capacidad: ${resultado.rows[0].capacidad}`);
        }
    } else {
        // Crear mesas estándar
        logger.data('Mesas a crear', cantidad);
        logger.data('Capacidad por defecto', capacidadDefault);
        
        for (let i = 1; i <= cantidad; i++) {
            const query = `
                INSERT INTO mesas (
                    numero,
                    capacidad,
                    estado,
                    id_sucursal,
                    id_restaurante
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING id_mesa, numero, capacidad, estado
            `;
            
            const valores = [
                i,
                capacidadDefault,
                'libre',
                idSucursal,
                idRestaurante
            ];
            
            const resultado = await client.query(query, valores);
            mesasCreadas.push(resultado.rows[0]);
        }
        
        logger.debug(`  🪑 Creadas ${cantidad} mesas con capacidad ${capacidadDefault}`);
    }
    
    return mesasCreadas;
}

module.exports = {
    crearMesas
};

