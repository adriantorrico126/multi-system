#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CLI INTERACTIVO COMPLETO PARA CREAR RESTAURANTES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sistema guiado que solicita TODA la información necesaria paso a paso
 * para crear un restaurante completo sin necesidad de editar código.
 * 
 * Uso: node cli_interactivo.js
 */

const readline = require('readline');
const { crearRestauranteCompleto, crearDesdePlantilla } = require('./index');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Colores para mejor visualización
const c = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m'
};

function pregunta(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function log(mensaje, color = 'reset') {
    console.log(`${c[color]}${mensaje}${c.reset}`);
}

function separador() {
    console.log('───────────────────────────────────────────────────────────────');
}

function titulo(texto) {
    console.log('');
    console.log(`${c.bright}${c.cyan}${texto}${c.reset}`);
    separador();
}

function exito(mensaje) {
    console.log(`${c.green}✅ ${mensaje}${c.reset}`);
}

function error(mensaje) {
    console.log(`${c.red}❌ ${mensaje}${c.reset}`);
}

function info(mensaje) {
    console.log(`${c.blue}ℹ ${mensaje}${c.reset}`);
}

function advertencia(mensaje) {
    console.log(`${c.yellow}⚠️  ${mensaje}${c.reset}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MENÚ PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

async function menuPrincipal() {
    console.clear();
    console.log('');
    log('═══════════════════════════════════════════════════════════════', 'cyan');
    log('         🏢 SISTEMA DE CREACIÓN DE RESTAURANTES               ', 'cyan');
    log('═══════════════════════════════════════════════════════════════', 'cyan');
    console.log('');
    log('Este asistente te guiará paso a paso para crear un nuevo', 'dim');
    log('restaurante completo con toda su configuración inicial.', 'dim');
    console.log('');
    separador();
    console.log('');
    console.log('Selecciona una opción:');
    console.log('');
    log('  1. 🚀 Crear restaurante completo (Recomendado)', 'bright');
    console.log('     → Configuración paso a paso de todo');
    console.log('');
    log('  2. 🎨 Crear desde plantilla (Rápido)', 'bright');
    console.log('     → Usa una plantilla predefinida');
    console.log('');
    log('  3. 📋 Ver plantillas disponibles', 'bright');
    console.log('     → Lista de tipos de restaurante');
    console.log('');
    log('  0. ❌ Salir', 'bright');
    console.log('');
    
    const opcion = await pregunta(`${c.cyan}Tu opción:${c.reset} `);
    
    switch (opcion.trim()) {
        case '1':
            await flujoCompletoInteractivo();
            break;
        case '2':
            await flujoPlantillaInteractivo();
            break;
        case '3':
            await mostrarPlantillas();
            break;
        case '0':
            console.log('');
            exito('¡Hasta luego!');
            console.log('');
            rl.close();
            process.exit(0);
            break;
        default:
            error('Opción inválida');
            await pregunta('\nPresiona ENTER para continuar...');
            await menuPrincipal();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// FLUJO COMPLETO INTERACTIVO
// ═══════════════════════════════════════════════════════════════════════════

async function flujoCompletoInteractivo() {
    console.clear();
    console.log('');
    log('═══════════════════════════════════════════════════════════════', 'cyan');
    log('         🚀 CREACIÓN COMPLETA DE RESTAURANTE                   ', 'cyan');
    log('═══════════════════════════════════════════════════════════════', 'cyan');
    console.log('');
    info('Te guiaré paso a paso para recopilar toda la información.');
    info('Puedes dejar campos opcionales en blanco presionando ENTER.');
    console.log('');
    await pregunta('Presiona ENTER para comenzar...');
    
    const datos = {};
    
    // ═══════════════════════════════════════════════════════════════════════
    // PASO 1: DATOS DEL RESTAURANTE
    // ═══════════════════════════════════════════════════════════════════════
    titulo('📋 PASO 1/5: DATOS DEL RESTAURANTE');
    console.log('');
    
    datos.restaurante = {};
    
    while (true) {
        datos.restaurante.nombre = await pregunta(`${c.bright}Nombre del restaurante:${c.reset} `);
        if (datos.restaurante.nombre.trim()) break;
        error('El nombre es obligatorio');
    }
    
    while (true) {
        datos.restaurante.ciudad = await pregunta(`${c.bright}Ciudad:${c.reset} `);
        if (datos.restaurante.ciudad.trim()) break;
        error('La ciudad es obligatoria');
    }
    
    datos.restaurante.direccion = await pregunta(`${c.bright}Dirección:${c.reset} `);
    
    datos.restaurante.telefono = await pregunta(`${c.bright}Teléfono:${c.reset} `);
    
    while (true) {
        datos.restaurante.email = await pregunta(`${c.bright}Email del restaurante:${c.reset} `);
        if (datos.restaurante.email.includes('@')) break;
        error('Debes ingresar un email válido');
    }
    
    console.log('');
    exito('Datos del restaurante registrados');
    
    // ═══════════════════════════════════════════════════════════════════════
    // PASO 2: DATOS DE LA SUCURSAL
    // ═══════════════════════════════════════════════════════════════════════
    titulo('🏪 PASO 2/5: SUCURSAL PRINCIPAL');
    console.log('');
    
    datos.sucursal = {};
    
    const nombreSucursal = await pregunta(`${c.bright}Nombre de la sucursal [Sucursal Principal]:${c.reset} `);
    datos.sucursal.nombre = nombreSucursal.trim() || 'Sucursal Principal';
    
    const usarMismaDireccion = await pregunta(`${c.bright}¿Usar la misma dirección del restaurante? (s/n) [s]:${c.reset} `);
    
    if (usarMismaDireccion.toLowerCase() === 'n') {
        datos.sucursal.direccion = await pregunta(`${c.bright}Dirección de la sucursal:${c.reset} `);
        datos.sucursal.ciudad = await pregunta(`${c.bright}Ciudad de la sucursal:${c.reset} `);
    } else {
        datos.sucursal.direccion = datos.restaurante.direccion;
        datos.sucursal.ciudad = datos.restaurante.ciudad;
        info('Usando dirección del restaurante');
    }
    
    console.log('');
    exito('Datos de la sucursal registrados');
    
    // ═══════════════════════════════════════════════════════════════════════
    // PASO 3: USUARIO ADMINISTRADOR
    // ═══════════════════════════════════════════════════════════════════════
    titulo('👤 PASO 3/5: USUARIO ADMINISTRADOR');
    console.log('');
    info('Este será el usuario con acceso total al sistema');
    console.log('');
    
    datos.administrador = {};
    
    while (true) {
        datos.administrador.nombre = await pregunta(`${c.bright}Nombre completo del administrador:${c.reset} `);
        if (datos.administrador.nombre.trim()) break;
        error('El nombre es obligatorio');
    }
    
    while (true) {
        datos.administrador.username = await pregunta(`${c.bright}Username (para login):${c.reset} `);
        if (datos.administrador.username.trim().length >= 3) break;
        error('El username debe tener al menos 3 caracteres');
    }
    
    while (true) {
        datos.administrador.email = await pregunta(`${c.bright}Email del administrador:${c.reset} `);
        if (datos.administrador.email.includes('@')) break;
        error('Debes ingresar un email válido');
    }
    
    while (true) {
        datos.administrador.password = await pregunta(`${c.bright}Contraseña (mín. 6 caracteres):${c.reset} `);
        if (datos.administrador.password.length >= 6) break;
        error('La contraseña debe tener al menos 6 caracteres');
    }
    
    console.log('');
    exito('Usuario administrador configurado');
    
    // ═══════════════════════════════════════════════════════════════════════
    // PASO 4: PLAN DE SUSCRIPCIÓN
    // ═══════════════════════════════════════════════════════════════════════
    titulo('📦 PASO 4/5: PLAN DE SUSCRIPCIÓN');
    console.log('');
    console.log('Selecciona el plan para el restaurante:');
    console.log('');
    log('  1. Básico', 'bright');
    console.log('     → 3 usuarios, 1 sucursal, 50 productos');
    console.log('');
    log('  2. Profesional', 'bright');
    console.log('     → 10 usuarios, 3 sucursales, 200 productos');
    console.log('     → Facturación electrónica');
    console.log('');
    log('  3. Avanzado ⭐ [Recomendado]', 'green');
    console.log('     → 25 usuarios, 5 sucursales, 500 productos');
    console.log('     → Inventario avanzado, modificadores de productos');
    console.log('');
    log('  4. Enterprise', 'bright');
    console.log('     → 100 usuarios, 20 sucursales, 2000 productos');
    console.log('     → Multi-moneda, API, soporte 24/7');
    console.log('');
    
    const planOpcion = await pregunta(`${c.bright}Selecciona plan (1-4) [3]:${c.reset} `);
    const planId = parseInt(planOpcion.trim() || '3');
    
    if (planId < 1 || planId > 4) {
        advertencia('Plan inválido, usando Avanzado (3)');
        datos.plan = { id_plan: 3 };
    } else {
        datos.plan = { id_plan: planId };
    }
    
    const nombresPlan = ['', 'Básico', 'Profesional', 'Avanzado', 'Enterprise'];
    console.log('');
    exito(`Plan seleccionado: ${nombresPlan[datos.plan.id_plan]}`);
    
    // ═══════════════════════════════════════════════════════════════════════
    // PASO 5: CONFIGURACIÓN DE MESAS Y PRODUCTOS
    // ═══════════════════════════════════════════════════════════════════════
    titulo('🪑 PASO 5/5: CONFIGURACIÓN INICIAL');
    console.log('');
    
    // Mesas
    log('MESAS:', 'bright');
    const cantidadMesas = await pregunta(`${c.bright}Cantidad de mesas [10]:${c.reset} `);
    const capacidadMesas = await pregunta(`${c.bright}Capacidad por defecto (personas) [4]:${c.reset} `);
    
    datos.mesas = {
        cantidad: parseInt(cantidadMesas.trim() || '10'),
        capacidad: parseInt(capacidadMesas.trim() || '4')
    };
    
    console.log('');
    
    // Productos
    log('PRODUCTOS:', 'bright');
    console.log('');
    const agregarProductos = await pregunta(`${c.bright}¿Deseas agregar productos ahora? (s/n) [n]:${c.reset} `);
    
    if (agregarProductos.toLowerCase() === 's') {
        datos.productos = await agregarProductosInteractivo();
    } else {
        datos.productos = [];
        info('Podrás agregar productos después desde el sistema');
    }
    
    console.log('');
    exito('Configuración inicial completada');
    
    // ═══════════════════════════════════════════════════════════════════════
    // CONFIRMACIÓN FINAL
    // ═══════════════════════════════════════════════════════════════════════
    titulo('🔍 CONFIRMACIÓN DE DATOS');
    console.log('');
    console.log('Revisa la información antes de crear el restaurante:');
    console.log('');
    
    log('RESTAURANTE:', 'cyan');
    console.log(`  Nombre: ${datos.restaurante.nombre}`);
    console.log(`  Ciudad: ${datos.restaurante.ciudad}`);
    console.log(`  Email: ${datos.restaurante.email}`);
    console.log(`  Teléfono: ${datos.restaurante.telefono || 'N/A'}`);
    console.log('');
    
    log('SUCURSAL:', 'cyan');
    console.log(`  Nombre: ${datos.sucursal.nombre}`);
    console.log(`  Ciudad: ${datos.sucursal.ciudad}`);
    console.log('');
    
    log('ADMINISTRADOR:', 'cyan');
    console.log(`  Nombre: ${datos.administrador.nombre}`);
    console.log(`  Username: ${datos.administrador.username}`);
    console.log(`  Email: ${datos.administrador.email}`);
    console.log('');
    
    log('CONFIGURACIÓN:', 'cyan');
    console.log(`  Plan: ${nombresPlan[datos.plan.id_plan]}`);
    console.log(`  Mesas: ${datos.mesas.cantidad} mesas de ${datos.mesas.capacidad} personas`);
    console.log(`  Productos: ${datos.productos.length} productos`);
    console.log('');
    
    const confirmar = await pregunta(`${c.yellow}¿Confirmar y crear restaurante? (s/n):${c.reset} `);
    
    if (confirmar.toLowerCase() !== 's') {
        console.log('');
        advertencia('Creación cancelada');
        await pregunta('\nPresiona ENTER para volver al menú...');
        await menuPrincipal();
        return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CREAR RESTAURANTE
    // ═══════════════════════════════════════════════════════════════════════
    console.log('');
    console.log('');
    log('═══════════════════════════════════════════════════════════════', 'green');
    log('         🚀 CREANDO RESTAURANTE...                             ', 'green');
    log('═══════════════════════════════════════════════════════════════', 'green');
    console.log('');
    
    const resultado = await crearRestauranteCompleto(datos);
    
    console.log('');
    console.log('');
    
    if (resultado.exitoso) {
        log('═══════════════════════════════════════════════════════════════', 'green');
        log('         ✅ ¡RESTAURANTE CREADO EXITOSAMENTE!                  ', 'green');
        log('═══════════════════════════════════════════════════════════════', 'green');
        console.log('');
        
        log('📊 IDS GENERADOS:', 'cyan');
        console.log(`  Restaurante: ${resultado.resultado.restaurante.id_restaurante}`);
        console.log(`  Sucursal: ${resultado.resultado.sucursal.id_sucursal}`);
        console.log(`  Administrador: ${resultado.resultado.administrador.id_vendedor}`);
        console.log('');
        
        log('🔐 CREDENCIALES DE ACCESO:', 'yellow');
        console.log(`  URL: http://localhost:3000`);
        console.log(`  Usuario: ${datos.administrador.username}`);
        console.log(`  Contraseña: ${datos.administrador.password}`);
        console.log('');
        
        log(`⏱️  Tiempo: ${resultado.duracion}s`, 'dim');
        console.log('');
        
        advertencia('¡IMPORTANTE! Guarda estas credenciales de forma segura');
        
    } else {
        log('═══════════════════════════════════════════════════════════════', 'red');
        log('         ❌ ERROR AL CREAR RESTAURANTE                         ', 'red');
        log('═══════════════════════════════════════════════════════════════', 'red');
        console.log('');
        error(`Error: ${resultado.error}`);
        console.log('');
    }
    
    await pregunta('\nPresiona ENTER para volver al menú...');
    await menuPrincipal();
}

// ═══════════════════════════════════════════════════════════════════════════
// AGREGAR PRODUCTOS INTERACTIVAMENTE
// ═══════════════════════════════════════════════════════════════════════════

async function agregarProductosInteractivo() {
    const productos = [];
    
    console.log('');
    info('Puedes agregar productos ahora. Escribe "fin" cuando termines.');
    console.log('');
    
    while (true) {
        console.log('');
        const categoria = await pregunta(`${c.bright}Categoría (o "fin" para terminar):${c.reset} `);
        
        if (categoria.toLowerCase() === 'fin') break;
        if (!categoria.trim()) continue;
        
        const nombre = await pregunta(`${c.bright}Nombre del producto:${c.reset} `);
        if (!nombre.trim()) continue;
        
        const precio = await pregunta(`${c.bright}Precio [0]:${c.reset} `);
        const stock = await pregunta(`${c.bright}Stock inicial [0]:${c.reset} `);
        
        productos.push({
            categoria: categoria.trim(),
            nombre: nombre.trim(),
            precio: parseFloat(precio) || 0,
            stock: parseInt(stock) || 0
        });
        
        exito(`Producto "${nombre}" agregado a "${categoria}"`);
    }
    
    console.log('');
    exito(`${productos.length} productos agregados`);
    
    return productos;
}

// ═══════════════════════════════════════════════════════════════════════════
// FLUJO CON PLANTILLA
// ═══════════════════════════════════════════════════════════════════════════

async function flujoPlantillaInteractivo() {
    console.clear();
    console.log('');
    log('═══════════════════════════════════════════════════════════════', 'cyan');
    log('         🎨 CREAR DESDE PLANTILLA                              ', 'cyan');
    log('═══════════════════════════════════════════════════════════════', 'cyan');
    console.log('');
    
    console.log('Selecciona el tipo de restaurante:');
    console.log('');
    console.log('  1. 🍕 Pizzería (11 productos, 15 mesas)');
    console.log('  2. ☕ Cafetería (12 productos, 8 mesas)');
    console.log('  3. 🍔 Comida Rápida (10 productos, 12 mesas)');
    console.log('  4. 🥗 Vegetariano (11 productos, 10 mesas)');
    console.log('  5. 🍽️  Genérico (7 productos, 10 mesas)');
    console.log('');
    
    const opcion = await pregunta(`${c.cyan}Tu opción (1-5):${c.reset} `);
    
    const mapPlantillas = {
        '1': 'pizzeria',
        '2': 'cafeteria',
        '3': 'comida_rapida',
        '4': 'vegetariano',
        '5': 'generico'
    };
    
    const tipoPlantilla = mapPlantillas[opcion.trim()];
    
    if (!tipoPlantilla) {
        error('Opción inválida');
        await pregunta('\nPresiona ENTER para continuar...');
        await menuPrincipal();
        return;
    }
    
    console.log('');
    info('Solo necesitas personalizar algunos datos básicos');
    console.log('');
    separador();
    console.log('');
    
    const datosPersonalizados = {
        restaurante: {},
        administrador: {}
    };
    
    // Datos del restaurante
    while (true) {
        datosPersonalizados.restaurante.nombre = await pregunta(`${c.bright}Nombre del restaurante:${c.reset} `);
        if (datosPersonalizados.restaurante.nombre.trim()) break;
        error('El nombre es obligatorio');
    }
    
    const ciudad = await pregunta(`${c.bright}Ciudad [Cochabamba]:${c.reset} `);
    datosPersonalizados.restaurante.ciudad = ciudad.trim() || 'Cochabamba';
    
    datosPersonalizados.restaurante.direccion = await pregunta(`${c.bright}Dirección:${c.reset} `);
    datosPersonalizados.restaurante.telefono = await pregunta(`${c.bright}Teléfono:${c.reset} `);
    
    while (true) {
        datosPersonalizados.restaurante.email = await pregunta(`${c.bright}Email:${c.reset} `);
        if (datosPersonalizados.restaurante.email.includes('@')) break;
        error('Debes ingresar un email válido');
    }
    
    console.log('');
    separador();
    console.log('');
    
    // Usuario administrador
    datosPersonalizados.administrador.nombre = await pregunta(`${c.bright}Nombre del administrador:${c.reset} `);
    
    while (true) {
        datosPersonalizados.administrador.username = await pregunta(`${c.bright}Username:${c.reset} `);
        if (datosPersonalizados.administrador.username.trim().length >= 3) break;
        error('El username debe tener al menos 3 caracteres');
    }
    
    while (true) {
        datosPersonalizados.administrador.email = await pregunta(`${c.bright}Email del admin:${c.reset} `);
        if (datosPersonalizados.administrador.email.includes('@')) break;
        error('Debes ingresar un email válido');
    }
    
    while (true) {
        datosPersonalizados.administrador.password = await pregunta(`${c.bright}Contraseña (mín. 6):${c.reset} `);
        if (datosPersonalizados.administrador.password.length >= 6) break;
        error('La contraseña debe tener al menos 6 caracteres');
    }
    
    console.log('');
    separador();
    console.log('');
    
    const confirmar = await pregunta(`${c.yellow}¿Crear restaurante con plantilla ${tipoPlantilla}? (s/n):${c.reset} `);
    
    if (confirmar.toLowerCase() !== 's') {
        advertencia('Creación cancelada');
        await pregunta('\nPresiona ENTER para volver...');
        await menuPrincipal();
        return;
    }
    
    console.log('');
    log('🔄 Creando restaurante...', 'cyan');
    console.log('');
    
    const resultado = await crearDesdePlantilla(tipoPlantilla, datosPersonalizados);
    
    console.log('');
    
    if (resultado.exitoso) {
        exito('¡RESTAURANTE CREADO EXITOSAMENTE!');
        console.log('');
        log('🔐 Credenciales:', 'yellow');
        console.log(`  Usuario: ${datosPersonalizados.administrador.username}`);
        console.log(`  Contraseña: ${datosPersonalizados.administrador.password}`);
        console.log('');
    } else {
        error(`Error: ${resultado.error}`);
        console.log('');
    }
    
    await pregunta('\nPresiona ENTER para volver...');
    await menuPrincipal();
}

// ═══════════════════════════════════════════════════════════════════════════
// MOSTRAR PLANTILLAS
// ═══════════════════════════════════════════════════════════════════════════

async function mostrarPlantillas() {
    console.clear();
    console.log('');
    log('═══════════════════════════════════════════════════════════════', 'cyan');
    log('         📋 PLANTILLAS DISPONIBLES                             ', 'cyan');
    log('═══════════════════════════════════════════════════════════════', 'cyan');
    console.log('');
    
    console.log('1. 🍕 PIZZERÍA');
    console.log('   • 3 categorías: Pizzas, Bebidas, Entradas');
    console.log('   • 11 productos predefinidos');
    console.log('   • 15 mesas de 4 personas');
    console.log('   • Plan: Avanzado');
    console.log('');
    
    console.log('2. ☕ CAFETERÍA');
    console.log('   • 3 categorías: Cafés, Bebidas Frías, Repostería');
    console.log('   • 12 productos predefinidos');
    console.log('   • 8 mesas de 2 personas');
    console.log('   • Plan: Profesional');
    console.log('');
    
    console.log('3. 🍔 COMIDA RÁPIDA');
    console.log('   • 4 categorías: Hamburguesas, Hot Dogs, Complementos, Bebidas');
    console.log('   • 10 productos predefinidos');
    console.log('   • 12 mesas de 4 personas');
    console.log('   • Plan: Avanzado');
    console.log('');
    
    console.log('4. 🥗 VEGETARIANO');
    console.log('   • 4 categorías: Platos, Sopas, Jugos, Postres');
    console.log('   • 11 productos predefinidos');
    console.log('   • 10 mesas de 4 personas');
    console.log('   • Plan: Avanzado');
    console.log('');
    
    console.log('5. 🍽️  GENÉRICO');
    console.log('   • 3 categorías básicas');
    console.log('   • 7 productos básicos');
    console.log('   • 10 mesas de 4 personas');
    console.log('   • Plan: Avanzado');
    console.log('');
    
    await pregunta('Presiona ENTER para volver...');
    await menuPrincipal();
}

// ═══════════════════════════════════════════════════════════════════════════
// INICIAR
// ═══════════════════════════════════════════════════════════════════════════

console.log('');
log('🔄 Iniciando sistema...', 'cyan');
console.log('');

setTimeout(() => {
    menuPrincipal();
}, 500);

