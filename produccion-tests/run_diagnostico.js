#!/usr/bin/env node

const fs = require('fs');
const { exec, spawn } = require('child_process');
const path = require('path');

console.log('🚀 EJECUTANDO DIAGNÓSTICO COMPLETO PARA RESTAURANTE ID 10');
console.log('=' * 80);

// Verificar si pg está instalado
async function verificarDependencias() {
    return new Promise((resolve) => {
        try {
            require('pg');
            console.log('✅ PostgreSQL driver encontrado');
            resolve(true);
        } catch (error) {
            console.log('⚠️ PostgreSQL driver no encontrado, instalando...');
            
            exec('npm install pg', (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Error instalando PostgreSQL driver:', error.message);
                    resolve(false);
                } else {
                    console.log('✅ PostgreSQL driver instalado correctamente');
                    resolve(true);
                }
            });
        }
    });
}

// Función principal
async function main() {
    try {
        console.log('\n📦 Verificando dependencias...');
        const dependenciasOk = await verificarDependencias();
        
        if (!dependenciasOk) {
            console.error('❌ No se pudieron instalar las dependencias');
            return;
        }

        console.log('\n🔍 Importando módulo de diagnóstico...');
        const ProductionDiagnostico = require('./diagnostico_completo.js');

        console.log('\n🚀 Ejecutando diagnóstico completo...');
        const diagnostico = new ProductionDiagnostico();
        
        const conectado = await diagnostico.conectar();
        if (!conectado) {
            console.error('❌ No se pudo conectar a la base de datos');
            return;
        }

        console.log('\n📊 Ejecutando consultas de diagnóstico...');
        const resultados = await diagnostico.diagnosticoRestaurant10();
        
        console.log('\n📄 Generando reporte...');
        const reporte = await diagnostico.generarReporte();

        console.log('\n🎯 DIAGNÓSTICO COMPLETADO');
        console.log('=' * 80);
        
        // Mostrar resumen
        console.log('\n📋 RESUMEN DE RESULTADOS:');
        
        if (resultados.restaurante && resultados.restaurante.length > 0) {
            console.log(`✅ Restaurante: ${resultados.restaurante[0]?.nombre}`);
        }

        if (resultados.suscripciones && resultados.suscripciones.length > 0) {
            resultados.suscripciones.forEach(s => {
                console.log(`📊 Suscripción ${s.estado}: ${s.plan_nombre} (${s.plan_tipo})`);
            });
        }

        if (resultados.diagnosticoFinal && resultados.diagnosticoFinal.length > 0) {
            console.log(`🎯 Diagnóstico: ${resultados.diagnosticoFinal[0]?.diagnostico}`);
        }

        console.log('\n📁 Reporte completo guardado en archivo JSON');
        console.log('\n🔧 PRÓXIMOS PASOS SUGERIDOS:');
        
        if (resultados.diagnosticoFinal && resultados.diagnosticoFinal.length > 0) {
            const diagnostico = resultados.diagnosticoFinal[0];
            
            if (diagnostico.diagnostico.includes('ENTERPRISE')) {
                console.log('✅ Problema identificado como Enterprise activo - revisar frontend');
                console.log('🔧 Verificar AuthContext y localStorage en navegador');
            } else if (diagnostico.diagnostico.includes('BÁSICO')) {
                console.log('⚠️ Plan básico activo - verificar si debería ser Enterprise');
                console.log('🔧 Actualizar suscripción si es necesario');
            } else {
                console.log('🚨 Estado confuso detected - investigar manualmente');
                console.log('🔧 Revisar tabla suscripciones y planes');
            }
        }

        await diagnostico.desconectar();

    } catch (error) {
        console.error('❌ Error durante el diagnóstico:', error.message);
        process.exit(1);
    }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Error fatal:', error.message);
        process.exit(1);
    });
}

module.exports = main;
