# Plan System Tests - Guía Completa de Validación

Este directorio contiene todas las herramientas necesarias para validar que el sistema de planes y suscripciones esté implementado correctamente.

## 🚀 Inicio Rápido

### Validación Completa (Recomendado)
```bash
# Ejecutar todas las validaciones
node src/tests/plan-complete-validation.js
```

### Validaciones Individuales
```bash
# Validación de Frontend
node src/tests/plan-frontend-validation.js

# Validación de API
node src/tests/plan-api-validation.js

# Validación de Base de Datos
psql -d database -f src/tests/plan-database-validation.sql

# Pruebas Automatizadas
npm test
```

## 📁 Estructura de Archivos

### Scripts de Validación
- **`plan-complete-validation.js`** - Validación completa del sistema
- **`plan-frontend-validation.js`** - Validación del frontend
- **`plan-api-validation.js`** - Validación de la API
- **`plan-database-validation.sql`** - Validación de la base de datos
- **`plan-testing-script.js`** - Script de pruebas generales

### Pruebas Automatizadas
- **`plan-system.test.tsx`** - Pruebas unitarias del sistema
- **`plan-integration.test.tsx`** - Pruebas de integración
- **`plan-limits.test.tsx`** - Pruebas de límites
- **`plan-api.test.ts`** - Pruebas de API
- **`plan-performance.test.ts`** - Pruebas de rendimiento
- **`plan-security.test.ts`** - Pruebas de seguridad
- **`plan-e2e.test.tsx`** - Pruebas end-to-end
- **`plan-validation.test.tsx`** - Pruebas de validación

### Documentación
- **`plan-manual-testing.md`** - Guía de pruebas manuales
- **`README.md`** - Este archivo

## 🔧 Configuración Previa

### 1. Instalar Dependencias
```bash
# Dependencias principales
npm install

# Dependencias de testing
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom
```

### 2. Configurar Base de Datos
```bash
# Ejecutar scripts de base de datos
psql -d database -f sistema-pos/vegetarian_restaurant_backend/sql/sistema_planes_unificado.sql
psql -d database -f sistema-pos/vegetarian_restaurant_backend/sql/migracion_planes_existentes.sql
psql -d database -f sistema-pos/vegetarian_restaurant_backend/sql/triggers_automaticos_planes.sql
```

### 3. Configurar Servidor
```bash
# Iniciar servidor backend
cd sistema-pos/vegetarian_restaurant_backend
npm start

# En otra terminal, iniciar frontend
cd sistema-pos/menta-resto-system-pro
npm run dev
```

## 📋 Proceso de Validación

### Paso 1: Validación Automática
```bash
# Ejecutar validación completa
node src/tests/plan-complete-validation.js
```

### Paso 2: Validación de Base de Datos
```bash
# Conectar a PostgreSQL
psql -h localhost -U usuario -d nombre_base_datos

# Ejecutar script de validación
\i src/tests/plan-database-validation.sql
```

### Paso 3: Validación de API
```bash
# Asegurar que el servidor esté ejecutándose
npm start

# Ejecutar validación de API
node src/tests/plan-api-validation.js
```

### Paso 4: Validación de Frontend
```bash
# Asegurar que el frontend esté ejecutándose
npm run dev

# Ejecutar validación de frontend
node src/tests/plan-frontend-validation.js
```

### Paso 5: Pruebas Automatizadas
```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar con cobertura
npm test -- --coverage
```

### Paso 6: Pruebas Manuales
Seguir la guía en `plan-manual-testing.md` para:
- Verificar funcionalidades en el navegador
- Probar restricciones de planes
- Validar alertas de límites
- Verificar responsividad
- Probar accesibilidad

## 🎯 Criterios de Aceptación

### ✅ Funcionalidad
- [ ] Todos los planes funcionan correctamente
- [ ] Todas las restricciones están aplicadas
- [ ] Todos los límites están funcionando
- [ ] Todas las alertas están funcionando
- [ ] Todas las funcionalidades están restringidas

### ✅ Rendimiento
- [ ] API responde en menos de 200ms
- [ ] Componentes se renderizan en menos de 100ms
- [ ] Sistema maneja múltiples usuarios
- [ ] Sistema es escalable

### ✅ Seguridad
- [ ] Validación de entrada implementada
- [ ] Autenticación funcionando
- [ ] Autorización funcionando
- [ ] Vulnerabilidades comunes prevenidas

### ✅ Testing
- [ ] Todas las pruebas pasan
- [ ] Cobertura de código > 80%
- [ ] Pruebas manuales completadas
- [ ] Pruebas automatizadas funcionando

### ✅ Documentación
- [ ] Documentación completa
- [ ] README actualizado
- [ ] Guías de pruebas creadas
- [ ] Documentación de API disponible

## 🚨 Solución de Problemas

### Error: "Module not found"
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error: "Database connection failed"
```bash
# Verificar configuración de PostgreSQL
psql -h localhost -U usuario -d nombre_base_datos

# Verificar que el servidor esté ejecutándose
sudo systemctl status postgresql
```

### Error: "API endpoints not found"
```bash
# Verificar que el servidor esté ejecutándose
npm start

# Verificar logs del servidor
tail -f logs/app.log
```

### Error: "Tests failing"
```bash
# Ejecutar pruebas en modo verbose
npm test -- --verbose

# Ejecutar una prueba específica
npm test -- --testNamePattern="Plan System Implementation Validation"
```

## 📊 Interpretación de Resultados

### Validación Exitosa
```
🎉 ¡TODAS LAS VALIDACIONES PASARON!
✅ Sistema de Planes implementado correctamente
🚀 Listo para producción
```

### Validación Fallida
```
⚠️  ALGUNAS VALIDACIONES FALLARON
🔧 Revisa los errores anteriores antes de continuar
```

### Reportes Generados
- `complete-validation-report.json` - Reporte completo
- `frontend-validation-report.json` - Reporte de frontend
- `plan-testing-report.json` - Reporte de pruebas

## 🔗 Enlaces Útiles

### Comandos de Desarrollo
```bash
# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Verificar tipos TypeScript
npx tsc --noEmit

# Linter
npm run lint
```

### Comandos de Base de Datos
```bash
# Conectar a PostgreSQL
psql -h localhost -U usuario -d nombre_base_datos

# Ejecutar migración
psql -d database -f sql/migracion_planes_existentes.sql

# Verificar tablas
\dt

# Verificar funciones
\df
```

### Comandos de Testing
```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar con cobertura
npm test -- --coverage

# Ejecutar en modo watch
npm test -- --watch

# Ejecutar pruebas específicas
npm test -- --testNamePattern="Plan System"
```

## 📝 Notas Importantes

1. **Ejecutar en orden**: Sigue el orden de los pasos para una validación completa
2. **Verificar dependencias**: Asegúrate de que todas las dependencias estén instaladas
3. **Configurar base de datos**: Los scripts SQL deben ejecutarse antes de las pruebas
4. **Servidor ejecutándose**: La API debe estar funcionando para las pruebas de API
5. **Frontend ejecutándose**: El frontend debe estar funcionando para las pruebas E2E

## 🤝 Contribuir

Al agregar nuevas funcionalidades:

1. Escribe pruebas unitarias primero
2. Agrega pruebas de integración
3. Incluye pruebas de seguridad
4. Verifica rendimiento
5. Actualiza la documentación
6. Ejecuta todas las validaciones

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs de error
2. Verifica la configuración
3. Ejecuta las validaciones individuales
4. Consulta la documentación
5. Revisa los reportes generados

---

**¡El sistema de planes está listo para producción cuando todas las validaciones pasen!** 🚀