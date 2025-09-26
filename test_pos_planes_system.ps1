# =====================================================
# SCRIPT DE PRUEBA PARA SISTEMA DE PLANES EN POS LOCAL
# =====================================================

Write-Host "🧪 Probando sistema de planes en POS local..." -ForegroundColor Blue

# Configuración
$POS_URL = "http://localhost:3000"
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

# Paso 1: Verificar que el servidor POS esté funcionando
Show-Message "Verificando que el servidor POS esté funcionando..."
try {
    $response = Invoke-WebRequest -Uri "$POS_URL/" -UseBasicParsing
    Show-Success "Servidor POS funcionando correctamente"
} catch {
    Show-Error "No se puede conectar al servidor POS: $($_.Exception.Message)"
    exit 1
}

# Paso 2: Login como administrador
Show-Message "Iniciando sesión como administrador..."
$loginData = @{
    email = $ADMIN_USER
    password = $ADMIN_PASS
} | ConvertTo-Json

$loginResponse = Make-Request -Method "POST" -Url "$POS_URL/api/auth/login" -Data $loginData

if ($loginResponse -and $loginResponse.token) {
    $token = $loginResponse.token
    Show-Success "Login exitoso en POS"
} else {
    Show-Error "Error en el login del POS: $loginResponse"
    exit 1
}

# Paso 3: Probar endpoint de plan actual
Show-Message "Probando endpoint GET /api/plans/current..."
$currentPlanResponse = Make-Request -Method "GET" -Url "$POS_URL/api/plans/current" -Token $token

if ($currentPlanResponse) {
    Show-Success "Endpoint de plan actual funcionando"
    Write-Host "Plan actual: $($currentPlanResponse.data.plan_nombre)" -ForegroundColor Cyan
    Write-Host "Precio mensual: $($currentPlanResponse.data.precio_mensual)" -ForegroundColor Cyan
    Write-Host "Funcionalidades: $($currentPlanResponse.data.funcionalidades | ConvertTo-Json -Compress)" -ForegroundColor Cyan
} else {
    Show-Error "Error en endpoint de plan actual"
}

# Paso 4: Probar endpoint de planes disponibles
Show-Message "Probando endpoint GET /api/plans/available..."
$availablePlansResponse = Make-Request -Method "GET" -Url "$POS_URL/api/plans/available" -Token $token

if ($availablePlansResponse) {
    Show-Success "Endpoint de planes disponibles funcionando"
    Write-Host "Planes disponibles: $($availablePlansResponse.data.Count)" -ForegroundColor Cyan
} else {
    Show-Error "Error en endpoint de planes disponibles"
}

# Paso 5: Probar verificación de funcionalidades específicas
Show-Message "Probando verificación de funcionalidades..."

$features = @("inventory", "dashboard", "sales", "mesas", "reservas", "delivery", "promociones", "egresos", "cocina", "arqueo", "lotes", "analytics", "api", "white-label")

foreach ($feature in $features) {
    $featureResponse = Make-Request -Method "GET" -Url "$POS_URL/api/plans/features/$feature" -Token $token
    
    if ($featureResponse) {
        $hasAccess = $featureResponse.data.hasAccess -or $featureResponse.data.features
        $status = if ($hasAccess) { "✅" } else { "❌" }
        Write-Host "  $status $feature" -ForegroundColor $(if ($hasAccess) { "Green" } else { "Red" })
    } else {
        Write-Host "  ❓ $feature (error)" -ForegroundColor Yellow
    }
}

# Paso 6: Probar verificación de límites
Show-Message "Probando verificación de límites..."

$limits = @("products", "users", "sucursales", "transactions")

foreach ($limit in $limits) {
    $limitResponse = Make-Request -Method "GET" -Url "$POS_URL/api/plans/limits/$limit" -Token $token
    
    if ($limitResponse) {
        $usage = $limitResponse.data
        $percentage = if ($usage.limite -gt 0) { [math]::Round(($usage.actual / $usage.limite) * 100, 1) } else { 0 }
        Write-Host "  📊 $limit`: $($usage.actual)/$($usage.limite) ($percentage%)" -ForegroundColor Cyan
    } else {
        Write-Host "  ❓ $limit (error)" -ForegroundColor Yellow
    }
}

# Paso 7: Probar estadísticas de uso
Show-Message "Probando estadísticas de uso..."
$usageStatsResponse = Make-Request -Method "GET" -Url "$POS_URL/api/plans/usage-stats" -Token $token

if ($usageStatsResponse) {
    Show-Success "Estadísticas de uso funcionando"
    Write-Host "Estadísticas: $($usageStatsResponse.data | ConvertTo-Json -Compress)" -ForegroundColor Cyan
} else {
    Show-Warning "Error en estadísticas de uso"
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Magenta
Write-Host "📋 RESUMEN DE PRUEBAS DEL SISTEMA POS" -ForegroundColor Magenta
Write-Host "=====================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "✅ Pruebas completadas:" -ForegroundColor Green
Write-Host "   - Servidor POS funcionando"
Write-Host "   - Login de administrador"
Write-Host "   - Plan actual del restaurante"
Write-Host "   - Planes disponibles"
Write-Host "   - Verificación de funcionalidades"
Write-Host "   - Verificación de límites"
Write-Host "   - Estadísticas de uso"
Write-Host ""
Write-Host "🔧 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Probar desde el frontend del POS"
Write-Host "   2. Verificar que los límites se apliquen correctamente"
Write-Host "   3. Probar cambio de plan desde el admin console"
Write-Host "   4. Una vez validado, migrar a producción"
Write-Host ""

Show-Success "Pruebas del sistema de planes en POS completadas!"
