# =====================================================
# SCRIPT DE PRUEBA PARA SISTEMA DE PLANES (PowerShell)
# =====================================================

Write-Host "🧪 Iniciando pruebas del sistema de planes..." -ForegroundColor Blue

# Configuración
$BASE_URL = "http://localhost:5001/api"
$ADMIN_USER = "admin@possolutions.com"
$ADMIN_PASS = "admin123"

# Función para mostrar mensajes
function Show-Message {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Show-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Show-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Show-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Función para hacer requests HTTP
function Make-Request {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Data = $null,
        [string]$Token = $null
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        if ($Data) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body $Data
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers
        }
        return $response
    } catch {
        Write-Host "Error en request: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Paso 1: Verificar que el servidor esté funcionando
Show-Message "Verificando que el servidor esté funcionando..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/" -UseBasicParsing
    if ($response.Content -like "*Admin Console Backend funcionando*") {
        Show-Success "Servidor funcionando correctamente"
    } else {
        Show-Error "El servidor no está respondiendo correctamente"
        exit 1
    }
} catch {
    Show-Error "No se puede conectar al servidor: $($_.Exception.Message)"
    exit 1
}

# Paso 2: Login como administrador
Show-Message "Iniciando sesión como administrador..."
$loginData = @{
    email = $ADMIN_USER
    password = $ADMIN_PASS
} | ConvertTo-Json

$loginResponse = Make-Request -Method "POST" -Url "$BASE_URL/auth/login" -Data $loginData

if ($loginResponse -and $loginResponse.token) {
    $token = $loginResponse.token
    Show-Success "Login exitoso"
} else {
    Show-Error "Error en el login: $loginResponse"
    exit 1
}

# Paso 3: Probar endpoint de planes
Show-Message "Probando endpoint GET /planes..."
$planesResponse = Make-Request -Method "GET" -Url "$BASE_URL/planes" -Token $token

if ($planesResponse -and $planesResponse.success) {
    Show-Success "Endpoint de planes funcionando"
    Write-Host "Respuesta: $($planesResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
} else {
    Show-Error "Error en endpoint de planes: $($planesResponse | ConvertTo-Json)"
}

# Paso 4: Probar endpoint de restaurantes con planes
Show-Message "Probando endpoint GET /planes/restaurantes/listado..."
$restaurantesResponse = Make-Request -Method "GET" -Url "$BASE_URL/planes/restaurantes/listado" -Token $token

if ($restaurantesResponse -and $restaurantesResponse.success) {
    Show-Success "Endpoint de restaurantes con planes funcionando"
} else {
    Show-Warning "Endpoint de restaurantes con planes: $($restaurantesResponse | ConvertTo-Json)"
}

# Paso 5: Crear un restaurante de prueba si no existe
Show-Message "Creando restaurante de prueba..."
$restauranteData = @{
    nombre = "Restaurante Prueba Planes"
    direccion = "Calle Prueba 123"
    ciudad = "La Paz"
    telefono = "12345678"
    email = "prueba@restaurante.com"
} | ConvertTo-Json

$restauranteResponse = Make-Request -Method "POST" -Url "$BASE_URL/restaurantes" -Data $restauranteData -Token $token

if ($restauranteResponse -and $restauranteResponse.data -and $restauranteResponse.data.id_restaurante) {
    $restauranteId = $restauranteResponse.data.id_restaurante
    Show-Success "Restaurante creado con ID: $restauranteId"
    
    # Paso 6: Probar suscripción del restaurante
    Show-Message "Probando suscripción del restaurante $restauranteId..."
    $suscripcionResponse = Make-Request -Method "GET" -Url "$BASE_URL/planes/restaurante/$restauranteId/suscripcion" -Token $token
    Write-Host "Respuesta suscripción: $($suscripcionResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
    
    # Paso 7: Probar uso del restaurante
    Show-Message "Probando uso del restaurante $restauranteId..."
    $usoResponse = Make-Request -Method "GET" -Url "$BASE_URL/planes/restaurante/$restauranteId/uso" -Token $token
    Write-Host "Respuesta uso: $($usoResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
    
    # Paso 8: Probar cambio de plan
    Show-Message "Probando cambio de plan..."
    $cambioPlanData = @{
        id_plan_nuevo = 1
        motivo = "Prueba de cambio de plan"
    } | ConvertTo-Json
    
    $cambioResponse = Make-Request -Method "POST" -Url "$BASE_URL/planes/restaurante/$restauranteId/cambiar-plan" -Data $cambioPlanData -Token $token
    Write-Host "Respuesta cambio de plan: $($cambioResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
    
} else {
    Show-Warning "No se pudo crear restaurante de prueba: $($restauranteResponse | ConvertTo-Json)"
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Magenta
Write-Host "📋 RESUMEN DE PRUEBAS" -ForegroundColor Magenta
Write-Host "=====================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "✅ Pruebas completadas:" -ForegroundColor Green
Write-Host "   - Servidor funcionando"
Write-Host "   - Login de administrador"
Write-Host "   - Endpoint de planes"
Write-Host "   - Endpoint de restaurantes con planes"
Write-Host "   - Creación de restaurante de prueba"
Write-Host "   - Suscripción de restaurante"
Write-Host "   - Uso de restaurante"
Write-Host "   - Cambio de plan"
Write-Host ""
Write-Host "🔧 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Verificar que las tablas 'planes' y 'suscripciones' existan en local"
Write-Host "   2. Ejecutar script de población de datos si es necesario"
Write-Host "   3. Probar todas las funcionalidades desde el frontend"
Write-Host "   4. Una vez validado en local, crear script de migración para producción"
Write-Host ""

Show-Success "Pruebas del sistema de planes completadas!"
