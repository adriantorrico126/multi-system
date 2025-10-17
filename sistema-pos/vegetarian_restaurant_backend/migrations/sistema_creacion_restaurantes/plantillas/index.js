/**
 * Plantillas predefinidas para diferentes tipos de restaurante
 */

const { obtenerProductosBasicos } = require('../modulos/productos');

/**
 * Plantilla para restaurante genérico
 */
const restauranteGenerico = {
    tipo: 'generico',
    restaurante: {
        nombre: 'Restaurante Genérico',
        direccion: 'Av. Principal #123',
        ciudad: 'Cochabamba',
        telefono: '44444444',
        email: 'contacto@restaurante.com'
    },
    sucursal: {
        nombre: 'Sucursal Principal',
        direccion: 'Av. Principal #123',
        ciudad: 'Cochabamba'
    },
    administrador: {
        nombre: 'Administrador',
        username: 'admin',
        email: 'admin@restaurante.com',
        password: 'Admin123!'
    },
    plan: {
        id_plan: 3 // Plan Avanzado
    },
    productos: obtenerProductosBasicos(),
    mesas: {
        cantidad: 10,
        capacidad: 4
    }
};

/**
 * Plantilla para pizzería
 */
const pizzeria = {
    tipo: 'pizzeria',
    restaurante: {
        nombre: 'Pizzería',
        direccion: 'Av. Principal #123',
        ciudad: 'Cochabamba',
        telefono: '44444444',
        email: 'contacto@pizzeria.com'
    },
    sucursal: {
        nombre: 'Sucursal Principal',
        direccion: 'Av. Principal #123',
        ciudad: 'Cochabamba'
    },
    administrador: {
        nombre: 'Administrador',
        username: 'admin',
        email: 'admin@pizzeria.com',
        password: 'Admin123!'
    },
    plan: {
        id_plan: 3
    },
    productos: [
        // Pizzas
        { categoria: 'Pizzas', nombre: 'Pizza Margarita', precio: 35.00, stock: 0 },
        { categoria: 'Pizzas', nombre: 'Pizza Pepperoni', precio: 40.00, stock: 0 },
        { categoria: 'Pizzas', nombre: 'Pizza Hawaiana', precio: 42.00, stock: 0 },
        { categoria: 'Pizzas', nombre: 'Pizza Vegetariana', precio: 38.00, stock: 0 },
        { categoria: 'Pizzas', nombre: 'Pizza 4 Quesos', precio: 45.00, stock: 0 },
        
        // Bebidas
        { categoria: 'Bebidas', nombre: 'Coca Cola', precio: 8.00, stock: 50 },
        { categoria: 'Bebidas', nombre: 'Fanta', precio: 8.00, stock: 50 },
        { categoria: 'Bebidas', nombre: 'Sprite', precio: 8.00, stock: 50 },
        { categoria: 'Bebidas', nombre: 'Agua Mineral', precio: 5.00, stock: 100 },
        
        // Entradas
        { categoria: 'Entradas', nombre: 'Pan de Ajo', precio: 12.00, stock: 0 },
        { categoria: 'Entradas', nombre: 'Alitas BBQ', precio: 25.00, stock: 0 }
    ],
    mesas: {
        cantidad: 15,
        capacidad: 4
    }
};

/**
 * Plantilla para cafetería
 */
const cafeteria = {
    tipo: 'cafeteria',
    restaurante: {
        nombre: 'Cafetería',
        direccion: 'Calle Comercio #456',
        ciudad: 'Cochabamba',
        telefono: '44444444',
        email: 'contacto@cafeteria.com'
    },
    sucursal: {
        nombre: 'Sucursal Principal',
        direccion: 'Calle Comercio #456',
        ciudad: 'Cochabamba'
    },
    administrador: {
        nombre: 'Administrador',
        username: 'admin',
        email: 'admin@cafeteria.com',
        password: 'Admin123!'
    },
    plan: {
        id_plan: 2 // Plan Profesional
    },
    productos: [
        // Cafés
        { categoria: 'Cafés', nombre: 'Espresso', precio: 10.00, stock: 0 },
        { categoria: 'Cafés', nombre: 'Americano', precio: 12.00, stock: 0 },
        { categoria: 'Cafés', nombre: 'Cappuccino', precio: 15.00, stock: 0 },
        { categoria: 'Cafés', nombre: 'Latte', precio: 15.00, stock: 0 },
        { categoria: 'Cafés', nombre: 'Mocca', precio: 18.00, stock: 0 },
        
        // Bebidas Frías
        { categoria: 'Bebidas Frías', nombre: 'Frappé', precio: 20.00, stock: 0 },
        { categoria: 'Bebidas Frías', nombre: 'Smoothie', precio: 18.00, stock: 0 },
        { categoria: 'Bebidas Frías', nombre: 'Jugo Natural', precio: 12.00, stock: 0 },
        
        // Repostería
        { categoria: 'Repostería', nombre: 'Croissant', precio: 10.00, stock: 20 },
        { categoria: 'Repostería', nombre: 'Muffin', precio: 12.00, stock: 20 },
        { categoria: 'Repostería', nombre: 'Torta del Día', precio: 15.00, stock: 10 },
        { categoria: 'Repostería', nombre: 'Galletas', precio: 8.00, stock: 30 }
    ],
    mesas: {
        cantidad: 8,
        capacidad: 2
    }
};

/**
 * Plantilla para comida rápida
 */
const comidaRapida = {
    tipo: 'comida_rapida',
    restaurante: {
        nombre: 'Fast Food',
        direccion: 'Av. América #789',
        ciudad: 'Cochabamba',
        telefono: '44444444',
        email: 'contacto@fastfood.com'
    },
    sucursal: {
        nombre: 'Sucursal Principal',
        direccion: 'Av. América #789',
        ciudad: 'Cochabamba'
    },
    administrador: {
        nombre: 'Administrador',
        username: 'admin',
        email: 'admin@fastfood.com',
        password: 'Admin123!'
    },
    plan: {
        id_plan: 3
    },
    productos: [
        // Hamburguesas
        { categoria: 'Hamburguesas', nombre: 'Hamburguesa Simple', precio: 20.00, stock: 0 },
        { categoria: 'Hamburguesas', nombre: 'Hamburguesa Doble', precio: 28.00, stock: 0 },
        { categoria: 'Hamburguesas', nombre: 'Hamburguesa Premium', precio: 35.00, stock: 0 },
        
        // Hot Dogs
        { categoria: 'Hot Dogs', nombre: 'Hot Dog Simple', precio: 15.00, stock: 0 },
        { categoria: 'Hot Dogs', nombre: 'Hot Dog Completo', precio: 20.00, stock: 0 },
        
        // Complementos
        { categoria: 'Complementos', nombre: 'Papas Fritas', precio: 10.00, stock: 0 },
        { categoria: 'Complementos', nombre: 'Nuggets', precio: 15.00, stock: 0 },
        { categoria: 'Complementos', nombre: 'Aros de Cebolla', precio: 12.00, stock: 0 },
        
        // Bebidas
        { categoria: 'Bebidas', nombre: 'Refresco', precio: 8.00, stock: 100 },
        { categoria: 'Bebidas', nombre: 'Milkshake', precio: 15.00, stock: 0 }
    ],
    mesas: {
        cantidad: 12,
        capacidad: 4
    }
};

/**
 * Plantilla para restaurante vegetariano
 */
const restauranteVegetariano = {
    tipo: 'vegetariano',
    restaurante: {
        nombre: 'Restaurante Vegetariano',
        direccion: 'Calle Verde #321',
        ciudad: 'Cochabamba',
        telefono: '44444444',
        email: 'contacto@veggie.com'
    },
    sucursal: {
        nombre: 'Sucursal Principal',
        direccion: 'Calle Verde #321',
        ciudad: 'Cochabamba'
    },
    administrador: {
        nombre: 'Administrador',
        username: 'admin',
        email: 'admin@veggie.com',
        password: 'Admin123!'
    },
    plan: {
        id_plan: 3
    },
    productos: [
        // Platos Principales
        { categoria: 'Platos Principales', nombre: 'Ensalada César Vegana', precio: 28.00, stock: 0 },
        { categoria: 'Platos Principales', nombre: 'Burger Vegetal', precio: 32.00, stock: 0 },
        { categoria: 'Platos Principales', nombre: 'Pasta Primavera', precio: 30.00, stock: 0 },
        { categoria: 'Platos Principales', nombre: 'Bowl Mediterráneo', precio: 35.00, stock: 0 },
        
        // Sopas
        { categoria: 'Sopas', nombre: 'Sopa de Lentejas', precio: 18.00, stock: 0 },
        { categoria: 'Sopas', nombre: 'Crema de Verduras', precio: 20.00, stock: 0 },
        
        // Jugos y Batidos
        { categoria: 'Jugos y Batidos', nombre: 'Jugo Verde', precio: 15.00, stock: 0 },
        { categoria: 'Jugos y Batidos', nombre: 'Batido Proteico', precio: 18.00, stock: 0 },
        { categoria: 'Jugos y Batidos', nombre: 'Smoothie Antioxidante', precio: 20.00, stock: 0 },
        
        // Postres
        { categoria: 'Postres', nombre: 'Brownie Vegano', precio: 15.00, stock: 10 },
        { categoria: 'Postres', nombre: 'Helado de Coco', precio: 12.00, stock: 20 }
    ],
    mesas: {
        cantidad: 10,
        capacidad: 4
    }
};

// Exportar todas las plantillas
const plantillas = {
    generico: restauranteGenerico,
    pizzeria: pizzeria,
    cafeteria: cafeteria,
    comida_rapida: comidaRapida,
    vegetariano: restauranteVegetariano
};

module.exports = {
    plantillas,
    restauranteGenerico,
    pizzeria,
    cafeteria,
    comidaRapida,
    restauranteVegetariano
};

