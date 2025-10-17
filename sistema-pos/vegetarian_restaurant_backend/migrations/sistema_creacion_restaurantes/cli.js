#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CLI INTERACTIVO PARA CREAR RESTAURANTES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sistema guiado paso a paso que solicita toda la información necesaria
 * para crear un restaurante completo en el sistema POS.
 * 
 * Uso: node cli.js
 */

const readline = require('readline');
const { crearRestauranteCompleto, crearDesdePlantilla } = require('./index');
const { plantillas } = require('./plantillas/index');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function pregunta(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function limpiarPantalla() {
    console.clear();
}

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m'
};

async function menuPrincipal() {
    limpiarPantalla();
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🏢 SISTEMA DE CREACIÓN DE RESTAURANTES');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('Selecciona una opción:');
    console.log('');
    console.log('  1. Crear desde plantilla (Rápido y fácil)');
    console.log('  2. Crear restaurante personalizado (Control total)');
    console.log('  3. Ver plantillas disponibles');
    console.log('  0. Salir');
    console.log('');
    
    const opcion = await pregunta('Tu opción: ');
    
    switch (opcion.trim()) {
        case '1':
            await crearDesdePlantillaInteractivo();
            break;
        case '2':
            await crearPersonalizadoInteractivo();
            break;
        case '3':
            await mostrarPlantillas();
            break;
        case '0':
            console.log('\n👋 ¡Hasta luego!\n');
            rl.close();
            process.exit(0);
            break;
        default:
            console.log('\n❌ Opción inválida');
            await pregunta('Presiona ENTER para continuar...');
            await menuPrincipal();
    }
}

async function mostrarPlantillas() {
    limpiarPantalla();
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎨 PLANTILLAS DISPONIBLES');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    const plantillasInfo = [
        {
            id: 'pizzeria',
            nombre: 'Pizzería',
            productos: '11 productos (Pizzas, Bebidas, Entradas)',
            mesas: '15 mesas de 4 personas',
            plan: 'Avanzado'
        },
        {
            id: 'cafeteria',
            nombre: 'Cafetería',
            productos: '12 productos (Cafés, Bebidas Frías, Repostería)',
            mesas: '8 mesas de 2 personas',
            plan: 'Profesional'
        },
        {
            id: 'comida_rapida',
            nombre: 'Comida Rápida',
            productos: '10 productos (Hamburguesas, Hot Dogs, Complementos)',
            mesas: '12 mesas de 4 personas',
            plan: 'Avanzado'
        },
        {
            id: 'vegetariano',
            nombre: 'Vegetariano',
            productos: '11 productos (Platos, Sopas, Jugos, Postres)',
            mesas: '10 mesas de 4 personas',
            plan: 'Avanzado'
        },
        {
            id: 'generico',
            nombre: 'Genérico',
            productos: '7 productos básicos',
            mesas: '10 mesas de 4 personas',
            plan: 'Avanzado'
        }
    ];
    
    plantillasInfo.forEach((p, i) => {
        console.log(`${i + 1}. ${p.nombre} (${p.id})`);
        console.log(`   📦 ${p.productos}`);
        console.log(`   🪑 ${p.mesas}`);
        console.log(`   💎 Plan: ${p.plan}`);
        console.log('');
    });
    
    await pregunta('Presiona ENTER para volver...');
    await menuPrincipal();
}

async function crearDesdePlantillaInteractivo() {
    limpiarPantalla();
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎨 CREAR DESDE PLANTILLA');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('Plantillas disponibles:');
    console.log('  1. Pizzería');
    console.log('  2. Cafetería');
    console.log('  3. Comida Rápida');
    console.log('  4. Vegetariano');
    console.log('  5. Genérico');
    console.log('');
    
    const plantilla = await pregunta('Selecciona plantilla (1-5): ');
    const mapPlantillas = {
        '1': 'pizzeria',
        '2': 'cafeteria',
        '3': 'comida_rapida',
        '4': 'vegetariano',
        '5': 'generico'
    };
    
    const tipoPlantilla = mapPlantillas[plantilla.trim()];
    
    if (!tipoPlantilla) {
        console.log('\n❌ Opción inválida');
        await pregunta('Presiona ENTER para continuar...');
        await menuPrincipal();
        return;
    }
    
    console.log('');
    console.log('📝 Ingresa los datos de tu restaurante:');
    console.log('');
    
    const nombre = await pregunta('Nombre del restaurante: ');
    const ciudad = await pregunta('Ciudad (default: Cochabamba): ') || 'Cochabamba';
    const direccion = await pregunta('Dirección: ');
    const telefono = await pregunta('Teléfono: ');
    const email = await pregunta('Email del restaurante: ');
    
    console.log('');
    console.log('👤 Datos del administrador:');
    console.log('');
    
    const adminNombre = await pregunta('Nombre completo: ');
    const adminUsername = await pregunta('Username: ');
    const adminEmail = await pregunta('Email: ');
    const adminPassword = await pregunta('Contraseña (mín. 6 caracteres): ');
    
    console.log('');
    console.log('🔍 Confirmación:');
    console.log('');
    console.log(`   Restaurante: ${nombre}`);
    console.log(`   Ciudad: ${ciudad}`);
    console.log(`   Plantilla: ${tipoPlantilla}`);
    console.log(`   Admin: ${adminUsername} (${adminEmail})`);
    console.log('');
    
    const confirmar = await pregunta('¿Confirmar creación? (s/n): ');
    
    if (confirmar.toLowerCase() !== 's') {
        console.log('\n❌ Creación cancelada');
        await pregunta('Presiona ENTER para volver al menú...');
        await menuPrincipal();
        return;
    }
    
    console.log('');
    
    const datosPersonalizados = {
        restaurante: {
            nombre,
            direccion,
            ciudad,
            telefono,
            email
        },
        administrador: {
            nombre: adminNombre,
            username: adminUsername,
            email: adminEmail,
            password: adminPassword
        }
    };
    
    const resultado = await crearDesdePlantilla(tipoPlantilla, datosPersonalizados);
    
    if (resultado.exitoso) {
        console.log('');
        console.log('✅ ¡RESTAURANTE CREADO EXITOSAMENTE!');
        console.log('');
        console.log('🔐 Credenciales de acceso:');
        console.log(`   Usuario: ${adminUsername}`);
        console.log(`   Contraseña: ${adminPassword}`);
        console.log('');
    } else {
        console.log('');
        console.log('❌ Error al crear restaurante:', resultado.error);
        console.log('');
    }
    
    await pregunta('Presiona ENTER para volver al menú...');
    await menuPrincipal();
}

async function crearPersonalizadoInteractivo() {
    limpiarPantalla();
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🛠️  CREAR RESTAURANTE PERSONALIZADO');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('💡 Ingresa los datos paso a paso');
    console.log('');
    
    // Datos del restaurante
    console.log('📋 1. DATOS DEL RESTAURANTE');
    console.log('───────────────────────────────────────────────────────────────');
    const nombre = await pregunta('Nombre: ');
    const direccion = await pregunta('Dirección: ');
    const ciudad = await pregunta('Ciudad: ');
    const telefono = await pregunta('Teléfono: ');
    const emailRest = await pregunta('Email: ');
    
    // Datos de la sucursal
    console.log('');
    console.log('🏪 2. DATOS DE LA SUCURSAL PRINCIPAL');
    console.log('───────────────────────────────────────────────────────────────');
    const nombreSuc = await pregunta('Nombre (default: Sucursal Principal): ') || 'Sucursal Principal';
    const usarMismaDireccion = await pregunta('¿Usar misma dirección del restaurante? (s/n): ');
    
    let direccionSuc, ciudadSuc;
    if (usarMismaDireccion.toLowerCase() === 's') {
        direccionSuc = direccion;
        ciudadSuc = ciudad;
    } else {
        direccionSuc = await pregunta('Dirección de la sucursal: ');
        ciudadSuc = await pregunta('Ciudad de la sucursal: ');
    }
    
    // Datos del administrador
    console.log('');
    console.log('👤 3. DATOS DEL ADMINISTRADOR');
    console.log('───────────────────────────────────────────────────────────────');
    const adminNombre = await pregunta('Nombre completo: ');
    const adminUsername = await pregunta('Username: ');
    const adminEmail = await pregunta('Email: ');
    const adminPassword = await pregunta('Contraseña: ');
    
    // Plan
    console.log('');
    console.log('📦 4. SELECCIONAR PLAN');
    console.log('───────────────────────────────────────────────────────────────');
    console.log('  1. Básico (3 usuarios, 1 sucursal, 50 productos)');
    console.log('  2. Profesional (10 usuarios, 3 sucursales, 200 productos)');
    console.log('  3. Avanzado (25 usuarios, 5 sucursales, 500 productos) ⭐ Recomendado');
    console.log('  4. Enterprise (100 usuarios, 20 sucursales, 2000 productos)');
    console.log('');
    const planId = await pregunta('Plan (1-4, default: 3): ') || '3';
    
    // Mesas
    console.log('');
    console.log('🪑 5. CONFIGURAR MESAS');
    console.log('───────────────────────────────────────────────────────────────');
    const cantidadMesas = await pregunta('Cantidad de mesas (default: 10): ') || '10';
    const capacidadMesas = await pregunta('Capacidad por defecto (default: 4): ') || '4';
    
    // Confirmación
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 CONFIRMACIÓN');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   Restaurante: ${nombre}`);
    console.log(`   Ciudad: ${ciudad}`);
    console.log(`   Email: ${emailRest}`);
    console.log(`   Sucursal: ${nombreSuc}`);
    console.log(`   Administrador: ${adminUsername} (${adminEmail})`);
    console.log(`   Plan: Plan ${planId}`);
    console.log(`   Mesas: ${cantidadMesas} mesas de ${capacidadMesas} personas`);
    console.log('');
    
    const confirmar = await pregunta('¿Crear restaurante? (s/n): ');
    
    if (confirmar.toLowerCase() !== 's') {
        console.log('\n❌ Creación cancelada');
        await pregunta('Presiona ENTER para volver...');
        await menuPrincipal();
        return;
    }
    
    console.log('');
    console.log('🔄 Creando restaurante...');
    console.log('');
    
    const datos = {
        restaurante: {
            nombre,
            direccion,
            ciudad,
            telefono,
            email: emailRest
        },
        sucursal: {
            nombre: nombreSuc,
            direccion: direccionSuc,
            ciudad: ciudadSuc
        },
        administrador: {
            nombre: adminNombre,
            username: adminUsername,
            email: adminEmail,
            password: adminPassword
        },
        plan: {
            id_plan: parseInt(planId)
        },
        productos: [], // Sin productos inicialmente
        mesas: {
            cantidad: parseInt(cantidadMesas),
            capacidad: parseInt(capacidadMesas)
        }
    };
    
    const resultado = await crearRestauranteCompleto(datos);
    
    if (resultado.exitoso) {
        console.log('');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('✅ ¡RESTAURANTE CREADO EXITOSAMENTE!');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
        console.log('🔐 Credenciales de acceso:');
        console.log(`   Usuario: ${adminUsername}`);
        console.log(`   Contraseña: ${adminPassword}`);
        console.log('');
        console.log('📊 IDs generados:');
        console.log(`   Restaurante: ${resultado.resultado.restaurante.id_restaurante}`);
        console.log(`   Sucursal: ${resultado.resultado.sucursal.id_sucursal}`);
        console.log(`   Admin: ${resultado.resultado.administrador.id_vendedor}`);
        console.log('');
    } else {
        console.log('');
        console.log('❌ Error al crear restaurante:', resultado.error);
        console.log('');
    }
    
    await pregunta('Presiona ENTER para volver al menú...');
    await menuPrincipal();
}

async function crearDesdePlantillaInteractivo() {
    limpiarPantalla();
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎨 CREAR DESDE PLANTILLA');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('Selecciona el tipo de restaurante:');
    console.log('');
    console.log('  1. 🍕 Pizzería');
    console.log('  2. ☕ Cafetería');
    console.log('  3. 🍔 Comida Rápida');
    console.log('  4. 🥗 Vegetariano');
    console.log('  5. 🍽️  Genérico');
    console.log('');
    
    const opcion = await pregunta('Tu opción (1-5): ');
    const mapPlantillas = {
        '1': 'pizzeria',
        '2': 'cafeteria',
        '3': 'comida_rapida',
        '4': 'vegetariano',
        '5': 'generico'
    };
    
    const tipoPlantilla = mapPlantillas[opcion.trim()];
    
    if (!tipoPlantilla) {
        console.log('\n❌ Opción inválida');
        await pregunta('Presiona ENTER para continuar...');
        await menuPrincipal();
        return;
    }
    
    console.log('');
    console.log('📝 Personaliza tu restaurante:');
    console.log('');
    
    const nombre = await pregunta('Nombre del restaurante: ');
    const ciudad = await pregunta('Ciudad (default: Cochabamba): ') || 'Cochabamba';
    const direccion = await pregunta('Dirección: ');
    const telefono = await pregunta('Teléfono: ');
    const email = await pregunta('Email: ');
    
    console.log('');
    console.log('👤 Usuario administrador:');
    console.log('');
    
    const adminNombre = await pregunta('Nombre: ');
    const adminUsername = await pregunta('Username: ');
    const adminEmail = await pregunta('Email: ');
    const adminPassword = await pregunta('Contraseña: ');
    
    console.log('');
    console.log('🔄 Creando restaurante...');
    console.log('');
    
    const datosPersonalizados = {
        restaurante: {
            nombre,
            direccion,
            ciudad,
            telefono,
            email
        },
        administrador: {
            nombre: adminNombre,
            username: adminUsername,
            email: adminEmail,
            password: adminPassword
        }
    };
    
    const resultado = await crearDesdePlantilla(tipoPlantilla, datosPersonalizados);
    
    if (resultado.exitoso) {
        console.log('');
        console.log('✅ ¡RESTAURANTE CREADO!');
        console.log('');
        console.log('🔐 Credenciales:');
        console.log(`   Usuario: ${adminUsername}`);
        console.log(`   Contraseña: ${adminPassword}`);
        console.log('');
    } else {
        console.log('');
        console.log('❌ Error:', resultado.error);
        console.log('');
    }
    
    await pregunta('Presiona ENTER para volver...');
    await menuPrincipal();
}

// Iniciar CLI
console.log('\n🔄 Iniciando sistema...\n');
menuPrincipal();

