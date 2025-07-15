#!/bin/bash

# Script de instalación automática para el backend
# Sistema POS - Restaurante Vegetariano

set -e  # Salir si hay algún error

echo "🚀 INICIANDO INSTALACIÓN AUTOMÁTICA DEL BACKEND..."
echo "=================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "setup_backend.js" ]; then
    print_error "No se encontró setup_backend.js"
    print_info "Asegúrate de ejecutar este script desde la raíz del proyecto"
    exit 1
fi

# 1. Ejecutar configuración inicial
print_info "Paso 1: Configurando archivos iniciales..."
node setup_backend.js

# 2. Verificar Node.js
print_info "Paso 2: Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    print_info "Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
print_status "Node.js $NODE_VERSION instalado"

# 3. Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi

NPM_VERSION=$(npm --version)
print_status "npm $NPM_VERSION instalado"

# 4. Verificar PostgreSQL
print_info "Paso 3: Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL CLI no está instalado"
    print_info "Instala PostgreSQL desde: https://www.postgresql.org/download/"
    print_info "Continuando sin verificación de BD..."
else
    PG_VERSION=$(psql --version | cut -d' ' -f3)
    print_status "PostgreSQL CLI $PG_VERSION instalado"
    
    # Intentar conectar a PostgreSQL
    if psql -U postgres -c "SELECT version();" &> /dev/null; then
        print_status "Conexión a PostgreSQL exitosa"
    else
        print_warning "No se pudo conectar a PostgreSQL automáticamente"
        print_info "Asegúrate de que PostgreSQL esté ejecutándose"
    fi
fi

# 5. Instalar dependencias del backend
print_info "Paso 4: Instalando dependencias del backend..."
cd vegetarian_restaurant_backend

if [ ! -f "package.json" ]; then
    print_error "package.json no encontrado en vegetarian_restaurant_backend/"
    exit 1
fi

print_info "Instalando dependencias con npm..."
npm install

if [ $? -eq 0 ]; then
    print_status "Dependencias instaladas correctamente"
else
    print_error "Error instalando dependencias"
    exit 1
fi

# 6. Verificar archivo .env
print_info "Paso 5: Verificando configuración..."
if [ ! -f ".env" ]; then
    print_error "Archivo .env no encontrado"
    print_info "Ejecuta 'node setup_backend.js' desde la raíz del proyecto"
    exit 1
fi

print_status "Archivo .env encontrado"

# 7. Verificar scripts SQL
print_info "Paso 6: Verificando archivos de migración..."
cd ..

MIGRATION_FILES=("create_mesa_tables.sql" "init_mesas.sql" "update_tipo_servicio_constraint.sql")
MISSING_FILES=()

for file in "${MIGRATION_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    else
        print_status "$file encontrado"
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    print_warning "Archivos faltantes: ${MISSING_FILES[*]}"
fi

# 8. Mostrar resumen final
echo ""
echo "=================================================="
print_status "INSTALACIÓN COMPLETADA"
echo "=================================================="

print_info "Próximos pasos:"
echo "1. Edita el archivo .env con tus credenciales reales:"
echo "   cd vegetarian_restaurant_backend"
echo "   nano .env  # o tu editor preferido"
echo ""
echo "2. Crea la base de datos PostgreSQL:"
echo "   psql -U postgres -c \"CREATE DATABASE menta_restobar_db;\""
echo ""
echo "3. Ejecuta las migraciones:"
echo "   psql -U postgres -d menta_restobar_db -f create_mesa_tables.sql"
echo ""
echo "4. Inicia el servidor:"
echo "   cd vegetarian_restaurant_backend"
echo "   npm start"
echo ""
echo "5. Verifica la instalación:"
echo "   node check_backend_startup.js"

print_status "¡Instalación completada exitosamente!" 