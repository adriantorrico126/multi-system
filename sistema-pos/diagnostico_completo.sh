#!/bin/bash

echo "🔐 DIAGNÓSTICO COMPLETO DEL SISTEMA DE AUTENTICACIÓN"
echo "==================================================="
echo ""

# Función para mostrar sección
show_section() {
    echo ""
    echo "📋 $1"
    echo "$(printf '=%.0s' {1..50})"
}

# Función para mostrar resultado
show_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
    fi
}

# 1. Verificar configuración del entorno
show_section "CONFIGURACIÓN DEL ENTORNO"

echo "Configurando variables de entorno del frontend..."
if [ -f "configurar_env.sh" ]; then
    chmod +x configurar_env.sh
    ./configurar_env.sh > /dev/null 2>&1
    show_result $? "Variables de entorno configuradas"
else
    echo "❌ Script de configuración no encontrado"
fi

# 2. Verificar backend
show_section "ESTADO DEL BACKEND"

echo "Verificando si el backend está corriendo..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend corriendo en puerto 3000"
    
    # Verificar endpoints específicos
    echo "Verificando endpoints de autenticación..."
    
    # Login endpoint
    if curl -s -X POST http://localhost:3000/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"test"}' \
        | grep -q "Usuario o contraseña incorrectos"; then
        echo "✅ Endpoint de login funcionando"
    else
        echo "❌ Endpoint de login no funciona"
    fi
    
    # Validate endpoint
    if curl -s http://localhost:3000/api/v1/auth/validate \
        | grep -q "Unauthorized"; then
        echo "✅ Endpoint de validación funcionando"
    else
        echo "❌ Endpoint de validación no funciona"
    fi
    
else
    echo "❌ Backend NO está corriendo"
    echo ""
    echo "🚀 Para iniciar el backend:"
    echo "   cd sistema-pos/vegetarian_restaurant_backend"
    echo "   npm start"
    echo ""
fi

# 3. Verificar base de datos y usuarios
show_section "BASE DE DATOS Y USUARIOS"

echo "Verificando usuarios en la base de datos..."
if [ -f "crear_usuario_admin.sh" ]; then
    chmod +x crear_usuario_admin.sh
    ./crear_usuario_admin.sh > /dev/null 2>&1
    show_result $? "Usuarios verificados/creados"
else
    echo "❌ Script de usuarios no encontrado"
fi

# 4. Verificar frontend
show_section "ESTADO DEL FRONTEND"

echo "Verificando si el frontend está corriendo..."
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Frontend corriendo en puerto 8080"
else
    echo "❌ Frontend NO está corriendo"
    echo ""
    echo "🚀 Para iniciar el frontend:"
    echo "   cd sistema-pos/menta-resto-system-pro"
    echo "   npm run dev"
    echo ""
fi

# 5. Probar login
show_section "PRUEBA DE LOGIN"

echo "Probando login con credenciales por defecto..."
if [ -f "prueba_login.sh" ]; then
    chmod +x prueba_login.sh
    ./prueba_login.sh
else
    echo "❌ Script de prueba no encontrado"
fi

# 6. Verificar archivos del sistema
show_section "ARCHIVOS DEL SISTEMA"

files=(
    "sistema-pos/menta-resto-system-pro/src/context/AuthContext.tsx"
    "sistema-pos/menta-resto-system-pro/src/components/auth/LoginForm.tsx"
    "sistema-pos/menta-resto-system-pro/src/components/auth/ProtectedRoute.tsx"
    "sistema-pos/menta-resto-system-pro/src/pages/Login.tsx"
    "sistema-pos/menta-resto-system-pro/src/pages/Index.tsx"
    "sistema-pos/vegetarian_restaurant_backend/src/routes/authRoutes.js"
    "sistema-pos/vegetarian_restaurant_backend/src/controllers/authController.js"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - FALTANTE"
    fi
done

# 7. Resumen final
show_section "RESUMEN Y RECOMENDACIONES"

echo "🎯 ESTADO DEL SISTEMA:"
echo ""

# Verificar si todo está funcionando
backend_running=$(curl -s http://localhost:3000/health > /dev/null 2>&1 && echo "true" || echo "false")
frontend_running=$(curl -s http://localhost:8080 > /dev/null 2>&1 && echo "true" || echo "false")

if [ "$backend_running" = "true" ] && [ "$frontend_running" = "true" ]; then
    echo "✅ Sistema completamente operativo"
    echo "✅ Backend y frontend corriendo"
    echo "✅ Archivos del sistema presentes"
    echo ""
    echo "🚀 PRÓXIMOS PASOS:"
    echo "   1. Abre http://localhost:8080 en tu navegador"
    echo "   2. Usa las credenciales: admin / admin"
    echo "   3. Si hay problemas, revisa la consola del navegador"
    
elif [ "$backend_running" = "true" ] && [ "$frontend_running" = "false" ]; then
    echo "⚠️  Backend funcionando, frontend no iniciado"
    echo ""
    echo "🚀 SOLUCIÓN:"
    echo "   1. Inicia el frontend: cd sistema-pos/menta-resto-system-pro && npm run dev"
    echo "   2. Espera a que cargue completamente"
    echo "   3. Abre http://localhost:8080"
    
elif [ "$backend_running" = "false" ] && [ "$frontend_running" = "true" ]; then
    echo "⚠️  Frontend funcionando, backend no iniciado"
    echo ""
    echo "🚀 SOLUCIÓN:"
    echo "   1. Inicia el backend: cd sistema-pos/vegetarian_restaurant_backend && npm start"
    echo "   2. Espera a que cargue completamente"
    echo "   3. Refresca el navegador"
    
else
    echo "❌ Ni backend ni frontend están corriendo"
    echo ""
    echo "🚀 SOLUCIÓN COMPLETA:"
    echo "   1. Terminal 1: cd sistema-pos/vegetarian_restaurant_backend && npm start"
    echo "   2. Terminal 2: cd sistema-pos/menta-resto-system-pro && npm run dev"
    echo "   3. Espera a que ambos carguen completamente"
    echo "   4. Abre http://localhost:8080"
fi

echo ""
echo "🔧 COMANDOS ÚTILES:"
echo "   - Reiniciar backend: Ctrl+C, luego npm start"
echo "   - Reiniciar frontend: Ctrl+C, luego npm run dev"
echo "   - Limpiar caché del navegador: Ctrl+Shift+R"
echo "   - Ver logs del backend: Revisa la consola donde corre npm start"
echo "   - Ver logs del frontend: Revisa la consola del navegador (F12)"
echo ""
echo "📞 SI EL PROBLEMA PERSISTE:"
echo "   1. Ejecuta: ./diagnostico_login.sh"
echo "   2. Ejecuta: ./prueba_login.sh"
echo "   3. Revisa los logs de ambos servicios"
echo "   4. Verifica que no hay conflictos de puertos"
echo ""
echo "✅ Diagnóstico completado!"

echo "🔐 DIAGNÓSTICO COMPLETO DEL SISTEMA DE AUTENTICACIÓN"
echo "==================================================="
echo ""

# Función para mostrar sección
show_section() {
    echo ""
    echo "📋 $1"
    echo "$(printf '=%.0s' {1..50})"
}

# Función para mostrar resultado
show_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
    fi
}

# 1. Verificar configuración del entorno
show_section "CONFIGURACIÓN DEL ENTORNO"

echo "Configurando variables de entorno del frontend..."
if [ -f "configurar_env.sh" ]; then
    chmod +x configurar_env.sh
    ./configurar_env.sh > /dev/null 2>&1
    show_result $? "Variables de entorno configuradas"
else
    echo "❌ Script de configuración no encontrado"
fi

# 2. Verificar backend
show_section "ESTADO DEL BACKEND"

echo "Verificando si el backend está corriendo..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend corriendo en puerto 3000"
    
    # Verificar endpoints específicos
    echo "Verificando endpoints de autenticación..."
    
    # Login endpoint
    if curl -s -X POST http://localhost:3000/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"test"}' \
        | grep -q "Usuario o contraseña incorrectos"; then
        echo "✅ Endpoint de login funcionando"
    else
        echo "❌ Endpoint de login no funciona"
    fi
    
    # Validate endpoint
    if curl -s http://localhost:3000/api/v1/auth/validate \
        | grep -q "Unauthorized"; then
        echo "✅ Endpoint de validación funcionando"
    else
        echo "❌ Endpoint de validación no funciona"
    fi
    
else
    echo "❌ Backend NO está corriendo"
    echo ""
    echo "🚀 Para iniciar el backend:"
    echo "   cd sistema-pos/vegetarian_restaurant_backend"
    echo "   npm start"
    echo ""
fi

# 3. Verificar base de datos y usuarios
show_section "BASE DE DATOS Y USUARIOS"

echo "Verificando usuarios en la base de datos..."
if [ -f "crear_usuario_admin.sh" ]; then
    chmod +x crear_usuario_admin.sh
    ./crear_usuario_admin.sh > /dev/null 2>&1
    show_result $? "Usuarios verificados/creados"
else
    echo "❌ Script de usuarios no encontrado"
fi

# 4. Verificar frontend
show_section "ESTADO DEL FRONTEND"

echo "Verificando si el frontend está corriendo..."
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Frontend corriendo en puerto 8080"
else
    echo "❌ Frontend NO está corriendo"
    echo ""
    echo "🚀 Para iniciar el frontend:"
    echo "   cd sistema-pos/menta-resto-system-pro"
    echo "   npm run dev"
    echo ""
fi

# 5. Probar login
show_section "PRUEBA DE LOGIN"

echo "Probando login con credenciales por defecto..."
if [ -f "prueba_login.sh" ]; then
    chmod +x prueba_login.sh
    ./prueba_login.sh
else
    echo "❌ Script de prueba no encontrado"
fi

# 6. Verificar archivos del sistema
show_section "ARCHIVOS DEL SISTEMA"

files=(
    "sistema-pos/menta-resto-system-pro/src/context/AuthContext.tsx"
    "sistema-pos/menta-resto-system-pro/src/components/auth/LoginForm.tsx"
    "sistema-pos/menta-resto-system-pro/src/components/auth/ProtectedRoute.tsx"
    "sistema-pos/menta-resto-system-pro/src/pages/Login.tsx"
    "sistema-pos/menta-resto-system-pro/src/pages/Index.tsx"
    "sistema-pos/vegetarian_restaurant_backend/src/routes/authRoutes.js"
    "sistema-pos/vegetarian_restaurant_backend/src/controllers/authController.js"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - FALTANTE"
    fi
done

# 7. Resumen final
show_section "RESUMEN Y RECOMENDACIONES"

echo "🎯 ESTADO DEL SISTEMA:"
echo ""

# Verificar si todo está funcionando
backend_running=$(curl -s http://localhost:3000/health > /dev/null 2>&1 && echo "true" || echo "false")
frontend_running=$(curl -s http://localhost:8080 > /dev/null 2>&1 && echo "true" || echo "false")

if [ "$backend_running" = "true" ] && [ "$frontend_running" = "true" ]; then
    echo "✅ Sistema completamente operativo"
    echo "✅ Backend y frontend corriendo"
    echo "✅ Archivos del sistema presentes"
    echo ""
    echo "🚀 PRÓXIMOS PASOS:"
    echo "   1. Abre http://localhost:8080 en tu navegador"
    echo "   2. Usa las credenciales: admin / admin"
    echo "   3. Si hay problemas, revisa la consola del navegador"
    
elif [ "$backend_running" = "true" ] && [ "$frontend_running" = "false" ]; then
    echo "⚠️  Backend funcionando, frontend no iniciado"
    echo ""
    echo "🚀 SOLUCIÓN:"
    echo "   1. Inicia el frontend: cd sistema-pos/menta-resto-system-pro && npm run dev"
    echo "   2. Espera a que cargue completamente"
    echo "   3. Abre http://localhost:8080"
    
elif [ "$backend_running" = "false" ] && [ "$frontend_running" = "true" ]; then
    echo "⚠️  Frontend funcionando, backend no iniciado"
    echo ""
    echo "🚀 SOLUCIÓN:"
    echo "   1. Inicia el backend: cd sistema-pos/vegetarian_restaurant_backend && npm start"
    echo "   2. Espera a que cargue completamente"
    echo "   3. Refresca el navegador"
    
else
    echo "❌ Ni backend ni frontend están corriendo"
    echo ""
    echo "🚀 SOLUCIÓN COMPLETA:"
    echo "   1. Terminal 1: cd sistema-pos/vegetarian_restaurant_backend && npm start"
    echo "   2. Terminal 2: cd sistema-pos/menta-resto-system-pro && npm run dev"
    echo "   3. Espera a que ambos carguen completamente"
    echo "   4. Abre http://localhost:8080"
fi

echo ""
echo "🔧 COMANDOS ÚTILES:"
echo "   - Reiniciar backend: Ctrl+C, luego npm start"
echo "   - Reiniciar frontend: Ctrl+C, luego npm run dev"
echo "   - Limpiar caché del navegador: Ctrl+Shift+R"
echo "   - Ver logs del backend: Revisa la consola donde corre npm start"
echo "   - Ver logs del frontend: Revisa la consola del navegador (F12)"
echo ""
echo "📞 SI EL PROBLEMA PERSISTE:"
echo "   1. Ejecuta: ./diagnostico_login.sh"
echo "   2. Ejecuta: ./prueba_login.sh"
echo "   3. Revisa los logs de ambos servicios"
echo "   4. Verifica que no hay conflictos de puertos"
echo ""
echo "✅ Diagnóstico completado!"


