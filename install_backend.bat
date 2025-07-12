@echo off
REM Script de instalación automática para el backend (Windows)
REM Sistema POS - Restaurante Vegetariano

echo 🚀 INICIANDO INSTALACIÓN AUTOMÁTICA DEL BACKEND...
echo ==================================================

REM Verificar que estamos en el directorio correcto
if not exist "setup_backend.js" (
    echo ❌ No se encontró setup_backend.js
    echo ℹ️  Asegúrate de ejecutar este script desde la raíz del proyecto
    pause
    exit /b 1
)

REM 1. Ejecutar configuración inicial
echo ℹ️  Paso 1: Configurando archivos iniciales...
node setup_backend.js

REM 2. Verificar Node.js
echo ℹ️  Paso 2: Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado
    echo ℹ️  Instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% instalado

REM 3. Verificar npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm no está instalado
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% instalado

REM 4. Verificar PostgreSQL
echo ℹ️  Paso 3: Verificando PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  PostgreSQL CLI no está instalado
    echo ℹ️  Instala PostgreSQL desde: https://www.postgresql.org/download/
    echo ℹ️  Continuando sin verificación de BD...
) else (
    for /f "tokens=3" %%i in ('psql --version') do set PG_VERSION=%%i
    echo ✅ PostgreSQL CLI %PG_VERSION% instalado
    
    REM Intentar conectar a PostgreSQL
    psql -U postgres -c "SELECT version();" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Conexión a PostgreSQL exitosa
    ) else (
        echo ⚠️  No se pudo conectar a PostgreSQL automáticamente
        echo ℹ️  Asegúrate de que PostgreSQL esté ejecutándose
    )
)

REM 5. Instalar dependencias del backend
echo ℹ️  Paso 4: Instalando dependencias del backend...
cd vegetarian_restaurant_backend

if not exist "package.json" (
    echo ❌ package.json no encontrado en vegetarian_restaurant_backend/
    pause
    exit /b 1
)

echo ℹ️  Instalando dependencias con npm...
npm install

if %errorlevel% equ 0 (
    echo ✅ Dependencias instaladas correctamente
) else (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)

REM 6. Verificar archivo .env
echo ℹ️  Paso 5: Verificando configuración...
if not exist ".env" (
    echo ❌ Archivo .env no encontrado
    echo ℹ️  Ejecuta 'node setup_backend.js' desde la raíz del proyecto
    pause
    exit /b 1
)

echo ✅ Archivo .env encontrado

REM 7. Verificar scripts SQL
echo ℹ️  Paso 6: Verificando archivos de migración...
cd ..

set MISSING_FILES=

if exist "create_mesa_tables.sql" (
    echo ✅ create_mesa_tables.sql encontrado
) else (
    echo ❌ create_mesa_tables.sql no encontrado
    set MISSING_FILES=1
)

if exist "init_mesas.sql" (
    echo ✅ init_mesas.sql encontrado
) else (
    echo ❌ init_mesas.sql no encontrado
    set MISSING_FILES=1
)

if exist "update_tipo_servicio_constraint.sql" (
    echo ✅ update_tipo_servicio_constraint.sql encontrado
) else (
    echo ❌ update_tipo_servicio_constraint.sql no encontrado
    set MISSING_FILES=1
)

if defined MISSING_FILES (
    echo ⚠️  Algunos archivos de migración faltan
)

REM 8. Mostrar resumen final
echo.
echo ==================================================
echo ✅ INSTALACIÓN COMPLETADA
echo ==================================================

echo ℹ️  Próximos pasos:
echo 1. Edita el archivo .env con tus credenciales reales:
echo    cd vegetarian_restaurant_backend
echo    notepad .env  # o tu editor preferido
echo.
echo 2. Crea la base de datos PostgreSQL:
echo    psql -U postgres -c "CREATE DATABASE menta_restobar_db;"
echo.
echo 3. Ejecuta las migraciones:
echo    psql -U postgres -d menta_restobar_db -f create_mesa_tables.sql
echo.
echo 4. Inicia el servidor:
echo    cd vegetarian_restaurant_backend
echo    npm start
echo.
echo 5. Verifica la instalación:
echo    node check_backend_startup.js

echo ✅ ¡Instalación completada exitosamente!
pause 