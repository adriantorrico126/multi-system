#!/bin/bash

echo "Iniciando la instalación de todas las dependencias del proyecto..."
echo ""

echo "Instalando dependencias para admin-console-backend..."
cd admin-console-backend || exit
npm install
if [ $? -ne 0 ]; then
    echo "Error al instalar las dependencias de admin-console-backend."
    exit 1
fi
cd ..
echo "Dependencias de admin-console-backend instaladas."
echo ""

echo "Instalando dependencias para multi-resto-insights-hub..."
cd multi-resto-insights-hub || exit
npm install
if [ $? -ne 0 ]; then
    echo "Error al instalar las dependencias de multi-resto-insights-hub."
    exit 1
fi
cd ..
echo "Dependencias de multi-resto-insights-hub instaladas."
echo ""

echo "Instalando dependencias para menta-resto-system-pro..."
cd sistema-pos/menta-resto-system-pro || exit
npm install
if [ $? -ne 0 ]; then
    echo "Error al instalar las dependencias de menta-resto-system-pro."
    exit 1
fi
cd ../..
echo "Dependencias de menta-resto-system-pro instaladas."
echo ""

echo "Instalando dependencias para vegetarian_restaurant_backend..."
cd sistema-pos/vegetarian_restaurant_backend || exit
npm install
if [ $? -ne 0 ]; then
    echo "Error al instalar las dependencias de vegetarian_restaurant_backend."
    exit 1
fi
cd ../..
echo "Dependencias de vegetarian_restaurant_backend instaladas."
echo ""

echo "Instalación completada con éxito!"
