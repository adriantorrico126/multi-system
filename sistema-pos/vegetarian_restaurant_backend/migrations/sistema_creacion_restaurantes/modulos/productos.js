/**
 * Módulo de creación de categorías y productos
 */

const { logger } = require('../utils/logger');

/**
 * Crear categorías y productos
 */
async function crearCategoriasYProductos(client, idRestaurante, productosData) {
    logger.debug('Procesando categorías y productos...');
    
    if (!productosData || productosData.length === 0) {
        logger.debug('No se proporcionaron productos, omitiendo...');
        return { categorias: [], productos: [] };
    }
    
    const categoriasCreadas = [];
    const productosCreados = [];
    const categoriasMap = new Map(); // Para evitar duplicados
    
    // Agrupar productos por categoría
    const productosPorCategoria = {};
    
    for (const item of productosData) {
        if (!item.categoria) {
            throw new Error(`El producto "${item.nombre}" no tiene categoría asignada`);
        }
        
        if (!productosPorCategoria[item.categoria]) {
            productosPorCategoria[item.categoria] = [];
        }
        
        productosPorCategoria[item.categoria].push(item);
    }
    
    logger.data('Categorías a crear', Object.keys(productosPorCategoria).length);
    logger.data('Total productos', productosData.length);
    
    // Crear categorías y productos
    for (const [nombreCategoria, productos] of Object.entries(productosPorCategoria)) {
        // Crear categoría si no existe
        if (!categoriasMap.has(nombreCategoria)) {
            logger.debug(`  📁 Creando categoría: ${nombreCategoria}`);
            
            const categoriaQuery = `
                INSERT INTO categorias (nombre, activo, id_restaurante)
                VALUES ($1, $2, $3)
                RETURNING id_categoria, nombre
            `;
            
            const categoriaResult = await client.query(categoriaQuery, [
                nombreCategoria.trim(),
                true,
                idRestaurante
            ]);
            
            const categoria = categoriaResult.rows[0];
            categoriasMap.set(nombreCategoria, categoria.id_categoria);
            categoriasCreadas.push(categoria);
        }
        
        const idCategoria = categoriasMap.get(nombreCategoria);
        
        // Crear productos de esta categoría
        for (const producto of productos) {
            logger.debug(`    🍕 Creando producto: ${producto.nombre}`);
            
            const productoQuery = `
                INSERT INTO productos (
                    nombre,
                    precio,
                    id_categoria,
                    stock_actual,
                    activo,
                    id_restaurante
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id_producto, nombre, precio
            `;
            
            const valores = [
                producto.nombre.trim(),
                producto.precio || 0,
                idCategoria,
                producto.stock || 0,
                true,
                idRestaurante
            ];
            
            const productoResult = await client.query(productoQuery, valores);
            productosCreados.push(productoResult.rows[0]);
        }
    }
    
    return {
        categorias: categoriasCreadas,
        productos: productosCreados
    };
}

/**
 * Función auxiliar para crear productos básicos de ejemplo
 */
function obtenerProductosBasicos() {
    return [
        // Bebidas
        { categoria: 'Bebidas', nombre: 'Agua Mineral', precio: 5.00, stock: 100 },
        { categoria: 'Bebidas', nombre: 'Refresco', precio: 8.00, stock: 50 },
        { categoria: 'Bebidas', nombre: 'Jugo Natural', precio: 12.00, stock: 30 },
        
        // Platos principales
        { categoria: 'Platos Principales', nombre: 'Plato del Día', precio: 25.00, stock: 0 },
        { categoria: 'Platos Principales', nombre: 'Menú Ejecutivo', precio: 30.00, stock: 0 },
        
        // Postres
        { categoria: 'Postres', nombre: 'Helado', precio: 10.00, stock: 20 },
        { categoria: 'Postres', nombre: 'Torta', precio: 15.00, stock: 10 }
    ];
}

module.exports = {
    crearCategoriasYProductos,
    obtenerProductosBasicos
};

