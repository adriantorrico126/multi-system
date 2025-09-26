@echo off
echo ========================================
echo    MIGRACION DE DATOS - PRODUCCION A LOCAL
echo ========================================
echo.

echo Instalando dependencias de Python...
pip install -r requirements.txt

echo.
echo Ejecutando migracion...
python migrate_data.py

echo.
echo Presiona cualquier tecla para continuar...
pause
