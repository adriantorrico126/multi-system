Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MIGRACION DE DATOS - PRODUCCION A LOCAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Instalando dependencias de Python..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host ""
Write-Host "Ejecutando migracion..." -ForegroundColor Green
python migrate_data.py

Write-Host ""
Write-Host "Presiona Enter para continuar..." -ForegroundColor Gray
Read-Host
