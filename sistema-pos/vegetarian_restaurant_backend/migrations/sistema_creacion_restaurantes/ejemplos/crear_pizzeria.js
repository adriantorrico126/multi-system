/**
 * EJEMPLO: Crear una pizzería usando el sistema avanzado
 */

const { crearDesdePlantilla } = require('../index');

async function main() {
    console.log('🍕 Creando pizzería desde plantilla...\n');
    
    const datosPersonalizados = {
        restaurante: {
            nombre: 'Pizzería Don Carlo',
            direccion: 'Av. Heroínas #567',
            ciudad: 'Cochabamba',
            telefono: '44567890',
            email: 'contacto@doncarlo.com'
        },
        sucursal: {
            nombre: 'Sucursal Centro',
            direccion: 'Av. Heroínas #567',
            ciudad: 'Cochabamba'
        },
        administrador: {
            nombre: 'Carlos Pérez',
            username: 'carlos',
            email: 'carlos@doncarlo.com',
            password: 'Carlos123!'
        }
    };
    
    const resultado = await crearDesdePlantilla('pizzeria', datosPersonalizados);
    
    if (resultado.exitoso) {
        console.log('\n✅ ¡Pizzería creada exitosamente!');
        console.log(`\n📋 Detalles de acceso:`);
        console.log(`   URL: http://localhost:3000`);
        console.log(`   Usuario: ${datosPersonalizados.administrador.username}`);
        console.log(`   Contraseña: ${datosPersonalizados.administrador.password}`);
    } else {
        console.log('\n❌ Error al crear pizzería:', resultado.error);
    }
    
    process.exit(resultado.exitoso ? 0 : 1);
}

main();

