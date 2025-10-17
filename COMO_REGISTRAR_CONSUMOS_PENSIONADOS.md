# 📝 CÓMO REGISTRAR CONSUMOS DE PENSIONADOS

**Sistema:** SITEMM - POS Multi-tenant  
**Módulo:** Pensionados

---

## 🎯 **FLUJO COMPLETO DE REGISTRO DE CONSUMOS**

### **Opción 1: Registrar Consumo Manualmente (API)**

#### **Endpoint:**
```http
POST /api/v1/pensionados/consumo
Authorization: Bearer {token}
Content-Type: application/json
```

#### **Body del Request:**
```json
{
  "id_pensionado": 1,
  "fecha_consumo": "2025-10-17",
  "tipo_comida": "almuerzo",
  "productos_consumidos": [
    {
      "id_producto": 15,
      "nombre_producto": "Menú del día",
      "cantidad": 1,
      "precio_unitario": 25.00,
      "subtotal": 25.00,
      "modificadores": [
        {
          "id_modificador": 3,
          "nombre_modificador": "Extra queso",
          "precio_extra": 5.00
        }
      ]
    }
  ],
  "total_consumido": 30.00,
  "observaciones": "Cliente prefiere sin sal",
  "id_mesa": 5,
  "id_venta": 123
}
```

#### **Respuesta Exitosa:**
```json
{
  "success": true,
  "message": "Consumo registrado correctamente",
  "data": {
    "id_consumo": 45,
    "id_pensionado": 1,
    "fecha_consumo": "2025-10-17",
    "tipo_comida": "almuerzo",
    "total_consumido": 30.00,
    "productos_consumidos": [...],
    "created_at": "2025-10-17T12:30:00Z"
  }
}
```

---

## 🔗 **INTEGRACIÓN CON EL SISTEMA POS**

### **Flujo Recomendado:**

```
1. Cliente pensionado llega al restaurante
2. Mesero/Cajero verifica en "Pensionados" que esté activo
3. Mesero toma el pedido normalmente en el POS
4. Al finalizar la venta, en lugar de cobrar:
   - Marcar como "Consumo de Pensionado"
   - Seleccionar el pensionado de la lista
   - El sistema registra automáticamente el consumo
5. Se genera un comprobante para el pensionado
6. El consumo queda registrado en su cuenta
```

---

## 🛠️ **IMPLEMENTACIÓN TÉCNICA**

### **Paso 1: Verificar que el Pensionado Puede Consumir**

**Endpoint:**
```http
POST /api/v1/pensionados/:id/verificar-consumo
```

**Body:**
```json
{
  "fecha_consumo": "2025-10-17",
  "tipo_comida": "almuerzo"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "puede_consumir": true,
    "motivo": null,
    "consumos_hoy": 0,
    "limite_dia": 1,
    "consumos_restantes": 1
  }
}
```

### **Paso 2: Registrar el Consumo**

Después de verificar, usar el endpoint de registro mostrado arriba.

---

## 📊 **CONSULTAR CONSUMOS**

### **Obtener Consumos de un Pensionado:**

**Endpoint:**
```http
GET /api/v1/pensionados/:id/consumos?fecha_desde=2025-10-01&fecha_hasta=2025-10-31
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id_consumo": 45,
      "fecha_consumo": "2025-10-17",
      "tipo_comida": "almuerzo",
      "total_consumido": 30.00,
      "productos_consumidos": [...],
      "observaciones": "Cliente prefiere sin sal",
      "created_at": "2025-10-17T12:30:00Z"
    }
  ]
}
```

---

## 🧾 **GENERAR PREFACTURA CONSOLIDADA**

### **Cuando termina el período:**

**Endpoint:**
```http
POST /api/v1/pensionados/:id/prefacturas
```

**Body:**
```json
{
  "fecha_inicio_periodo": "2025-10-01",
  "fecha_fin_periodo": "2025-10-31",
  "observaciones": "Prefactura mensual - Octubre 2025"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Prefactura generada correctamente",
  "data": {
    "id_prefactura_pensionado": 12,
    "total_dias": 31,
    "total_consumo": 620.00,
    "descuentos_aplicados": 62.00,
    "total_final": 558.00,
    "estado": "pendiente",
    "productos_detallados": [...],
    "fecha_generacion": "2025-10-31T23:59:00Z"
  }
}
```

---

## 💡 **EJEMPLO DE USO COMPLETO**

### **Escenario: Cliente Pensionado Juan Pérez almuerza**

```javascript
// 1. Verificar que puede consumir
const verificacion = await fetch('http://localhost:3000/api/v1/pensionados/1/verificar-consumo', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fecha_consumo: '2025-10-17',
    tipo_comida: 'almuerzo'
  })
});

const { data } = await verificacion.json();

if (data.puede_consumir) {
  // 2. Cliente hace su pedido en el POS
  // ... pedido normal ...
  
  // 3. Al finalizar, registrar como consumo de pensionado
  const consumo = await fetch('http://localhost:3000/api/v1/pensionados/consumo', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id_pensionado: 1,
      fecha_consumo: '2025-10-17',
      tipo_comida: 'almuerzo',
      id_venta: ventaCreada.id_venta, // ID de la venta del POS
      id_mesa: 5,
      productos_consumidos: ventaCreada.detalles,
      total_consumido: ventaCreada.total,
      observaciones: 'Consumo regular'
    })
  });
  
  console.log('✅ Consumo registrado exitosamente');
} else {
  alert(`❌ ${data.motivo}`);
}
```

---

## 🎨 **PRÓXIMA MEJORA: COMPONENTE EN EL FRONTEND**

### **Componente a Crear: `RegistrarConsumoModal.tsx`**

Este componente permitirá:
- Buscar pensionado activo
- Verificar si puede consumir hoy
- Vincular con una venta del POS
- Registrar el consumo automáticamente

### **Ubicación sugerida:**
```
src/components/pensionados/RegistrarConsumoModal.tsx
```

### **Integración en el POS:**
- Agregar botón "Consumo Pensionado" en el checkout
- Al hacer click, abrir modal de selección de pensionado
- Verificar y registrar automáticamente

---

## 📋 **FLUJO VISUAL PROPUESTO**

```
┌─────────────────────────────────────┐
│   Ventana de Checkout (POS)        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Total a Pagar: Bs 30.00    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [ Pagar Efectivo ]          │   │
│  │ [ Pagar Tarjeta  ]          │   │
│  │ [ Consumo Pensionado ] ⭐   │ ← NUEVO BOTÓN
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│  Seleccionar Pensionado             │
│                                     │
│  🔍 Buscar: [_____________]         │
│                                     │
│  📋 Pensionados Activos:            │
│  ┌─────────────────────────────┐   │
│  │ ☑ Juan Pérez               │   │
│  │   Almuerzo disponible       │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ ☐ María García             │   │
│  │   Ya consumió hoy           │   │
│  └─────────────────────────────┘   │
│                                     │
│  [ Cancelar ]  [ Confirmar ]       │
└─────────────────────────────────────┘
                ↓
        ✅ Consumo Registrado
```

---

## 🚀 **IMPLEMENTACIÓN RÁPIDA EN FRONTEND**

### **Código de Ejemplo:**

```typescript
// En src/services/pensionadosApi.ts ya existe:
import { registrarConsumo, verificarConsumo } from '@/services/pensionadosApi';

// Usar en el componente:
const handleConsumoPensionado = async (venta: Sale) => {
  // 1. Verificar primero
  const verificacion = await verificarConsumo(
    pensionadoSeleccionado.id_pensionado,
    new Date().toISOString().split('T')[0],
    'almuerzo'
  );

  if (!verificacion.data?.puede_consumir) {
    toast.error(verificacion.data?.motivo || 'No puede consumir');
    return;
  }

  // 2. Registrar consumo
  const consumoData = {
    id_pensionado: pensionadoSeleccionado.id_pensionado,
    fecha_consumo: new Date().toISOString().split('T')[0],
    tipo_comida: 'almuerzo', // o 'desayuno', 'cena'
    id_venta: venta.id_venta,
    id_mesa: venta.id_mesa,
    productos_consumidos: venta.detalles.map(d => ({
      id_producto: d.id_producto,
      nombre_producto: d.nombre_producto,
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
      subtotal: d.subtotal,
      modificadores: d.modificadores || []
    })),
    total_consumido: venta.total,
    observaciones: `Consumo registrado desde POS`
  };

  const response = await registrarConsumo(consumoData);
  
  if (response.success) {
    toast.success('Consumo de pensionado registrado correctamente');
    // Actualizar estadísticas, cerrar modal, etc.
  }
};
```

---

## ✅ **RESUMEN**

### **Para registrar consumos de pensionados:**

1. **Manualmente vía API:** Usar el endpoint `POST /api/v1/pensionados/consumo`
2. **Integrado al POS:** Crear componente modal de selección de pensionado
3. **Verificación:** Siempre verificar primero si puede consumir
4. **Registro:** Vincular con la venta del POS
5. **Prefactura:** Generar al final del período

### **Próximos pasos:**
- ✅ Backend completo
- ✅ Página de gestión de pensionados
- ⏳ Modal de registro de consumo en POS
- ⏳ Integración con checkout

---

**¿Quieres que implemente el modal de registro de consumo en el POS ahora?** [[memory:7117303]]

