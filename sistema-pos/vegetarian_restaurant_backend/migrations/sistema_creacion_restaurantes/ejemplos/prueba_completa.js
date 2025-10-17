/**
 * PRUEBA COMPLETA DEL SISTEMA
 * 
 * Este script crea un restaurante de prueba para validar que todo funcione
 */

const { crearRestauranteCompleto } = require('../index');

async function pruebaCompleta() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🧪 PRUEBA COMPLETA DEL SISTEMA DE CREACIÓN');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('⚠️  ADVERTENCIA: Este script creará un restaurante de prueba');
    console.log('   en tu base de datos. Asegúrate de estar en el ambiente correcto.');
    console.log('');
    
    const timestamp = Date.now();
    
    const datos = {
        restaurante: {
            nombre: `Restaurante Prueba ${timestamp}`,
            direccion: 'Av. Test #999',
            ciudad: 'Cochabamba',
            telefono: '44999999',
            email: `prueba${timestamp}@test.com`
        },
        sucursal: {
            nombre: 'Sucursal Test',
            direccion: 'Av. Test #999',
            ciudad: 'Cochabamba'
        },
        administrador: {
            nombre: 'Admin Test',
            username: `admin_test_${timestamp}`,
            email: `admin_test_${timestamp}@test.com`,
            password: 'Test123!'
        },
        plan: {
            id_plan: 3 // Plan Avanzado
        },
        productos: [
            // Bebidas
            { categoria: 'Bebidas', nombre: 'Agua Test', precio: 5.00, stock: 100 },
            { categoria: 'Bebidas', nombre: 'Refresco Test', precio: 8.00, stock: 50 },
            
            // Comida
            { categoria: 'Comida', nombre: 'Plato Test 1', precio: 25.00, stock: 0 },
            { categoria: 'Comida', nombre: 'Plato Test 2', precio: 30.00, stock: 0 },
            { categoria: 'Comida', nombre: 'Plato Test 3', precio: 35.00, stock: 0 },
            
            // Postres
            { categoria: 'Postres', nombre: 'Helado Test', precio: 10.00, stock: 20 }
        ],
        mesas: {
            cantidad: 5,
            capacidad: 4
        }
    };
    
    console.log('📋 Datos de prueba preparados:');
    console.log(`   Restaurante: ${datos.restaurante.nombre}`);
    console.log(`   Usuario: ${datos.administrador.username}`);
    console.log(`   Password: ${datos.administrador.password}`);
    console.log('');
    console.log('🔄 Iniciando creación...');
    console.log('');
    
    const resultado = await crearRestauranteCompleto(datos);
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    
    if (resultado.exitoso) {
        console.log('✅ PRUEBA EXITOSA - SISTEMA FUNCIONANDO CORRECTAMENTE');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
        console.log('📊 Datos creados:');
        console.log(`   🏢 Restaurante ID: ${resultado.resultado.restaurante.id_restaurante}`);
        console.log(`   🏪 Sucursal ID: ${resultado.resultado.sucursal.id_sucursal}`);
        console.log(`   👤 Admin ID: ${resultado.resultado.administrador.id_vendedor}`);
        console.log(`   📦 Suscripción ID: ${resultado.resultado.suscripcion.id_suscripcion}`);
        console.log(`   📁 Categorías: ${resultado.resultado.categorias.length}`);
        console.log(`   🍕 Productos: ${resultado.resultado.productos.length}`);
        console.log(`   🪑 Mesas: ${resultado.resultado.mesas.length}`);
        console.log(`   💰 Arqueo ID: ${resultado.resultado.arqueo.id_arqueo}`);
        console.log('');
        console.log('🔐 Credenciales de acceso:');
        console.log(`   Usuario: ${datos.administrador.username}`);
        console.log(`   Password: ${datos.administrador.password}`);
        console.log('');
        console.log('⏱️  Duración: ' + resultado.duracion + 's');
        console.log('');
        
        if (resultado.verificacion.advertencias.length > 0) {
            console.log('⚠️  Advertencias:');
            resultado.verificacion.advertencias.forEach(adv => {
                console.log(`   - ${adv}`);
            });
        }
        
        console.log('');
        console.log('💡 Puedes eliminar este restaurante de prueba cuando quieras');
        console.log(`   desde la administración del sistema (ID: ${resultado.resultado.restaurante.id_restaurante})`);
        
    } else {
        console.log('❌ PRUEBA FALLIDA - HAY PROBLEMAS EN EL SISTEMA');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
        console.log('Error:', resultado.error);
        console.log('');
        console.log('💡 Revisa:');
        console.log('   1. Que la base de datos esté corriendo');
        console.log('   2. Que las credenciales de conexión sean correctas');
        console.log('   3. Que las tablas necesarias existan');
        console.log('   4. Los logs anteriores para más detalles');
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    
    process.exit(resultado.exitoso ? 0 : 1);
}

pruebaCompleta();

