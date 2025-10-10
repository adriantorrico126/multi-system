@echo off
REM =====================================================
REM Script de Backup de Base de Datos - Windows
REM Sistema: SITEMM POS
REM =====================================================

echo ========================================
echo BACKUP DE BASE DE DATOS
echo ========================================
echo.

REM Configuración
set DB_USER=postgres
set DB_NAME=sistempos
set DB_HOST=localhost
set DB_PORT=5432
set BACKUP_DIR=backups
set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\sistempos_backup_%TIMESTAMP%.sql

REM Crear directorio de backups si no existe
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo Creando backup de la base de datos...
echo Base de datos: %DB_NAME%
echo Archivo: %BACKUP_FILE%
echo.

REM Ejecutar pg_dump
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -F p -f "%BACKUP_FILE%" %DB_NAME%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo BACKUP COMPLETADO EXITOSAMENTE
    echo ========================================
    echo Archivo: %BACKUP_FILE%
    echo Tamaño: 
    dir "%BACKUP_FILE%" | find "%BACKUP_FILE%"
    echo.
    echo Para restaurar este backup:
    echo psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%BACKUP_FILE%"
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR AL CREAR BACKUP
    echo ========================================
    echo Verifica que PostgreSQL este instalado y accesible
    echo.
)

pause

