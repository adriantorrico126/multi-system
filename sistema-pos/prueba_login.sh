#!/bin/bash

echo "🧪 PRUEBA RÁPIDA DEL SISTEMA DE LOGIN"
echo "===================================="
echo ""

# Verificar que el backend esté corriendo
echo "1. Verificando backend..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend corriendo"
else
    echo "❌ Backend no está corriendo"
    echo "   Inicia el backend primero:"
    echo "   cd sistema-pos/vegetarian_restaurant_backend"
    echo "   npm start"
    exit 1
fi

echo ""

# Probar login con credenciales por defecto
echo "2. Probando login..."
echo "   Usuario: admin"
echo "   Contraseña: admin"
echo ""

response=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin"}')

if echo "$response" | grep -q "Login exitoso"; then
    echo "✅ Login exitoso!"
    echo "   Token generado: $(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 | cut -c1-20)..."
    echo "   Usuario: $(echo "$response" | grep -o '"nombre":"[^"]*"' | cut -d'"' -f4)"
    echo "   Rol: $(echo "$response" | grep -o '"rol":"[^"]*"' | cut -d'"' -f4)"
else
    echo "❌ Login falló"
    echo "   Respuesta: $response"
    echo ""
    echo "🔍 Posibles causas:"
    echo "   - Usuario 'admin' no existe en la base de datos"
    echo "   - Contraseña incorrecta"
    echo "   - Usuario inactivo"
    echo ""
    echo "💡 Para crear un usuario admin:"
    echo "   psql -h localhost -U postgres -d menta_restobar_db"
    echo "   INSERT INTO vendedores (nombre, username, password_hash, rol, activo, id_sucursal, id_restaurante) VALUES ('Admin', 'admin', '\$2b\$10\$...', 'admin', true, 1, 1);"
fi

echo ""

# Probar endpoint de validación
echo "3. Probando endpoint de validación..."
if curl -s http://localhost:3000/api/v1/auth/validate | grep -q "Unauthorized"; then
    echo "✅ Endpoint de validación funcionando"
else
    echo "❌ Endpoint de validación no funciona"
fi

echo ""

echo "🎯 RESUMEN:"
echo "==========="
if echo "$response" | grep -q "Login exitoso"; then
    echo "✅ Sistema de login funcionando correctamente"
    echo "✅ Backend respondiendo"
    echo "✅ Endpoints configurados"
    echo ""
    echo "🚀 El problema puede estar en el frontend:"
    echo "   1. Verifica que el frontend esté corriendo en puerto 8080"
    echo "   2. Revisa la consola del navegador para errores"
    echo "   3. Asegúrate de que VITE_BACKEND_URL esté configurado"
    echo "   4. Limpia el caché del navegador (Ctrl+Shift+R)"
else
    echo "❌ Problema en el backend o base de datos"
    echo "   1. Verifica que la base de datos esté corriendo"
    echo "   2. Asegúrate de que hay usuarios en la tabla vendedores"
    echo "   3. Verifica las credenciales de la base de datos"
fi

echo "🧪 PRUEBA RÁPIDA DEL SISTEMA DE LOGIN"
echo "===================================="
echo ""

# Verificar que el backend esté corriendo
echo "1. Verificando backend..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend corriendo"
else
    echo "❌ Backend no está corriendo"
    echo "   Inicia el backend primero:"
    echo "   cd sistema-pos/vegetarian_restaurant_backend"
    echo "   npm start"
    exit 1
fi

echo ""

# Probar login con credenciales por defecto
echo "2. Probando login..."
echo "   Usuario: admin"
echo "   Contraseña: admin"
echo ""

response=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin"}')

if echo "$response" | grep -q "Login exitoso"; then
    echo "✅ Login exitoso!"
    echo "   Token generado: $(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 | cut -c1-20)..."
    echo "   Usuario: $(echo "$response" | grep -o '"nombre":"[^"]*"' | cut -d'"' -f4)"
    echo "   Rol: $(echo "$response" | grep -o '"rol":"[^"]*"' | cut -d'"' -f4)"
else
    echo "❌ Login falló"
    echo "   Respuesta: $response"
    echo ""
    echo "🔍 Posibles causas:"
    echo "   - Usuario 'admin' no existe en la base de datos"
    echo "   - Contraseña incorrecta"
    echo "   - Usuario inactivo"
    echo ""
    echo "💡 Para crear un usuario admin:"
    echo "   psql -h localhost -U postgres -d menta_restobar_db"
    echo "   INSERT INTO vendedores (nombre, username, password_hash, rol, activo, id_sucursal, id_restaurante) VALUES ('Admin', 'admin', '\$2b\$10\$...', 'admin', true, 1, 1);"
fi

echo ""

# Probar endpoint de validación
echo "3. Probando endpoint de validación..."
if curl -s http://localhost:3000/api/v1/auth/validate | grep -q "Unauthorized"; then
    echo "✅ Endpoint de validación funcionando"
else
    echo "❌ Endpoint de validación no funciona"
fi

echo ""

echo "🎯 RESUMEN:"
echo "==========="
if echo "$response" | grep -q "Login exitoso"; then
    echo "✅ Sistema de login funcionando correctamente"
    echo "✅ Backend respondiendo"
    echo "✅ Endpoints configurados"
    echo ""
    echo "🚀 El problema puede estar en el frontend:"
    echo "   1. Verifica que el frontend esté corriendo en puerto 8080"
    echo "   2. Revisa la consola del navegador para errores"
    echo "   3. Asegúrate de que VITE_BACKEND_URL esté configurado"
    echo "   4. Limpia el caché del navegador (Ctrl+Shift+R)"
else
    echo "❌ Problema en el backend o base de datos"
    echo "   1. Verifica que la base de datos esté corriendo"
    echo "   2. Asegúrate de que hay usuarios en la tabla vendedores"
    echo "   3. Verifica las credenciales de la base de datos"
fi


