#!/bin/bash

echo "========================================"
echo "    INSTALADOR SISTEMA DE EGRESOS"
echo "========================================"
echo

echo "🔍 Verificando estado actual de la base de datos..."
node check_egresos_tables.js

echo
echo "========================================"
echo

echo "🚀 Iniciando migración del sistema de egresos..."
node migrate_egresos.js

echo
echo "========================================"
echo

echo "🔍 Verificando estado final de la base de datos..."
node check_egresos_tables.js

echo
echo "========================================"
echo "    INSTALACION COMPLETADA"
echo "========================================"
echo
echo "Presiona Enter para continuar..."
read
