#!/bin/bash

echo "🔍 DIAGNÓSTICO DEL SISTEMA DE AUTENTICACIÓN"
echo "=========================================="
echo ""

# Verificar que el backend esté corriendo
echo "1. Verificando estado del backend..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend corriendo en puerto 3000"
else
    echo "❌ Backend NO está corriendo en puerto 3000"
    echo ""
    echo "🚀 Para iniciar el backend:"
    echo "   cd sistema-pos/vegetarian_restaurant_backend"
    echo "   npm start"
    echo ""
    echo "O si prefieres usar nodemon:"
    echo "   npm run dev"
    echo ""
    exit 1
fi

echo ""

# Verificar endpoints específicos
echo "2. Verificando endpoints de autenticación..."

# Verificar endpoint de login
echo "   - Endpoint de login:"
if curl -s -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' \
    | grep -q "Usuario o contraseña incorrectos"; then
    echo "     ✅ POST /api/v1/auth/login - Funcionando"
else
    echo "     ❌ POST /api/v1/auth/login - Error"
fi

# Verificar endpoint de validación
echo "   - Endpoint de validación:"
if curl -s http://localhost:3000/api/v1/auth/validate \
    | grep -q "Unauthorized"; then
    echo "     ✅ GET /api/v1/auth/validate - Funcionando"
else
    echo "     ❌ GET /api/v1/auth/validate - Error"
fi

echo ""

# Verificar configuración del frontend
echo "3. Verificando configuración del frontend..."
cd sistema-pos/menta-resto-system-pro

if [ -f ".env" ]; then
    echo "✅ Archivo .env encontrado"
    echo "   Contenido:"
    cat .env | grep VITE_BACKEND_URL || echo "   No hay VITE_BACKEND_URL configurado"
else
    echo "⚠️  Archivo .env no encontrado"
    echo "   Creando archivo .env básico..."
    echo "VITE_BACKEND_URL=http://localhost:3000/api/v1" > .env
    echo "✅ Archivo .env creado"
fi

echo ""

# Verificar que el frontend esté corriendo
echo "4. Verificando estado del frontend..."
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Frontend corriendo en puerto 8080"
else
    echo "❌ Frontend NO está corriendo en puerto 8080"
    echo ""
    echo "🚀 Para iniciar el frontend:"
    echo "   cd sistema-pos/menta-resto-system-pro"
    echo "   npm run dev"
    echo ""
fi

echo ""

# Verificar usuarios en la base de datos
echo "5. Verificando usuarios en la base de datos..."
echo "   (Esto requiere acceso a la base de datos)"
echo "   Para verificar manualmente:"
echo "   psql -h localhost -U postgres -d menta_restobar_db"
echo "   SELECT id_vendedor, nombre, username, rol, activo FROM vendedores WHERE activo = true;"

echo ""

# Crear script de prueba de login
echo "6. Creando script de prueba de login..."
cat > test_login.js << 'EOF'
const axios = require('axios');

async function testLogin() {
    try {
        console.log('🔍 Probando login...');
        
        const response = await axios.post('http://localhost:3000/api/v1/auth/login', {
            username: 'admin',
            password: 'admin'
        });
        
        console.log('✅ Login exitoso!');
        console.log('Token:', response.data.token ? 'Presente' : 'Ausente');
        console.log('Usuario:', response.data.data.nombre);
        console.log('Rol:', response.data.data.rol);
        
    } catch (error) {
        console.log('❌ Error en login:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Mensaje:', error.response.data.message);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testLogin();
EOF

echo "✅ Script de prueba creado: test_login.js"
echo "   Para ejecutar: node test_login.js"

echo ""

echo "🎯 RESUMEN DEL DIAGNÓSTICO"
echo "=========================="
echo ""
echo "Si el backend está corriendo pero el login falla:"
echo "1. Verifica que hay usuarios activos en la base de datos"
echo "2. Usa las credenciales correctas (usuario: admin, contraseña: admin)"
echo "3. Revisa la consola del navegador para errores específicos"
echo "4. Verifica que no hay problemas de CORS"
echo ""
echo "Si el frontend no puede conectar:"
echo "1. Asegúrate de que el backend esté corriendo en puerto 3000"
echo "2. Verifica la configuración de VITE_BACKEND_URL"
echo "3. Revisa la consola del navegador para errores de red"
echo ""
echo "🔧 SOLUCIÓN RÁPIDA:"
echo "1. Reinicia el backend: Ctrl+C y npm start"
echo "2. Reinicia el frontend: Ctrl+C y npm run dev"
echo "3. Limpia el caché del navegador: Ctrl+Shift+R"
echo ""
