-- =====================================================
-- TRIGGERS AUTOMÁTICOS PARA SISTEMA DE PLANES
-- Actualización automática de contadores y validación de límites
-- =====================================================

-- 1. TRIGGER PARA ACTUALIZAR CONTADOR DE SUCURSALES
-- =====================================================

CREATE OR REPLACE FUNCTION actualizar_contador_sucursales()
RETURNS TRIGGER AS $$
DECLARE
    v_id_plan INTEGER;
    v_operacion INTEGER;
BEGIN
    -- Determinar la operación (1 = insertar, -1 = eliminar, 0 = actualizar)
    IF TG_OP = 'INSERT' THEN
        v_operacion := 1;
    ELSIF TG_OP = 'DELETE' THEN
        v_operacion := -1;
    ELSE
        v_operacion := 0;
    END IF;
    
    -- Obtener el plan del restaurante
    SELECT sa.id_plan INTO v_id_plan
    FROM suscripciones_activas sa
    WHERE sa.id_restaurante = COALESCE(NEW.id_restaurante, OLD.id_restaurante)
    AND sa.estado = 'activa'
    AND sa.fecha_fin >= CURRENT_DATE;
    
    -- Actualizar contador solo si hay cambio en el estado activo
    IF v_operacion != 0 OR (TG_OP = 'UPDATE' AND OLD.activo != NEW.activo) THEN
        INSERT INTO contadores_uso (
            id_restaurante, id_plan, sucursales_actuales, mes_medicion, año_medicion
        )
        VALUES (
            COALESCE(NEW.id_restaurante, OLD.id_restaurante),
            v_id_plan,
            (
                SELECT COUNT(*) 
                FROM sucursales 
                WHERE id_restaurante = COALESCE(NEW.id_restaurante, OLD.id_restaurante)
                AND activo = true
            ),
            EXTRACT(MONTH FROM CURRENT_DATE),
            EXTRACT(YEAR FROM CURRENT_DATE)
        )
        ON CONFLICT (id_restaurante, mes_medicion, año_medicion)
        DO UPDATE SET
            sucursales_actuales = (
                SELECT COUNT(*) 
                FROM sucursales 
                WHERE id_restaurante = COALESCE(NEW.id_restaurante, OLD.id_restaurante)
                AND activo = true
            ),
            ultima_actualizacion = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_contador_sucursales
    AFTER INSERT OR UPDATE OR DELETE ON sucursales
    FOR EACH ROW EXECUTE FUNCTION actualizar_contador_sucursales();

-- 2. TRIGGER PARA ACTUALIZAR CONTADOR DE USUARIOS
-- =====================================================

CREATE OR REPLACE FUNCTION actualizar_contador_usuarios()
RETURNS TRIGGER AS $$
DECLARE
    v_id_plan INTEGER;
BEGIN
    -- Obtener el plan del restaurante
    SELECT sa.id_plan INTO v_id_plan
    FROM suscripciones_activas sa
    WHERE sa.id_restaurante = COALESCE(NEW.id_restaurante, OLD.id_restaurante)
    AND sa.estado = 'activa'
    AND sa.fecha_fin >= CURRENT_DATE;
    
    -- Actualizar contador
    INSERT INTO contadores_uso (
        id_restaurante, id_plan, usuarios_actuales, mes_medicion, año_medicion
    )
    VALUES (
        COALESCE(NEW.id_restaurante, OLD.id_restaurante),
        v_id_plan,
        (
            SELECT COUNT(*) 
            FROM vendedores 
            WHERE id_restaurante = COALESCE(NEW.id_restaurante, OLD.id_restaurante)
            AND activo = true
        ),
        EXTRACT(MONTH FROM CURRENT_DATE),
        EXTRACT(YEAR FROM CURRENT_DATE)
    )
    ON CONFLICT (id_restaurante, mes_medicion, año_medicion)
    DO UPDATE SET
        usuarios_actuales = (
            SELECT COUNT(*) 
            FROM vendedores 
            WHERE id_restaurante = COALESCE(NEW.id_restaurante, OLD.id_restaurante)
            AND activo = true
        ),
        ultima_actualizacion = CURRENT_TIMESTAMP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_contador_usuarios
    AFTER INSERT OR UPDATE OR DELETE ON vendedores
    FOR EACH ROW EXECUTE FUNCTION actualizar_contador_usuarios();

-- 3. TRIGGER PARA ACTUALIZAR CONTADOR DE PRODUCTOS
-- =====================================================

CREATE OR REPLACE FUNCTION actualizar_contador_productos()
RETURNS TRIGGER AS $$
DECLARE
    v_id_plan INTEGER;
BEGIN
    -- Obtener el plan del restaurante
    SELECT sa.id_plan INTO v_id_plan
    FROM suscripciones_activas sa
    WHERE sa.id_restaurante = COALESCE(NEW.id_restaurante, OLD.id_restaurante)
    AND sa.estado = 'activa'
    AND sa.fecha_fin >= CURRENT_DATE;
    
    -- Actualizar contador
    INSERT INTO contadores_uso (
        id_restaurante, id_plan, productos_actuales, mes_medicion, año_medicion
    )
    VALUES (
        COALESCE(NEW.id_restaurante, OLD.id_restaurante),
        v_id_plan,
        (
            SELECT COUNT(*) 
            FROM productos 
            WHERE id_restaurante = COALESCE(NEW.id_restaurante, OLD.id_restaurante)
            AND activo = true
        ),
        EXTRACT(MONTH FROM CURRENT_DATE),
        EXTRACT(YEAR FROM CURRENT_DATE)
    )
    ON CONFLICT (id_restaurante, mes_medicion, año_medicion)
    DO UPDATE SET
        productos_actuales = (
            SELECT COUNT(*) 
            FROM productos 
            WHERE id_restaurante = COALESCE(NEW.id_restaurante, OLD.id_restaurante)
            AND activo = true
        ),
        ultima_actualizacion = CURRENT_TIMESTAMP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_contador_productos
    AFTER INSERT OR UPDATE OR DELETE ON productos
    FOR EACH ROW EXECUTE FUNCTION actualizar_contador_productos();

-- 4. TRIGGER PARA ACTUALIZAR CONTADOR DE TRANSACCIONES
-- =====================================================

CREATE OR REPLACE FUNCTION actualizar_contador_transacciones()
RETURNS TRIGGER AS $$
DECLARE
    v_id_plan INTEGER;
    v_mes_actual INTEGER;
    v_año_actual INTEGER;
BEGIN
    -- Obtener el plan del restaurante
    SELECT sa.id_plan INTO v_id_plan
    FROM suscripciones_activas sa
    WHERE sa.id_restaurante = COALESCE(NEW.id_restaurante, OLD.id_restaurante)
    AND sa.estado = 'activa'
    AND sa.fecha_fin >= CURRENT_DATE;
    
    v_mes_actual := EXTRACT(MONTH FROM CURRENT_DATE);
    v_año_actual := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Actualizar contador solo para transacciones del mes actual
    IF TG_OP = 'INSERT' AND NEW.estado != 'cancelado' THEN
        INSERT INTO contadores_uso (
            id_restaurante, id_plan, transacciones_mes_actual, mes_medicion, año_medicion
        )
        VALUES (
            NEW.id_restaurante,
            v_id_plan,
            1,
            v_mes_actual,
            v_año_actual
        )
        ON CONFLICT (id_restaurante, mes_medicion, año_medicion)
        DO UPDATE SET
            transacciones_mes_actual = contadores_uso.transacciones_mes_actual + 1,
            ultima_actualizacion = CURRENT_TIMESTAMP;
    ELSIF TG_OP = 'UPDATE' AND OLD.estado != NEW.estado THEN
        -- Si cambia el estado de cancelado a activo o viceversa
        IF OLD.estado = 'cancelado' AND NEW.estado != 'cancelado' THEN
            INSERT INTO contadores_uso (
                id_restaurante, id_plan, transacciones_mes_actual, mes_medicion, año_medicion
            )
            VALUES (
                NEW.id_restaurante,
                v_id_plan,
                1,
                v_mes_actual,
                v_año_actual
            )
            ON CONFLICT (id_restaurante, mes_medicion, año_medicion)
            DO UPDATE SET
                transacciones_mes_actual = contadores_uso.transacciones_mes_actual + 1,
                ultima_actualizacion = CURRENT_TIMESTAMP;
        ELSIF OLD.estado != 'cancelado' AND NEW.estado = 'cancelado' THEN
            INSERT INTO contadores_uso (
                id_restaurante, id_plan, transacciones_mes_actual, mes_medicion, año_medicion
            )
            VALUES (
                NEW.id_restaurante,
                v_id_plan,
                -1,
                v_mes_actual,
                v_año_actual
            )
            ON CONFLICT (id_restaurante, mes_medicion, año_medicion)
            DO UPDATE SET
                transacciones_mes_actual = GREATEST(0, contadores_uso.transacciones_mes_actual - 1),
                ultima_actualizacion = CURRENT_TIMESTAMP;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_contador_transacciones
    AFTER INSERT OR UPDATE ON ventas
    FOR EACH ROW EXECUTE FUNCTION actualizar_contador_transacciones();

-- 5. TRIGGER PARA VALIDAR LÍMITES ANTES DE INSERTAR
-- =====================================================

CREATE OR REPLACE FUNCTION validar_limites_sucursales()
RETURNS TRIGGER AS $$
DECLARE
    v_limite_valido BOOLEAN;
BEGIN
    -- Validar límite de sucursales
    SELECT validar_limite_plan(NEW.id_restaurante, 'sucursales', 1) INTO v_limite_valido;
    
    IF NOT v_limite_valido THEN
        RAISE EXCEPTION 'Límite de sucursales excedido para el restaurante %', NEW.id_restaurante;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_limites_sucursales
    BEFORE INSERT ON sucursales
    FOR EACH ROW EXECUTE FUNCTION validar_limites_sucursales();

-- 6. TRIGGER PARA VALIDAR LÍMITES DE USUARIOS
-- =====================================================

CREATE OR REPLACE FUNCTION validar_limites_usuarios()
RETURNS TRIGGER AS $$
DECLARE
    v_limite_valido BOOLEAN;
BEGIN
    -- Validar límite de usuarios
    SELECT validar_limite_plan(NEW.id_restaurante, 'usuarios', 1) INTO v_limite_valido;
    
    IF NOT v_limite_valido THEN
        RAISE EXCEPTION 'Límite de usuarios excedido para el restaurante %', NEW.id_restaurante;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_limites_usuarios
    BEFORE INSERT ON vendedores
    FOR EACH ROW EXECUTE FUNCTION validar_limites_usuarios();

-- 7. TRIGGER PARA VALIDAR LÍMITES DE PRODUCTOS
-- =====================================================

CREATE OR REPLACE FUNCTION validar_limites_productos()
RETURNS TRIGGER AS $$
DECLARE
    v_limite_valido BOOLEAN;
BEGIN
    -- Validar límite de productos
    SELECT validar_limite_plan(NEW.id_restaurante, 'productos', 1) INTO v_limite_valido;
    
    IF NOT v_limite_valido THEN
        RAISE EXCEPTION 'Límite de productos excedido para el restaurante %', NEW.id_restaurante;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_limites_productos
    BEFORE INSERT ON productos
    FOR EACH ROW EXECUTE FUNCTION validar_limites_productos();

-- 8. TRIGGER PARA VALIDAR LÍMITES DE TRANSACCIONES
-- =====================================================

CREATE OR REPLACE FUNCTION validar_limites_transacciones()
RETURNS TRIGGER AS $$
DECLARE
    v_limite_valido BOOLEAN;
BEGIN
    -- Solo validar para transacciones nuevas no canceladas
    IF NEW.estado != 'cancelado' THEN
        SELECT validar_limite_plan(NEW.id_restaurante, 'transacciones', 1) INTO v_limite_valido;
        
        IF NOT v_limite_valido THEN
            RAISE EXCEPTION 'Límite de transacciones mensuales excedido para el restaurante %', NEW.id_restaurante;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_limites_transacciones
    BEFORE INSERT ON ventas
    FOR EACH ROW EXECUTE FUNCTION validar_limites_transacciones();

-- 9. TRIGGER PARA GENERAR ALERTAS AUTOMÁTICAS
-- =====================================================

CREATE OR REPLACE FUNCTION generar_alertas_limites()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_actual RECORD;
    v_porcentaje_uso DECIMAL(5,2);
    v_nivel_urgencia VARCHAR(20);
    v_mensaje TEXT;
BEGIN
    -- Obtener plan actual
    SELECT p.*, s.estado
    INTO v_plan_actual
    FROM planes_unificados p
    JOIN suscripciones_activas s ON p.id_plan = s.id_plan
    WHERE s.id_restaurante = NEW.id_restaurante 
    AND s.estado = 'activa'
    AND s.fecha_fin >= CURRENT_DATE;
    
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;
    
    -- Verificar límites y generar alertas
    
    -- Alerta de sucursales
    IF NEW.sucursales_actuales > 0 AND v_plan_actual.max_sucursales > 0 THEN
        v_porcentaje_uso := (NEW.sucursales_actuales::DECIMAL / v_plan_actual.max_sucursales) * 100;
        
        IF v_porcentaje_uso >= 80 THEN
            IF v_porcentaje_uso >= 100 THEN
                v_nivel_urgencia := 'critico';
                v_mensaje := 'Límite de sucursales excedido: ' || NEW.sucursales_actuales || '/' || v_plan_actual.max_sucursales;
            ELSIF v_porcentaje_uso >= 90 THEN
                v_nivel_urgencia := 'alto';
                v_mensaje := 'Límite de sucursales casi excedido: ' || NEW.sucursales_actuales || '/' || v_plan_actual.max_sucursales;
            ELSE
                v_nivel_urgencia := 'medio';
                v_mensaje := 'Uso alto de sucursales: ' || NEW.sucursales_actuales || '/' || v_plan_actual.max_sucursales;
            END IF;
            
            INSERT INTO alertas_limites (
                id_restaurante, id_plan, tipo_alerta, recurso, valor_actual,
                valor_limite, porcentaje_uso, estado, nivel_urgencia, mensaje
            ) VALUES (
                NEW.id_restaurante, v_plan_actual.id_plan, 'limite_sucursales', 'sucursales',
                NEW.sucursales_actuales, v_plan_actual.max_sucursales, v_porcentaje_uso,
                'pendiente', v_nivel_urgencia, v_mensaje
            );
        END IF;
    END IF;
    
    -- Alerta de usuarios
    IF NEW.usuarios_actuales > 0 AND v_plan_actual.max_usuarios > 0 THEN
        v_porcentaje_uso := (NEW.usuarios_actuales::DECIMAL / v_plan_actual.max_usuarios) * 100;
        
        IF v_porcentaje_uso >= 80 THEN
            IF v_porcentaje_uso >= 100 THEN
                v_nivel_urgencia := 'critico';
                v_mensaje := 'Límite de usuarios excedido: ' || NEW.usuarios_actuales || '/' || v_plan_actual.max_usuarios;
            ELSIF v_porcentaje_uso >= 90 THEN
                v_nivel_urgencia := 'alto';
                v_mensaje := 'Límite de usuarios casi excedido: ' || NEW.usuarios_actuales || '/' || v_plan_actual.max_usuarios;
            ELSE
                v_nivel_urgencia := 'medio';
                v_mensaje := 'Uso alto de usuarios: ' || NEW.usuarios_actuales || '/' || v_plan_actual.max_usuarios;
            END IF;
            
            INSERT INTO alertas_limites (
                id_restaurante, id_plan, tipo_alerta, recurso, valor_actual,
                valor_limite, porcentaje_uso, estado, nivel_urgencia, mensaje
            ) VALUES (
                NEW.id_restaurante, v_plan_actual.id_plan, 'limite_usuarios', 'usuarios',
                NEW.usuarios_actuales, v_plan_actual.max_usuarios, v_porcentaje_uso,
                'pendiente', v_nivel_urgencia, v_mensaje
            );
        END IF;
    END IF;
    
    -- Alerta de productos
    IF NEW.productos_actuales > 0 AND v_plan_actual.max_productos > 0 THEN
        v_porcentaje_uso := (NEW.productos_actuales::DECIMAL / v_plan_actual.max_productos) * 100;
        
        IF v_porcentaje_uso >= 80 THEN
            IF v_porcentaje_uso >= 100 THEN
                v_nivel_urgencia := 'critico';
                v_mensaje := 'Límite de productos excedido: ' || NEW.productos_actuales || '/' || v_plan_actual.max_productos;
            ELSIF v_porcentaje_uso >= 90 THEN
                v_nivel_urgencia := 'alto';
                v_mensaje := 'Límite de productos casi excedido: ' || NEW.productos_actuales || '/' || v_plan_actual.max_productos;
            ELSE
                v_nivel_urgencia := 'medio';
                v_mensaje := 'Uso alto de productos: ' || NEW.productos_actuales || '/' || v_plan_actual.max_productos;
            END IF;
            
            INSERT INTO alertas_limites (
                id_restaurante, id_plan, tipo_alerta, recurso, valor_actual,
                valor_limite, porcentaje_uso, estado, nivel_urgencia, mensaje
            ) VALUES (
                NEW.id_restaurante, v_plan_actual.id_plan, 'limite_productos', 'productos',
                NEW.productos_actuales, v_plan_actual.max_productos, v_porcentaje_uso,
                'pendiente', v_nivel_urgencia, v_mensaje
            );
        END IF;
    END IF;
    
    -- Alerta de transacciones
    IF NEW.transacciones_mes_actual > 0 AND v_plan_actual.max_transacciones_mes > 0 THEN
        v_porcentaje_uso := (NEW.transacciones_mes_actual::DECIMAL / v_plan_actual.max_transacciones_mes) * 100;
        
        IF v_porcentaje_uso >= 80 THEN
            IF v_porcentaje_uso >= 100 THEN
                v_nivel_urgencia := 'critico';
                v_mensaje := 'Límite de transacciones mensuales excedido: ' || NEW.transacciones_mes_actual || '/' || v_plan_actual.max_transacciones_mes;
            ELSIF v_porcentaje_uso >= 90 THEN
                v_nivel_urgencia := 'alto';
                v_mensaje := 'Límite de transacciones mensuales casi excedido: ' || NEW.transacciones_mes_actual || '/' || v_plan_actual.max_transacciones_mes;
            ELSE
                v_nivel_urgencia := 'medio';
                v_mensaje := 'Uso alto de transacciones mensuales: ' || NEW.transacciones_mes_actual || '/' || v_plan_actual.max_transacciones_mes;
            END IF;
            
            INSERT INTO alertas_limites (
                id_restaurante, id_plan, tipo_alerta, recurso, valor_actual,
                valor_limite, porcentaje_uso, estado, nivel_urgencia, mensaje
            ) VALUES (
                NEW.id_restaurante, v_plan_actual.id_plan, 'limite_transacciones', 'transacciones',
                NEW.transacciones_mes_actual, v_plan_actual.max_transacciones_mes, v_porcentaje_uso,
                'pendiente', v_nivel_urgencia, v_mensaje
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_alertas_limites
    AFTER INSERT OR UPDATE ON contadores_uso
    FOR EACH ROW EXECUTE FUNCTION generar_alertas_limites();

-- 10. TRIGGER PARA AUDITORÍA DE CAMBIOS DE PLAN
-- =====================================================

CREATE OR REPLACE FUNCTION auditar_cambio_plan()
RETURNS TRIGGER AS $$
DECLARE
    v_tipo_cambio VARCHAR(50);
    v_plan_anterior_nombre VARCHAR(100);
    v_plan_nuevo_nombre VARCHAR(100);
BEGIN
    -- Determinar tipo de cambio
    IF TG_OP = 'INSERT' THEN
        v_tipo_cambio := 'cambio_plan';
        v_plan_anterior_nombre := NULL;
        v_plan_nuevo_nombre := (SELECT nombre FROM planes_unificados WHERE id_plan = NEW.id_plan);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.id_plan != NEW.id_plan THEN
            v_tipo_cambio := 'cambio_plan';
            v_plan_anterior_nombre := (SELECT nombre FROM planes_unificados WHERE id_plan = OLD.id_plan);
            v_plan_nuevo_nombre := (SELECT nombre FROM planes_unificados WHERE id_plan = NEW.id_plan);
        ELSIF OLD.estado != NEW.estado THEN
            CASE NEW.estado
                WHEN 'suspendida' THEN v_tipo_cambio := 'suspension';
                WHEN 'activa' THEN v_tipo_cambio := 'reactivacion';
                WHEN 'cancelada' THEN v_tipo_cambio := 'cancelacion';
                ELSE v_tipo_cambio := 'cambio_estado';
            END CASE;
            v_plan_anterior_nombre := (SELECT nombre FROM planes_unificados WHERE id_plan = NEW.id_plan);
            v_plan_nuevo_nombre := v_plan_anterior_nombre;
        ELSE
            RETURN NEW;
        END IF;
    ELSE
        RETURN OLD;
    END IF;
    
    -- Insertar registro de auditoría
    INSERT INTO auditoria_planes (
        id_restaurante, tipo_cambio, id_plan_anterior, id_plan_nuevo,
        fecha_cambio, fecha_efectiva, motivo, observaciones,
        datos_anteriores, datos_nuevos
    ) VALUES (
        NEW.id_restaurante, v_tipo_cambio, 
        CASE WHEN v_plan_anterior_nombre IS NOT NULL THEN 
            (SELECT id_plan FROM planes_unificados WHERE nombre = v_plan_anterior_nombre) 
        ELSE NULL END,
        CASE WHEN v_plan_nuevo_nombre IS NOT NULL THEN 
            (SELECT id_plan FROM planes_unificados WHERE nombre = v_plan_nuevo_nombre) 
        ELSE NULL END,
        CURRENT_TIMESTAMP, CURRENT_DATE,
        'Cambio automático detectado por trigger',
        'Plan anterior: ' || COALESCE(v_plan_anterior_nombre, 'N/A') || 
        ', Plan nuevo: ' || COALESCE(v_plan_nuevo_nombre, 'N/A'),
        to_jsonb(OLD),
        to_jsonb(NEW)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auditar_cambio_plan
    AFTER INSERT OR UPDATE ON suscripciones_activas
    FOR EACH ROW EXECUTE FUNCTION auditar_cambio_plan();

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION actualizar_contador_sucursales IS 'Actualiza automáticamente el contador de sucursales';
COMMENT ON FUNCTION actualizar_contador_usuarios IS 'Actualiza automáticamente el contador de usuarios';
COMMENT ON FUNCTION actualizar_contador_productos IS 'Actualiza automáticamente el contador de productos';
COMMENT ON FUNCTION actualizar_contador_transacciones IS 'Actualiza automáticamente el contador de transacciones';
COMMENT ON FUNCTION validar_limites_sucursales IS 'Valida límites antes de insertar sucursales';
COMMENT ON FUNCTION validar_limites_usuarios IS 'Valida límites antes de insertar usuarios';
COMMENT ON FUNCTION validar_limites_productos IS 'Valida límites antes de insertar productos';
COMMENT ON FUNCTION validar_limites_transacciones IS 'Valida límites antes de insertar transacciones';
COMMENT ON FUNCTION generar_alertas_limites IS 'Genera alertas automáticas cuando se exceden límites';
COMMENT ON FUNCTION auditar_cambio_plan IS 'Audita cambios en suscripciones de planes';
