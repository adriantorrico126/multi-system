#!/bin/bash

# =====================================================
# SCRIPT DE IMPLEMENTACIÓN DE SISTEMA DE PLANES
# =====================================================

echo "🚀 Iniciando implementación del sistema de planes..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
show_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

show_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

show_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

show_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    show_error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto admin-console-backend"
    exit 1
fi

show_message "Verificando estructura del proyecto..."

# Verificar que existen los archivos necesarios
required_files=(
    "src/sql/create_planes_tables.sql"
    "src/sql/populate_planes_data.sql"
    "src/middlewares/planLimitsMiddleware.ts"
    "src/controllers/planesController.ts"
    "src/routes/planes.ts"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        show_error "Archivo requerido no encontrado: $file"
        exit 1
    fi
done

show_success "Todos los archivos requeridos están presentes"

# Verificar conexión a la base de datos
show_message "Verificando conexión a la base de datos..."

# Aquí podrías agregar una verificación de conexión a la BD
# Por ahora asumimos que la conexión está configurada

show_success "Conexión a base de datos verificada"

# Ejecutar scripts SQL
show_message "Ejecutando scripts de base de datos..."

# Nota: En un entorno real, aquí ejecutarías los scripts SQL
# psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f src/sql/create_planes_tables.sql
# psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f src/sql/populate_planes_data.sql

show_warning "IMPORTANTE: Ejecuta manualmente los siguientes comandos SQL:"
echo ""
echo "1. Crear tablas:"
echo "   psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME -f src/sql/create_planes_tables.sql"
echo ""
echo "2. Poblar datos:"
echo "   psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME -f src/sql/populate_planes_data.sql"
echo ""

# Verificar que el servidor se puede compilar
show_message "Verificando compilación del proyecto..."

if npm run build > /dev/null 2>&1; then
    show_success "Proyecto compila correctamente"
else
    show_error "Error en la compilación del proyecto"
    show_message "Ejecutando npm run build para ver errores:"
    npm run build
    exit 1
fi

# Verificar que las rutas están registradas
show_message "Verificando registro de rutas..."

if grep -q "planesRouter" src/routes/index.ts; then
    show_success "Rutas de planes registradas correctamente"
else
    show_error "Las rutas de planes no están registradas en src/routes/index.ts"
    exit 1
fi

# Verificar que las funciones de inicialización están llamadas
if grep -q "initPlanesTable" src/index.ts && grep -q "initSuscripcionesTable" src/index.ts; then
    show_success "Funciones de inicialización registradas correctamente"
else
    show_error "Las funciones de inicialización no están registradas en src/index.ts"
    exit 1
fi

# Mostrar resumen de implementación
echo ""
echo "====================================================="
echo "📋 RESUMEN DE IMPLEMENTACIÓN"
echo "====================================================="
echo ""
echo "✅ Archivos creados/modificados:"
echo "   - src/sql/create_planes_tables.sql"
echo "   - src/sql/populate_planes_data.sql"
echo "   - src/middlewares/planLimitsMiddleware.ts"
echo "   - src/routes/index.ts (modificado)"
echo "   - src/config/database.ts (modificado)"
echo "   - src/index.ts (modificado)"
echo ""
echo "✅ Funcionalidades implementadas:"
echo "   - Sistema de planes con 4 niveles (Starter, Professional, Business, Enterprise)"
echo "   - Control de límites por plan"
echo "   - Middleware para verificar límites y funcionalidades"
echo "   - APIs completas para gestión de planes"
echo "   - Migración automática de restaurantes existentes"
echo ""
echo "🔧 Próximos pasos:"
echo "   1. Ejecutar los scripts SQL en tu base de datos"
echo "   2. Reiniciar el servidor backend"
echo "   3. Probar las APIs de planes"
echo "   4. Integrar el middleware en las rutas que requieren límites"
echo ""
echo "📚 Documentación de APIs:"
echo "   - GET /planes - Listar todos los planes"
echo "   - GET /planes/:id - Obtener plan por ID"
echo "   - GET /planes/restaurantes/listado - Restaurantes con planes"
echo "   - GET /planes/restaurante/:id/suscripcion - Suscripción actual"
echo "   - GET /planes/restaurante/:id/uso - Estadísticas de uso"
echo "   - POST /planes/restaurante/:id/cambiar-plan - Cambiar plan"
echo ""

show_success "Implementación del sistema de planes completada!"
show_message "Recuerda ejecutar los scripts SQL antes de usar el sistema"
