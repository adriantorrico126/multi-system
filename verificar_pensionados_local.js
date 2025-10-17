/**
 * =====================================================
 * SCRIPT DE VERIFICACIÓN - SISTEMA DE PENSIONADOS LOCAL
 * =====================================================
 * 
 * Este script verifica qué estructura de pensionados existe
 * en la base de datos local y muestra un reporte completo.
 */

const { Client } = require('pg');

// Configuración de la base de datos LOCAL
const dbConfig = {
  user: 'postgres',
  password: '6951230Anacleta',
  database: 'sistempos',
  host: 'localhost',
  port: 5432
};

// Colores para la consola
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
  title: (text) => console.log(`\n${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}`),
  section: (text) => console.log(`${colors.bright}${colors.cyan}${text}${colors.reset}`),
  success: (text) => console.log(`${colors.green}✓${colors.reset} ${text}`),
  error: (text) => console.log(`${colors.red}✗${colors.reset} ${text}`),
  warning: (text) => console.log(`${colors.yellow}⚠${colors.reset} ${text}`),
  info: (text) => console.log(`${colors.blue}ℹ${colors.reset} ${text}`),
  data: (text) => console.log(`  ${colors.magenta}→${colors.reset} ${text}`),
  divider: () => console.log(`${colors.blue}${'─'.repeat(60)}${colors.reset}`)
};

async function verificarSistemaPensionados() {
  const client = new Client(dbConfig);

  try {
    log.title();
    log.section('🔍 VERIFICACIÓN DEL SISTEMA DE PENSIONADOS - BASE DE DATOS LOCAL');
    log.title();
    
    await client.connect();
    log.success(`Conectado a la base de datos: ${dbConfig.database}`);
    log.info(`Host: ${dbConfig.host}:${dbConfig.port}`);
    log.info(`Usuario: ${dbConfig.user}`);

    // =====================================================
    // 1. VERIFICAR TABLAS
    // =====================================================
    log.title();
    log.section('📊 PASO 1: Verificando Tablas');
    log.divider();

    const tablasQuery = `
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as num_columnas
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_name IN ('pensionados', 'consumo_pensionados', 'prefacturas_pensionados')
      ORDER BY table_name;
    `;

    const tablasResult = await client.query(tablasQuery);

    if (tablasResult.rows.length === 0) {
      log.error('No se encontraron tablas del sistema de pensionados');
      log.warning('El sistema de pensionados NO está instalado en esta base de datos');
      await client.end();
      return;
    }

    log.success(`Se encontraron ${tablasResult.rows.length} tabla(s) del sistema de pensionados:`);
    tablasResult.rows.forEach(row => {
      log.data(`${row.table_name} (${row.num_columnas} columnas)`);
    });

    // =====================================================
    // 2. VERIFICAR COLUMNAS DE CADA TABLA
    // =====================================================
    log.title();
    log.section('📋 PASO 2: Verificando Columnas de las Tablas');
    log.divider();

    for (const tabla of tablasResult.rows) {
      const columnasQuery = `
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `;

      const columnasResult = await client.query(columnasQuery, [tabla.table_name]);

      log.section(`\n📄 Tabla: ${tabla.table_name.toUpperCase()}`);
      log.info(`Total de columnas: ${columnasResult.rows.length}`);
      
      columnasResult.rows.forEach(col => {
        const tipo = col.character_maximum_length 
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.data_type;
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default.substring(0, 30)}` : '';
        log.data(`${col.column_name}: ${tipo} ${nullable}${defaultVal}`);
      });
    }

    // =====================================================
    // 3. VERIFICAR CONSTRAINTS
    // =====================================================
    log.title();
    log.section('🔒 PASO 3: Verificando Constraints');
    log.divider();

    const constraintsQuery = `
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        cc.check_clause
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.check_constraints cc 
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_name IN ('pensionados', 'consumo_pensionados', 'prefacturas_pensionados')
        AND tc.constraint_type IN ('CHECK', 'PRIMARY KEY', 'FOREIGN KEY')
      ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
    `;

    const constraintsResult = await client.query(constraintsQuery);

    if (constraintsResult.rows.length > 0) {
      log.success(`Se encontraron ${constraintsResult.rows.length} constraint(s):`);
      
      let currentTable = '';
      constraintsResult.rows.forEach(row => {
        if (row.table_name !== currentTable) {
          currentTable = row.table_name;
          log.section(`\n📄 ${row.table_name.toUpperCase()}:`);
        }
        
        const clause = row.check_clause ? ` (${row.check_clause.substring(0, 50)}...)` : '';
        log.data(`[${row.constraint_type}] ${row.constraint_name}${clause}`);
      });
    } else {
      log.warning('No se encontraron constraints definidos');
    }

    // =====================================================
    // 4. VERIFICAR ÍNDICES
    // =====================================================
    log.title();
    log.section('📇 PASO 4: Verificando Índices');
    log.divider();

    const indicesQuery = `
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename IN ('pensionados', 'consumo_pensionados', 'prefacturas_pensionados')
      ORDER BY tablename, indexname;
    `;

    const indicesResult = await client.query(indicesQuery);

    if (indicesResult.rows.length > 0) {
      log.success(`Se encontraron ${indicesResult.rows.length} índice(s):`);
      
      let currentTable = '';
      indicesResult.rows.forEach(row => {
        if (row.tablename !== currentTable) {
          currentTable = row.tablename;
          log.section(`\n📄 ${row.tablename.toUpperCase()}:`);
        }
        log.data(row.indexname);
      });
    } else {
      log.warning('No se encontraron índices personalizados (solo índices por defecto)');
    }

    // =====================================================
    // 5. VERIFICAR FUNCIONES
    // =====================================================
    log.title();
    log.section('⚙️  PASO 5: Verificando Funciones');
    log.divider();

    const funcionesQuery = `
      SELECT 
        proname as nombre_funcion,
        pg_get_functiondef(oid) as definicion
      FROM pg_proc
      WHERE proname IN (
        'update_pensionados_updated_at',
        'calcular_dias_consumo',
        'calcular_total_consumido',
        'actualizar_estadisticas_pensionado',
        'trigger_actualizar_estadisticas_consumo'
      )
      ORDER BY proname;
    `;

    const funcionesResult = await client.query(funcionesQuery);

    if (funcionesResult.rows.length > 0) {
      log.success(`Se encontraron ${funcionesResult.rows.length} función(es):`);
      funcionesResult.rows.forEach(row => {
        log.data(row.nombre_funcion);
      });
    } else {
      log.warning('No se encontraron funciones del sistema de pensionados');
    }

    // =====================================================
    // 6. VERIFICAR TRIGGERS
    // =====================================================
    log.title();
    log.section('⚡ PASO 6: Verificando Triggers');
    log.divider();

    const triggersQuery = `
      SELECT 
        tgname as nombre_trigger,
        tgrelid::regclass as tabla,
        tgtype,
        tgenabled
      FROM pg_trigger
      WHERE tgname IN (
        'trigger_pensionados_updated_at',
        'trigger_prefacturas_pensionados_updated_at',
        'trigger_consumo_estadisticas'
      )
      ORDER BY tgname;
    `;

    const triggersResult = await client.query(triggersQuery);

    if (triggersResult.rows.length > 0) {
      log.success(`Se encontraron ${triggersResult.rows.length} trigger(s):`);
      triggersResult.rows.forEach(row => {
        const estado = row.tgenabled === 'O' ? 'ACTIVO' : 'INACTIVO';
        log.data(`${row.nombre_trigger} en ${row.tabla} [${estado}]`);
      });
    } else {
      log.warning('No se encontraron triggers del sistema de pensionados');
    }

    // =====================================================
    // 7. VERIFICAR DATOS
    // =====================================================
    log.title();
    log.section('💾 PASO 7: Verificando Datos');
    log.divider();

    // Contar pensionados
    if (tablasResult.rows.some(t => t.table_name === 'pensionados')) {
      const countPensionadosQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE estado = 'activo') as activos,
          COUNT(*) FILTER (WHERE estado = 'pausado') as pausados,
          COUNT(*) FILTER (WHERE estado = 'finalizado') as finalizados,
          COUNT(*) FILTER (WHERE estado = 'cancelado') as cancelados
        FROM pensionados;
      `;

      const countPensionados = await client.query(countPensionadosQuery);
      const datos = countPensionados.rows[0];

      log.section('\n📊 Pensionados:');
      log.data(`Total: ${datos.total}`);
      if (datos.total > 0) {
        log.data(`  - Activos: ${datos.activos}`);
        log.data(`  - Pausados: ${datos.pausados}`);
        log.data(`  - Finalizados: ${datos.finalizados}`);
        log.data(`  - Cancelados: ${datos.cancelados}`);
      }
    }

    // Contar consumos
    if (tablasResult.rows.some(t => t.table_name === 'consumo_pensionados')) {
      const countConsumosQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT id_pensionado) as pensionados_unicos,
          COUNT(DISTINCT fecha_consumo) as dias_unicos,
          SUM(total_consumido) as total_consumido
        FROM consumo_pensionados;
      `;

      const countConsumos = await client.query(countConsumosQuery);
      const datos = countConsumos.rows[0];

      log.section('\n🍽️  Consumos:');
      log.data(`Total de consumos: ${datos.total}`);
      if (datos.total > 0) {
        log.data(`Pensionados que han consumido: ${datos.pensionados_unicos}`);
        log.data(`Días con consumos: ${datos.dias_unicos}`);
        log.data(`Total consumido: Bs ${parseFloat(datos.total_consumido || 0).toFixed(2)}`);
      }
    }

    // Contar prefacturas
    if (tablasResult.rows.some(t => t.table_name === 'prefacturas_pensionados')) {
      const countPrefacturasQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
          COUNT(*) FILTER (WHERE estado = 'generada') as generadas,
          COUNT(*) FILTER (WHERE estado = 'enviada') as enviadas,
          COUNT(*) FILTER (WHERE estado = 'pagada') as pagadas
        FROM prefacturas_pensionados;
      `;

      const countPrefacturas = await client.query(countPrefacturasQuery);
      const datos = countPrefacturas.rows[0];

      log.section('\n🧾 Prefacturas:');
      log.data(`Total: ${datos.total}`);
      if (datos.total > 0) {
        log.data(`  - Pendientes: ${datos.pendientes}`);
        log.data(`  - Generadas: ${datos.generadas}`);
        log.data(`  - Enviadas: ${datos.enviadas}`);
        log.data(`  - Pagadas: ${datos.pagadas}`);
      }
    }

    // =====================================================
    // 8. RESUMEN FINAL
    // =====================================================
    log.title();
    log.section('📝 RESUMEN FINAL');
    log.title();

    const resumen = {
      tablas: tablasResult.rows.length,
      constraints: constraintsResult.rows.length,
      indices: indicesResult.rows.length,
      funciones: funcionesResult.rows.length,
      triggers: triggersResult.rows.length
    };

    console.log('');
    log.info('Estado del Sistema de Pensionados:');
    console.log('');
    log.data(`✓ Tablas instaladas: ${resumen.tablas}/3`);
    log.data(`✓ Constraints configurados: ${resumen.constraints}`);
    log.data(`✓ Índices creados: ${resumen.indices}`);
    log.data(`✓ Funciones definidas: ${resumen.funciones}/5`);
    log.data(`✓ Triggers activos: ${resumen.triggers}/3`);
    console.log('');

    // Evaluación
    if (resumen.tablas === 3 && resumen.funciones >= 5 && resumen.triggers >= 3) {
      log.success('✓ Sistema COMPLETO: El sistema de pensionados está completamente instalado');
      console.log('');
      log.info('Este sistema está listo para usar y puede servir como referencia para producción.');
    } else if (resumen.tablas === 3) {
      log.warning('⚠ Sistema PARCIAL: Las tablas existen pero faltan funciones/triggers');
      console.log('');
      log.info('Recomendación: Ejecutar el script completo de deploy para completar la instalación.');
    } else {
      log.error('✗ Sistema INCOMPLETO: Faltan tablas principales');
      console.log('');
      log.info('Recomendación: Ejecutar el script de deploy completo.');
    }

    console.log('');
    log.title();
    log.section('📄 Archivos disponibles para deploy a producción:');
    log.divider();
    log.data('▸ estructuradb/deploy_pensionados_produccion.sql (Deploy completo)');
    log.data('▸ estructuradb/rollback_pensionados_produccion.sql (Rollback)');
    log.title();
    console.log('');

  } catch (error) {
    log.title();
    log.error('Error durante la verificación:');
    console.error(error);
    log.title();
  } finally {
    await client.end();
    log.info('Conexión cerrada');
  }
}

// Ejecutar la verificación
console.log('');
verificarSistemaPensionados()
  .then(() => {
    console.log('');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });

