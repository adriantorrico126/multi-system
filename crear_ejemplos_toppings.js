/**
 * =====================================================
 * HELPER: CREAR EJEMPLOS DE TOPPINGS
 * =====================================================
 * Sistema: SITEMM POS
 * Descripción: Crea configuraciones de ejemplo para diferentes tipos de productos
 * =====================================================
 */

const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: '6951230Anacleta',
    host: 'localhost',
    port: 5432,
    database: 'sistempos'
});

// Colores
const colors = {
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

/**
 * Configuración de ejemplo para PIZZAS
 */
async function crearEjemploPizza(idProducto, idRestaurante) {
    log('\n🍕 Configurando ejemplo para PIZZA...', 'cyan');
    
    try {
        // Crear grupos
        const grupos = [
            { nombre: 'Tamaño', desc: 'Elige el tamaño de tu pizza', tipo: 'seleccion_unica', min: 1, max: 1, obligatorio: true, orden: 1 },
            { nombre: 'Masa', desc: 'Tipo de masa', tipo: 'seleccion_unica', min: 1, max: 1, obligatorio: true, orden: 2 },
            { nombre: 'Ingredientes Extra', desc: 'Agrega ingredientes', tipo: 'seleccion_multiple', min: 0, max: 5, obligatorio: false, orden: 3 },
            { nombre: 'Salsas', desc: 'Salsas adicionales', tipo: 'seleccion_multiple', min: 0, max: 3, obligatorio: false, orden: 4 }
        ];
        
        for (const grupo of grupos) {
            const result = await pool.query(`
                INSERT INTO grupos_modificadores (nombre, descripcion, tipo, min_selecciones, max_selecciones, es_obligatorio, orden_display, id_restaurante)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id_grupo_modificador
            `, [grupo.nombre, grupo.desc, grupo.tipo, grupo.min, grupo.max, grupo.obligatorio, grupo.orden, idRestaurante]);
            
            const idGrupo = result.rows[0].id_grupo_modificador;
            log(`  ✓ Grupo creado: ${grupo.nombre} (ID: ${idGrupo})`, 'green');
            
            // Crear modificadores según el grupo
            let modificadores = [];
            
            if (grupo.nombre === 'Tamaño') {
                modificadores = [
                    { nombre: 'Personal (25cm)', precio: 0, desc: 'Para 1 persona', tipo: 'tamaño', orden: 1 },
                    { nombre: 'Mediana (30cm)', precio: 5, desc: 'Para 2 personas', tipo: 'tamaño', orden: 2 },
                    { nombre: 'Familiar (40cm)', precio: 10, desc: 'Para 4 personas', tipo: 'tamaño', orden: 3 }
                ];
            } else if (grupo.nombre === 'Masa') {
                modificadores = [
                    { nombre: 'Tradicional', precio: 0, desc: 'Masa clásica', tipo: 'masa', orden: 1 },
                    { nombre: 'Delgada', precio: 0, desc: 'Crujiente', tipo: 'masa', orden: 2 },
                    { nombre: 'Integral', precio: 2, desc: 'Con fibra', tipo: 'masa', orden: 3 },
                    { nombre: 'Sin Gluten', precio: 5, desc: 'Para celíacos', tipo: 'masa', orden: 4 }
                ];
            } else if (grupo.nombre === 'Ingredientes Extra') {
                modificadores = [
                    { nombre: 'Champiñones', precio: 2, desc: 'Frescos', tipo: 'ingrediente', stock: 50, orden: 1 },
                    { nombre: 'Aceitunas', precio: 1.5, desc: 'Negras', tipo: 'ingrediente', stock: 30, orden: 2 },
                    { nombre: 'Pimientos', precio: 1.5, desc: 'Dulces', tipo: 'ingrediente', stock: 40, orden: 3 },
                    { nombre: 'Cebolla', precio: 1, desc: 'Morada', tipo: 'ingrediente', stock: 60, orden: 4 }
                ];
            } else if (grupo.nombre === 'Salsas') {
                modificadores = [
                    { nombre: 'Salsa BBQ', precio: 1, desc: 'Barbacoa', tipo: 'salsa', orden: 1 },
                    { nombre: 'Salsa Picante', precio: 0.5, desc: 'Extra hot', tipo: 'salsa', orden: 2 },
                    { nombre: 'Salsa de Ajo', precio: 1, desc: 'Cremosa', tipo: 'salsa', orden: 3 }
                ];
            }
            
            // Insertar modificadores
            for (const mod of modificadores) {
                await pool.query(`
                    INSERT INTO productos_modificadores 
                    (id_producto, nombre_modificador, precio_extra, tipo_modificador, id_grupo_modificador, 
                     descripcion, stock_disponible, controlar_stock, orden_display, id_restaurante, activo)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
                `, [idProducto, mod.nombre, mod.precio, mod.tipo, idGrupo, mod.desc, 
                    mod.stock || null, !!mod.stock, mod.orden, idRestaurante]);
                
                log(`    - ${mod.nombre} (+Bs ${mod.precio})`, 'green');
            }
            
            // Asociar grupo al producto
            await pool.query(`
                INSERT INTO productos_grupos_modificadores (id_producto, id_grupo_modificador, orden_display, es_obligatorio)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id_producto, id_grupo_modificador) DO NOTHING
            `, [idProducto, idGrupo, grupo.orden, grupo.obligatorio]);
        }
        
        log('\n✅ Ejemplo de PIZZA configurado completamente', 'green');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

/**
 * Configuración de ejemplo para HAMBURGUESAS
 */
async function crearEjemploHamburguesa(idProducto, idRestaurante) {
    log('\n🍔 Configurando ejemplo para HAMBURGUESA...', 'cyan');
    
    try {
        const grupos = [
            { nombre: 'Punto de Cocción', tipo: 'seleccion_unica', min: 1, max: 1, obligatorio: true, orden: 1 },
            { nombre: 'Pan', tipo: 'seleccion_unica', min: 1, max: 1, obligatorio: true, orden: 2 },
            { nombre: 'Extras', tipo: 'seleccion_multiple', min: 0, max: 5, obligatorio: false, orden: 3 }
        ];
        
        for (const grupo of grupos) {
            const result = await pool.query(`
                INSERT INTO grupos_modificadores (nombre, descripcion, tipo, min_selecciones, max_selecciones, es_obligatorio, orden_display, id_restaurante)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id_grupo_modificador
            `, [grupo.nombre, `Selecciona ${grupo.nombre.toLowerCase()}`, grupo.tipo, grupo.min, grupo.max, grupo.obligatorio, grupo.orden, idRestaurante]);
            
            const idGrupo = result.rows[0].id_grupo_modificador;
            log(`  ✓ Grupo: ${grupo.nombre}`, 'green');
            
            let modificadores = [];
            
            if (grupo.nombre === 'Punto de Cocción') {
                modificadores = [
                    { nombre: 'Término Medio', precio: 0 },
                    { nombre: 'Bien Cocida', precio: 0 },
                    { nombre: 'Jugosa', precio: 0 }
                ];
            } else if (grupo.nombre === 'Pan') {
                modificadores = [
                    { nombre: 'Pan Blanco', precio: 0 },
                    { nombre: 'Pan Integral', precio: 1 },
                    { nombre: 'Pan Sin Gluten', precio: 3 }
                ];
            } else if (grupo.nombre === 'Extras') {
                modificadores = [
                    { nombre: 'Queso Extra', precio: 2 },
                    { nombre: 'Tocino', precio: 3 },
                    { nombre: 'Aguacate', precio: 2.5 },
                    { nombre: 'Huevo', precio: 2 },
                    { nombre: 'Jalapeños', precio: 1 }
                ];
            }
            
            for (const mod of modificadores) {
                await pool.query(`
                    INSERT INTO productos_modificadores 
                    (id_producto, nombre_modificador, precio_extra, tipo_modificador, id_grupo_modificador, id_restaurante, activo)
                    VALUES ($1, $2, $3, $4, $5, $6, true)
                `, [idProducto, mod.nombre, mod.precio, 'complemento', idGrupo, idRestaurante]);
                
                log(`    - ${mod.nombre} (+Bs ${mod.precio})`, 'green');
            }
            
            await pool.query(`
                INSERT INTO productos_grupos_modificadores (id_producto, id_grupo_modificador, orden_display, es_obligatorio)
                VALUES ($1, $2, $3, $4)
            `, [idProducto, idGrupo, grupo.orden, grupo.obligatorio]);
        }
        
        log('\n✅ Ejemplo de HAMBURGUESA configurado', 'green');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

/**
 * Configuración de ejemplo para BEBIDAS
 */
async function crearEjemploBebida(idProducto, idRestaurante) {
    log('\n🥤 Configurando ejemplo para BEBIDA...', 'cyan');
    
    try {
        // Crear grupo de tamaño
        const grupoResult = await pool.query(`
            INSERT INTO grupos_modificadores (nombre, descripcion, tipo, min_selecciones, max_selecciones, es_obligatorio, orden_display, id_restaurante)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id_grupo_modificador
        `, ['Tamaño de Bebida', 'Elige el tamaño', 'seleccion_unica', 1, 1, true, 1, idRestaurante]);
        
        const idGrupo = grupoResult.rows[0].id_grupo_modificador;
        log(`  ✓ Grupo: Tamaño de Bebida`, 'green');
        
        const modificadores = [
            { nombre: 'Pequeño (300ml)', precio: 0 },
            { nombre: 'Mediano (500ml)', precio: 2 },
            { nombre: 'Grande (700ml)', precio: 4 }
        ];
        
        for (const mod of modificadores) {
            await pool.query(`
                INSERT INTO productos_modificadores 
                (id_producto, nombre_modificador, precio_extra, tipo_modificador, id_grupo_modificador, id_restaurante, activo)
                VALUES ($1, $2, $3, $4, $5, $6, true)
            `, [idProducto, mod.nombre, mod.precio, 'tamaño', idGrupo, idRestaurante]);
            
            log(`    - ${mod.nombre} (+Bs ${mod.precio})`, 'green');
        }
        
        await pool.query(`
            INSERT INTO productos_grupos_modificadores (id_producto, id_grupo_modificador, orden_display, es_obligatorio)
            VALUES ($1, $2, $3, $4)
        `, [idProducto, idGrupo, 1, true]);
        
        log('\n✅ Ejemplo de BEBIDA configurado', 'green');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

/**
 * Función principal
 */
async function main() {
    log('\n' + '='.repeat(60), 'cyan');
    log('CREAR EJEMPLOS DE TOPPINGS', 'cyan');
    log('='.repeat(60), 'cyan');
    
    try {
        // Obtener restaurante
        const restResult = await pool.query('SELECT id_restaurante FROM restaurantes LIMIT 1');
        if (restResult.rows.length === 0) {
            console.error('No hay restaurantes en la BD');
            return;
        }
        const idRestaurante = restResult.rows[0].id_restaurante;
        log(`\nRestaurante ID: ${idRestaurante}`, 'yellow');
        
        // Obtener algunos productos
        const productos = await pool.query(`
            SELECT id_producto, nombre 
            FROM productos 
            WHERE id_restaurante = $1 AND activo = true 
            ORDER BY nombre 
            LIMIT 10
        `, [idRestaurante]);
        
        if (productos.rows.length === 0) {
            console.error('No hay productos en la BD');
            return;
        }
        
        log('\n📋 Productos disponibles:', 'cyan');
        productos.rows.forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.nombre} (ID: ${p.id_producto})`);
        });
        
        console.log('\n¿Qué quieres configurar?');
        console.log('1. Pizza (completa)');
        console.log('2. Hamburguesa (completa)');
        console.log('3. Bebida (tamaños)');
        console.log('\nPor defecto, configuraremos el primer producto como pizza de ejemplo...\n');
        
        // Configurar ejemplo automáticamente
        const primerProducto = productos.rows[0];
        
        // Decisión: si el nombre incluye "pizza", usar config de pizza
        if (primerProducto.nombre.toLowerCase().includes('pizza')) {
            await crearEjemploPizza(primerProducto.id_producto, idRestaurante);
        } else if (primerProducto.nombre.toLowerCase().includes('hamburgues')) {
            await crearEjemploHamburguesa(primerProducto.id_producto, idRestaurante);
        } else if (primerProducto.nombre.toLowerCase().includes('bebida') || 
                   primerProducto.nombre.toLowerCase().includes('jugo') ||
                   primerProducto.nombre.toLowerCase().includes('refresco')) {
            await crearEjemploBebida(primerProducto.id_producto, idRestaurante);
        } else {
            // Por defecto, configurar como pizza
            log('\n⚠️  Producto no identificado, usando configuración de PIZZA como ejemplo', 'yellow');
            await crearEjemploPizza(primerProducto.id_producto, idRestaurante);
        }
        
        // Mostrar resultado
        log('\n' + '='.repeat(60), 'cyan');
        log('CONFIGURACIÓN COMPLETADA', 'green');
        log('='.repeat(60), 'cyan');
        
        const resultado = await pool.query(`
            SELECT * FROM vista_grupos_por_producto 
            WHERE id_producto = $1
        `, [primerProducto.id_producto]);
        
        console.log(`\nProducto configurado: ${primerProducto.nombre}`);
        console.log(`Grupos creados: ${resultado.rows.length}`);
        
        resultado.rows.forEach(r => {
            console.log(`\n  📁 ${r.grupo_nombre}`);
            console.log(`     Tipo: ${r.grupo_tipo}`);
            console.log(`     Obligatorio: ${r.es_obligatorio ? 'Sí' : 'No'}`);
            console.log(`     Modificadores: ${r.total_modificadores}`);
        });
        
        log('\n💡 Próximos pasos:', 'cyan');
        console.log('1. Inicia el backend: cd sistema-pos/vegetarian_restaurant_backend && npm start');
        console.log('2. Inicia el frontend: cd sistema-pos/menta-resto-system-pro && npm run dev');
        console.log(`3. Busca el producto "${primerProducto.nombre}" en el POS`);
        console.log('4. Haz clic en el botón "Editar" (✏️)');
        console.log('5. ¡Verás el nuevo modal profesional!');
        
        log('\n✨ Sistema listo para usar', 'green');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

main();

