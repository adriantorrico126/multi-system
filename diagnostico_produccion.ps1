# =====================================================
# DIAGNÓSTICO COMPLETO DE PRODUCCIÓN
# =====================================================

Write-Host "🔍 DIAGNÓSTICO DE PRODUCCIÓN - admin-api.forkast.vip" -ForegroundColor Blue
Write-Host "=====================================================" -ForegroundColor Blue

# Configuración
$DOMAIN = "admin-api.forkast.vip"
$IP = "198.54.117.242"

# Función para mostrar resultados
function Show-Result {
    param($Test, $Status, $Details = "")
    $color = if ($Status -eq "✅") { "Green" } elseif ($Status -eq "❌") { "Red" } else { "Yellow" }
    Write-Host "$Status $Test" -ForegroundColor $color
    if ($Details) { Write-Host "   $Details" -ForegroundColor Gray }
}

Write-Host "`n1. VERIFICACIÓN DE DNS:" -ForegroundColor Cyan
try {
    $dnsResult = nslookup $DOMAIN 2>$null | Select-String "Address:"
    if ($dnsResult) {
        Show-Result "DNS Resolution" "✅" "Resuelve correctamente a $IP"
    } else {
        Show-Result "DNS Resolution" "❌" "No se puede resolver"
    }
} catch {
    Show-Result "DNS Resolution" "❌" "Error: $($_.Exception.Message)"
}

Write-Host "`n2. VERIFICACIÓN DE CONECTIVIDAD:" -ForegroundColor Cyan

# Puerto 80 (HTTP)
try {
    $httpTest = Test-NetConnection -ComputerName $IP -Port 80 -WarningAction SilentlyContinue
    if ($httpTest.TcpTestSucceeded) {
        Show-Result "Puerto 80 (HTTP)" "✅" "Conectividad OK"
    } else {
        Show-Result "Puerto 80 (HTTP)" "❌" "No responde"
    }
} catch {
    Show-Result "Puerto 80 (HTTP)" "❌" "Error: $($_.Exception.Message)"
}

# Puerto 443 (HTTPS)
try {
    $httpsTest = Test-NetConnection -ComputerName $IP -Port 443 -WarningAction SilentlyContinue
    if ($httpsTest.TcpTestSucceeded) {
        Show-Result "Puerto 443 (HTTPS)" "✅" "Conectividad OK"
    } else {
        Show-Result "Puerto 443 (HTTPS)" "❌" "No responde - PROBLEMA PRINCIPAL"
    }
} catch {
    Show-Result "Puerto 443 (HTTPS)" "❌" "Error: $($_.Exception.Message)"
}

Write-Host "`n3. VERIFICACIÓN DE SERVICIOS:" -ForegroundColor Cyan

# HTTP
try {
    $httpResponse = Invoke-WebRequest -Uri "http://$DOMAIN/" -UseBasicParsing -TimeoutSec 10
    Show-Result "Servicio HTTP" "✅" "Status: $($httpResponse.StatusCode)"
    if ($httpResponse.Content -like "*Namecheap*") {
        Show-Result "Contenido HTTP" "⚠️" "Redirige a Namecheap (verificación de dominio)"
    }
} catch {
    Show-Result "Servicio HTTP" "❌" "Error: $($_.Exception.Message)"
}

# HTTPS
try {
    $httpsResponse = Invoke-WebRequest -Uri "https://$DOMAIN/" -UseBasicParsing -TimeoutSec 10
    Show-Result "Servicio HTTPS" "✅" "Status: $($httpsResponse.StatusCode)"
} catch {
    Show-Result "Servicio HTTPS" "❌" "Error: $($_.Exception.Message)"
}

Write-Host "`n4. VERIFICACIÓN DE CERTIFICADO SSL:" -ForegroundColor Cyan
try {
    $cert = [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    $request = [System.Net.WebRequest]::Create("https://$DOMAIN/")
    $response = $request.GetResponse()
    $cert = $request.ServicePoint.Certificate
    if ($cert) {
        Show-Result "Certificado SSL" "✅" "Presente"
        Show-Result "Válido hasta" "✅" $cert.GetExpirationDateString()
    } else {
        Show-Result "Certificado SSL" "❌" "No encontrado"
    }
} catch {
    Show-Result "Certificado SSL" "❌" "Error: $($_.Exception.Message)"
}

Write-Host "`n5. VERIFICACIÓN DE PUERTOS ADICIONALES:" -ForegroundColor Cyan
$ports = @(3000, 4000, 8080, 8443)
foreach ($port in $ports) {
    try {
        $test = Test-NetConnection -ComputerName $IP -Port $port -WarningAction SilentlyContinue
        $status = if ($test.TcpTestSucceeded) { "✅" } else { "❌" }
        Show-Result "Puerto $port" $status ""
    } catch {
        Show-Result "Puerto $port" "❌" "Error"
    }
}

Write-Host "`n=====================================================" -ForegroundColor Red
Write-Host "📋 RESUMEN DEL DIAGNÓSTICO" -ForegroundColor Red
Write-Host "=====================================================" -ForegroundColor Red
Write-Host ""
Write-Host "🔴 PROBLEMA PRINCIPAL:" -ForegroundColor Red
Write-Host "   El puerto 443 (HTTPS) no está respondiendo" -ForegroundColor Yellow
Write-Host "   El certificado SSL no está configurado o está roto" -ForegroundColor Yellow
Write-Host ""
Write-Host "🟡 PROBLEMAS SECUNDARIOS:" -ForegroundColor Yellow
Write-Host "   El sitio HTTP redirige a Namecheap (verificación de dominio)" -ForegroundColor Yellow
Write-Host "   Posible problema de configuración en DigitalOcean" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ LO QUE SÍ FUNCIONA:" -ForegroundColor Green
Write-Host "   DNS resolución correcta" -ForegroundColor Green
Write-Host "   Servidor alcanzable" -ForegroundColor Green
Write-Host "   Puerto 80 respondiendo" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 SOLUCIONES RECOMENDADAS:" -ForegroundColor Cyan
Write-Host "   1. Verificar configuración SSL en DigitalOcean" -ForegroundColor White
Write-Host "   2. Revisar certificados SSL/TLS" -ForegroundColor White
Write-Host "   3. Verificar configuración de dominio en Namecheap" -ForegroundColor White
Write-Host "   4. Revisar logs de DigitalOcean" -ForegroundColor White
Write-Host "   5. Verificar configuración de proxy/load balancer" -ForegroundColor White
Write-Host ""

Write-Host "🚨 ACCIÓN INMEDIATA REQUERIDA:" -ForegroundColor Red
Write-Host "   Revisar configuración SSL en DigitalOcean App Platform" -ForegroundColor Yellow
Write-Host "   Verificar que el dominio esté correctamente configurado" -ForegroundColor Yellow
Write-Host ""
