#!/bin/bash

echo "========================================"
echo "SISTEMA DE MIGRACION DE BASE DE DATOS"
echo "========================================"
echo

# Verificar que Python esté instalado
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 no está instalado"
    exit 1
fi

# Verificar que las dependencias estén instaladas
if [ ! -d "venv" ]; then
    echo "Creando entorno virtual..."
    python3 -m venv venv
fi

echo "Activando entorno virtual..."
source venv/bin/activate

echo "Instalando dependencias..."
pip install -r requirements.txt

echo
echo "========================================"
echo "MENU DE OPCIONES"
echo "========================================"
echo "1. Probar conexiones"
echo "2. Extraer esquemas"
echo "3. Comparar esquemas"
echo "4. Generar script de migración"
echo "5. Probar migración (dry-run)"
echo "6. Ejecutar migración"
echo "7. Ver estado del sistema"
echo "8. Salir"
echo

read -p "Seleccione una opción (1-8): " choice

case $choice in
    1)
        echo
        echo "Probando conexiones..."
        python main.py test
        ;;
    2)
        echo
        echo "Extrayendo esquemas..."
        python main.py extract
        ;;
    3)
        echo
        echo "Comparando esquemas..."
        python main.py compare
        ;;
    4)
        echo
        echo "Generando script de migración..."
        python main.py generate
        ;;
    5)
        echo
        echo "Probando migración (dry-run)..."
        python main.py dry-run
        ;;
    6)
        echo
        echo "ADVERTENCIA: Esto ejecutará la migración real en producción"
        read -p "¿Está seguro? (s/N): " confirm
        if [[ $confirm == [sS] ]]; then
            echo "Ejecutando migración..."
            python main.py migrate
        else
            echo "Migración cancelada"
        fi
        ;;
    7)
        echo
        echo "Estado del sistema..."
        python main.py status
        ;;
    8)
        echo "Saliendo..."
        exit 0
        ;;
    *)
        echo "Opción inválida"
        ;;
esac

echo
echo "Presione Enter para continuar..."
read
