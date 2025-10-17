/**
 * EJEMPLO: Crear restaurante personalizado
 */

const { crearRestauranteCompleto } = require('../index');

async function main() {
    console.log('🏢 Creando restaurante personalizado...\n');
    
    const datos = {
        // Datos del restaurante
        restaurante: {
            nombre: 'Mi Restaurante Único',
            direccion: 'Calle Personalizada #123',
            ciudad: 'Cochabamba',
            telefono: '44123456',
            email: 'contacto@mirestaurante.com'
        },
        
        // Datos de la sucursal principal
        sucursal: {
            nombre: 'Sucursal Principal',
            direccion: 'Calle Personalizada #123',
            ciudad: 'Cochabamba'
        },
        
        // Datos del administrador
        administrador: {
            nombre: 'Juan Administrador',
            username: 'juan',
            email: 'juan@mirestaurante.com',
            password: 'Juan123!'
        },
        
        // Plan (opcional, por defecto es plan 3 - Avanzado)
        plan: {
            id_plan: 3 // 1: Básico, 2: Profesional, 3: Avanzado, 4: Enterprise
        },
        
        // Productos personalizados (opcional)
        productos: [
            { categoria: 'Entradas', nombre: 'Ensalada Mixta', precio: 15.00, stock: 0 },
            { categoria: 'Entradas', nombre: 'Sopa del Día', precio: 12.00, stock: 0 },
            
            { categoria: 'Platos Principales', nombre: 'Plato Especial', precio: 35.00, stock: 0 },
            { categoria: 'Platos Principales', nombre: 'Menú del Día', precio: 25.00, stock: 0 },
            
            { categoria: 'Bebidas', nombre: 'Refresco', precio: 8.00, stock: 50 },
            { categoria: 'Bebidas', nombre: 'Agua Mineral', precio: 5.00, stock: 100 },
            { categoria: 'Bebidas', nombre: 'Jugo Natural', precio: 12.00, stock: 30 },
            
            { categoria: 'Postres', nombre: 'Helado', precio: 10.00, stock: 20 },
            { categoria: 'Postres', nombre: 'Flan', precio: 12.00, stock: 15 }
        ],
        
        // Configuración de mesas (opcional)
        mesas: {
            cantidad: 15, // Número de mesas
            capacidad: 4  // Capacidad por defecto
            
            // O puedes definir mesas personalizadas:
            // mesas: [
            //     { numero: 1, capacidad: 2 },
            //     { numero: 2, capacidad: 4 },
            //     { numero: 3, capacidad: 6 },
            //     ...
            // ]
        }
    };
    
    const resultado = await crearRestauranteCompleto(datos);
    
    if (resultado.exitoso) {
        console.log('\n✅ ¡Restaurante creado exitosamente!');
        console.log(`\n📋 Detalles de acceso:`);
        console.log(`   URL: http://localhost:3000`);
        console.log(`   Usuario: ${datos.administrador.username}`);
        console.log(`   Contraseña: ${datos.administrador.password}`);
    } else {
        console.log('\n❌ Error al crear restaurante:', resultado.error);
    }
    
    process.exit(resultado.exitoso ? 0 : 1);
}

main();

