@echo off
REM =====================================================
REM Script de Ejecución de Migraciones - Windows
REM Sistema: SITEMM POS - Toppings Profesional
REM =====================================================

echo ========================================
echo SISTEMA DE MIGRACIONES - TOPPINGS
echo ========================================
echo.

REM Configuración
set DB_USER=postgres
set DB_PASSWORD=6951230Anacleta
set DB_NAME=sistempos
set DB_HOST=localhost
set DB_PORT=5432

echo Base de datos: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo.

REM Configurar password de PostgreSQL
set PGPASSWORD=%DB_PASSWORD%

echo ========================================
echo PASO 1: CREAR BACKUP
echo ========================================
echo.

call backup_database.bat

echo.
echo ========================================
echo PASO 2: EJECUTAR MIGRACIONES
echo ========================================
echo.

echo Ejecutando migración 001: Grupos de modificadores...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f 001_grupos_modificadores.sql
if %ERRORLEVEL% NEQ 0 (
    echo ERROR en migración 001
    pause
    exit /b 1
)
echo ✓ Migración 001 completada
echo.

echo Ejecutando migración 002: Mejorar productos_modificadores...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f 002_mejorar_productos_modificadores.sql
if %ERRORLEVEL% NEQ 0 (
    echo ERROR en migración 002
    pause
    exit /b 1
)
echo ✓ Migración 002 completada
echo.

echo Ejecutando migración 003: Productos-Grupos relación...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f 003_productos_grupos_modificadores.sql
if %ERRORLEVEL% NEQ 0 (
    echo ERROR en migración 003
    pause
    exit /b 1
)
echo ✓ Migración 003 completada
echo.

echo Ejecutando migración 004: Mejorar detalle_ventas_modificadores...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f 004_mejorar_detalle_ventas_modificadores.sql
if %ERRORLEVEL% NEQ 0 (
    echo ERROR en migración 004
    pause
    exit /b 1
)
echo ✓ Migración 004 completada
echo.

echo Ejecutando migración 005: Vistas y funciones...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f 005_vistas_y_funciones.sql
if %ERRORLEVEL% NEQ 0 (
    echo ERROR en migración 005
    pause
    exit /b 1
)
echo ✓ Migración 005 completada
echo.

echo ========================================
echo PASO 3: VERIFICACIÓN
echo ========================================
echo.

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%%modificador%%' ORDER BY tablename;"

echo.
echo ========================================
echo MIGRACIONES COMPLETADAS EXITOSAMENTE
echo ========================================
echo.
echo Tablas creadas:
echo - grupos_modificadores
echo - productos_grupos_modificadores
echo.
echo Tablas mejoradas:
echo - productos_modificadores
echo - detalle_ventas_modificadores
echo.
echo Vistas creadas:
echo - vista_modificadores_completa
echo - vista_grupos_por_producto
echo.
echo Funciones creadas:
echo - validar_modificadores_producto
echo - actualizar_stock_modificadores_trigger
echo.
echo ========================================

REM Limpiar password del entorno
set PGPASSWORD=

pause

