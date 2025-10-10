# 🍕 SISTEMA PROFESIONAL DE TOPPINGS/MODIFICADORES

**Sistema:** SITEMM POS  
**Módulo:** Gestión Avanzada de Toppings y Modificadores  
**Versión:** 3.0.0

---

## 📋 ÍNDICE

1. [Visión General](#visión-general)
2. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
3. [Backend - API REST](#backend---api-rest)
4. [Frontend - React Components](#frontend---react-components)
5. [Casos de Uso](#casos-de-uso)
6. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 VISIÓN GENERAL

### Problemática Actual
El sistema tiene un módulo básico de modificadores que necesita:
- ✅ Categorización de modificadores (extras, ingredientes, salsas, etc.)
- ✅ Límites de selección (mínimo/máximo)
- ✅ Modificadores obligatorios vs opcionales
- ✅ Grupos de modificadores (ej: "Elige tu proteína", "Agrega extras")
- ✅ Control de stock de modificadores
- ✅ Precios dinámicos y promociones
- ✅ UI/UX optimizada para móvil y desktop

### Solución Propuesta
Implementar un sistema de **3 capas**:
1. **Grupos de Modificadores** - Organizan los modificadores (ej: Salsas, Proteínas)
2. **Modificadores** - Los elementos individuales (ej: Salsa BBQ, Pollo)
3. **Reglas de Negocio** - Validaciones y restricciones

---

## 🗄️ ARQUITECTURA DE BASE DE DATOS

### Mejoras a Implementar

```sql
-- =====================================================
-- 1. GRUPOS DE MODIFICADORES (NUEVO)
-- =====================================================

CREATE TABLE IF NOT EXISTS grupos_modificadores (
    id_grupo_modificador SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) CHECK (tipo IN ('seleccion_unica', 'seleccion_multiple', 'cantidad_variable')),
    min_selecciones INTEGER DEFAULT 0,
    max_selecciones INTEGER,
    es_obligatorio BOOLEAN DEFAULT false,
    orden_display INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    id_restaurante INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

COMMENT ON TABLE grupos_modificadores IS 'Grupos que organizan modificadores (ej: Salsas, Proteínas, Extras)';
COMMENT ON COLUMN grupos_modificadores.tipo IS 'seleccion_unica: radio buttons, seleccion_multiple: checkboxes, cantidad_variable: input numérico';
COMMENT ON COLUMN grupos_modificadores.min_selecciones IS 'Número mínimo de modificadores que deben seleccionarse (0 = opcional)';
COMMENT ON COLUMN grupos_modificadores.max_selecciones IS 'Número máximo de modificadores (NULL = sin límite)';

-- =====================================================
-- 2. MODIFICADORES MEJORADOS (ACTUALIZACIÓN)
-- =====================================================

-- Agregar campos nuevos a la tabla existente
ALTER TABLE productos_modificadores
    ADD COLUMN IF NOT EXISTS id_grupo_modificador INTEGER REFERENCES grupos_modificadores(id_grupo_modificador) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS stock_disponible INTEGER,
    ADD COLUMN IF NOT EXISTS controlar_stock BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS imagen_url TEXT,
    ADD COLUMN IF NOT EXISTS descripcion TEXT,
    ADD COLUMN IF NOT EXISTS calorias INTEGER,
    ADD COLUMN IF NOT EXISTS es_vegetariano BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS es_vegano BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS contiene_gluten BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS alergenos TEXT[], -- Array de alérgenos
    ADD COLUMN IF NOT EXISTS precio_base NUMERIC(10,2), -- Para cálculos de promociones
    ADD COLUMN IF NOT EXISTS descuento_porcentaje NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS orden_display INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS id_restaurante INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Agregar foreign key de restaurante si no existe
ALTER TABLE productos_modificadores
    ADD CONSTRAINT fk_productos_modificadores_restaurante 
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE;

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_modificadores_grupo ON productos_modificadores(id_grupo_modificador);
CREATE INDEX IF NOT EXISTS idx_modificadores_producto ON productos_modificadores(id_producto);
CREATE INDEX IF NOT EXISTS idx_modificadores_restaurante ON productos_modificadores(id_restaurante);

COMMENT ON COLUMN productos_modificadores.stock_disponible IS 'Stock actual si se controla inventario';
COMMENT ON COLUMN productos_modificadores.precio_base IS 'Precio original antes de descuentos';
COMMENT ON COLUMN productos_modificadores.alergenos IS 'Array de alérgenos: {nueces, lacteos, mariscos, etc}';

-- =====================================================
-- 3. RELACIÓN PRODUCTOS - GRUPOS DE MODIFICADORES
-- =====================================================

CREATE TABLE IF NOT EXISTS productos_grupos_modificadores (
    id SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL,
    id_grupo_modificador INTEGER NOT NULL,
    orden_display INTEGER DEFAULT 0,
    es_obligatorio BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id_producto, id_grupo_modificador),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_grupo_modificador) REFERENCES grupos_modificadores(id_grupo_modificador) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_productos_grupos_producto ON productos_grupos_modificadores(id_producto);
CREATE INDEX IF NOT EXISTS idx_productos_grupos_modificador ON productos_grupos_modificadores(id_grupo_modificador);

COMMENT ON TABLE productos_grupos_modificadores IS 'Define qué grupos de modificadores aplican a cada producto';

-- =====================================================
-- 4. DETALLE DE VENTAS - MODIFICADORES (ACTUALIZACIÓN)
-- =====================================================

ALTER TABLE detalle_ventas_modificadores
    ADD COLUMN IF NOT EXISTS cantidad INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS precio_unitario NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS observaciones TEXT;

COMMENT ON COLUMN detalle_ventas_modificadores.cantidad IS 'Cantidad del modificador (ej: 2x queso extra)';
COMMENT ON COLUMN detalle_ventas_modificadores.precio_unitario IS 'Precio unitario al momento de la venta (histórico)';

-- =====================================================
-- 5. PROMOCIONES DE MODIFICADORES (NUEVO)
-- =====================================================

CREATE TABLE IF NOT EXISTS promociones_modificadores (
    id_promocion_modificador SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(30) CHECK (tipo IN ('porcentaje', 'precio_fijo', 'combo', '2x1', 'gratis_con_producto')),
    valor NUMERIC(10,2),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    id_modificador INTEGER,
    id_producto_requerido INTEGER, -- Para "gratis con producto X"
    cantidad_minima INTEGER DEFAULT 1,
    activo BOOLEAN DEFAULT true,
    id_restaurante INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_modificador) REFERENCES productos_modificadores(id_modificador) ON DELETE CASCADE,
    FOREIGN KEY (id_producto_requerido) REFERENCES productos(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_promociones_modificadores_restaurante ON promociones_modificadores(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_promociones_modificadores_fechas ON promociones_modificadores(fecha_inicio, fecha_fin);

COMMENT ON TABLE promociones_modificadores IS 'Promociones específicas para modificadores/toppings';

-- =====================================================
-- 6. VISTAS ÚTILES
-- =====================================================

-- Vista de modificadores con información completa
CREATE OR REPLACE VIEW vista_modificadores_completa AS
SELECT 
    pm.id_modificador,
    pm.nombre_modificador,
    pm.descripcion,
    pm.precio_extra,
    pm.tipo_modificador,
    pm.stock_disponible,
    pm.controlar_stock,
    pm.imagen_url,
    pm.calorias,
    pm.es_vegetariano,
    pm.es_vegano,
    pm.contiene_gluten,
    pm.alergenos,
    pm.activo,
    gm.id_grupo_modificador,
    gm.nombre AS grupo_nombre,
    gm.tipo AS grupo_tipo,
    gm.es_obligatorio AS grupo_obligatorio,
    p.id_producto,
    p.nombre AS producto_nombre,
    CASE 
        WHEN pm.controlar_stock AND pm.stock_disponible <= 0 THEN 'sin_stock'
        WHEN pm.controlar_stock AND pm.stock_disponible <= 5 THEN 'stock_bajo'
        ELSE 'disponible'
    END AS estado_stock,
    CASE
        WHEN pm.descuento_porcentaje IS NOT NULL AND pm.descuento_porcentaje > 0 
        THEN pm.precio_extra * (1 - pm.descuento_porcentaje / 100)
        ELSE pm.precio_extra
    END AS precio_final
FROM productos_modificadores pm
LEFT JOIN grupos_modificadores gm ON pm.id_grupo_modificador = gm.id_grupo_modificador
LEFT JOIN productos p ON pm.id_producto = p.id_producto
WHERE pm.activo = true;

-- Vista de grupos de modificadores por producto
CREATE OR REPLACE VIEW vista_grupos_por_producto AS
SELECT 
    p.id_producto,
    p.nombre AS producto_nombre,
    gm.id_grupo_modificador,
    gm.nombre AS grupo_nombre,
    gm.tipo AS grupo_tipo,
    gm.min_selecciones,
    gm.max_selecciones,
    gm.es_obligatorio,
    gm.orden_display,
    COUNT(pm.id_modificador) AS total_modificadores,
    json_agg(
        json_build_object(
            'id', pm.id_modificador,
            'nombre', pm.nombre_modificador,
            'precio', pm.precio_extra,
            'disponible', CASE 
                WHEN pm.controlar_stock THEN pm.stock_disponible > 0
                ELSE true
            END
        ) ORDER BY pm.orden_display
    ) AS modificadores
FROM productos p
JOIN productos_grupos_modificadores pgm ON p.id_producto = pgm.id_producto
JOIN grupos_modificadores gm ON pgm.id_grupo_modificador = gm.id_grupo_modificador
LEFT JOIN productos_modificadores pm ON gm.id_grupo_modificador = pm.id_grupo_modificador AND pm.activo = true
WHERE p.activo = true AND gm.activo = true
GROUP BY p.id_producto, p.nombre, gm.id_grupo_modificador, gm.nombre, 
         gm.tipo, gm.min_selecciones, gm.max_selecciones, gm.es_obligatorio, gm.orden_display
ORDER BY p.id_producto, gm.orden_display;

-- =====================================================
-- 7. TRIGGERS PARA MANEJO DE STOCK
-- =====================================================

-- Trigger para actualizar stock de modificadores al crear venta
CREATE OR REPLACE FUNCTION actualizar_stock_modificadores()
RETURNS TRIGGER AS $$
BEGIN
    -- Reducir stock si el modificador controla inventario
    UPDATE productos_modificadores pm
    SET stock_disponible = stock_disponible - NEW.cantidad,
        updated_at = NOW()
    WHERE pm.id_modificador = NEW.id_modificador
    AND pm.controlar_stock = true;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_stock_modificadores
AFTER INSERT ON detalle_ventas_modificadores
FOR EACH ROW
EXECUTE FUNCTION actualizar_stock_modificadores();

-- =====================================================
-- 8. FUNCIÓN PARA VALIDAR SELECCIÓN DE MODIFICADORES
-- =====================================================

CREATE OR REPLACE FUNCTION validar_modificadores_producto(
    p_id_producto INTEGER,
    p_modificadores_seleccionados INTEGER[]
) RETURNS TABLE (
    es_valido BOOLEAN,
    mensaje_error TEXT,
    grupo_invalido VARCHAR(100)
) AS $$
DECLARE
    v_grupo RECORD;
    v_count INTEGER;
BEGIN
    -- Validar cada grupo de modificadores
    FOR v_grupo IN 
        SELECT 
            gm.id_grupo_modificador,
            gm.nombre,
            gm.min_selecciones,
            gm.max_selecciones,
            gm.es_obligatorio
        FROM grupos_modificadores gm
        JOIN productos_grupos_modificadores pgm 
            ON gm.id_grupo_modificador = pgm.id_grupo_modificador
        WHERE pgm.id_producto = p_id_producto
        AND gm.activo = true
    LOOP
        -- Contar modificadores seleccionados de este grupo
        SELECT COUNT(*) INTO v_count
        FROM productos_modificadores pm
        WHERE pm.id_grupo_modificador = v_grupo.id_grupo_modificador
        AND pm.id_modificador = ANY(p_modificadores_seleccionados);
        
        -- Validar mínimo
        IF v_count < v_grupo.min_selecciones THEN
            RETURN QUERY SELECT 
                false, 
                format('Debe seleccionar al menos %s de "%s"', 
                    v_grupo.min_selecciones, v_grupo.nombre),
                v_grupo.nombre;
            RETURN;
        END IF;
        
        -- Validar máximo
        IF v_grupo.max_selecciones IS NOT NULL AND v_count > v_grupo.max_selecciones THEN
            RETURN QUERY SELECT 
                false,
                format('No puede seleccionar más de %s de "%s"', 
                    v_grupo.max_selecciones, v_grupo.nombre),
                v_grupo.nombre;
            RETURN;
        END IF;
    END LOOP;
    
    -- Todo válido
    RETURN QUERY SELECT true, 'OK'::TEXT, NULL::VARCHAR(100);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. DATOS DE EJEMPLO (PIZZA)
-- =====================================================

-- Grupos de modificadores para pizza
INSERT INTO grupos_modificadores (nombre, descripcion, tipo, min_selecciones, max_selecciones, es_obligatorio, orden_display, id_restaurante)
VALUES 
    ('Tamaño', 'Elige el tamaño de tu pizza', 'seleccion_unica', 1, 1, true, 1, 1),
    ('Masa', 'Tipo de masa', 'seleccion_unica', 1, 1, true, 2, 1),
    ('Ingredientes Extra', 'Agrega ingredientes adicionales', 'seleccion_multiple', 0, 5, false, 3, 1),
    ('Salsas', 'Salsas adicionales', 'seleccion_multiple', 0, 3, false, 4, 1),
    ('Queso Extra', 'Cantidad de queso extra', 'cantidad_variable', 0, NULL, false, 5, 1)
ON CONFLICT DO NOTHING;

-- Modificadores de ejemplo
-- (Asumiendo que existe un producto con id_producto = 1)
INSERT INTO productos_modificadores (
    id_producto, nombre_modificador, precio_extra, tipo_modificador, 
    id_grupo_modificador, stock_disponible, controlar_stock, 
    descripcion, calorias, es_vegetariano, orden_display, id_restaurante
)
VALUES 
    -- Tamaños
    (1, 'Personal (25cm)', 0, 'tamaño', 1, NULL, false, 'Para 1 persona', 600, true, 1, 1),
    (1, 'Mediana (30cm)', 5, 'tamaño', 1, NULL, false, 'Para 2 personas', 900, true, 2, 1),
    (1, 'Familiar (40cm)', 10, 'tamaño', 1, NULL, false, 'Para 4-5 personas', 1500, true, 3, 1),
    
    -- Masas
    (1, 'Masa Tradicional', 0, 'masa', 2, NULL, false, 'Masa clásica italiana', 200, true, 1, 1),
    (1, 'Masa Delgada', 0, 'masa', 2, NULL, false, 'Crujiente y ligera', 150, true, 2, 1),
    (1, 'Masa Integral', 2, 'masa', 2, NULL, false, 'Con harina integral', 180, true, 3, 1),
    (1, 'Masa Sin Gluten', 5, 'masa', 2, 10, true, 'Para celíacos', 190, true, 4, 1),
    
    -- Ingredientes Extra
    (1, 'Champiñones', 2, 'ingrediente', 3, 50, true, 'Champiñones frescos', 15, true, 1, 1),
    (1, 'Aceitunas', 1.5, 'ingrediente', 3, 30, true, 'Aceitunas negras', 20, true, 2, 1),
    (1, 'Pimientos', 1.5, 'ingrediente', 3, 40, true, 'Pimientos dulces', 10, true, 3, 1),
    (1, 'Cebolla', 1, 'ingrediente', 3, 60, true, 'Cebolla morada', 8, true, 4, 1),
    (1, 'Tomate Cherry', 2, 'ingrediente', 3, 25, true, 'Tomates cherry frescos', 12, true, 5, 1),
    
    -- Salsas
    (1, 'Salsa BBQ', 1, 'salsa', 4, NULL, false, 'Salsa barbacoa dulce', 30, true, 1, 1),
    (1, 'Salsa Picante', 0.5, 'salsa', 4, NULL, false, 'Salsa picante de la casa', 5, true, 2, 1),
    (1, 'Salsa de Ajo', 1, 'salsa', 4, NULL, false, 'Salsa cremosa de ajo', 40, true, 3, 1),
    
    -- Queso Extra
    (1, 'Queso Mozzarella Extra', 3, 'queso', 5, 100, true, 'Por porción adicional', 75, true, 1, 1)
ON CONFLICT DO NOTHING;

-- Asociar grupos a productos
INSERT INTO productos_grupos_modificadores (id_producto, id_grupo_modificador, orden_display, es_obligatorio)
VALUES 
    (1, 1, 1, true),  -- Tamaño obligatorio
    (1, 2, 2, true),  -- Masa obligatoria
    (1, 3, 3, false), -- Ingredientes opcionales
    (1, 4, 4, false), -- Salsas opcionales
    (1, 5, 5, false)  -- Queso extra opcional
ON CONFLICT DO NOTHING;
```

---

## 🔧 BACKEND - API REST

### Estructura de Archivos

```
src/
├── models/
│   ├── modificadorModel.js (MEJORAR)
│   ├── grupoModificadorModel.js (NUEVO)
│   └── promocionModificadorModel.js (NUEVO)
├── controllers/
│   ├── modificadorController.js (MEJORAR)
│   ├── grupoModificadorController.js (NUEVO)
│   └── promocionModificadorController.js (NUEVO)
├── routes/
│   ├── modificadorRoutes.js (MEJORAR)
│   ├── grupoModificadorRoutes.js (NUEVO)
│   └── promocionModificadorRoutes.js (NUEVO)
├── middlewares/
│   └── validarModificadores.js (NUEVO)
└── services/
    └── modificadorService.js (NUEVO)
```

### 1. Modelo Mejorado - modificadorModel.js

```javascript
const { pool } = require('../config/database');

const ModificadorModel = {
  /**
   * Obtener todos los grupos de modificadores de un producto
   * con sus modificadores anidados
   */
  async obtenerGruposPorProducto(id_producto) {
    const query = `
      SELECT * FROM vista_grupos_por_producto
      WHERE id_producto = $1
      ORDER BY orden_display
    `;
    
    const result = await pool.query(query, [id_producto]);
    return result.rows;
  },

  /**
   * Obtener modificadores completos con información detallada
   */
  async obtenerModificadoresCompletos(id_producto, id_restaurante) {
    const query = `
      SELECT 
        id_modificador,
        nombre_modificador,
        descripcion,
        precio_extra,
        precio_final,
        tipo_modificador,
        stock_disponible,
        controlar_stock,
        imagen_url,
        calorias,
        es_vegetariano,
        es_vegano,
        contiene_gluten,
        alergenos,
        grupo_nombre,
        grupo_tipo,
        grupo_obligatorio,
        estado_stock
      FROM vista_modificadores_completa
      WHERE id_producto = $1
      AND id_restaurante = $2
      AND activo = true
      ORDER BY grupo_obligatorio DESC, orden_display
    `;
    
    const result = await pool.query(query, [id_producto, id_restaurante]);
    return result.rows;
  },

  /**
   * Crear modificador con validación de stock
   */
  async crear(modificadorData) {
    const {
      id_producto,
      nombre_modificador,
      precio_extra,
      tipo_modificador,
      id_grupo_modificador,
      stock_disponible,
      controlar_stock,
      imagen_url,
      descripcion,
      calorias,
      es_vegetariano,
      es_vegano,
      contiene_gluten,
      alergenos,
      id_restaurante
    } = modificadorData;

    const query = `
      INSERT INTO productos_modificadores (
        id_producto, nombre_modificador, precio_extra, tipo_modificador,
        id_grupo_modificador, stock_disponible, controlar_stock,
        imagen_url, descripcion, calorias, es_vegetariano, es_vegano,
        contiene_gluten, alergenos, id_restaurante
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const result = await pool.query(query, [
      id_producto, nombre_modificador, precio_extra, tipo_modificador,
      id_grupo_modificador, stock_disponible, controlar_stock,
      imagen_url, descripcion, calorias, es_vegetariano, es_vegano,
      contiene_gluten, alergenos, id_restaurante
    ]);

    return result.rows[0];
  },

  /**
   * Actualizar modificador
   */
  async actualizar(id_modificador, modificadorData, id_restaurante) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Construir query dinámicamente
    Object.entries(modificadorData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    // Agregar updated_at
    fields.push(`updated_at = NOW()`);

    const query = `
      UPDATE productos_modificadores
      SET ${fields.join(', ')}
      WHERE id_modificador = $${paramIndex}
      AND id_restaurante = $${paramIndex + 1}
      RETURNING *
    `;

    values.push(id_modificador, id_restaurante);

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  /**
   * Validar selección de modificadores
   */
  async validarSeleccion(id_producto, modificadoresSeleccionados) {
    const query = `
      SELECT * FROM validar_modificadores_producto($1, $2)
    `;

    const result = await pool.query(query, [
      id_producto,
      modificadoresSeleccionados
    ]);

    return result.rows[0];
  },

  /**
   * Asociar modificadores a detalle de venta con cantidades
   */
  async asociarAVenta(id_detalle_venta, modificadores) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const mod of modificadores) {
        const { id_modificador, cantidad, precio_aplicado, observaciones } = mod;

        await client.query(
          `INSERT INTO detalle_ventas_modificadores (
            id_detalle_venta, id_modificador, cantidad, 
            precio_unitario, subtotal, precio_aplicado, observaciones
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            id_detalle_venta,
            id_modificador,
            cantidad || 1,
            precio_aplicado,
            (cantidad || 1) * precio_aplicado,
            precio_aplicado,
            observaciones
          ]
        );
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Obtener modificadores de una venta
   */
  async obtenerPorVenta(id_venta) {
    const query = `
      SELECT 
        dvm.*,
        pm.nombre_modificador,
        pm.tipo_modificador,
        pm.imagen_url
      FROM detalle_ventas_modificadores dvm
      JOIN detalle_ventas dv ON dvm.id_detalle_venta = dv.id_detalle
      JOIN productos_modificadores pm ON dvm.id_modificador = pm.id_modificador
      WHERE dv.id_venta = $1
    `;

    const result = await pool.query(query, [id_venta]);
    return result.rows;
  },

  /**
   * Verificar disponibilidad de stock
   */
  async verificarStock(id_modificador, cantidad) {
    const query = `
      SELECT 
        controlar_stock,
        stock_disponible,
        nombre_modificador
      FROM productos_modificadores
      WHERE id_modificador = $1
    `;

    const result = await pool.query(query, [id_modificador]);
    const mod = result.rows[0];

    if (!mod) {
      throw new Error('Modificador no encontrado');
    }

    if (mod.controlar_stock && mod.stock_disponible < cantidad) {
      throw new Error(`Stock insuficiente de ${mod.nombre_modificador}. Disponible: ${mod.stock_disponible}`);
    }

    return true;
  }
};

module.exports = ModificadorModel;
```

### 2. Modelo de Grupos - grupoModificadorModel.js (NUEVO)

```javascript
const { pool } = require('../config/database');

const GrupoModificadorModel = {
  /**
   * Obtener todos los grupos de un restaurante
   */
  async obtenerTodos(id_restaurante) {
    const query = `
      SELECT * FROM grupos_modificadores
      WHERE id_restaurante = $1
      AND activo = true
      ORDER BY orden_display, nombre
    `;

    const result = await pool.query(query, [id_restaurante]);
    return result.rows;
  },

  /**
   * Crear grupo de modificadores
   */
  async crear(grupoData) {
    const {
      nombre,
      descripcion,
      tipo,
      min_selecciones,
      max_selecciones,
      es_obligatorio,
      orden_display,
      id_restaurante
    } = grupoData;

    const query = `
      INSERT INTO grupos_modificadores (
        nombre, descripcion, tipo, min_selecciones, max_selecciones,
        es_obligatorio, orden_display, id_restaurante
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre, descripcion, tipo, min_selecciones, max_selecciones,
      es_obligatorio, orden_display, id_restaurante
    ]);

    return result.rows[0];
  },

  /**
   * Asociar grupo a producto
   */
  async asociarAProducto(id_producto, id_grupo_modificador, orden_display, es_obligatorio) {
    const query = `
      INSERT INTO productos_grupos_modificadores (
        id_producto, id_grupo_modificador, orden_display, es_obligatorio
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id_producto, id_grupo_modificador) 
      DO UPDATE SET 
        orden_display = EXCLUDED.orden_display,
        es_obligatorio = EXCLUDED.es_obligatorio
      RETURNING *
    `;

    const result = await pool.query(query, [
      id_producto, id_grupo_modificador, orden_display, es_obligatorio
    ]);

    return result.rows[0];
  },

  /**
   * Obtener grupos de un producto
   */
  async obtenerPorProducto(id_producto) {
    const query = `
      SELECT 
        gm.*,
        pgm.orden_display as orden_producto,
        pgm.es_obligatorio as obligatorio_producto
      FROM grupos_modificadores gm
      JOIN productos_grupos_modificadores pgm 
        ON gm.id_grupo_modificador = pgm.id_grupo_modificador
      WHERE pgm.id_producto = $1
      AND gm.activo = true
      ORDER BY pgm.orden_display
    `;

    const result = await pool.query(query, [id_producto]);
    return result.rows;
  }
};

module.exports = GrupoModificadorModel;
```

### 3. Controller Mejorado - modificadorController.js

```javascript
const ModificadorModel = require('../models/modificadorModel');
const GrupoModificadorModel = require('../models/grupoModificadorModel');
const logger = require('../config/logger');

const modificadorController = {
  /**
   * Obtener grupos con modificadores de un producto
   */
  async obtenerGruposPorProducto(req, res) {
    try {
      const { id_producto } = req.params;
      const id_restaurante = req.user.id_restaurante;

      const grupos = await ModificadorModel.obtenerGruposPorProducto(id_producto);

      res.status(200).json({
        success: true,
        data: grupos
      });
    } catch (error) {
      logger.error('Error al obtener grupos de modificadores:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener modificadores',
        error: error.message
      });
    }
  },

  /**
   * Crear modificador
   */
  async crear(req, res) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const modificadorData = {
        ...req.body,
        id_restaurante
      };

      // Validaciones
      if (!modificadorData.id_producto || !modificadorData.nombre_modificador) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios'
        });
      }

      const modificador = await ModificadorModel.crear(modificadorData);

      logger.info(`Modificador creado: ${modificador.id_modificador} por usuario ${req.user.username}`);

      res.status(201).json({
        success: true,
        message: 'Modificador creado exitosamente',
        data: modificador
      });
    } catch (error) {
      logger.error('Error al crear modificador:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear modificador',
        error: error.message
      });
    }
  },

  /**
   * Actualizar modificador
   */
  async actualizar(req, res) {
    try {
      const { id_modificador } = req.params;
      const id_restaurante = req.user.id_restaurante;
      const modificadorData = req.body;

      const modificador = await ModificadorModel.actualizar(
        id_modificador,
        modificadorData,
        id_restaurante
      );

      if (!modificador) {
        return res.status(404).json({
          success: false,
          message: 'Modificador no encontrado'
        });
      }

      logger.info(`Modificador actualizado: ${id_modificador} por usuario ${req.user.username}`);

      res.status(200).json({
        success: true,
        message: 'Modificador actualizado exitosamente',
        data: modificador
      });
    } catch (error) {
      logger.error('Error al actualizar modificador:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar modificador',
        error: error.message
      });
    }
  },

  /**
   * Validar selección de modificadores antes de agregar al carrito
   */
  async validarSeleccion(req, res) {
    try {
      const { id_producto, modificadores } = req.body;

      const validacion = await ModificadorModel.validarSeleccion(
        id_producto,
        modificadores
      );

      res.status(200).json({
        success: validacion.es_valido,
        message: validacion.mensaje_error || 'Selección válida',
        data: validacion
      });
    } catch (error) {
      logger.error('Error al validar modificadores:', error);
      res.status(500).json({
        success: false,
        message: 'Error al validar modificadores',
        error: error.message
      });
    }
  },

  /**
   * Verificar stock antes de venta
   */
  async verificarStock(req, res) {
    try {
      const { modificadores } = req.body;

      for (const mod of modificadores) {
        await ModificadorModel.verificarStock(
          mod.id_modificador,
          mod.cantidad || 1
        );
      }

      res.status(200).json({
        success: true,
        message: 'Stock disponible'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = modificadorController;
```

### 4. Rutas Mejoradas - modificadorRoutes.js

```javascript
const express = require('express');
const router = express.Router();
const modificadorController = require('../controllers/modificadorController');
const grupoModificadorController = require('../controllers/grupoModificadorController');
const { authenticateToken, authorizeRoles, ensureTenantContext } = require('../middlewares/authMiddleware');

// ===== RUTAS DE MODIFICADORES =====

// Obtener grupos con modificadores de un producto
router.get(
  '/producto/:id_producto/grupos',
  authenticateToken,
  ensureTenantContext,
  modificadorController.obtenerGruposPorProducto
);

// Crear modificador (solo admin/gerente)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  modificadorController.crear
);

// Actualizar modificador (solo admin/gerente)
router.put(
  '/:id_modificador',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  modificadorController.actualizar
);

// Validar selección de modificadores
router.post(
  '/validar',
  authenticateToken,
  ensureTenantContext,
  modificadorController.validarSeleccion
);

// Verificar stock de modificadores
router.post(
  '/verificar-stock',
  authenticateToken,
  ensureTenantContext,
  modificadorController.verificarStock
);

// ===== RUTAS DE GRUPOS =====

// Obtener todos los grupos (para administración)
router.get(
  '/grupos',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  grupoModificadorController.obtenerTodos
);

// Crear grupo de modificadores
router.post(
  '/grupos',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  grupoModificadorController.crear
);

// Asociar grupo a producto
router.post(
  '/grupos/:id_grupo/productos/:id_producto',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  grupoModificadorController.asociarAProducto
);

module.exports = router;
```

---

## ⚛️ FRONTEND - REACT COMPONENTS

### Estructura de Componentes

```
src/components/pos/
├── modifiers/
│   ├── ModifierGroupSelector.tsx (NUEVO)
│   ├── ModifierItem.tsx (NUEVO)
│   ├── ModifierModal.tsx (MEJORAR ProductCard)
│   └── ModifierSummary.tsx (NUEVO)
└── admin/
    ├── ModifierManager.tsx (NUEVO)
    └── GroupModifierManager.tsx (NUEVO)
```

### 1. Componente Selector de Grupo - ModifierGroupSelector.tsx

```typescript
import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Modifier {
  id_modificador: number;
  nombre_modificador: string;
  descripcion?: string;
  precio_extra: number;
  precio_final: number;
  imagen_url?: string;
  calorias?: number;
  es_vegetariano?: boolean;
  es_vegano?: boolean;
  contiene_gluten?: boolean;
  alergenos?: string[];
  estado_stock: 'disponible' | 'stock_bajo' | 'sin_stock';
}

interface ModifierGroup {
  id_grupo_modificador: number;
  grupo_nombre: string;
  grupo_tipo: 'seleccion_unica' | 'seleccion_multiple' | 'cantidad_variable';
  min_selecciones: number;
  max_selecciones: number | null;
  es_obligatorio: boolean;
  modificadores: Modifier[];
}

interface ModifierGroupSelectorProps {
  group: ModifierGroup;
  selectedModifiers: number[];
  onSelectionChange: (groupId: number, modifierId: number, action: 'add' | 'remove' | 'set', quantity?: number) => void;
  modifierQuantities: Record<number, number>;
}

export function ModifierGroupSelector({
  group,
  selectedModifiers,
  onSelectionChange,
  modifierQuantities
}: ModifierGroupSelectorProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validar selección
  useEffect(() => {
    const selectedInGroup = group.modificadores.filter(m => 
      selectedModifiers.includes(m.id_modificador)
    ).length;

    if (group.es_obligatorio && selectedInGroup < group.min_selecciones) {
      setValidationError(`Debe seleccionar al menos ${group.min_selecciones}`);
    } else if (group.max_selecciones && selectedInGroup > group.max_selecciones) {
      setValidationError(`No puede seleccionar más de ${group.max_selecciones}`);
    } else {
      setValidationError(null);
    }
  }, [selectedModifiers, group]);

  const renderModifier = (modifier: Modifier) => {
    const isSelected = selectedModifiers.includes(modifier.id_modificador);
    const quantity = modifierQuantities[modifier.id_modificador] || 0;
    const isAvailable = modifier.estado_stock !== 'sin_stock';

    return (
      <Card
        key={modifier.id_modificador}
        className={`p-4 transition-all cursor-pointer ${
          isSelected ? 'border-2 border-primary bg-primary/5' : 'border'
        } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox/Radio para selección */}
          <div className="pt-1">
            {group.grupo_tipo === 'seleccion_unica' ? (
              <RadioGroupItem
                value={String(modifier.id_modificador)}
                id={`mod-${modifier.id_modificador}`}
                disabled={!isAvailable}
              />
            ) : (
              <Checkbox
                id={`mod-${modifier.id_modificador}`}
                checked={isSelected}
                onCheckedChange={(checked) => {
                  onSelectionChange(
                    group.id_grupo_modificador,
                    modifier.id_modificador,
                    checked ? 'add' : 'remove'
                  );
                }}
                disabled={!isAvailable}
              />
            )}
          </div>

          {/* Imagen (opcional) */}
          {modifier.imagen_url && (
            <img
              src={modifier.imagen_url}
              alt={modifier.nombre_modificador}
              className="w-16 h-16 object-cover rounded"
            />
          )}

          {/* Información del modificador */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <Label
                  htmlFor={`mod-${modifier.id_modificador}`}
                  className="font-semibold cursor-pointer"
                >
                  {modifier.nombre_modificador}
                </Label>
                {modifier.descripcion && (
                  <p className="text-xs text-gray-600 mt-1">
                    {modifier.descripcion}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="font-bold text-primary">
                  {modifier.precio_final > 0 ? `+Bs ${modifier.precio_final}` : 'Gratis'}
                </p>
                {modifier.precio_extra !== modifier.precio_final && (
                  <p className="text-xs line-through text-gray-400">
                    Bs {modifier.precio_extra}
                  </p>
                )}
              </div>
            </div>

            {/* Información nutricional y características */}
            <div className="flex flex-wrap gap-1 mt-2">
              {modifier.es_vegano && (
                <Badge variant="outline" className="text-xs bg-green-50">
                  🌱 Vegano
                </Badge>
              )}
              {modifier.es_vegetariano && !modifier.es_vegano && (
                <Badge variant="outline" className="text-xs bg-green-50">
                  🥬 Vegetariano
                </Badge>
              )}
              {modifier.contiene_gluten === false && (
                <Badge variant="outline" className="text-xs bg-blue-50">
                  Sin Gluten
                </Badge>
              )}
              {modifier.calorias && (
                <Badge variant="outline" className="text-xs">
                  {modifier.calorias} kcal
                </Badge>
              )}
              {modifier.estado_stock === 'stock_bajo' && (
                <Badge variant="outline" className="text-xs bg-yellow-50">
                  ⚠️ Pocas unidades
                </Badge>
              )}
            </div>

            {/* Alergenos */}
            {modifier.alergenos && modifier.alergenos.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <AlertCircle className="w-3 h-3 text-orange-500" />
                <span className="text-xs text-orange-600">
                  Contiene: {modifier.alergenos.join(', ')}
                </span>
              </div>
            )}

            {/* Control de cantidad para tipo cantidad_variable */}
            {group.grupo_tipo === 'cantidad_variable' && isSelected && (
              <div className="flex items-center gap-2 mt-3">
                <Label className="text-sm">Cantidad:</Label>
                <Input
                  type="number"
                  min="1"
                  max={modifier.stock_disponible || 999}
                  value={quantity}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value) || 1;
                    onSelectionChange(
                      group.id_grupo_modificador,
                      modifier.id_modificador,
                      'set',
                      newQuantity
                    );
                  }}
                  className="w-20"
                />
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Título del grupo */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">
            {group.grupo_nombre}
            {group.es_obligatorio && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </h3>
          
          {/* Información de selección */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {group.grupo_tipo === 'seleccion_unica' ? (
              <Badge variant="outline">Selecciona 1</Badge>
            ) : group.grupo_tipo === 'seleccion_multiple' ? (
              <Badge variant="outline">
                {group.max_selecciones 
                  ? `Máx. ${group.max_selecciones}` 
                  : 'Múltiple'}
              </Badge>
            ) : (
              <Badge variant="outline">Cantidad variable</Badge>
            )}
          </div>
        </div>

        {/* Descripción */}
        {group.descripcion && (
          <p className="text-sm text-gray-600 mt-1">
            {group.descripcion}
          </p>
        )}

        {/* Error de validación */}
        {validationError && (
          <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* Lista de modificadores */}
      <div className="space-y-2">
        {group.grupo_tipo === 'seleccion_unica' ? (
          <RadioGroup
            value={
              selectedModifiers.find(id => 
                group.modificadores.some(m => m.id_modificador === id)
              )?.toString() || ''
            }
            onValueChange={(value) => {
              const modifierId = parseInt(value);
              onSelectionChange(
                group.id_grupo_modificador,
                modifierId,
                'set'
              );
            }}
          >
            {group.modificadores.map(renderModifier)}
          </RadioGroup>
        ) : (
          group.modificadores.map(renderModifier)
        )}
      </div>
    </div>
  );
}
```

### 2. Modal de Modificadores Mejorado - ModifierModal.tsx

```typescript
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { ModifierGroupSelector } from './ModifierGroupSelector';
import { ModifierSummary } from './ModifierSummary';
import api from '@/services/api';

interface ModifierModalProps {
  product: {
    id: number;
    nombre: string;
    precio: number;
  };
  open: boolean;
  onClose: () => void;
  onAddToCart: (product: any, notes: string, modifiers: any[]) => void;
}

export function ModifierModal({
  product,
  open,
  onClose,
  onAddToCart
}: ModifierModalProps) {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<number[]>([]);
  const [modifierQuantities, setModifierQuantities] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Cargar grupos de modificadores
  useEffect(() => {
    if (open && product.id) {
      loadModifierGroups();
    }
  }, [open, product.id]);

  const loadModifierGroups = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/api/v1/modificadores/producto/${product.id}/grupos`
      );
      setGroups(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar modificadores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionChange = (
    groupId: number,
    modifierId: number,
    action: 'add' | 'remove' | 'set',
    quantity?: number
  ) => {
    if (action === 'add') {
      setSelectedModifiers(prev => [...prev, modifierId]);
      setModifierQuantities(prev => ({ ...prev, [modifierId]: quantity || 1 }));
    } else if (action === 'remove') {
      setSelectedModifiers(prev => prev.filter(id => id !== modifierId));
      setModifierQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[modifierId];
        return newQuantities;
      });
    } else if (action === 'set') {
      // Para selección única, reemplazar todas las selecciones de ese grupo
      const group = groups.find(g => g.id_grupo_modificador === groupId);
      if (group) {
        const groupModifierIds = group.modificadores.map((m: any) => m.id_modificador);
        setSelectedModifiers(prev => 
          [...prev.filter(id => !groupModifierIds.includes(id)), modifierId]
        );
        setModifierQuantities(prev => ({ ...prev, [modifierId]: quantity || 1 }));
      }
    }
  };

  const validateSelection = async () => {
    try {
      const response = await api.post('/api/v1/modificadores/validar', {
        id_producto: product.id,
        modificadores: selectedModifiers
      });

      if (!response.data.success) {
        setValidationError(response.data.message);
        return false;
      }

      setValidationError(null);
      return true;
    } catch (error: any) {
      setValidationError(error.response?.data?.message || 'Error de validación');
      return false;
    }
  };

  const handleAddToCart = async () => {
    // Validar selección
    const isValid = await validateSelection();
    if (!isValid) return;

    // Preparar modificadores seleccionados
    const selectedModifiersData = selectedModifiers.map(id => {
      const modifier = groups
        .flatMap(g => g.modificadores)
        .find((m: any) => m.id_modificador === id);
      
      return {
        id_modificador: id,
        nombre_modificador: modifier.nombre_modificador,
        precio_aplicado: modifier.precio_final,
        cantidad: modifierQuantities[id] || 1
      };
    });

    onAddToCart(product, notes, selectedModifiersData);
    
    // Limpiar y cerrar
    setSelectedModifiers([]);
    setModifierQuantities({});
    setNotes('');
    setValidationError(null);
    onClose();
  };

  // Calcular precio total
  const calculateTotal = () => {
    const modifiersTotal = selectedModifiers.reduce((total, id) => {
      const modifier = groups
        .flatMap(g => g.modificadores)
        .find((m: any) => m.id_modificador === id);
      
      if (modifier) {
        return total + (modifier.precio_final * (modifierQuantities[id] || 1));
      }
      return total;
    }, 0);

    return product.precio + modifiersTotal;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Personaliza tu {product.nombre}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Grupos de modificadores */}
            {groups.map((group, index) => (
              <div key={group.id_grupo_modificador}>
                <ModifierGroupSelector
                  group={group}
                  selectedModifiers={selectedModifiers}
                  onSelectionChange={handleSelectionChange}
                  modifierQuantities={modifierQuantities}
                />
                {index < groups.length - 1 && <Separator className="my-6" />}
              </div>
            ))}

            {groups.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No hay modificadores disponibles para este producto
              </p>
            )}

            {/* Notas especiales */}
            <div>
              <label className="font-semibold block mb-2">
                Notas especiales (opcional)
              </label>
              <Textarea
                placeholder="Ej: Sin cebolla, cocción término medio, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Error de validación */}
            {validationError && (
              <Alert variant="destructive">
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {/* Resumen */}
            <ModifierSummary
              productName={product.nombre}
              productPrice={product.precio}
              selectedModifiers={selectedModifiers.map(id => {
                const modifier = groups
                  .flatMap(g => g.modificadores)
                  .find((m: any) => m.id_modificador === id);
                return {
                  ...modifier,
                  cantidad: modifierQuantities[id] || 1
                };
              })}
              total={calculateTotal()}
            />
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleAddToCart} disabled={loading}>
            Agregar al carrito - Bs {calculateTotal().toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Resumen de Modificadores - ModifierSummary.tsx

```typescript
import React from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ModifierSummaryProps {
  productName: string;
  productPrice: number;
  selectedModifiers: any[];
  total: number;
}

export function ModifierSummary({
  productName,
  productPrice,
  selectedModifiers,
  total
}: ModifierSummaryProps) {
  if (selectedModifiers.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-gray-50">
      <h4 className="font-semibold mb-3">Resumen del pedido</h4>
      
      <div className="space-y-2 text-sm">
        {/* Producto base */}
        <div className="flex justify-between">
          <span>{productName}</span>
          <span>Bs {productPrice.toFixed(2)}</span>
        </div>

        {/* Modificadores */}
        {selectedModifiers.map((modifier, index) => (
          <div key={index} className="flex justify-between text-gray-600 pl-4">
            <span>
              + {modifier.nombre_modificador}
              {modifier.cantidad > 1 && ` (x${modifier.cantidad})`}
            </span>
            <span>
              Bs {(modifier.precio_aplicado * modifier.cantidad).toFixed(2)}
            </span>
          </div>
        ))}

        <Separator />

        {/* Total */}
        <div className="flex justify-between font-bold text-base">
          <span>Total</span>
          <span className="text-primary">Bs {total.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}
```

---

## 💼 CASOS DE USO

### Caso de Uso 1: Pizza Personalizada

**Escenario:** Un cliente pide una pizza familiar con extras.

**Flujo:**
1. Cliente selecciona "Pizza Margarita"
2. Modal se abre con grupos obligatorios y opcionales
3. **Grupo "Tamaño"** (obligatorio, selección única):
   - Selecciona "Familiar (40cm)" - +Bs 10
4. **Grupo "Masa"** (obligatorio, selección única):
   - Selecciona "Masa Integral" - +Bs 2
5. **Grupo "Ingredientes Extra"** (opcional, max 5):
   - Selecciona "Champiñones" - +Bs 2
   - Selecciona "Aceitunas" - +Bs 1.5
6. **Grupo "Salsas"** (opcional, max 3):
   - Selecciona "Salsa Picante" - +Bs 0.5
7. **Notas:** "Bien cocida"
8. Sistema valida:
   - ✅ Tamaño seleccionado (obligatorio)
   - ✅ Masa seleccionada (obligatoria)
   - ✅ Ingredientes ≤ 5
   - ✅ Salsas ≤ 3
9. Total calculado: Pizza (Bs 45) + Tamaño (Bs 10) + Masa (Bs 2) + Ingredientes (Bs 3.5) + Salsa (Bs 0.5) = **Bs 61**
10. Se agrega al carrito con todos los modificadores

### Caso de Uso 2: Hamburguesa Vegana

**Escenario:** Cliente con restricciones alimenticias.

**Flujo:**
1. Selecciona "Hamburguesa de Lentejas"
2. **Grupo "Pan"**:
   - Opciones visibles: "Pan Sin Gluten" (🌾 Sin Gluten)
3. **Grupo "Proteína"**:
   - Opciones filtradas: Solo veganas (🌱 Vegano)
4. **Grupo "Extras"**:
   - Sistema muestra alérgenos: ⚠️ "Queso contiene: lacteos"
5. Cliente evita ingredientes con alérgenos
6. Agrega al carrito con seguridad

### Caso de Uso 3: Control de Stock

**Escenario:** Se agota un ingrediente.

**Flujo:**
1. Stock de "Champiñones" = 2 unidades
2. Cliente 1 selecciona 2x Champiñones
3. Cliente 2 intenta seleccionar Champiñones
4. Sistema muestra: "❌ Sin stock - Champiñones"
5. Opción deshabilitada automáticamente
6. Cliente 2 elige alternativa disponible

---

## 🎯 MEJORES PRÁCTICAS

### 1. Performance
- ✅ Lazy loading de imágenes de modificadores
- ✅ Caché de grupos por producto
- ✅ Validación en cliente antes de enviar al servidor
- ✅ Debounce en búsqueda de modificadores

### 2. UX/UI
- ✅ Indicadores visuales claros (obligatorio vs opcional)
- ✅ Validación en tiempo real
- ✅ Resumen de selección visible
- ✅ Información nutricional y alérgenos
- ✅ Optimizado para móvil (touch targets grandes)

### 3. Seguridad
- ✅ Validación server-side obligatoria
- ✅ Verificación de stock antes de venta
- ✅ Control de permisos por rol
- ✅ Auditoría de cambios en modificadores

### 4. Escalabilidad
- ✅ Sistema de grupos flexible
- ✅ Promociones de modificadores
- ✅ Multi-idioma preparado
- ✅ Multi-tenant con aislamiento por restaurante

---

## 🚀 IMPLEMENTACIÓN GRADUAL

### Fase 1 (Semana 1-2):
1. Migración de base de datos
2. Crear tablas y vistas
3. Implementar triggers

### Fase 2 (Semana 3-4):
4. Backend: Modelos y controladores
5. Backend: Rutas y middleware
6. Testing de API

### Fase 3 (Semana 5-6):
7. Frontend: Componentes base
8. Frontend: Modal de modificadores
9. Integración con carrito

### Fase 4 (Semana 7-8):
10. Panel de administración
11. Gestión de grupos
12. Promociones de modificadores

### Fase 5 (Semana 9):
13. Testing E2E
14. Optimización de performance
15. Documentación

---

## 📚 DOCUMENTACIÓN ADICIONAL

Ver archivos relacionados:
- `API_MODIFICADORES.md` - Documentación completa de API
- `GUIA_ADMINISTRACION_MODIFICADORES.md` - Para configuración
- `CASOS_PRUEBA_MODIFICADORES.md` - Suite de tests

---

**Autor:** Sistema SITEMM  
**Versión:** 3.0.0  
**Última actualización:** Octubre 2025

