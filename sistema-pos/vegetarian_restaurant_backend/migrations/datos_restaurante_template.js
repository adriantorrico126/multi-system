/**
 * =====================================================
 * PLANTILLA DE DATOS PARA NUEVO RESTAURANTE
 * =====================================================
 * Sistema: SITEMM POS
 * Fecha: 2025-10-10
 * Descripción: Plantilla con los datos del nuevo restaurante
 * =====================================================
 * 
 * INSTRUCCIONES:
 * 1. Modifica los datos en este archivo
 * 2. Ejecuta: node crear_nuevo_restaurante.js
 * =====================================================
 */

module.exports = {
    // ========================================
    // INFORMACIÓN BÁSICA DEL RESTAURANTE
    // ========================================
    restaurante: {
        nombre: 'Mi Restaurante',                    // ⚠️ CAMBIAR: Nombre del restaurante
        direccion: 'Calle Principal #123',           // ⚠️ CAMBIAR: Dirección completa
        ciudad: 'La Paz',                           // ⚠️ CAMBIAR: Ciudad
        telefono: '+591 123456789',                 // ⚠️ CAMBIAR: Teléfono de contacto
        email: 'contacto@mirestaurante.com'        // ⚠️ CAMBIAR: Email de contacto
    },
    
    // ========================================
    // INFORMACIÓN DE LA SUCURSAL PRINCIPAL
    // ========================================
    sucursal: {
        nombre: 'Sucursal Principal',               // ⚠️ CAMBIAR: Nombre de la sucursal
        direccion: 'Calle Principal #123',          // ⚠️ CAMBIAR: Dirección de la sucursal
        ciudad: 'La Paz',                          // ⚠️ CAMBIAR: Ciudad de la sucursal
        telefono: '+591 123456789'                 // ⚠️ CAMBIAR: Teléfono de la sucursal
    },
    
    // ========================================
    // USUARIO ADMINISTRADOR
    // ========================================
    admin: {
        nombre: 'Administrador',                    // ⚠️ CAMBIAR: Nombre del administrador
        username: 'admin',                          // ⚠️ CAMBIAR: Usuario de login
        email: 'admin@mirestaurante.com',          // ⚠️ CAMBIAR: Email del administrador
        password: 'admin123',                       // ⚠️ CAMBIAR: Password (se encriptará)
        telefono: '+591 123456789'                 // ⚠️ CAMBIAR: Teléfono del administrador
    }
};

/**
 * ========================================
 * EJEMPLO DE USO:
 * ========================================
 * 
 * 1. Copia este archivo a: datos_restaurante.js
 * 2. Modifica los datos arriba
 * 3. Ejecuta: node crear_nuevo_restaurante.js
 * 
 * ========================================
 * DATOS ADICIONALES QUE SE CREAN:
 * ========================================
 * 
 * ✅ Métodos de pago básicos:
 *    - Efectivo
 *    - Pago Móvil  
 *    - Tarjeta de Débito
 *    - Tarjeta de Crédito
 * 
 * ✅ Categorías básicas:
 *    - Bebidas
 *    - Platos Principales
 *    - Postres
 *    - Entradas
 * 
 * ✅ Mesas básicas:
 *    - 10 mesas numeradas del 1 al 10
 *    - Capacidad: 4 personas cada una
 * 
 * ========================================
 */
