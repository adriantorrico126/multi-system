# Plan de Pruebas Manuales - Sistema de Planes

## Pruebas de Funcionalidad

### 1. Verificación de Planes

#### Plan Básico
- [ ] Verificar que solo tiene acceso a POS
- [ ] Verificar que NO tiene acceso a inventario básico
- [ ] Verificar que NO tiene acceso a inventario avanzado
- [ ] Verificar que NO tiene acceso a egresos
- [ ] Verificar que NO tiene acceso a egresos avanzados
- [ ] Verificar que NO tiene acceso a reportes avanzados
- [ ] Verificar límites: 1 sucursal, 2 usuarios, 50 productos, 500 transacciones/mes, 1GB almacenamiento

#### Plan Profesional
- [ ] Verificar que tiene acceso a POS
- [ ] Verificar que tiene acceso a inventario básico
- [ ] Verificar que NO tiene acceso a inventario avanzado
- [ ] Verificar que tiene acceso a egresos
- [ ] Verificar que NO tiene acceso a egresos avanzados
- [ ] Verificar que NO tiene acceso a reportes avanzados
- [ ] Verificar límites: 3 sucursales, 5 usuarios, 100 productos, 1000 transacciones/mes, 5GB almacenamiento

#### Plan Avanzado
- [ ] Verificar que tiene acceso a POS
- [ ] Verificar que tiene acceso a inventario básico
- [ ] Verificar que tiene acceso a inventario avanzado
- [ ] Verificar que tiene acceso a egresos
- [ ] Verificar que tiene acceso a egresos avanzados
- [ ] Verificar que tiene acceso a reportes avanzados
- [ ] Verificar límites: 10 sucursales, 20 usuarios, 500 productos, 5000 transacciones/mes, 20GB almacenamiento

#### Plan Enterprise
- [ ] Verificar que tiene acceso a todas las funcionalidades
- [ ] Verificar que tiene límites ilimitados
- [ ] Verificar que tiene acceso a API
- [ ] Verificar que tiene acceso a white label
- [ ] Verificar que tiene soporte 24/7

### 2. Verificación de Restricciones

#### Inventario
- [ ] Plan Básico: No puede acceder a pestaña "Productos"
- [ ] Plan Básico: No puede acceder a pestaña "Lotes"
- [ ] Plan Básico: No puede acceder a pestaña "Reportes"
- [ ] Plan Profesional: Puede acceder a pestaña "Productos"
- [ ] Plan Profesional: No puede acceder a pestaña "Lotes"
- [ ] Plan Profesional: No puede acceder a pestaña "Reportes"
- [ ] Plan Avanzado: Puede acceder a todas las pestañas

#### Egresos
- [ ] Plan Básico: No puede acceder a ninguna pestaña de egresos
- [ ] Plan Profesional: Puede acceder a pestaña "Egresos" y "Categorías"
- [ ] Plan Profesional: No puede acceder a pestaña "Presupuestos"
- [ ] Plan Avanzado: Puede acceder a todas las pestañas

### 3. Verificación de Límites

#### Límites de Productos
- [ ] Plan Básico: Límite de 50 productos
- [ ] Plan Profesional: Límite de 100 productos
- [ ] Plan Avanzado: Límite de 500 productos
- [ ] Plan Enterprise: Sin límite

#### Límites de Usuarios
- [ ] Plan Básico: Límite de 2 usuarios
- [ ] Plan Profesional: Límite de 5 usuarios
- [ ] Plan Avanzado: Límite de 20 usuarios
- [ ] Plan Enterprise: Sin límite

#### Límites de Sucursales
- [ ] Plan Básico: Límite de 1 sucursal
- [ ] Plan Profesional: Límite de 3 sucursales
- [ ] Plan Avanzado: Límite de 10 sucursales
- [ ] Plan Enterprise: Sin límite

### 4. Verificación de Alertas

#### Alertas de Límites
- [ ] Alerta cuando se alcanza el 80% del límite
- [ ] Alerta cuando se alcanza el 90% del límite
- [ ] Alerta cuando se excede el límite
- [ ] Botón de actualización de plan en alertas

#### Alertas de Funcionalidades
- [ ] Mensaje de restricción en funcionalidades no disponibles
- [ ] Botón de actualización de plan en restricciones
- [ ] Información del plan requerido

### 5. Verificación de UI

#### Componentes de Plan
- [ ] PlanStatusCard se renderiza correctamente
- [ ] PlanLimitAlert se renderiza correctamente
- [ ] PlanFeatureGate se renderiza correctamente
- [ ] Mensajes de actualización se muestran correctamente

#### Responsividad
- [ ] Componentes se ven bien en móvil
- [ ] Componentes se ven bien en tablet
- [ ] Componentes se ven bien en desktop

#### Accesibilidad
- [ ] Navegación con teclado funciona
- [ ] Screen readers pueden leer el contenido
- [ ] Contraste de colores es adecuado

### 6. Verificación de API

#### Endpoints de Planes
- [ ] GET /api/v1/planes-sistema - Lista todos los planes
- [ ] GET /api/v1/planes-sistema/:id - Obtiene un plan específico
- [ ] POST /api/v1/planes-sistema/:id/validate-feature - Valida funcionalidad
- [ ] POST /api/v1/planes-sistema/compare - Compara planes

#### Endpoints de Suscripciones
- [ ] GET /api/v1/suscripciones-sistema/restaurant/:id - Obtiene suscripción
- [ ] POST /api/v1/suscripciones-sistema - Crea suscripción
- [ ] PUT /api/v1/suscripciones-sistema/:id - Actualiza suscripción
- [ ] POST /api/v1/suscripciones-sistema/:id/change-plan - Cambia plan
- [ ] POST /api/v1/suscripciones-sistema/:id/suspend - Suspende suscripción
- [ ] POST /api/v1/suscripciones-sistema/:id/reactivate - Reactiva suscripción

#### Endpoints de Contadores
- [ ] GET /api/v1/contadores-sistema/restaurant/:id - Obtiene contadores
- [ ] PUT /api/v1/contadores-sistema/:id - Actualiza contadores
- [ ] POST /api/v1/contadores-sistema/:id/validate-limit - Valida límite
- [ ] GET /api/v1/contadores-sistema/global-stats - Estadísticas globales

#### Endpoints de Alertas
- [ ] GET /api/v1/alertas-sistema/restaurant/:id - Obtiene alertas
- [ ] POST /api/v1/alertas-sistema/:id/resolve - Resuelve alerta
- [ ] POST /api/v1/alertas-sistema/:id/ignore - Ignora alerta
- [ ] POST /api/v1/alertas-sistema/restaurant/:id/mark-all-read - Marca como leídas
- [ ] GET /api/v1/alertas-sistema/restaurant/:id/stats - Estadísticas de alertas

### 7. Verificación de Base de Datos

#### Tablas
- [ ] Tabla `planes` existe y tiene datos
- [ ] Tabla `suscripciones` existe y tiene datos
- [ ] Tabla `uso_recursos` existe y tiene datos
- [ ] Tabla `alertas_limite` existe y tiene datos

#### Triggers
- [ ] Trigger de actualización de contadores funciona
- [ ] Trigger de validación de límites funciona
- [ ] Trigger de generación de alertas funciona
- [ ] Trigger de auditoría de cambios funciona

#### Funciones
- [ ] Función `validar_limite_plan` funciona
- [ ] Función `validar_funcionalidad_plan` funciona
- [ ] Función `actualizar_contador_uso` funciona
- [ ] Función `generar_alerta_limite` funciona

### 8. Verificación de Middleware

#### Middleware de Límites
- [ ] Valida límites antes de operaciones
- [ ] Bloquea operaciones que excedan límites
- [ ] Genera alertas cuando se alcanzan límites
- [ ] Actualiza contadores de uso

#### Middleware de Validación
- [ ] Valida suscripciones activas
- [ ] Valida fechas de expiración
- [ ] Valida estados de suscripción
- [ ] Proporciona información de plan

#### Middleware de Tracking
- [ ] Rastrea uso de funcionalidades
- [ ] Actualiza contadores en tiempo real
- [ ] Genera alertas automáticamente
- [ ] Registra eventos de uso

### 9. Verificación de Rendimiento

#### Tiempo de Respuesta
- [ ] API responde en menos de 200ms
- [ ] Componentes se renderizan en menos de 100ms
- [ ] Consultas de base de datos son eficientes
- [ ] Carga de página es rápida

#### Escalabilidad
- [ ] Sistema maneja múltiples usuarios
- [ ] Sistema maneja múltiples restaurantes
- [ ] Sistema maneja múltiples operaciones simultáneas
- [ ] Sistema maneja grandes volúmenes de datos

### 10. Verificación de Seguridad

#### Validación de Entrada
- [ ] Entrada de usuario se valida
- [ ] SQL injection está prevenido
- [ ] XSS está prevenido
- [ ] CSRF está prevenido

#### Autenticación
- [ ] Usuarios deben estar autenticados
- [ ] Tokens JWT son válidos
- [ ] Sesiones expiran correctamente
- [ ] Acceso no autorizado está bloqueado

#### Autorización
- [ ] Usuarios solo pueden acceder a sus datos
- [ ] Funcionalidades están restringidas por plan
- [ ] Límites están aplicados correctamente
- [ ] Cambios de plan están auditados

## Checklist de Implementación

### Backend
- [ ] Modelos de base de datos creados
- [ ] Controladores implementados
- [ ] Rutas configuradas
- [ ] Middleware implementado
- [ ] Triggers de base de datos funcionando
- [ ] Funciones de base de datos funcionando
- [ ] Migración de datos completada

### Frontend
- [ ] Contexto de planes implementado
- [ ] Hooks de planes implementados
- [ ] Componentes de UI implementados
- [ ] Integración con páginas existentes
- [ ] Pruebas unitarias creadas
- [ ] Pruebas de integración creadas
- [ ] Pruebas E2E creadas

### Testing
- [ ] Pruebas unitarias pasan
- [ ] Pruebas de integración pasan
- [ ] Pruebas de API pasan
- [ ] Pruebas de rendimiento pasan
- [ ] Pruebas de seguridad pasan
- [ ] Pruebas E2E pasan
- [ ] Cobertura de código > 80%

### Documentación
- [ ] README actualizado
- [ ] Documentación de API creada
- [ ] Documentación de componentes creada
- [ ] Guía de pruebas creada
- [ ] Documentación de deployment creada

## Criterios de Aceptación

### Funcionalidad
- ✅ Todos los planes funcionan correctamente
- ✅ Todas las restricciones están aplicadas
- ✅ Todos los límites están funcionando
- ✅ Todas las alertas están funcionando
- ✅ Todas las funcionalidades están restringidas

### Rendimiento
- ✅ API responde en menos de 200ms
- ✅ Componentes se renderizan en menos de 100ms
- ✅ Sistema maneja múltiples usuarios
- ✅ Sistema es escalable

### Seguridad
- ✅ Validación de entrada implementada
- ✅ Autenticación funcionando
- ✅ Autorización funcionando
- ✅ Vulnerabilidades comunes prevenidas

### Testing
- ✅ Todas las pruebas pasan
- ✅ Cobertura de código > 80%
- ✅ Pruebas manuales completadas
- ✅ Pruebas automatizadas funcionando

### Documentación
- ✅ Documentación completa
- ✅ README actualizado
- ✅ Guías de pruebas creadas
- ✅ Documentación de API disponible

## Comandos de Prueba

### Ejecutar Pruebas Automatizadas
```bash
# Todas las pruebas
npm test

# Pruebas específicas
npm test plan-validation.test.tsx
npm test plan-system.test.tsx
npm test plan-integration.test.tsx
npm test plan-limits.test.tsx
npm test plan-api.test.ts
npm test plan-performance.test.ts
npm test plan-security.test.ts
npm test plan-e2e.test.tsx

# Con cobertura
npm test -- --coverage
```

### Verificar Base de Datos
```sql
-- Verificar planes
SELECT * FROM planes;

-- Verificar suscripciones
SELECT * FROM suscripciones;

-- Verificar contadores
SELECT * FROM uso_recursos;

-- Verificar alertas
SELECT * FROM alertas_limite;

-- Verificar triggers
SELECT * FROM information_schema.triggers WHERE trigger_name LIKE '%plan%';
```

### Verificar API
```bash
# Verificar endpoints de planes
curl -X GET http://localhost:3000/api/v1/planes-sistema
curl -X GET http://localhost:3000/api/v1/planes-sistema/1

# Verificar endpoints de suscripciones
curl -X GET http://localhost:3000/api/v1/suscripciones-sistema/restaurant/1

# Verificar endpoints de contadores
curl -X GET http://localhost:3000/api/v1/contadores-sistema/restaurant/1

# Verificar endpoints de alertas
curl -X GET http://localhost:3000/api/v1/alertas-sistema/restaurant/1
```

## Reporte de Pruebas

### Resultados
- [ ] Todas las pruebas automatizadas pasan
- [ ] Todas las pruebas manuales completadas
- [ ] Todos los criterios de aceptación cumplidos
- [ ] Sistema listo para producción

### Problemas Encontrados
- [ ] Problema 1: Descripción y solución
- [ ] Problema 2: Descripción y solución
- [ ] Problema 3: Descripción y solución

### Recomendaciones
- [ ] Recomendación 1
- [ ] Recomendación 2
- [ ] Recomendación 3

### Firma de Aprobación
- [ ] Desarrollador: _________________ Fecha: _______
- [ ] Tester: _________________ Fecha: _______
- [ ] Product Owner: _________________ Fecha: _______
