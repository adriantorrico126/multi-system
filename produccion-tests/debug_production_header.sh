#!/bin/bash

# Script para debuggear problemas del Header en producción
# Restaurante ID 10

echo "🔍 DEBUG HEADER PRODUCCIÓN - RESTAURANTE ID 10"
echo "=================================================="

# Variables
RESTAURANT_ID=10
API_BASE="https://tu-url-produccion.com/api/v1"  # Cambiar por URL real
USERNAME="test_user"  # Cambiar por usuario real
PASSWORD="test_password"  # Cambiar por password real

echo "📋 Configuración:"
echo "   Restaurant ID: $RESTAURANT_ID"
echo "   API Base: $API_BASE"
echo "   Usuario: $USERNAME"
echo ""

# Función para hacer requests autenticados
make_request() {
    local endpoint="$1"
    local method="$2"
    local data="$3"
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data" \
            "$API_BASE$endpoint"
    else
        curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            "$API_BASE$endpoint"
    fi
}

# 1. Test de Login
echo "🔐 1. PROBANDO LOGIN..."
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" \
    "$API_BASE/auth/login")

echo "Respuesta login:"
echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extraer token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo "✅ Token obtenido: ${TOKEN:0:20}..."
    
    # Extraer datos del usuario del login
    USER_NAME=$(echo "$LOGIN_RESPONSE" | jq -r '.data.nombre // "NO ENCONTRADO"' 2>/dev/null)
    USER_RESTAURANT=$(echo "$LOGIN_RESPONSE" | jq -r '.data.restaurante.nombre // "NO ENCONTRADO"' 2>/dev/null)
    USER_BRANCH=$(echo "$LOGIN_RESPONSE" | jq -r '.data.sucursal.nombre // "NO ENCONTRADO"' 2>/dev/null)
    USER_RESTAURANT_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.data.id_restaurante // "NO ENCONTRADO"' 2>/dev/null)
    
    echo "   Usuario: $USER_NAME"
    echo "   Restaurante: $USER_RESTAURANT"
    echo "   Sucursal: $USER_BRANCH"
    echo "   Restaurant ID: $USER_RESTAURANT_ID"
else
    echo "❌ No se obtuvo token válido"
    exit 1
fi

echo ""

# 2. Test de Refresh Token
echo "🔄 2. PROBANDO REFRESH TOKEN..."
REFRESH_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    "$API_BASE/auth/refresh")

echo "Respuesta refresh:"
echo "$REFRESH_RESPONSE" | jq . 2>/dev/null || echo "$REFRESH_RESPONSE"

# Extraer datos del usuario del refresh
REFRESH_USER_NAME=$(echo "$REFRESH_RESPONSE" | jq -r '.data.nombre // "NO ENCONTRADO"' 2>/dev/null)
REFRESH_USER_RESTAURANT=$(echo "$REFRESH_RESPONSE" | jq -r '.data.restaurante.nombre // "NO ENCONTRADO"' 2>/dev/null)
REFRESH_USER_BRANCH=$(echo "$REFRESH_RESPONSE" | jq -r '.data.sucursal.nombre // "NO ENCONTRADO"' 2>/dev/null)

echo "   Usuario: $REFRESH_USER_NAME"
echo "   Restaurante: $REFRESH_USER_RESTAURANT"
echo "   Sucursal: $REFRESH_USER_BRANCH"

echo ""

# 3. Test de datos del restaurante
echo "🏪 3. PROBANDO DATOS DEL RESTAURANTE $RESTAURANT_ID..."
RESTAURANT_RESPONSE=$(make_request "/restaurantes/$RESTAURANT_ID" "GET")

echo "Respuesta restaurante:"
echo "$RESTAURANT_RESPONSE" | jq . 2>/dev/null || echo "$RESTAURANT_RESPONSE"

# Extraer datos del restaurante
RESTAURANT_NAME=$(echo "$RESTAURANT_RESPONSE" | jq -r '.data.nombre // "NO ENCONTRADO"' 2>/dev/null)
RESTAURANT_CITY=$(echo "$RESTAURANT_RESPONSE" | jq -r '.data.ciudad // "NO ENCONTRADO"' 2>/dev/null)
RESTAURANT_ADDRESS=$(echo "$RESTAURANT_RESPONSE" | jq -r '.data.direccion // "NO ENCONTRADO"' 2>/dev/null)

echo "   Nombre: $RESTAURANT_NAME"
echo "   Ciudad: $RESTAURANT_CITY"
echo "   Dirección: $RESTAURANT_ADDRESS"

echo ""

# 4. Test de sucursales
echo "🏢 4. PROBANDO SUCURSALES DEL RESTAURANTE $RESTAURANT_ID..."
BRANCHES_RESPONSE=$(make_request "/sucursales/restaurante/$RESTAURANT_ID" "GET")

echo "Respuesta sucursales:"
echo "$BRANCHES_RESPONSE" | jq . 2>/dev/null || echo "$BRANCHES_RESPONSE"

echo ""

# 5. Test de datos del plan
echo "💎 5. PROBANDO DATOS DEL PLAN..."
PLAN_RESPONSE=$(make_request "/planes/restaurante/$RESTAURANT_ID/actual" "GET")

echo "Respuesta plan:"
echo "$PLAN_RESPONSE" | jq . 2>/dev/null || echo "$PLAN_RESPONSE"

# Extraer datos del plan
PLAN_NAME=$(echo "$PLAN_RESPONSE" | jq -r '.data.plan.nombre // "NO ENCONTRADO"' 2>/dev/null)
PLAN_STATUS=$(echo "$PLAN_RESPONSE" | jq -r '.data.suscripcion\?.estado // "NO ENCONTRADO"' 2>/dev/null)

echo "   Nombre del Plan: $PLAN_NAME"
echo "   Estado: $PLAN_STATUS"

echo ""

# 6. Análisis final
echo "📊 ANÁLISIS FINAL"
echo "=================="

echo ""
echo "🎯 COMPARACIÓN DE DATOS:"
echo "   Login Restaurant:     $USER_RESTAURANT"
echo "   Refresh Restaurant:   $REFRESH_USER_RESTAURANT"
echo "   BD Restaurant:        $RESTAURANT_NAME"
echo ""
echo "   Login Branch:         $USER_BRANCH"
echo "   Refresh Branch:       $REFRESH_USER_BRANCH"
echo ""
echo "   Plan Name:            $PLAN_NAME"
echo "   Plan Status:          $PLAN_STATUS"

echo ""
echo "🔍 DIAGNÓSTICO:"

if [ "$USER_RESTAURANT" = "NO ENCONTRADO" ]; then
    echo "❌ PROBLEMA: Login no incluye datos de restaurante"
elif [ "$REFRESH_USER_RESTAURANT" = "NO ENCONTRADO" ]; then
    echo "❌ PROBLEMA: Refresh no incluye datos de restaurante"
elif [ "$PLAN_NAME" = "NO ENCONTRADO" ]; then
    echo "❌ PROBLEMA: No se pueden obtener datos del plan"
elif [ "$USER_RESTAURANT" != "$REFRESH_USER_RESTAURANT" ]; then
    echo "❌ PROBLEMA: Inconsistencia entre login y refresh"
else
    echo "✅ Datos encontrados correctamente"
fi

echo ""
echo "🛠️ ACCIÓN RECOMENDADA:"
echo "1. Verificar que authController incluya restaurante en login/refresh"
echo "2. Verificar que AuthContext sincronize datos correctamente"
echo "3. Verificar que Header.tsx maneje datos undefined"
echo "4. Implementar refresh automático cuando faltan datos críticos"

echo ""
echo "🎯 PROBLEMA EN HEADER:"
echo "   El Header muestra 'Restaurante' porque:"
echo "   - user.restaurante?.nombre es undefined"
echo "   - Fallback a 'Restaurante' por defecto"
echo ""
echo "   Solución: Asegurar que authController incluya datos completos"
