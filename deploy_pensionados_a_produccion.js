/**
 * =====================================================
 * DEPLOY SISTEMA DE PENSIONADOS A PRODUCCIÓN
 * =====================================================
 * Sistema: SITEMM POS
 * Base de datos: DigitalOcean PostgreSQL
 * =====================================================
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de PRODUCCIÓN
const dbConfig = {
  host: 'db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com',
  port: 25060,
  user: 'doadmin',
  password: process.env.PROD_DB_PASSWORD,
  database: 'defaultdb',
  ssl: {
    rejectUnauthorized: false
  }
};

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  title: () => console.log(`\n${colors.bright}${colors.blue}${'='.repeat(70)}${colors.reset}`),
  section: (text) => console.log(`${colors.bright}${colors.cyan}${text}${colors.reset}`),
  success: (text) => console.log(`${colors.green}✓${colors.reset} ${text}`),
  error: (text) => console.log(`${colors.red}✗${colors.reset} ${text}`),
  warning: (text) => console.log(`${colors.yellow}⚠${colors.reset} ${text}`),
  info: (text) => console.log(`${colors.blue}ℹ${colors.reset} ${text}`),
  data: (text) => console.log(`  ${colors.magenta}→${colors.reset} ${text}`),
  divider: () => console.log(`${colors.blue}${'─'.repeat(70)}${colors.reset}`)
};

async function deployPensionadosProduccion() {
  const client = new Client(dbConfig);

  try {
    log.title();
    log.section('🚀 DEPLOY SISTEMA DE PENSIONADOS A PRODUCCIÓN');
    log.section('DigitalOcean PostgreSQL');
    log.title();
    
    await client.connect();
    log.success('✓ Conectado a la base de datos de PRODUCCIÓN');
    log.info(`Base de datos: ${dbConfig.database}`);
    log.info(`Host: ${dbConfig.host}`);
    console.log('');

    // =====================================================
    // PASO 1: VERIFICACIÓN PREVIA
    // =====================================================
    log.title();
    log.section('📋 PASO 1: Verificación Previa');
    log.divider();

    const verificacionQuery = `
      SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'pensionados') as tabla_pensionados,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'consumo_pensionados') as tabla_consumos,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'prefacturas_pensionados') as tabla_prefacturas;
    `;

    const verificacion = await client.query(verificacionQuery);
    const v = verificacion.rows[0];

    log.info('Estado actual:');
    log.data(`Tabla pensionados: ${v.tabla_pensionados > 0 ? '✓ Existe' : '✗ No existe'}`);
    log.data(`Tabla consumo_pensionados: ${v.tabla_consumos > 0 ? '✓ Existe' : '✗ No existe'}`);
    log.data(`Tabla prefacturas_pensionados: ${v.tabla_prefacturas > 0 ? '✓ Existe' : '✗ No existe'}`);
    console.log('');

    const yaExiste = v.tabla_pensionados > 0 || v.tabla_consumos > 0 || v.tabla_prefacturas > 0;

    if (yaExiste) {
      log.warning('⚠️ ADVERTENCIA: Algunas tablas ya existen');
      log.info('Se hará backup antes de continuar...');
    } else {
      log.info('Las tablas no existen. Se procederá con instalación limpia.');
    }

    // =====================================================
    // PASO 2: BACKUP DE DATOS EXISTENTES
    // =====================================================
    log.title();
    log.section('💾 PASO 2: Backup de Datos Existentes');
    log.divider();

    if (v.tabla_pensionados > 0) {
      await client.query(`DROP TABLE IF EXISTS pensionados_backup_pre_deploy CASCADE`);
      await client.query(`CREATE TABLE pensionados_backup_pre_deploy AS SELECT * FROM pensionados`);
      const count = await client.query(`SELECT COUNT(*) as count FROM pensionados_backup_pre_deploy`);
      log.success(`Backup creado: pensionados_backup_pre_deploy (${count.rows[0].count} registros)`);
    }

    if (v.tabla_consumos > 0) {
      await client.query(`DROP TABLE IF EXISTS consumo_pensionados_backup_pre_deploy CASCADE`);
      await client.query(`CREATE TABLE consumo_pensionados_backup_pre_deploy AS SELECT * FROM consumo_pensionados`);
      const count = await client.query(`SELECT COUNT(*) as count FROM consumo_pensionados_backup_pre_deploy`);
      log.success(`Backup creado: consumo_pensionados_backup_pre_deploy (${count.rows[0].count} registros)`);
    }

    if (v.tabla_prefacturas > 0) {
      await client.query(`DROP TABLE IF EXISTS prefacturas_pensionados_backup_pre_deploy CASCADE`);
      await client.query(`CREATE TABLE prefacturas_pensionados_backup_pre_deploy AS SELECT * FROM prefacturas_pensionados`);
      const count = await client.query(`SELECT COUNT(*) as count FROM prefacturas_pensionados_backup_pre_deploy`);
      log.success(`Backup creado: prefacturas_pensionados_backup_pre_deploy (${count.rows[0].count} registros)`);
    }

    if (!yaExiste) {
      log.info('No hay datos para hacer backup');
    }

    console.log('');

    // =====================================================
    // PASO 3: CREAR TABLAS
    // =====================================================
    log.title();
    log.section('📊 PASO 3: Creando Tablas');
    log.divider();

    // Crear tabla pensionados
    await client.query(`
      CREATE TABLE IF NOT EXISTS pensionados (
        id_pensionado SERIAL PRIMARY KEY,
        id_restaurante INTEGER NOT NULL,
        id_sucursal INTEGER,
        
        -- Información del cliente
        nombre_cliente VARCHAR(100) NOT NULL,
        tipo_cliente VARCHAR(50) NOT NULL DEFAULT 'individual',
        documento_identidad VARCHAR(20),
        telefono VARCHAR(20),
        email VARCHAR(100),
        direccion TEXT,
        
        -- Información del contrato
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE NOT NULL,
        tipo_periodo VARCHAR(20) NOT NULL DEFAULT 'semanas',
        cantidad_periodos INTEGER NOT NULL DEFAULT 1,
        
        -- Configuración del servicio
        incluye_almuerzo BOOLEAN DEFAULT true,
        incluye_cena BOOLEAN DEFAULT false,
        incluye_desayuno BOOLEAN DEFAULT false,
        max_platos_dia INTEGER DEFAULT 1,
        
        -- Información financiera
        monto_acumulado DECIMAL(12,2) DEFAULT 0.00,
        descuento_aplicado DECIMAL(5,2) DEFAULT 0.00,
        total_consumido DECIMAL(12,2) DEFAULT 0.00,
        saldo_pendiente DECIMAL(12,2) DEFAULT 0.00,
        
        -- Estado y control
        estado VARCHAR(20) DEFAULT 'activo',
        fecha_ultimo_consumo DATE,
        dias_consumo INTEGER DEFAULT 0,
        
        -- Auditoría
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by INTEGER
      );
    `);
    log.success('✓ Tabla pensionados creada/verificada');

    // Crear tabla consumo_pensionados
    await client.query(`
      CREATE TABLE IF NOT EXISTS consumo_pensionados (
        id_consumo SERIAL PRIMARY KEY,
        id_pensionado INTEGER NOT NULL,
        id_restaurante INTEGER NOT NULL,
        fecha_consumo DATE NOT NULL,
        id_mesa INTEGER,
        id_venta INTEGER,
        
        -- Detalles del consumo
        tipo_comida VARCHAR(20) DEFAULT 'almuerzo',
        productos_consumidos JSONB NOT NULL DEFAULT '[]',
        total_consumido DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        
        -- Información adicional
        observaciones TEXT,
        mesero_asignado INTEGER,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    log.success('✓ Tabla consumo_pensionados creada/verificada');

    // Crear tabla prefacturas_pensionados
    await client.query(`
      CREATE TABLE IF NOT EXISTS prefacturas_pensionados (
        id_prefactura_pensionado SERIAL PRIMARY KEY,
        id_pensionado INTEGER NOT NULL,
        id_restaurante INTEGER NOT NULL,
        
        -- Período de facturación
        fecha_inicio_periodo DATE NOT NULL,
        fecha_fin_periodo DATE NOT NULL,
        
        -- Resumen del consumo
        total_dias INTEGER NOT NULL DEFAULT 0,
        total_consumo DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        descuentos_aplicados DECIMAL(12,2) DEFAULT 0.00,
        total_final DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        
        -- Estado de la prefactura
        estado VARCHAR(20) DEFAULT 'pendiente',
        fecha_generacion TIMESTAMP WITH TIME ZONE,
        fecha_envio TIMESTAMP WITH TIME ZONE,
        fecha_pago TIMESTAMP WITH TIME ZONE,
        
        -- Detalles de productos
        productos_detallados JSONB NOT NULL DEFAULT '[]',
        
        -- Información adicional
        observaciones TEXT,
        numero_factura VARCHAR(50),
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    log.success('✓ Tabla prefacturas_pensionados creada/verificada');
    console.log('');

    // =====================================================
    // PASO 4: AGREGAR CONSTRAINTS
    // =====================================================
    log.title();
    log.section('🔒 PASO 4: Agregando Constraints');
    log.divider();

    const constraints = [
      { tabla: 'pensionados', nombre: 'chk_tipo_cliente', check: "tipo_cliente IN ('individual', 'corporativo', 'evento')" },
      { tabla: 'pensionados', nombre: 'chk_estado_pensionado', check: "estado IN ('activo', 'pausado', 'finalizado', 'cancelado')" },
      { tabla: 'pensionados', nombre: 'chk_tipo_periodo', check: "tipo_periodo IN ('semanas', 'meses', 'años')" },
      { tabla: 'pensionados', nombre: 'chk_fechas_pensionado', check: "fecha_fin > fecha_inicio" },
      { tabla: 'pensionados', nombre: 'chk_cantidad_periodos', check: "cantidad_periodos > 0" },
      { tabla: 'consumo_pensionados', nombre: 'chk_tipo_comida', check: "tipo_comida IN ('desayuno', 'almuerzo', 'cena')" },
      { tabla: 'consumo_pensionados', nombre: 'chk_total_consumido', check: "total_consumido >= 0" },
      { tabla: 'prefacturas_pensionados', nombre: 'chk_estado_prefactura', check: "estado IN ('pendiente', 'generada', 'enviada', 'pagada')" },
      { tabla: 'prefacturas_pensionados', nombre: 'chk_fechas_prefactura', check: "fecha_fin_periodo >= fecha_inicio_periodo" },
      { tabla: 'prefacturas_pensionados', nombre: 'chk_total_dias', check: "total_dias >= 0" },
      { tabla: 'prefacturas_pensionados', nombre: 'chk_totales_prefactura', check: "total_consumo >= 0 AND total_final >= 0" }
    ];

    for (const constraint of constraints) {
      try {
        await client.query(`
          ALTER TABLE ${constraint.tabla} 
          DROP CONSTRAINT IF EXISTS ${constraint.nombre};
        `);
        
        await client.query(`
          ALTER TABLE ${constraint.tabla} 
          ADD CONSTRAINT ${constraint.nombre} CHECK (${constraint.check});
        `);
        
        log.success(`✓ Constraint ${constraint.nombre} agregado a ${constraint.tabla}`);
      } catch (error) {
        log.warning(`⚠ Constraint ${constraint.nombre} ya existe o hubo error: ${error.message}`);
      }
    }
    console.log('');

    // =====================================================
    // PASO 5: CREAR ÍNDICES
    // =====================================================
    log.title();
    log.section('📇 PASO 5: Creando Índices');
    log.divider();

    const indices = [
      'CREATE INDEX IF NOT EXISTS idx_pensionados_restaurante ON pensionados(id_restaurante)',
      'CREATE INDEX IF NOT EXISTS idx_pensionados_estado ON pensionados(estado)',
      'CREATE INDEX IF NOT EXISTS idx_pensionados_fecha_inicio ON pensionados(fecha_inicio)',
      'CREATE INDEX IF NOT EXISTS idx_pensionados_fecha_fin ON pensionados(fecha_fin)',
      'CREATE INDEX IF NOT EXISTS idx_pensionados_tipo_cliente ON pensionados(tipo_cliente)',
      'CREATE INDEX IF NOT EXISTS idx_pensionados_sucursal ON pensionados(id_sucursal)',
      'CREATE INDEX IF NOT EXISTS idx_pensionados_documento ON pensionados(documento_identidad)',
      
      'CREATE INDEX IF NOT EXISTS idx_consumo_pensionado ON consumo_pensionados(id_pensionado)',
      'CREATE INDEX IF NOT EXISTS idx_consumo_fecha ON consumo_pensionados(fecha_consumo)',
      'CREATE INDEX IF NOT EXISTS idx_consumo_restaurante ON consumo_pensionados(id_restaurante)',
      'CREATE INDEX IF NOT EXISTS idx_consumo_mesa ON consumo_pensionados(id_mesa)',
      'CREATE INDEX IF NOT EXISTS idx_consumo_venta ON consumo_pensionados(id_venta)',
      'CREATE INDEX IF NOT EXISTS idx_consumo_tipo_comida ON consumo_pensionados(tipo_comida)',
      
      'CREATE INDEX IF NOT EXISTS idx_prefactura_pensionado ON prefacturas_pensionados(id_pensionado)',
      'CREATE INDEX IF NOT EXISTS idx_prefactura_estado ON prefacturas_pensionados(estado)',
      'CREATE INDEX IF NOT EXISTS idx_prefactura_fecha_inicio ON prefacturas_pensionados(fecha_inicio_periodo)',
      'CREATE INDEX IF NOT EXISTS idx_prefactura_fecha_fin ON prefacturas_pensionados(fecha_fin_periodo)',
      'CREATE INDEX IF NOT EXISTS idx_prefactura_restaurante ON prefacturas_pensionados(id_restaurante)'
    ];

    let indicesCreados = 0;
    for (const indice of indices) {
      try {
        await client.query(indice);
        indicesCreados++;
      } catch (error) {
        log.warning(`⚠ Error creando índice: ${error.message}`);
      }
    }
    
    log.success(`✓ ${indicesCreados}/${indices.length} índices creados/verificados`);
    console.log('');

    // =====================================================
    // PASO 6: CREAR FUNCIONES
    // =====================================================
    log.title();
    log.section('⚙️  PASO 6: Creando Funciones');
    log.divider();

    // Función 1: update_pensionados_updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_pensionados_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    log.success('✓ Función update_pensionados_updated_at creada');

    // Función 2: calcular_dias_consumo
    await client.query(`
      CREATE OR REPLACE FUNCTION calcular_dias_consumo(id_pensionado_param INTEGER)
      RETURNS INTEGER AS $$
      DECLARE
          dias_count INTEGER;
      BEGIN
          SELECT COUNT(DISTINCT fecha_consumo) INTO dias_count
          FROM consumo_pensionados
          WHERE id_pensionado = id_pensionado_param;
          
          RETURN COALESCE(dias_count, 0);
      END;
      $$ LANGUAGE plpgsql;
    `);
    log.success('✓ Función calcular_dias_consumo creada');

    // Función 3: calcular_total_consumido
    await client.query(`
      CREATE OR REPLACE FUNCTION calcular_total_consumido(id_pensionado_param INTEGER)
      RETURNS DECIMAL(12,2) AS $$
      DECLARE
          total DECIMAL(12,2);
      BEGIN
          SELECT COALESCE(SUM(total_consumido), 0) INTO total
          FROM consumo_pensionados
          WHERE id_pensionado = id_pensionado_param;
          
          RETURN total;
      END;
      $$ LANGUAGE plpgsql;
    `);
    log.success('✓ Función calcular_total_consumido creada');

    // Función 4: actualizar_estadisticas_pensionado
    await client.query(`
      CREATE OR REPLACE FUNCTION actualizar_estadisticas_pensionado(id_pensionado_param INTEGER)
      RETURNS VOID AS $$
      BEGIN
          UPDATE pensionados
          SET 
              dias_consumo = calcular_dias_consumo(id_pensionado_param),
              total_consumido = calcular_total_consumido(id_pensionado_param),
              fecha_ultimo_consumo = (
                  SELECT MAX(fecha_consumo)
                  FROM consumo_pensionados
                  WHERE id_pensionado = id_pensionado_param
              ),
              updated_at = NOW()
          WHERE id_pensionado = id_pensionado_param;
      END;
      $$ LANGUAGE plpgsql;
    `);
    log.success('✓ Función actualizar_estadisticas_pensionado creada');

    // Función 5: trigger_actualizar_estadisticas_consumo
    await client.query(`
      CREATE OR REPLACE FUNCTION trigger_actualizar_estadisticas_consumo()
      RETURNS TRIGGER AS $$
      BEGIN
          PERFORM actualizar_estadisticas_pensionado(NEW.id_pensionado);
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    log.success('✓ Función trigger_actualizar_estadisticas_consumo creada');
    console.log('');

    // =====================================================
    // PASO 7: CREAR TRIGGERS
    // =====================================================
    log.title();
    log.section('⚡ PASO 7: Creando Triggers');
    log.divider();

    // Eliminar triggers existentes
    await client.query(`DROP TRIGGER IF EXISTS trigger_pensionados_updated_at ON pensionados`);
    await client.query(`DROP TRIGGER IF EXISTS trigger_prefacturas_pensionados_updated_at ON prefacturas_pensionados`);
    await client.query(`DROP TRIGGER IF EXISTS trigger_consumo_estadisticas ON consumo_pensionados`);

    // Crear triggers
    await client.query(`
      CREATE TRIGGER trigger_pensionados_updated_at
          BEFORE UPDATE ON pensionados
          FOR EACH ROW
          EXECUTE FUNCTION update_pensionados_updated_at();
    `);
    log.success('✓ Trigger trigger_pensionados_updated_at creado');

    await client.query(`
      CREATE TRIGGER trigger_prefacturas_pensionados_updated_at
          BEFORE UPDATE ON prefacturas_pensionados
          FOR EACH ROW
          EXECUTE FUNCTION update_pensionados_updated_at();
    `);
    log.success('✓ Trigger trigger_prefacturas_pensionados_updated_at creado');

    await client.query(`
      CREATE TRIGGER trigger_consumo_estadisticas
          AFTER INSERT OR UPDATE ON consumo_pensionados
          FOR EACH ROW
          EXECUTE FUNCTION trigger_actualizar_estadisticas_consumo();
    `);
    log.success('✓ Trigger trigger_consumo_estadisticas creado');
    console.log('');

    // =====================================================
    // PASO 8: AGREGAR COMENTARIOS
    // =====================================================
    log.title();
    log.section('📝 PASO 8: Agregando Comentarios de Documentación');
    log.divider();

    await client.query(`COMMENT ON TABLE pensionados IS 'Tabla principal para gestión de pensionados del restaurante'`);
    await client.query(`COMMENT ON TABLE consumo_pensionados IS 'Registro diario de consumo de pensionados'`);
    await client.query(`COMMENT ON TABLE prefacturas_pensionados IS 'Prefacturas consolidadas por períodos de pensionados'`);
    
    log.success('✓ Comentarios agregados');
    console.log('');

    // =====================================================
    // PASO 9: VALIDACIÓN FINAL
    // =====================================================
    log.title();
    log.section('✅ PASO 9: Validación Final');
    log.divider();

    const validacionFinalQuery = `
      SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'pensionados') as tabla_pensionados,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'consumo_pensionados') as tabla_consumos,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'prefacturas_pensionados') as tabla_prefacturas,
        (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('pensionados', 'consumo_pensionados', 'prefacturas_pensionados')) as total_indices,
        (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('update_pensionados_updated_at', 'calcular_dias_consumo', 'calcular_total_consumido', 'actualizar_estadisticas_pensionado', 'trigger_actualizar_estadisticas_consumo')) as total_funciones,
        (SELECT COUNT(*) FROM pg_trigger WHERE tgname IN ('trigger_pensionados_updated_at', 'trigger_prefacturas_pensionados_updated_at', 'trigger_consumo_estadisticas')) as total_triggers;
    `;

    const validacionFinal = await client.query(validacionFinalQuery);
    const vf = validacionFinal.rows[0];

    log.info('Resultados de validación:');
    console.log('');
    log.data(`✓ Tablas: ${vf.tabla_pensionados + vf.tabla_consumos + vf.tabla_prefacturas}/3`);
    log.data(`✓ Índices: ${vf.total_indices}`);
    log.data(`✓ Funciones: ${vf.total_funciones}/5`);
    log.data(`✓ Triggers: ${vf.total_triggers}/3`);
    console.log('');

    const todoOk = 
      (vf.tabla_pensionados + vf.tabla_consumos + vf.tabla_prefacturas) === 3 &&
      vf.total_funciones >= 5 &&
      vf.total_triggers >= 3;

    if (todoOk) {
      log.title();
      log.success('🎉 DEPLOY COMPLETADO EXITOSAMENTE');
      log.title();
      console.log('');
      log.info('El sistema de pensionados está ahora instalado en PRODUCCIÓN');
      log.info('Puedes empezar a usarlo inmediatamente desde el POS');
    } else {
      log.title();
      log.error('⚠️ DEPLOY INCOMPLETO');
      log.title();
      log.warning('Algunos componentes pueden no haberse creado correctamente');
      log.info('Revisa los mensajes anteriores para más detalles');
    }

    console.log('');

  } catch (error) {
    log.title();
    log.error('❌ ERROR DURANTE EL DEPLOY');
    log.title();
    console.error(error);
    log.warning('');
    log.warning('El deploy ha sido interrumpido');
    log.warning('Si hubo backups, puedes restaurarlos con el script de rollback');
    console.log('');
  } finally {
    await client.end();
    log.info('Conexión cerrada');
    console.log('');
  }
}

// Ejecutar deploy
console.log('');
log.title();
log.warning('⚠️  ADVERTENCIA: Vas a modificar la base de datos de PRODUCCIÓN');
log.title();
console.log('');
log.info('Base de datos: defaultdb');
log.info('Host: db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com');
console.log('');
log.warning('El script hará backup automático antes de cualquier cambio');
log.info('Puedes hacer rollback con: rollback_pensionados_produccion.sql');
console.log('');
log.title();

// Dar 3 segundos para leer la advertencia
setTimeout(() => {
  deployPensionadosProduccion()
    .then(() => {
      console.log('');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}, 3000);

console.log('');
log.info('Iniciando en 3 segundos... (Ctrl+C para cancelar)');
console.log('');

