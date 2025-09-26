# Script simple para probar sistema de planes en POS
Write-Host "Probando sistema de planes en POS local..." -ForegroundColor Blue

$POS_URL = "http://localhost:3000"
$ADMIN_USER = "admin@possolutions.com"
$ADMIN_PASS = "admin123"

# Login
Write-Host "Iniciando sesion..." -ForegroundColor Yellow
$loginData = @{
    email = $ADMIN_USER
    password = $ADMIN_PASS
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$POS_URL/api/auth/login" -Method "POST" -ContentType "application/json" -Body $loginData
    $token = $loginResponse.token
    Write-Host "Login exitoso!" -ForegroundColor Green
} catch {
    Write-Host "Error en login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Probar plan actual
Write-Host "Probando plan actual..." -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $token" }
    $currentPlan = Invoke-RestMethod -Uri "$POS_URL/api/plans/current" -Method "GET" -Headers $headers
    Write-Host "Plan actual: $($currentPlan.data.plan_nombre)" -ForegroundColor Green
    Write-Host "Precio: $($currentPlan.data.precio_mensual)" -ForegroundColor Green
} catch {
    Write-Host "Error en plan actual: $($_.Exception.Message)" -ForegroundColor Red
}

# Probar funcionalidades
Write-Host "Probando funcionalidades..." -ForegroundColor Yellow
$features = @("inventory", "mesas", "delivery", "reservas")

foreach ($feature in $features) {
    try {
        $featureResponse = Invoke-RestMethod -Uri "$POS_URL/api/plans/features/$feature" -Method "GET" -Headers $headers
        $hasAccess = $featureResponse.data.hasAccess -or $featureResponse.data.features
        $status = if ($hasAccess) { "SI" } else { "NO" }
        Write-Host "  $feature : $status" -ForegroundColor $(if ($hasAccess) { "Green" } else { "Red" })
    } catch {
        Write-Host "  $feature : ERROR" -ForegroundColor Yellow
    }
}

Write-Host "Pruebas completadas!" -ForegroundColor Green
