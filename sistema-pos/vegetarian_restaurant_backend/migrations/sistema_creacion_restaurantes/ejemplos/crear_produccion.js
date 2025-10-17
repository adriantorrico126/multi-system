/**
 * EJEMPLO: Crear restaurante en PRODUCCIÓN
 * 
 * IMPORTANTE: Este script está diseñado para usarse en producción.
 * Asegúrate de:
 * 1. Tener acceso a la base de datos de producción
 * 2. Haber configurado las variables de entorno correctamente
 * 3. Tener backup reciente de la BD
 * 4. Ejecutar en horario de bajo tráfico
 */

const { crearDesdePlantilla, crearRestauranteCompleto } = require('../index');

// Configuración de seguridad
const AMBIENTE = process.env.NODE_ENV || 'development';
const REQUIERE_CONFIRMACION = true;

async function crearEnProduccion() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🏢 CREACIÓN DE RESTAURANTE EN PRODUCCIÓN');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    // Verificar ambiente
    console.log(`📍 Ambiente detectado: ${AMBIENTE}`);
    
    if (AMBIENTE === 'production' && REQUIERE_CONFIRMACION) {
        console.log('');
        console.log('⚠️  ADVERTENCIA: Estás a punto de crear un restaurante en PRODUCCIÓN');
        console.log('');
        console.log('   Asegúrate de:');
        console.log('   ✅ Tener backup reciente de la base de datos');
        console.log('   ✅ Haber verificado los datos dos veces');
        console.log('   ✅ Estar ejecutando en horario de bajo tráfico');
        console.log('   ✅ Tener las credenciales correctas');
        console.log('');
        
        // En producción, requiere confirmación manual
        // Descomenta la siguiente línea y ejecuta con confirmación
        // throw new Error('⛔ CONFIRMACIÓN REQUERIDA: Edita este archivo y descomenta la línea de confirmación');
    }
    
    console.log('');
    console.log('📝 Datos del restaurante a crear:');
    console.log('');
    
    // ════════════════════════════════════════════════════════════════
    // CONFIGURA AQUÍ LOS DATOS DEL RESTAURANTE
    // ════════════════════════════════════════════════════════════════
    
    const datos = {
        restaurante: {
            nombre: 'Nombre del Restaurante',        // ⬅️ CAMBIAR
            direccion: 'Dirección completa',         // ⬅️ CAMBIAR
            ciudad: 'Ciudad',                         // ⬅️ CAMBIAR
            telefono: 'Teléfono',                    // ⬅️ CAMBIAR
            email: 'email@restaurante.com'           // ⬅️ CAMBIAR (debe ser único)
        },
        sucursal: {
            nombre: 'Sucursal Principal',            // ⬅️ CAMBIAR si es necesario
            direccion: 'Dirección de la sucursal',   // ⬅️ CAMBIAR
            ciudad: 'Ciudad'                          // ⬅️ CAMBIAR
        },
        administrador: {
            nombre: 'Nombre del Administrador',      // ⬅️ CAMBIAR
            username: 'username_unico',              // ⬅️ CAMBIAR (debe ser único)
            email: 'admin@restaurante.com',          // ⬅️ CAMBIAR (debe ser único)
            password: 'ContraseñaSegura123!'         // ⬅️ CAMBIAR (mín. 6 caracteres)
        },
        plan: {
            id_plan: 3  // 1: Básico, 2: Profesional, 3: Avanzado, 4: Enterprise
        },
        // Opcional: Agrega productos si lo deseas
        productos: [
            // { categoria: 'Bebidas', nombre: 'Agua', precio: 5.00, stock: 100 },
            // { categoria: 'Bebidas', nombre: 'Refresco', precio: 8.00, stock: 50 },
            // ...
        ],
        mesas: {
            cantidad: 10,     // ⬅️ CAMBIAR según necesidad
            capacidad: 4      // ⬅️ CAMBIAR según necesidad
        }
    };
    
    // Mostrar resumen
    console.log(`   🏢 Restaurante: ${datos.restaurante.nombre}`);
    console.log(`   📍 Ciudad: ${datos.restaurante.ciudad}`);
    console.log(`   📧 Email: ${datos.restaurante.email}`);
    console.log(`   👤 Admin: ${datos.administrador.username} (${datos.administrador.email})`);
    console.log(`   📦 Plan: ${datos.plan.id_plan}`);
    console.log(`   🪑 Mesas: ${datos.mesas.cantidad}`);
    console.log('');
    
    // Validación básica de datos
    const errores = validarDatos(datos);
    if (errores.length > 0) {
        console.log('❌ ERRORES EN LOS DATOS:');
        console.log('');
        errores.forEach(error => console.log(`   - ${error}`));
        console.log('');
        console.log('⛔ Corrige los errores antes de continuar');
        process.exit(1);
    }
    
    console.log('🔄 Iniciando creación...');
    console.log('');
    
    // Ejecutar creación
    const resultado = await crearRestauranteCompleto(datos, {
        ambiente: AMBIENTE
    });
    
    // Resultado
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    
    if (resultado.exitoso) {
        console.log('✅ RESTAURANTE CREADO EXITOSAMENTE EN PRODUCCIÓN');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
        console.log('📊 Información importante:');
        console.log('');
        console.log(`   🆔 ID Restaurante: ${resultado.resultado.restaurante.id_restaurante}`);
        console.log(`   🆔 ID Sucursal: ${resultado.resultado.sucursal.id_sucursal}`);
        console.log(`   🆔 ID Administrador: ${resultado.resultado.administrador.id_vendedor}`);
        console.log('');
        console.log('🔐 Credenciales de acceso:');
        console.log(`   Usuario: ${datos.administrador.username}`);
        console.log(`   Contraseña: ${datos.administrador.password}`);
        console.log('');
        console.log('⏱️  Tiempo de creación: ' + resultado.duracion + 's');
        console.log('');
        console.log('📝 PRÓXIMOS PASOS:');
        console.log('   1. Guarda las credenciales de forma segura');
        console.log('   2. Envía las credenciales al cliente');
        console.log('   3. Verifica que todo funcione correctamente');
        console.log('   4. Documenta el ID del restaurante');
        console.log('');
        
        // Generar reporte para guardar
        const reporte = generarReporte(datos, resultado);
        console.log('💾 REPORTE GENERADO:');
        console.log('');
        console.log(reporte);
        console.log('');
        console.log('💡 Guarda este reporte en tus registros');
        
    } else {
        console.log('❌ ERROR AL CREAR RESTAURANTE EN PRODUCCIÓN');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
        console.log('Error:', resultado.error);
        console.log('');
        console.log('⚠️  ACCIÓN REQUERIDA:');
        console.log('   1. Verifica la conexión a la base de datos');
        console.log('   2. Revisa que los datos sean únicos (email, username)');
        console.log('   3. Verifica que el plan existe');
        console.log('   4. Contacta al equipo técnico si persiste el error');
        console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════════════════');
    
    process.exit(resultado.exitoso ? 0 : 1);
}

/**
 * Validar datos antes de crear
 */
function validarDatos(datos) {
    const errores = [];
    
    // Validar restaurante
    if (!datos.restaurante.nombre || datos.restaurante.nombre === 'Nombre del Restaurante') {
        errores.push('Debes cambiar el nombre del restaurante');
    }
    
    if (!datos.restaurante.email || datos.restaurante.email === 'email@restaurante.com') {
        errores.push('Debes configurar un email válido para el restaurante');
    }
    
    if (!datos.restaurante.email.includes('@')) {
        errores.push('El email del restaurante debe ser válido');
    }
    
    // Validar administrador
    if (!datos.administrador.username || datos.administrador.username === 'username_unico') {
        errores.push('Debes configurar un username único para el administrador');
    }
    
    if (!datos.administrador.email || datos.administrador.email === 'admin@restaurante.com') {
        errores.push('Debes configurar un email válido para el administrador');
    }
    
    if (!datos.administrador.email.includes('@')) {
        errores.push('El email del administrador debe ser válido');
    }
    
    if (!datos.administrador.password || datos.administrador.password === 'ContraseñaSegura123!') {
        errores.push('Debes configurar una contraseña segura para el administrador');
    }
    
    if (datos.administrador.password.length < 6) {
        errores.push('La contraseña debe tener al menos 6 caracteres');
    }
    
    // Validar ciudad
    if (!datos.restaurante.ciudad || datos.restaurante.ciudad === 'Ciudad') {
        errores.push('Debes especificar la ciudad del restaurante');
    }
    
    return errores;
}

/**
 * Generar reporte de creación
 */
function generarReporte(datos, resultado) {
    const fecha = new Date().toLocaleString('es-BO');
    
    return `
───────────────────────────────────────────────────────────────
REPORTE DE CREACIÓN DE RESTAURANTE
───────────────────────────────────────────────────────────────
Fecha: ${fecha}
Ambiente: ${AMBIENTE}

RESTAURANTE:
  Nombre: ${datos.restaurante.nombre}
  ID: ${resultado.resultado.restaurante.id_restaurante}
  Email: ${datos.restaurante.email}
  Ciudad: ${datos.restaurante.ciudad}
  Teléfono: ${datos.restaurante.telefono}

SUCURSAL:
  Nombre: ${datos.sucursal.nombre}
  ID: ${resultado.resultado.sucursal.id_sucursal}
  Ciudad: ${datos.sucursal.ciudad}

ADMINISTRADOR:
  Nombre: ${datos.administrador.nombre}
  ID: ${resultado.resultado.administrador.id_vendedor}
  Username: ${datos.administrador.username}
  Email: ${datos.administrador.email}

SUSCRIPCIÓN:
  Plan ID: ${resultado.resultado.suscripcion.id_plan}
  Plan: ${resultado.resultado.suscripcion.nombre_plan}
  Estado: Activa

CONFIGURACIÓN:
  Categorías: ${resultado.resultado.categorias.length}
  Productos: ${resultado.resultado.productos.length}
  Mesas: ${resultado.resultado.mesas.length}

TIEMPO: ${resultado.duracion}s
───────────────────────────────────────────────────────────────
`;
}

// Ejecutar
crearEnProduccion();





