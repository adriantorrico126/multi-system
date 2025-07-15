@echo off
REM Script de instalación completa del sistema POS (Windows)
REM Incluye backend y frontend

echo 🚀 INICIANDO INSTALACIÓN COMPLETA DEL SISTEMA POS...
echo ===================================================

REM Verificar que estamos en el directorio correcto
if not exist "setup_backend.js" (
    echo ❌ No se encontró setup_backend.js
    echo ℹ️  Asegúrate de ejecutar este script desde la raíz del proyecto
    pause
    exit /b 1
)

REM 1. Configurar backend
echo ℹ️  Paso 1: Configurando backend...
call install_backend.bat

if %errorlevel% neq 0 (
    echo ❌ Error en la instalación del backend
    pause
    exit /b 1
)

REM 2. Configurar frontend
echo ℹ️  Paso 2: Configurando frontend...
cd menta-resto-system-pro

if not exist "package.json" (
    echo ❌ package.json no encontrado en menta-resto-system-pro/
    echo ℹ️  El frontend no está configurado completamente
    pause
    exit /b 1
)

echo ℹ️  Instalando dependencias del frontend...
npm install

if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias del frontend
    pause
    exit /b 1
)

echo ✅ Dependencias del frontend instaladas

REM 3. Crear archivo .env para frontend si no existe
if not exist ".env" (
    echo ℹ️  Creando archivo .env para frontend...
    copy env.example .env >nul
    echo ✅ Archivo .env del frontend creado
) else (
    echo ✅ Archivo .env del frontend ya existe
)

cd ..

REM 4. Mostrar resumen final
echo.
echo ==================================================
echo ✅ INSTALACIÓN COMPLETA FINALIZADA
echo ==================================================

echo ℹ️  Próximos pasos:
echo.
echo BACKEND:
echo 1. Edita el archivo .env del backend:
echo    cd vegetarian_restaurant_backend
echo    notepad .env
echo.
echo 2. Crea la base de datos PostgreSQL:
echo    psql -U postgres -c "CREATE DATABASE menta_restobar_db;"
echo.
echo 3. Ejecuta las migraciones:
echo    psql -U postgres -d menta_restobar_db -f create_mesa_tables.sql
echo.
echo 4. Inicia el backend:
echo    cd vegetarian_restaurant_backend
echo    npm start
echo.
echo FRONTEND:
echo 5. Edita el archivo .env del frontend:
echo    cd menta-resto-system-pro
echo    notepad .env
echo.
echo 6. Inicia el frontend:
echo    cd menta-resto-system-pro
echo    npm run dev
echo.
echo VERIFICACIÓN:
echo 7. Verifica la instalación completa:
echo    node check_backend_startup.js

echo ✅ ¡Instalación completa exitosa!
echo 💡 El sistema estará disponible en:
echo    - Backend: http://localhost:3000
echo    - Frontend: http://localhost:5173
pause 