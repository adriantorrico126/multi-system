# 🚀 GUÍA RÁPIDA: CÓMO REGISTRAR CONSUMOS DE PENSIONADOS

**Sistema:** SITEMM - POS  
**Módulo:** Pensionados  
**Estado:** Beta - Integración en Progreso

---

## 📋 **OPCIÓN ACTUAL: REGISTRAR VÍA API (Temporal)**

Mientras se completa la integración total con el POS, puedes registrar consumos usando la API directamente:                                         

### **Paso 1: Crear la Venta Normalmente en el POS**                              

1. Toma el pedido del pensionado como una venta regular
2. Selecciona productos, modif icadores, etc.
3. **Al finalizar, anota el ID de la venta** (aparece en el comprobante o en la lista de ventas)

### **Paso 2: Registrar el Consumo del Pensionado**

Usa una herramienta como **Postman** o **Thunder Client**:            

```http
POST http://localhost:3000/api/v1/pensionados/consumo
Authorization: Bearer {tu_token_jwt}
Content-Type: application/json
```

**Body:**
```json
{
  "id_pensionado": 1,
  "fecha_consumo": "2025-10-17",
  "tipo_comida": "almuerzo",
  "id_venta": 123,
  "productos_consumidos": [
    {
      "id_producto": 15,
      "nombre_producto": "Menú del día",
      "cantidad": 1,
      "precio_unitario": 25.00,
      "subtotal": 25.00
    }
  ],
  "total_consumido": 25.00,
  "observaciones": "Consumo regular"
}
```

---

## 🎯 **OPCIÓN FUTURA: INTEGRACIÓN COMPLETA (Próximamente)**

### **Flujo Planeado:**

```
1. Cliente pensionado llega al restaurante
2. Mesero toma el pedido normalmente
3. En el checkout, aparece botón "Pensionado" 
4. Click en "Pensionado" abre modal de selección
5. Seleccionar el pensionado de la lista
6. Sistema verifica que puede consumir
7. Confirmar → Se registra automáticamente
8. El consumo queda vinculado a su cuenta
```

### **Lo que falta implementar:**
- ✅ Modal de selección de pensionado (creado)
- ⏳ Crear venta primero, luego vincular al pensionado
- ⏳ Actualizar el flujo de `confirmSale` en POSSystem
- ⏳ Testing completo de la integración

---

## 💡 **SOLUCIÓN TEMPORAL: PROCESO MANUAL**

### **Para el usuario actual:**

#### **1. Identificar al pensionado:**
- Ve a **Dashboard → Pensionados**
- Verifica que el cliente tenga estado "activo"
- Anota el **ID del pensionado** (aparece en la tarjeta)

#### **2. Tomar el pedido:**
- Procesa la venta normalmente en el POS
- Completa el checkout como cualquier venta
- **IMPORTANTE:** Anota el **ID de la venta** (o búscala después en Historial)

#### **3. Vincular manualmente:**
- Abre Postman o Thunder Client
- Haz el `POST` al endpoint de consumo (ver arriba)
- Ingresa:
  - `id_pensionado`: El ID que anotaste
  - `id_venta`: El ID de la venta recién creada
  - Los demás datos de la venta

#### **4. Verificar:**
- Ve a Dashboard → Pensionados
- Click en "Ver" del pensionado
- Tab "Consumos" → Debería aparecer el consumo registrado

---

## 🔧 **COMPLETAR LA INTEGRACIÓN (Para Desarrollador)**

### **Archivos ya creados:**
- ✅ `SeleccionarPensionadoModal.tsx` - Modal de selección
- ✅ Botón "Pensionado" en CheckoutModal
- ✅ API completa del backend

### **Lo que falta:**

1. **Modificar el flujo de confirmSale en POSSystem.tsx:**
   ```typescript
   // Después de crear la venta exitosamente:
   if (modoConsumoPensionado) {
     setVentaRecienCreada(response.id_venta);
     setShowPensionadoModal(true);
     // El modal se encargará de registrar el consumo
   }
   ```

2. **Agregar estado en POSSystem:**
   ```typescript
   const [modoConsumoPensionado, setModoConsumoPensionado] = useState(false);
   const [showPensionadoModal, setShowPensionadoModal] = useState(false);
   const [ventaRecienCreada, setVentaRecienCreada] = useState<number | null>(null);
   ```

3. **Pasar el modo al CheckoutModal:**
   ```typescript
   <CheckoutModal
     // ... otros props
     onSelectPensionado={() => setModoConsumoPensionado(true)}
   />
   ```

4. **Actualizar SeleccionarPensionadoModal:**
   - Ya está listo, solo necesita recibir el id_venta correcto

---

## 📊 **VERIFICAR CONSUMOS REGISTRADOS**

### **Vía Frontend:**
1. Dashboard → Pensionados
2. Click en "Ver" del pensionado
3. Tab "Consumos"
4. Verás la lista de todos sus consumos

### **Vía API:**
```http
GET http://localhost:3000/api/v1/pensionados/{id}/consumos
Authorization: Bearer {token}
```

### **Verificar Estadísticas:**
```http
GET http://localhost:3000/api/v1/pensionados/{id}/estadisticas
Authorization: Bearer {token}
```

---

## ⚠️ **LIMITACIONES ACTUALES**

1. **No se puede vincular en tiempo real:** Primero se crea la venta, luego se vincula manualmente
2. **Requiere el ID de la venta:** Hay que buscarlo en el historial
3. **Proceso en dos pasos:** No es automático como debería ser

---

## 🎉 **LO QUE SÍ FUNCIONA 100%**

- ✅ Gestión completa de pensionados
- ✅ Crear, editar, eliminar pensionados
- ✅ Ver estadísticas y consumos
- ✅ Generar prefacturas consolidadas
- ✅ Verificar disponibilidad de consumo
- ✅ API completa y funcional
- ✅ Modal de selección de pensionado creado

---

## 🚀 **PRÓXIMOS PASOS RECOMENDADOS**

### **Para Usuario:**
1. Usa el proceso manual (crear venta → vincular vía API)
2. Mientras tanto, gestiona pensionados desde Dashboard

### **Para Desarrollador:**
1. Completar la integración del flujo (1-2 horas de trabajo)
2. Modificar `confirmSale` para manejar modo pensionado
3. Probar el flujo completo end-to-end
4. Desplegar a producción

---

## 📞 **SOPORTE**

Si necesitas ayuda con:
- ✅ Crear/gestionar pensionados
- ✅ Ver estadísticas y consumos
- ✅ Generar prefacturas
- ⏳ Integración automática con POS

**El sistema backend está 100% funcional. Solo falta terminar de conectar el frontend con el flujo de ventas del POS.** [[memory:7117303]]

---

**Última actualización:** 17 de octubre de 2025  
**Estado:** Backend completo ✅ | Integración POS parcial ⏳

