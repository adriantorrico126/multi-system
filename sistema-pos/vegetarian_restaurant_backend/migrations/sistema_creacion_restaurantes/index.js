/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SISTEMA AVANZADO DE CREACIÓN DE RESTAURANTES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sistema completo para crear nuevos restaurantes con:
 * ✅ Validaciones exhaustivas
 * ✅ Manejo robusto de errores
 * ✅ Logs detallados
 * ✅ Rollback automático en caso de error
 * ✅ Verificación post-creación
 * ✅ Plantillas predefinidas
 * 
 * Autor: Sistema POS - Menta Resto
 * Fecha: Octubre 2025
 */

const pool = require('../../src/config/db');
const bcrypt = require('bcryptjs');
const { crearRestaurante } = require('./modulos/restaurante');
const { crearSucursal } = require('./modulos/sucursal');
const { crearAdministrador } = require('./modulos/administrador');
const { crearSuscripcion } = require('./modulos/suscripcion');
const { crearContadoresUso } = require('./modulos/contadores');
const { crearCategoriasYProductos } = require('./modulos/productos');
const { crearMesas } = require('./modulos/mesas');
const { crearArqueoInicial } = require('./modulos/arqueo');
const { verificarCreacion } = require('./modulos/verificacion');
const { logger } = require('./utils/logger');
const { plantillas } = require('./plantillas/index');

/**
 * Función principal para crear un restaurante completo
 */
async function crearRestauranteCompleto(datos, opciones = {}) {
    const client = await pool.connect();
    const startTime = Date.now();
    
    try {
        logger.info('═══════════════════════════════════════════════════════════════');
        logger.info('🚀 INICIANDO CREACIÓN DE NUEVO RESTAURANTE');
        logger.info('═══════════════════════════════════════════════════════════════');
        logger.info(`📋 Restaurante: ${datos.restaurante.nombre}`);
        logger.info(`🏢 Tipo: ${datos.tipo || 'personalizado'}`);
        logger.info(`🌍 Entorno: ${opciones.ambiente || 'local'}`);
        logger.info('───────────────────────────────────────────────────────────────');
        
        // Iniciar transacción
        await client.query('BEGIN');
        logger.success('✅ Transacción iniciada');
        
        const resultado = {
            restaurante: null,
            sucursal: null,
            administrador: null,
            suscripcion: null,
            contadores: null,
            categorias: [],
            productos: [],
            mesas: [],
            arqueo: null
        };
        
        // 1. Crear restaurante base
        logger.step('PASO 1/8', 'Creando restaurante base');
        resultado.restaurante = await crearRestaurante(client, datos.restaurante);
        logger.success(`✅ Restaurante creado: ID ${resultado.restaurante.id_restaurante}`);
        
        // 2. Crear sucursal principal
        logger.step('PASO 2/8', 'Creando sucursal principal');
        resultado.sucursal = await crearSucursal(
            client, 
            resultado.restaurante.id_restaurante,
            datos.sucursal
        );
        logger.success(`✅ Sucursal creada: ID ${resultado.sucursal.id_sucursal}`);
        
        // 3. Crear administrador
        logger.step('PASO 3/8', 'Creando usuario administrador');
        resultado.administrador = await crearAdministrador(
            client,
            resultado.restaurante.id_restaurante,
            resultado.sucursal.id_sucursal,
            datos.administrador
        );
        logger.success(`✅ Administrador creado: ID ${resultado.administrador.id_vendedor}`);
        
        // 4. Crear suscripción y asignar plan
        logger.step('PASO 4/8', 'Configurando plan y suscripción');
        resultado.suscripcion = await crearSuscripcion(
            client,
            resultado.restaurante.id_restaurante,
            datos.plan || { id_plan: 3 } // Plan Avanzado por defecto
        );
        logger.success(`✅ Suscripción creada: Plan ID ${resultado.suscripcion.id_plan}`);
        
        // 5. Crear contadores de uso
        logger.step('PASO 5/8', 'Inicializando contadores de uso');
        resultado.contadores = await crearContadoresUso(
            client,
            resultado.restaurante.id_restaurante,
            resultado.suscripcion.id_plan
        );
        logger.success(`✅ Contadores creados: ${resultado.contadores.length} recursos`);
        
        // 6. Crear categorías y productos
        logger.step('PASO 6/8', 'Creando categorías y productos');
        const productosData = await crearCategoriasYProductos(
            client,
            resultado.restaurante.id_restaurante,
            datos.productos || []
        );
        resultado.categorias = productosData.categorias;
        resultado.productos = productosData.productos;
        logger.success(`✅ ${resultado.categorias.length} categorías, ${resultado.productos.length} productos creados`);
        
        // 7. Crear mesas
        logger.step('PASO 7/8', 'Creando mesas');
        resultado.mesas = await crearMesas(
            client,
            resultado.restaurante.id_restaurante,
            resultado.sucursal.id_sucursal,
            datos.mesas || { cantidad: 10, capacidad: 4 }
        );
        logger.success(`✅ ${resultado.mesas.length} mesas creadas`);
        
        // 8. Crear arqueo inicial
        logger.step('PASO 8/8', 'Inicializando arqueo de caja');
        resultado.arqueo = await crearArqueoInicial(
            client,
            resultado.restaurante.id_restaurante,
            resultado.sucursal.id_sucursal,
            resultado.administrador.id_vendedor
        );
        logger.success(`✅ Arqueo inicial creado: ID ${resultado.arqueo.id_arqueo}`);
        
        // Commit de la transacción
        await client.query('COMMIT');
        logger.success('✅ TRANSACCIÓN CONFIRMADA');
        
        // Verificación post-creación
        logger.info('───────────────────────────────────────────────────────────────');
        logger.info('🔍 VERIFICANDO INTEGRIDAD DE DATOS');
        const verificacion = await verificarCreacion(
            pool,
            resultado.restaurante.id_restaurante
        );
        
        if (verificacion.exitoso) {
            logger.success('✅ VERIFICACIÓN EXITOSA - Todo correcto');
        } else {
            logger.warning('⚠️  VERIFICACIÓN CON ADVERTENCIAS');
            verificacion.advertencias.forEach(adv => logger.warning(`  - ${adv}`));
        }
        
        // Resumen final
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info('═══════════════════════════════════════════════════════════════');
        logger.info('✨ CREACIÓN COMPLETADA EXITOSAMENTE');
        logger.info('═══════════════════════════════════════════════════════════════');
        logger.info(`📊 RESUMEN:`);
        logger.info(`   🏢 Restaurante: ${resultado.restaurante.nombre} (ID: ${resultado.restaurante.id_restaurante})`);
        logger.info(`   🏪 Sucursal: ${resultado.sucursal.nombre} (ID: ${resultado.sucursal.id_sucursal})`);
        logger.info(`   👤 Admin: ${resultado.administrador.username} (ID: ${resultado.administrador.id_vendedor})`);
        logger.info(`   📦 Plan: ${resultado.suscripcion.nombre_plan} (ID: ${resultado.suscripcion.id_plan})`);
        logger.info(`   📁 Categorías: ${resultado.categorias.length}`);
        logger.info(`   🍕 Productos: ${resultado.productos.length}`);
        logger.info(`   🪑 Mesas: ${resultado.mesas.length}`);
        logger.info(`   ⏱️  Tiempo: ${duration}s`);
        logger.info('═══════════════════════════════════════════════════════════════');
        
        return {
            exitoso: true,
            resultado,
            verificacion,
            duracion: duration
        };
        
    } catch (error) {
        // Rollback en caso de error
        await client.query('ROLLBACK');
        logger.error('❌ ERROR EN LA CREACIÓN - ROLLBACK EJECUTADO');
        logger.error(`   Mensaje: ${error.message}`);
        logger.error(`   Stack: ${error.stack}`);
        
        return {
            exitoso: false,
            error: error.message,
            stack: error.stack
        };
        
    } finally {
        client.release();
    }
}

/**
 * Crear restaurante desde plantilla predefinida
 */
async function crearDesdePlantilla(nombrePlantilla, datosPersonalizados = {}) {
    const plantilla = plantillas[nombrePlantilla];
    
    if (!plantilla) {
        logger.error(`❌ Plantilla "${nombrePlantilla}" no encontrada`);
        logger.info(`📋 Plantillas disponibles: ${Object.keys(plantillas).join(', ')}`);
        return { exitoso: false, error: 'Plantilla no encontrada' };
    }
    
    // Combinar plantilla con datos personalizados
    const datos = {
        ...plantilla,
        restaurante: { ...plantilla.restaurante, ...datosPersonalizados.restaurante },
        sucursal: { ...plantilla.sucursal, ...datosPersonalizados.sucursal },
        administrador: { ...plantilla.administrador, ...datosPersonalizados.administrador },
    };
    
    return await crearRestauranteCompleto(datos);
}

module.exports = {
    crearRestauranteCompleto,
    crearDesdePlantilla
};

// Si se ejecuta directamente
if (require.main === module) {
    logger.info('🎯 Ejecuta este módulo importándolo en tu script');
    logger.info('📖 Ejemplo de uso:');
    logger.info('');
    logger.info('const { crearRestauranteCompleto } = require("./sistema_creacion_restaurantes");');
    logger.info('');
    logger.info('const datos = {');
    logger.info('  restaurante: { nombre: "Mi Restaurante", ... },');
    logger.info('  sucursal: { nombre: "Sucursal Principal", ... },');
    logger.info('  administrador: { nombre: "Admin", username: "admin", ... }');
    logger.info('};');
    logger.info('');
    logger.info('crearRestauranteCompleto(datos).then(result => console.log(result));');
}

