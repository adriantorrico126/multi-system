const { Client } = require('pg');

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

async function diagnosticoReal() {
    const client = new Client(PRODUCTION_CONFIG);
    
    try {
        await client.connect();
        console.log('✅ Conectado a base de datos de producción');
        
        console.log('\n🎯 DIAGNÓSTICO REAL DEL RESTAURANTE ID 10');
        console.log('=' * 60);

        // 1. Información del restaurante
        console.log('\n📊 1. INFORMACIÓN DEL RESTAURANTE:');
        const restaurante = await client.query(`
            SELECT id_restaurante, nombre, ciudad, direccion, telefono, activo
            FROM restaurantes 
            WHERE id_restaurante = 10
        `);
        
        if (restaurante.rows.length > 0) {
            const r = restaurante.rows[0];
            console.log(`✅ Restaurante encontrado:`);
            console.log(`   ID: ${r.id_restaurante}`);
            console.log(`   Nombre: ${r.nombre}`);
            console.log(`   Ciudad: ${r.ciudad}`);
            console.log(`   Activo: ${r.activo}`);
        } else {
            console.log('❌ Restaurante ID 10 no encontrado');
            return;
        }

        // 2. Verificar estructura de tabla planes
        console.log('\n📊 2. ESTRUCTURA DE TABLA PLANES:');
        const estructura_planes = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'planes'
            ORDER BY ordinal_position
        `);
        
        console.log('Columnas disponibles en tabla planes:');
        estructura_planes.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
        });

        // 3. Ver planes disponibles
        console.log('\n📊 3. PLANES DISPONIBLES:');
        const planes = await client.query(`
            SELECT id_plan, nombre, descripcion
            FROM planes 
            ORDER BY id_plan
        `);
        
        planes.rows.forEach(p => {
            console.log(`   ID ${p.id_plan}: ${p.nombre}`);
        });

        // 4. Ver suscripciones del restaurante
        console.log('\n📊 4. SUSCRIPCIONES DEL RESTAURANTE 10:');
        const suscripciones = await client.query(`
            SELECT s.id_suscripcion, s.id_plan, s.estado, s.fecha_inicio, s.fecha_fin,
                   p.nombre as plan_nombre, p.descripcion as plan_descripcion
            FROM suscripciones s
            LEFT JOIN planes p ON s.id_plan = p.id_plan
            WHERE s.id_restaurante = 10
            ORDER BY s.created_at DESC
        `);
        
        if (suscripciones.rows.length > 0) {
            console.log(`📋 Total suscripciones: ${suscripciones.rows.length}`);
            suscripciones.rows.forEach(s => {
                console.log(`   Suscripción ID ${s.id_suscripcion}:`);
                console.log(`     Plan: ${s.plan_nombre} (ID: ${s.id_plan})`);
                console.log(`     Estado: ${s.estado}`);
                console.log(`     Vigencia: ${s.fecha_inicio} a ${s.fecha_fin}`);
            });
        } else {
            console.log('❌ No se encontraron suscripciones para el restaurante 10');
        }

        // 5. Ver usuarios del restaurante
        console.log('\n📊 5. USUARIOS DEL RESTAURANTE 10:');
        const usuarios = await client.query(`
            SELECT v.id_vendedor, v.nombre, v.username, v.email, v.rol, v.activo,
                   s.nombre as sucursal_nombre
            FROM vendedores v
            LEFT JOIN sucursales s ON v.id_sucursal = s.id_sucursal
            WHERE v.id_restaurante = 10
            ORDER BY v.id_vendedor
        `);
        
        if (usuarios.rows.length > 0) {
            console.log(`👥 Total usuarios: ${usuarios.rows.length}`);
            usuarios.rows.forEach(u => {
                console.log(`   ${u.nombre} (@${u.username}) - Rol: ${u.rol} - Activo: ${u.activo}`);
                console.log(`     Sucursal: ${u.sucursal_nombre || 'Sin asignar'}`);
            });
        } else {
            console.log('❌ No se encontraron usuarios para el restaurante 10');
        }

        // 6. Diagnóstico del estado actual
        console.log('\n📊 6. DIAGNÓSTICO DEL ESTADO:');
        const suscripcionActiva = suscripciones.rows.find(s => s.estado === 'activa');
        
        if (suscripcionActiva) {
            const fechaFin = new Date(suscripcionActiva.fecha_fin);
            const hoy = new Date();
            const vigente = fechaFin > hoy;
            
            console.log(`✅ Suscripción activa encontrada:`);
            console.log(`   Plan: ${suscripcionActiva.plan_nombre}`);
            console.log(`   Estado: ${suscripcionActiva.estado}`);
            console.log(`   Vigente hasta: ${suscripcionActiva.fecha_fin}`);
            console.log(`   Vigencia: ${vigente ? '✅ VÁLIDA' : '⚠️ EXPIRÓ'}`);
            
            if (vigente) {
                console.log(`🎯 CONCLUSIÓN: El restaurante Tiene suscripción válida`);
                console.log(`🔧 PROBLEMA IDENTIFICADO: El frontend no está sincronizando correctamente`);
            } else {
                console.log(`⚠️ PROBLEMA: Suscripción expiró - necesita renovación`);
            }
        } else {
            console.log(`❌ PROBLEMA CRÍTICO: No hay suscripción activa`);
            console.log(`🔧 SOLUCIÓN: Crear/activar suscripción para el restaurante`);
        }

        // 7. Verificação específica para el Header
        console.log('\n📊 7. DATOS DISPONIBLES PARA EL HEADER:');
        
        if (restaurante.rows.length > 0 && suscripcionActiva) {
            console.log('✅ Datos que deberían aparecer en el Header:');
            console.log(`   Nombre restaurante: "${restaurante.rows[0].nombre}"`);
            console.log(`   Ciudad: "${restaurante.rows[0].ciudad}"`);
            console.log(`   Plan actual: "${suscripcionActiva.plan_nombre}"`);
            console.log(`   Estado suscripción: "${suscripcionActiva.estado}"`);
            
            // Verificar si el problema está en el backend que no devuelve los datos
            console.log('\n🔧 DIAGNÓSTICO TÉCNICO:');
            console.log('- Si estos datos están en la BD pero no en el Header:');
            console.log('  1. Verificar authController.js - refreshToken debe devolver restaurante');
            console.log('  2. Verificar AuthContext.tsx - debe sincronizar con localStorage'); 
            console.log('  3. Verificar Header.tsx - debe usar user.restaurante.nombre');
            console.log('  4. Verificar API - debe incluir datos de restaurante en login/refresh');
        } else {
            console.log('❌ Faltan datos para mostrar en el Header');
            if (!suscripcionActiva) {
                console.log('🔧 ACCIÓN REQUERIDA: Activar suscripción');
            }
        }

        console.log('\n🎯 RESUMEN FINAL:');
        console.log(`Restaurante: ${restaurante.rows[0]?.nombre || 'NO ENCONTRADO'}`);
        console.log(`Suscripción: ${suscripcionActiva ? suscripcionActiva.plan_nombre : 'NINGUNA'}`);
        console.log(`Estado: ${suscripcionActiva ? suscripcionActiva.estado : 'SIN SUSCRIPCIÓN'}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

diagnosticoReal();
