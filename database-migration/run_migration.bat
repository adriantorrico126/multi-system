@echo off
echo ========================================
echo SISTEMA DE MIGRACION DE BASE DE DATOS
echo ========================================
echo.

REM Verificar que Python esté instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no está instalado o no está en el PATH
    pause
    exit /b 1
)

REM Verificar que las dependencias estén instaladas
if not exist "venv" (
    echo Creando entorno virtual...
    python -m venv venv
)

echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo Instalando dependencias...
pip install -r requirements.txt

echo.
echo ========================================
echo MENU DE OPCIONES
echo ========================================
echo 1. Probar conexiones
echo 2. Extraer esquemas
echo 3. Comparar esquemas
echo 4. Generar script de migración
echo 5. Probar migración (dry-run)
echo 6. Ejecutar migración
echo 7. Ver estado del sistema
echo 8. Salir
echo.

set /p choice="Seleccione una opción (1-8): "

if "%choice%"=="1" (
    echo.
    echo Probando conexiones...
    python main.py test
) else if "%choice%"=="2" (
    echo.
    echo Extrayendo esquemas...
    python main.py extract
) else if "%choice%"=="3" (
    echo.
    echo Comparando esquemas...
    python main.py compare
) else if "%choice%"=="4" (
    echo.
    echo Generando script de migración...
    python main.py generate
) else if "%choice%"=="5" (
    echo.
    echo Probando migración (dry-run)...
    python main.py dry-run
) else if "%choice%"=="6" (
    echo.
    echo ADVERTENCIA: Esto ejecutará la migración real en producción
    set /p confirm="¿Está seguro? (s/N): "
    if /i "%confirm%"=="s" (
        echo Ejecutando migración...
        python main.py migrate
    ) else (
        echo Migración cancelada
    )
) else if "%choice%"=="7" (
    echo.
    echo Estado del sistema...
    python main.py status
) else if "%choice%"=="8" (
    echo Saliendo...
    exit /b 0
) else (
    echo Opción inválida
)

echo.
echo Presione cualquier tecla para continuar...
pause >nul
