#!/bin/bash

echo "🔍 VERIFICACIÓN DEL TOKEN JWT"
echo "============================="
echo ""

# Verificar que el backend esté corriendo
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "❌ Backend no está corriendo"
    exit 1
fi

echo "✅ Backend corriendo"
echo ""

# Hacer login y obtener token
echo "1. Obteniendo token de login..."
login_response=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin"}')

if echo "$login_response" | grep -q "Login exitoso"; then
    echo "✅ Login exitoso"
    
    # Extraer token
    token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Token obtenido: ${token:0:20}..."
    
    # Probar endpoint de validación
    echo ""
    echo "2. Probando endpoint de validación..."
    validate_response=$(curl -s -H "Authorization: Bearer $token" \
        http://localhost:3000/api/v1/auth/validate)
    
    if echo "$validate_response" | grep -q "Token válido"; then
        echo "✅ Token válido"
    else
        echo "❌ Token inválido"
        echo "Respuesta: $validate_response"
    fi
    
    # Probar endpoint de productos
    echo ""
    echo "3. Probando endpoint de productos..."
    productos_response=$(curl -s -H "Authorization: Bearer $token" \
        "http://localhost:3000/api/v1/productos?id_restaurante=1")
    
    if echo "$productos_response" | grep -q "productos"; then
        echo "✅ Productos obtenidos correctamente"
        echo "Respuesta: $(echo "$productos_response" | head -c 100)..."
    else
        echo "❌ Error al obtener productos"
        echo "Respuesta: $productos_response"
    fi
    
    # Probar endpoint de cocina
    echo ""
    echo "4. Probando endpoint de cocina..."
    cocina_response=$(curl -s -H "Authorization: Bearer $token" \
        "http://localhost:3000/api/v1/ventas/cocina?id_restaurante=1")
    
    if echo "$cocina_response" | grep -q "ventas\|pedidos\|[]"; then
        echo "✅ Endpoint de cocina funcionando"
        echo "Respuesta: $(echo "$cocina_response" | head -c 100)..."
    else
        echo "❌ Error en endpoint de cocina"
        echo "Respuesta: $cocina_response"
    fi
    
else
    echo "❌ Login falló"
    echo "Respuesta: $login_response"
fi

echo ""
echo "🎯 RESUMEN:"
echo "==========="
echo "Si todos los endpoints funcionan con curl pero fallan en el frontend:"
echo "1. El problema está en el interceptor de Axios"
echo "2. Verifica que el token se esté enviando correctamente"
echo "3. Revisa la consola del navegador para errores específicos"
echo ""
echo "Si los endpoints fallan también con curl:"
echo "1. El problema está en el backend"
echo "2. Verifica la configuración de la base de datos"
echo "3. Revisa los logs del backend"
