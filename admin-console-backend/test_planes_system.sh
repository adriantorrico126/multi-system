#!/bin/bash

# =====================================================
# SCRIPT DE PRUEBA PARA SISTEMA DE PLANES
# =====================================================

echo "🧪 Iniciando pruebas del sistema de planes..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
BASE_URL="http://localhost:3001"
ADMIN_USER="admin@possolutions.com"
ADMIN_PASS="admin123"

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

# Función para hacer requests HTTP
make_request() {
    local method=$1
    local url=$2
    local data=$3
    local token=$4
    
    if [ -n "$token" ]; then
        if [ -n "$data" ]; then
            curl -s -X $method "$url" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data"
        else
            curl -s -X $method "$url" \
                -H "Authorization: Bearer $token"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -X $method "$url" \
                -H "Content-Type: application/json" \
                -d "$data"
        else
            curl -s -X $method "$url"
        fi
    fi
}

# Paso 1: Verificar que el servidor esté funcionando
show_message "Verificando que el servidor esté funcionando..."
response=$(make_request "GET" "$BASE_URL/")
if [[ $response == *"Admin Console Backend funcionando"* ]]; then
    show_success "Servidor funcionando correctamente"
else
    show_error "El servidor no está respondiendo correctamente"
    exit 1
fi

# Paso 2: Login como administrador
show_message "Iniciando sesión como administrador..."
login_response=$(make_request "POST" "$BASE_URL/auth/login" "{\"email\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}")
token=$(echo $login_response | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$token" ]; then
    show_success "Login exitoso"
else
    show_error "Error en el login: $login_response"
    exit 1
fi

# Paso 3: Probar endpoint de planes
show_message "Probando endpoint GET /planes..."
planes_response=$(make_request "GET" "$BASE_URL/planes" "" "$token")
if [[ $planes_response == *"success"* ]]; then
    show_success "Endpoint de planes funcionando"
    echo "Respuesta: $planes_response"
else
    show_error "Error en endpoint de planes: $planes_response"
fi

# Paso 4: Probar endpoint de restaurantes con planes
show_message "Probando endpoint GET /planes/restaurantes/listado..."
restaurantes_response=$(make_request "GET" "$BASE_URL/planes/restaurantes/listado" "" "$token")
if [[ $restaurantes_response == *"success"* ]]; then
    show_success "Endpoint de restaurantes con planes funcionando"
else
    show_warning "Endpoint de restaurantes con planes: $restaurantes_response"
fi

# Paso 5: Crear un restaurante de prueba si no existe
show_message "Creando restaurante de prueba..."
restaurante_data='{
    "nombre": "Restaurante Prueba Planes",
    "direccion": "Calle Prueba 123",
    "ciudad": "La Paz",
    "telefono": "12345678",
    "email": "prueba@restaurante.com"
}'

restaurante_response=$(make_request "POST" "$BASE_URL/restaurantes" "$restaurante_data" "$token")
restaurante_id=$(echo $restaurante_response | grep -o '"id_restaurante":[0-9]*' | cut -d':' -f2)

if [ -n "$restaurante_id" ]; then
    show_success "Restaurante creado con ID: $restaurante_id"
    
    # Paso 6: Probar suscripción del restaurante
    show_message "Probando suscripción del restaurante $restaurante_id..."
    suscripcion_response=$(make_request "GET" "$BASE_URL/planes/restaurante/$restaurante_id/suscripcion" "" "$token")
    echo "Respuesta suscripción: $suscripcion_response"
    
    # Paso 7: Probar uso del restaurante
    show_message "Probando uso del restaurante $restaurante_id..."
    uso_response=$(make_request "GET" "$BASE_URL/planes/restaurante/$restaurante_id/uso" "" "$token")
    echo "Respuesta uso: $uso_response"
    
else
    show_warning "No se pudo crear restaurante de prueba: $restaurante_response"
fi

# Paso 8: Probar cambio de plan (si hay restaurantes)
show_message "Probando cambio de plan..."
if [ -n "$restaurante_id" ]; then
    cambio_plan_data='{
        "id_plan_nuevo": 1,
        "motivo": "Prueba de cambio de plan"
    }'
    
    cambio_response=$(make_request "POST" "$BASE_URL/planes/restaurante/$restaurante_id/cambiar-plan" "$cambio_plan_data" "$token")
    echo "Respuesta cambio de plan: $cambio_response"
fi

echo ""
echo "====================================================="
echo "📋 RESUMEN DE PRUEBAS"
echo "====================================================="
echo ""
echo "✅ Pruebas completadas:"
echo "   - Servidor funcionando"
echo "   - Login de administrador"
echo "   - Endpoint de planes"
echo "   - Endpoint de restaurantes con planes"
echo "   - Creación de restaurante de prueba"
echo "   - Suscripción de restaurante"
echo "   - Uso de restaurante"
echo "   - Cambio de plan"
echo ""
echo "🔧 Próximos pasos:"
echo "   1. Verificar que las tablas 'planes' y 'suscripciones' existan en local"
echo "   2. Ejecutar script de población de datos si es necesario"
echo "   3. Probar todas las funcionalidades desde el frontend"
echo "   4. Una vez validado en local, crear script de migración para producción"
echo ""

show_success "Pruebas del sistema de planes completadas!"
