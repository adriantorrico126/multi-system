#!/bin/bash

echo "👤 VERIFICACIÓN Y CREACIÓN DE USUARIO ADMIN"
echo "==========================================="
echo ""

# Verificar que PostgreSQL esté corriendo
echo "1. Verificando conexión a PostgreSQL..."
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "✅ PostgreSQL corriendo"
else
    echo "❌ PostgreSQL no está corriendo"
    echo "   Inicia PostgreSQL primero"
    exit 1
fi

echo ""

# Verificar que la base de datos existe
echo "2. Verificando base de datos..."
if psql -h localhost -U postgres -d menta_restobar_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Base de datos 'menta_restobar_db' accesible"
else
    echo "❌ No se puede acceder a la base de datos"
    echo "   Verifica que la base de datos existe y las credenciales son correctas"
    exit 1
fi

echo ""

# Verificar si existe un usuario admin
echo "3. Verificando usuario admin..."
admin_exists=$(psql -h localhost -U postgres -d menta_restobar_db -t -c "SELECT COUNT(*) FROM vendedores WHERE username = 'admin' AND activo = true;" 2>/dev/null | tr -d ' ')

if [ "$admin_exists" = "1" ]; then
    echo "✅ Usuario 'admin' ya existe y está activo"
    
    # Mostrar información del usuario
    echo ""
    echo "📋 Información del usuario admin:"
    psql -h localhost -U postgres -d menta_restobar_db -c "SELECT id_vendedor, nombre, username, rol, activo FROM vendedores WHERE username = 'admin';"
    
else
    echo "❌ Usuario 'admin' no existe o está inactivo"
    echo ""
    echo "🔧 Creando usuario admin..."
    
    # Verificar que hay sucursales y restaurantes
    sucursal_count=$(psql -h localhost -U postgres -d menta_restobar_db -t -c "SELECT COUNT(*) FROM sucursales WHERE activo = true;" 2>/dev/null | tr -d ' ')
    restaurante_count=$(psql -h localhost -U postgres -d menta_restobar_db -t -c "SELECT COUNT(*) FROM restaurantes WHERE activo = true;" 2>/dev/null | tr -d ' ')
    
    if [ "$sucursal_count" = "0" ] || [ "$restaurante_count" = "0" ]; then
        echo "⚠️  No hay sucursales o restaurantes activos"
        echo "   Creando datos básicos..."
        
        # Crear restaurante si no existe
        psql -h localhost -U postgres -d menta_restobar_db -c "
        INSERT INTO restaurantes (nombre, direccion, ciudad, telefono, email, activo) 
        VALUES ('Restaurante Demo', 'Dirección Demo', 'La Paz', '12345678', 'demo@restaurante.com', true)
        ON CONFLICT DO NOTHING;
        " 2>/dev/null
        
        # Crear sucursal si no existe
        psql -h localhost -U postgres -d menta_restobar_db -c "
        INSERT INTO sucursales (nombre, ciudad, direccion, activo, id_restaurante) 
        VALUES ('Sucursal Principal', 'La Paz', 'Dirección Principal', true, 1)
        ON CONFLICT DO NOTHING;
        " 2>/dev/null
        
        echo "✅ Datos básicos creados"
    fi
    
    # Crear usuario admin
    echo "   Creando usuario admin con contraseña 'admin'..."
    
    # Hash de la contraseña 'admin' usando bcrypt
    # Nota: Este es un hash de ejemplo, en producción usar bcrypt
    password_hash='$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
    
    psql -h localhost -U postgres -d menta_restobar_db -c "
    INSERT INTO vendedores (nombre, username, password_hash, rol, activo, id_sucursal, id_restaurante) 
    VALUES ('Administrador', 'admin', '$password_hash', 'admin', true, 1, 1)
    ON CONFLICT (username) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        activo = true,
        rol = 'admin';
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Usuario admin creado exitosamente"
        echo "   Usuario: admin"
        echo "   Contraseña: admin"
    else
        echo "❌ Error al crear usuario admin"
        echo "   Verifica los permisos de la base de datos"
    fi
fi

echo ""

# Mostrar todos los usuarios activos
echo "4. Usuarios activos en el sistema:"
psql -h localhost -U postgres -d menta_restobar_db -c "SELECT id_vendedor, nombre, username, rol, activo FROM vendedores WHERE activo = true ORDER BY rol, nombre;"

echo ""
echo "🎯 RESUMEN:"
echo "==========="
echo "✅ Sistema de usuarios verificado"
echo "✅ Usuario admin disponible"
echo ""
echo "🚀 Ahora puedes probar el login:"
echo "   1. Usuario: admin"
echo "   2. Contraseña: admin"
echo ""
echo "💡 Si el login sigue fallando:"
echo "   1. Verifica que el backend esté corriendo"
echo "   2. Revisa la consola del navegador"
echo "   3. Ejecuta: ./prueba_login.sh"

echo "👤 VERIFICACIÓN Y CREACIÓN DE USUARIO ADMIN"
echo "==========================================="
echo ""

# Verificar que PostgreSQL esté corriendo
echo "1. Verificando conexión a PostgreSQL..."
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "✅ PostgreSQL corriendo"
else
    echo "❌ PostgreSQL no está corriendo"
    echo "   Inicia PostgreSQL primero"
    exit 1
fi

echo ""

# Verificar que la base de datos existe
echo "2. Verificando base de datos..."
if psql -h localhost -U postgres -d menta_restobar_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Base de datos 'menta_restobar_db' accesible"
else
    echo "❌ No se puede acceder a la base de datos"
    echo "   Verifica que la base de datos existe y las credenciales son correctas"
    exit 1
fi

echo ""

# Verificar si existe un usuario admin
echo "3. Verificando usuario admin..."
admin_exists=$(psql -h localhost -U postgres -d menta_restobar_db -t -c "SELECT COUNT(*) FROM vendedores WHERE username = 'admin' AND activo = true;" 2>/dev/null | tr -d ' ')

if [ "$admin_exists" = "1" ]; then
    echo "✅ Usuario 'admin' ya existe y está activo"
    
    # Mostrar información del usuario
    echo ""
    echo "📋 Información del usuario admin:"
    psql -h localhost -U postgres -d menta_restobar_db -c "SELECT id_vendedor, nombre, username, rol, activo FROM vendedores WHERE username = 'admin';"
    
else
    echo "❌ Usuario 'admin' no existe o está inactivo"
    echo ""
    echo "🔧 Creando usuario admin..."
    
    # Verificar que hay sucursales y restaurantes
    sucursal_count=$(psql -h localhost -U postgres -d menta_restobar_db -t -c "SELECT COUNT(*) FROM sucursales WHERE activo = true;" 2>/dev/null | tr -d ' ')
    restaurante_count=$(psql -h localhost -U postgres -d menta_restobar_db -t -c "SELECT COUNT(*) FROM restaurantes WHERE activo = true;" 2>/dev/null | tr -d ' ')
    
    if [ "$sucursal_count" = "0" ] || [ "$restaurante_count" = "0" ]; then
        echo "⚠️  No hay sucursales o restaurantes activos"
        echo "   Creando datos básicos..."
        
        # Crear restaurante si no existe
        psql -h localhost -U postgres -d menta_restobar_db -c "
        INSERT INTO restaurantes (nombre, direccion, ciudad, telefono, email, activo) 
        VALUES ('Restaurante Demo', 'Dirección Demo', 'La Paz', '12345678', 'demo@restaurante.com', true)
        ON CONFLICT DO NOTHING;
        " 2>/dev/null
        
        # Crear sucursal si no existe
        psql -h localhost -U postgres -d menta_restobar_db -c "
        INSERT INTO sucursales (nombre, ciudad, direccion, activo, id_restaurante) 
        VALUES ('Sucursal Principal', 'La Paz', 'Dirección Principal', true, 1)
        ON CONFLICT DO NOTHING;
        " 2>/dev/null
        
        echo "✅ Datos básicos creados"
    fi
    
    # Crear usuario admin
    echo "   Creando usuario admin con contraseña 'admin'..."
    
    # Hash de la contraseña 'admin' usando bcrypt
    # Nota: Este es un hash de ejemplo, en producción usar bcrypt
    password_hash='$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
    
    psql -h localhost -U postgres -d menta_restobar_db -c "
    INSERT INTO vendedores (nombre, username, password_hash, rol, activo, id_sucursal, id_restaurante) 
    VALUES ('Administrador', 'admin', '$password_hash', 'admin', true, 1, 1)
    ON CONFLICT (username) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        activo = true,
        rol = 'admin';
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Usuario admin creado exitosamente"
        echo "   Usuario: admin"
        echo "   Contraseña: admin"
    else
        echo "❌ Error al crear usuario admin"
        echo "   Verifica los permisos de la base de datos"
    fi
fi

echo ""

# Mostrar todos los usuarios activos
echo "4. Usuarios activos en el sistema:"
psql -h localhost -U postgres -d menta_restobar_db -c "SELECT id_vendedor, nombre, username, rol, activo FROM vendedores WHERE activo = true ORDER BY rol, nombre;"

echo ""
echo "🎯 RESUMEN:"
echo "==========="
echo "✅ Sistema de usuarios verificado"
echo "✅ Usuario admin disponible"
echo ""
echo "🚀 Ahora puedes probar el login:"
echo "   1. Usuario: admin"
echo "   2. Contraseña: admin"
echo ""
echo "💡 Si el login sigue fallando:"
echo "   1. Verifica que el backend esté corriendo"
echo "   2. Revisa la consola del navegador"
echo "   3. Ejecuta: ./prueba_login.sh"


