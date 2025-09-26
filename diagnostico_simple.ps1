# Diagnostico simple de produccion
Write-Host "DIAGNOSTICO DE PRODUCCION" -ForegroundColor Blue
Write-Host "=========================" -ForegroundColor Blue

$DOMAIN = "admin-api.forkast.vip"
$IP = "198.54.117.242"

Write-Host "`n1. DNS:" -ForegroundColor Cyan
try {
    $dns = nslookup $DOMAIN 2>$null | Select-String "Address:"
    if ($dns) {
        Write-Host "✅ DNS OK - Resuelve a $IP" -ForegroundColor Green
    } else {
        Write-Host "❌ DNS Error" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ DNS Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n2. Puerto 80 (HTTP):" -ForegroundColor Cyan
try {
    $http80 = Test-NetConnection -ComputerName $IP -Port 80 -WarningAction SilentlyContinue
    if ($http80.TcpTestSucceeded) {
        Write-Host "✅ Puerto 80 OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Puerto 80 NO responde" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Puerto 80 Error" -ForegroundColor Red
}

Write-Host "`n3. Puerto 443 (HTTPS):" -ForegroundColor Cyan
try {
    $https443 = Test-NetConnection -ComputerName $IP -Port 443 -WarningAction SilentlyContinue
    if ($https443.TcpTestSucceeded) {
        Write-Host "✅ Puerto 443 OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Puerto 443 NO responde - PROBLEMA PRINCIPAL" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Puerto 443 Error" -ForegroundColor Red
}

Write-Host "`n4. Servicio HTTP:" -ForegroundColor Cyan
try {
    $httpResponse = Invoke-WebRequest -Uri "http://$DOMAIN/" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ HTTP Status: $($httpResponse.StatusCode)" -ForegroundColor Green
    if ($httpResponse.Content -like "*Namecheap*") {
        Write-Host "⚠️ Redirige a Namecheap" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ HTTP Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n5. Servicio HTTPS:" -ForegroundColor Cyan
try {
    $httpsResponse = Invoke-WebRequest -Uri "https://$DOMAIN/" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ HTTPS Status: $($httpsResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ HTTPS Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=========================" -ForegroundColor Red
Write-Host "PROBLEMA IDENTIFICADO:" -ForegroundColor Red
Write-Host "Puerto 443 (HTTPS) no responde" -ForegroundColor Yellow
Write-Host "Certificado SSL roto o no configurado" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Red
