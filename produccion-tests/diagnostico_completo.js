const { Client } = require('pg');
const fs = require('fs');

// Configuración de la base de datos de producción
const PRODUCTION_CONFIG = {
    host: process.env.PROD_DB_HOST || 'db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com',
    port: process.env.PROD_DB_PORT || 25060,
    user: process.env.PROD_DB_USER || 'doadmin',
    password: process.env.PROD_DB_PASSWORD || 'placeholder_password',
    database: process.env.PROD_DB_NAME || 'defaultdb',
    ssl: {
        rejectUnauthorized: false
    }
};

class ProductionDiagnostico {
    constructor() {
        this.client = null;
        this.resultados = {};
    }

    async conectar() {
        try {
            this.client = new Client(PRODUCTION_CONFIG);
            await this.client.connect();
            console.log('✅ Conectado a base de datos de producción');
            return true;
        } catch (error) {
            console.error('❌ Error conectando a la BD de producción:', error.message);
            return false;
        }
    }

    async desconectar() {
        if (this.client) {
            await this.client.end();
            console.log('🔌 Desconectado de la base de datos');
        }
    }

    async ejecutarConsulta(sql, nombre = 'Consulta') {
        try {
            console.log(`\n🔍 Ejecutando: ${nombre}`);
            const resultado = await this.client.query(sql);
            console.log(`✅ Completado: ${resultado.rows.length} filas`);
            return resultado.rows;
        } catch (error) {
            console.error(`❌ Error en ${nombre}:`, error.message);
            return [];
        }
    }

    async diagnosticoRestaurant10() {
        if (!this.client) {
            console.error('❌ No se pudo conectar a la base de datos');
            return;
        }

        console.log('\n🚀 INICIANDO DIAGNÓSTICO COMPLETO DEL RESTAURANTE ID 10');
        console.log('=' * 80);

        // 1. Verificación básica del restaurante
        const restaurante = await this.ejecutarConsulta(`
            SELECT 
                id_restaurante,
                nombre,
                ciudad,
                direccion,
                telefono,
                email,
                activo,
                created_at,
                updated_at
            FROM restaurantes 
            WHERE id_restaurante = 10
        `, 'Información del Restaurante');

        this.resultados.restaurante = restaurante;

        // 2. Verificación de suscripciones activas
        const suscripciones = await this.ejecutarConsulta(`
            SELECT 
                s.id_suscripcion,
                s.id_restaurante,
                s.id_plan,
                s.estado,
                s.fecha_inicio,
                s.fecha_fin,
                s.precio_pagado,
                s.created_at,
                s.updated_at,
                p.nombre as plan_nombre,
                p.tipo as plan_tipo,
                p.precio as plan_precio,
                p.max_sucursales,
                p.max_usuarios,
                p.max_productos,
                p.max_transacciones_mes,
                p.almacenamiento_gb
            FROM suscripciones s
            JOIN planes p ON s.id_plan = p.id_plan
            WHERE s.id_restaurante = 10
            ORDER BY s.created_at DESC
        `, 'Suscripciones Activas');

        this.resultados.suscripciones = suscripciones;

        // 3. Verificación de estado general del sistema
        const estadoGeneral = await this.ejecutarConsulta(`
            WITH restaurant_summary AS (
                SELECT 
                    r.id_restaurante,
                    r.nombre as restaurante_nombre,
                    s.estado as suscripcion_estado,
                    s.fecha_inicio,
                    s.fecha_fin,
                    p.nombre as plan_nombre,
                    p.tipo as plan_tipo,
                    p.precio as plan_precio,
                    CASE 
                        WHEN p.tipo = 'enterprise' THEN 'ENTERPRISE'
                        WHEN p.tipo = 'professional' THEN 'PROFESIONAL'
                        WHEN p.tipo = 'basic' THEN 'BÁSICO'
                        ELSE 'DESCONOCIDO'
                    END as nivel_plan,
                    (SELECT COUNT(*) FROM vendedores WHERE id_restaurante = r.id_restaurante AND activo = true) as usuarios_activos,
                    (SELECT COUNT(*) FROM sucursales WHERE id_restaurante = r.id_restaurante AND activo = true) as sucursales_activas
                FROM restaurantes r
                LEFT JOIN suscripciones s ON r.id_restaurante = s.id_restaurante AND s.estado = 'activa'
                LEFT JOIN planes p ON s.id_plan = p.id_plan
                WHERE r.id_restaurante = 10
            )
            SELECT 
                restaurante_nombre,
                nivel_plan,
                suscripcion_estado,
                fecha_inicio,
                fecha_fin,
                plan_precio,
                usuarios_activos,
                sucursales_activas,
                CASE 
                    WHEN suscripcion_estado = 'activa' AND fecha_fin > CURRENT_DATE THEN '✅ ACTIVO'
                    WHEN suscripcion_estado = 'activa' AND fecha_fin <= CURRENT_DATE THEN '⚠️ EXPIRÓ'
                    WHEN suscripcion_estado IS NULL THEN '❌ SIN SUSCRIPCIÓN'
                    ELSE '❌ INACTIVO'
                END as estado_sistema
            FROM restaurant_summary
        `, 'Estado General del Sistema');

        this.resultados.estadoGeneral = estadoGeneral;

        // 4. Diagnóstico específico del problema
        const diagnosticoFinal = await this.ejecutarConsulta(`
            SELECT 
                'RESUMEN DE DIAGNÓSTICO' as titulo,
                
                CASE 
                    WHEN s.estado = 'activa' AND p.tipo = 'enterprise' AND s.fecha_fin > CURRENT_DATE 
                    THEN '✅ PLAN ENTERPRISE ACTIVO - SIN PROBLEMAS DE PLAN'
                    
                    WHEN s.estado = 'activa' AND p.tipo = 'basic' 
                    THEN '⚠️ PLAN BÁSICO ACTIVO - RESTRICCIONES ESPERADAS'
                    
                    WHEN s.estado = 'activa' AND p.tipo = 'enterprise' AND s.fecha_fin <= CURRENT_DATE
                    THEN '🚨 PLAN ENTERPRISE EXPIRADO - ACTUALIZAR SUSCRIPCIÓN'
                    
                    WHEN s.estado IS NULL 
                    THEN '❌ SIN SUSCRIPCIÓN VÁLIDA - ASIGNAR PLAN'
                    
                    ELSE '⚠️ ESTADO CONFUSO - REVISAR MANUALMENTE'
                END as diagnostico,
                
                r.nombre as restaurante,
                p.nombre as plan,
                p.tipo as tipo_plan,
                s.estado as estado_suscripcion,
                s.fecha_fin,
                
                CASE 
                    WHEN s.fecha_fin > CURRENT_DATE THEN 'VÁLIDA'
                    ELSE 'EXPIRÓ'
                END as vigencia
                
            FROM restaurantes r
            LEFT JOIN suscripciones s ON r.id_restaurante = s.id_restaurante AND s.estado = 'activa'
            LEFT JOIN planes p ON s.id_plan = p.id_plan
            WHERE r.id_restaurante = 10
        `, 'Diagnóstico Final');

        this.resultados.diagnosticoFinal = diagnosticoFinal;

        // 5. Verificación de datos para el frontend
        const datosFrontend = await this.ejecutarConsulta(`
            SELECT 
                json_build_object(
                    'restaurante', json_build_object(
                        'id', r.id_restaurante,
                        'nombre', r.nombre,
                        'ciudad', r.ciudad
                    ),
                    'plan', json_build_object(
                        'id_plan', p.id_plan,
                        'nombre', p.nombre,
                        'tipo', p.tipo,
                        'precio', p.precio
                    ),
                    'suscripcion', json_build_object(
                        'estado', s.estado,
                        'fecha_inicio', s.fecha_inicio,
                        'fecha_fin', s.fecha_fin
                    )
                ) as datos_frontend_api
            FROM restaurantes r
            LEFT JOIN suscripciones s ON r.id_restaurante = s.id_restaurante AND s.estado = 'activa'
            LEFT JOIN planes p ON s.id_plan = p.id_plan
            WHERE r.id_restaurante = 10
        `, 'Datos para Frontend');

        this.resultados.datosFrontend = datosFrontend;

        // 6. Verificación de contadores de uso
        const contadoresUso = await this.ejecutarConsulta(`
            SELECT 
                cu.recurso,
                cu.uso_actual,
                cu.limite_plan,
                ROUND((cu.uso_actual::DECIMAL / NULLIF(cu.limite_plan, 0)) * 100, 2) as porcentaje_uso,
                cu.fecha_medicion,
                p.nombre as plan_nombre,
                p.tipo as plan_tipo
            FROM contadores_uso cu
            JOIN planes p ON cu.id_plan = p.id_plan
            WHERE cu.id_restaurante = 10
            ORDER BY cu.recurso
        `, 'Contadores de Uso');

        this.resultados.contadoresUso = contadoresUso;

        return this.resultados;
    }

    async generarReporte() {
        const reporte = {
            timestamp: new Date().toISOString(),
            restaurant_id: 10,
            resultados: this.resultados,
            conclusiones: this.analizarResultados(),
            recomendaciones: this.generarRecomendaciones()
        };

        // Guardar reporte en archivo
        const nombreArchivo = `reporte_restaurant_10_${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(nombreArchivo, JSON.stringify(reporte, null, 2));
        
        console.log(`\n📄 Reporte guardado: ${nombreArchivo}`);
        return reporte;
    }

    analizarResultados() {
        const conclusiones = [];

        // Analizar restaurante
        if (this.resultados.restaurante && this.resultados.restaurante.length > 0) {
            const restaurante = this.resultados.restaurante[0];
            conclusiones.push(`✅ Restaurante encontrado: ${restaurante.nombre} (${restaurante.ciudad})`);
        } else {
            conclusiones.push('❌ Restaurante ID 10 no encontrado en la base de datos');
        }

        // Analizar suscripciones
        if (this.resultados.suscripciones && this.resultados.suscripciones.length > 0) {
            const suscripcionActiva = this.resultados.suscripciones.find(s => s.estado === 'activa');
            if (suscripcionActiva) {
                conclusiones.push(`✅ Suscripción activa: ${suscripcionActiva.plan_nombre} (${suscripcionActiva.plan_tipo})`);
                if (suscripcionActiva.fecha_fin < new Date()) {
                    conclusiones.push(`⚠️ Suscripción expiró: ${suscripcionActiva.fecha_fin}`);
                }
            } else {
                conclusiones.push('❌ No hay suscripciones activas');
            }
        } else {
            conclusiones.push('❌ No se encontraron suscripciones para este restaurante');
        }

        // Analizar diagnóstico final
        if (this.resultados.diagnosticoFinal && this.resultados.diagnosticoFinal.length > 0) {
            const diagnostico = this.resultados.diagnosticoFinal[0];
            conclusiones.push(`📋 Diagnóstico: ${diagnostico.diagnostico}`);
        }

        return conclusiones;
    }

    generarRecomendaciones() {
        const recomendaciones = [];

        // Recomendación básica
        recomendaciones.push('🔧 PASOS RECOMENDADOS:');
        recomendaciones.push('1. Revisar resultados de la consulta "Diagnóstico Final"');
        recomendaciones.push('2. Verificar que authController.js incluya datos de restaurante en refreshToken');
        recomendaciones.push('3. Verificar que AuthContext.tsx sincronice con localStorage');
        recomendaciones.push('4. Comprobar headers HTTP en producción');
        recomendaciones.push('5. Limpiar cache del navegador si es necesario');

        return recomendaciones;
    }
}

async function ejecutarDiagnostico() {
    const diagnostico = new ProductionDiagnostico();
    
    try {
        const conectado = await diagnostico.conectar();
        if (!conectado) {
            console.error('❌ No se pudo conectar a la base de datos');
            return;
        }

        const resultados = await diagnostico.diagnosticoRestaurant10();
        const reporte = await diagnostico.generarReporte();

        console.log('\n🎯 DIAGNÓSTICO COMPLETADO');
        console.log('📊 Resultados:');
        console.log(JSON.stringify(reporte, null, 2));

    } catch (error) {
        console.error('❌ Error durante el diagnóstico:', error);
    } finally {
        await diagnostico.desconectar();
    }
}

// Ejecutar diagnóstico si se llama directamente
if (require.main === module) {
    ejecutarDiagnostico();
}

module.exports = ProductionDiagnostico;
