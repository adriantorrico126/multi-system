#!/bin/bash

echo "🔧 CONFIGURANDO VARIABLES DE ENTORNO DEL FRONTEND"
echo "================================================"
echo ""

cd sistema-pos/menta-resto-system-pro

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo .env..."
    cat > .env << 'EOF'
# Configuración del Frontend - Sistema POS
VITE_BACKEND_URL=http://localhost:3000/api/v1
VITE_PORT=8080
VITE_NODE_ENV=development
VITE_APP_NAME=Sistema POS MultiServe
VITE_APP_VERSION=1.0.0
VITE_JWT_STORAGE_KEY=jwtToken
VITE_USER_STORAGE_KEY=currentUser
VITE_PRINT_SERVER_URL=http://localhost:3001
VITE_ANALYTICS_ENABLED=true
EOF
    echo "✅ Archivo .env creado"
else
    echo "✅ Archivo .env ya existe"
fi

echo ""
echo "📋 Contenido del archivo .env:"
cat .env

echo ""
echo "🔍 Verificando configuración..."

# Verificar que VITE_BACKEND_URL esté configurado
if grep -q "VITE_BACKEND_URL=http://localhost:3000/api/v1" .env; then
    echo "✅ VITE_BACKEND_URL configurado correctamente"
else
    echo "❌ VITE_BACKEND_URL no está configurado correctamente"
fi

echo ""
echo "🚀 Para aplicar los cambios:"
echo "1. Reinicia el servidor de desarrollo:"
echo "   Ctrl+C (si está corriendo)"
echo "   npm run dev"
echo ""
echo "2. O si prefieres, reinicia completamente:"
echo "   npm run dev"
echo ""
echo "✅ Configuración completada!"

echo "🔧 CONFIGURANDO VARIABLES DE ENTORNO DEL FRONTEND"
echo "================================================"
echo ""

cd sistema-pos/menta-resto-system-pro

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo .env..."
    cat > .env << 'EOF'
# Configuración del Frontend - Sistema POS
VITE_BACKEND_URL=http://localhost:3000/api/v1
VITE_PORT=8080
VITE_NODE_ENV=development
VITE_APP_NAME=Sistema POS MultiServe
VITE_APP_VERSION=1.0.0
VITE_JWT_STORAGE_KEY=jwtToken
VITE_USER_STORAGE_KEY=currentUser
VITE_PRINT_SERVER_URL=http://localhost:3001
VITE_ANALYTICS_ENABLED=true
EOF
    echo "✅ Archivo .env creado"
else
    echo "✅ Archivo .env ya existe"
fi

echo ""
echo "📋 Contenido del archivo .env:"
cat .env

echo ""
echo "🔍 Verificando configuración..."

# Verificar que VITE_BACKEND_URL esté configurado
if grep -q "VITE_BACKEND_URL=http://localhost:3000/api/v1" .env; then
    echo "✅ VITE_BACKEND_URL configurado correctamente"
else
    echo "❌ VITE_BACKEND_URL no está configurado correctamente"
fi

echo ""
echo "🚀 Para aplicar los cambios:"
echo "1. Reinicia el servidor de desarrollo:"
echo "   Ctrl+C (si está corriendo)"
echo "   npm run dev"
echo ""
echo "2. O si prefieres, reinicia completamente:"
echo "   npm run dev"
echo ""
echo "✅ Configuración completada!"


























