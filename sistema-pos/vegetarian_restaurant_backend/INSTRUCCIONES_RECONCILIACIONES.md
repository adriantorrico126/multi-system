# 🔧 Instrucciones para Crear las Tablas de Reconciliaciones

## 📋 **Problema Identificado**

Las APIs de reconciliaciones están fallando con error 500 porque las tablas no existen en la base de datos:
- `reconciliaciones_caja`
- `reconciliaciones_metodos_pago`
- `reconciliaciones_historial`

---

## ✅ **Solución: Ejecutar el Script SQL**

### **Opción 1: Usando psql (Línea de Comandos)**

```bash
# Conectarse a la base de datos local
psql -U postgres -d nombre_de_tu_base_de_datos -f fix_reconciliaciones_tables.sql

# O si tienes contraseña
psql -U postgres -W -d nombre_de_tu_base_de_datos -f fix_reconciliaciones_tables.sql
```

### **Opción 2: Usando pgAdmin**

1. **Abrir pgAdmin**
2. **Conectarse a tu base de datos**
3. **Ir a**: Tools → Query Tool (o presionar F5)
4. **Abrir el archivo**: File → Open → Seleccionar `fix_reconciliaciones_tables.sql`
5. **Ejecutar**: Presionar F5 o el botón ▶️ "Execute/Refresh"

### **Opción 3: Usando DBeaver / DataGrip / TablePlus**

1. **Conectarse a la base de datos**
2. **Abrir una nueva consola SQL**
3. **Copiar y pegar** todo el contenido de `fix_reconciliaciones_tables.sql`
4. **Ejecutar** el script

### **Opción 4: Copiar y Pegar**

1. **Abrir** el archivo `fix_reconciliaciones_tables.sql`
2. **Copiar** todo el contenido (Ctrl+A, Ctrl+C)
3. **Pegar** en tu cliente SQL favorito
4. **Ejecutar** el script

---

## 📊 **¿Qué Hace el Script?**

El script SQL creará automáticamente:

### **✅ 3 Tablas Principales:**
1. **`reconciliaciones_caja`** - Tabla principal de reconciliaciones
   - Guarda reconciliaciones de efectivo y completas
   - Multi-tenant por restaurante y sucursal
   - Calcula diferencias automáticamente

2. **`reconciliaciones_metodos_pago`** - Detalles por método de pago
   - Para reconciliaciones completas
   - Guarda montos esperados vs registrados
   - Calcula diferencias por método

3. **`reconciliaciones_historial`** - Auditoría de cambios
   - Registra todas las modificaciones
   - Útil para auditorías y reportes

### **✅ Índices para Performance:**
- Búsqueda rápida por restaurante, sucursal, vendedor
- Filtrado eficiente por fecha, estado, tipo
- Consultas optimizadas

### **✅ Vista Completa:**
- `vista_reconciliaciones_completa` - Une todas las tablas
- Incluye nombres de sucursales y vendedores
- Calcula estados automáticamente

### **✅ Triggers Automáticos:**
- Actualización automática de `updated_at`
- Validaciones de datos

---

## 🔍 **Verificar que Funcionó**

Después de ejecutar el script, puedes verificar con estas consultas:

### **1. Verificar que las tablas se crearon:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%reconciliacion%'
ORDER BY table_name;
```

**Resultado esperado:**
- `reconciliaciones_caja`
- `reconciliaciones_historial`
- `reconciliaciones_metodos_pago`

### **2. Verificar la estructura de reconciliaciones_caja:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reconciliaciones_caja' 
ORDER BY ordinal_position;
```

**Resultado esperado:** 17 columnas incluyendo:
- `id_reconciliacion`
- `tipo_reconciliacion`
- `efectivo_esperado`
- `efectivo_fisico`
- `diferencia_efectivo`
- etc.

### **3. Verificar que no hay errores:**
```sql
-- Esta consulta NO debe dar error
SELECT * FROM reconciliaciones_caja LIMIT 1;
```

---

## 🎯 **Después de Ejecutar el Script**

1. **Reiniciar el servidor backend**:
   ```bash
   # Detener el servidor (Ctrl+C)
   # Volver a iniciar
   npm start
   ```

2. **Limpiar caché del navegador** (Ctrl+Shift+Del)

3. **Recargar la aplicación** (F5)

4. **Probar las reconciliaciones**:
   - Como **Cajero**: Hacer una reconciliación nueva
   - Como **Admin**: Ir a Analytics → Reconciliaciones
   - **Verificar** que no aparezcan errores 500

---

## ⚠️ **Posibles Problemas**

### **Error: "relation already exists"**
- **Causa**: Las tablas ya existen parcialmente
- **Solución**: El script usa `CREATE TABLE IF NOT EXISTS`, así que esto no debería pasar
- **Si persiste**: Puedes eliminar las tablas manualmente primero:
  ```sql
  DROP TABLE IF EXISTS reconciliaciones_historial CASCADE;
  DROP TABLE IF EXISTS reconciliaciones_metodos_pago CASCADE;
  DROP TABLE IF EXISTS reconciliaciones_caja CASCADE;
  DROP VIEW IF EXISTS vista_reconciliaciones_completa CASCADE;
  ```
  Y luego ejecutar el script nuevamente.

### **Error: "permission denied"**
- **Causa**: El usuario de la base de datos no tiene permisos
- **Solución**: Conectarte con un usuario con permisos de CREATE TABLE (normalmente `postgres`)

### **Error: "database does not exist"**
- **Causa**: Nombre de base de datos incorrecto
- **Solución**: Verificar el nombre correcto de tu base de datos

---

## 📞 **Si Tienes Problemas**

Si encuentras algún error al ejecutar el script, por favor:

1. **Copia el mensaje de error completo**
2. **Dime qué cliente SQL estás usando** (pgAdmin, psql, DBeaver, etc.)
3. **Comparte el error** para ayudarte a resolverlo

---

## ✅ **Checklist de Ejecución**

- [ ] Conectado a la base de datos correcta
- [ ] Usuario con permisos adecuados
- [ ] Archivo `fix_reconciliaciones_tables.sql` abierto
- [ ] Script ejecutado sin errores
- [ ] Tablas verificadas (3 tablas + 1 vista)
- [ ] Servidor backend reiniciado
- [ ] Aplicación recargada
- [ ] Reconciliaciones funcionando sin errores 500

---

## 🎉 **Una Vez Completado**

Las reconciliaciones funcionarán correctamente:

- ✅ Los **cajeros** podrán hacer reconciliaciones
- ✅ Los **admins** podrán ver todas las reconciliaciones
- ✅ **Estadísticas** y **analytics** funcionarán
- ✅ **Historial** completo disponible
- ✅ **Auditoría** de cambios habilitada

**¡Listo! Las reconciliaciones estarán completamente funcionales.**

