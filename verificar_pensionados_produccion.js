/**
 * VERIFICACIÓN POST-DEPLOY - SISTEMA DE PENSIONADOS
 * Producción - DigitalOcean PostgreSQL
 */

require('dotenv').config();
const { Client } = require('pg');

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
  data: (text) => console.log(`  ${colors.magenta}→${colors.reset} ${text}`)
};

async function verificar() {
  const client = new Client(dbConfig);

  try {
    log.title();
    log.section('✅ VERIFICACIÓN POST-DEPLOY - SISTEMA DE PENSIONADOS');
    log.section('Producción - DigitalOcean PostgreSQL');
    log.title();
    
    await client.connect();
    log.success('Conectado a PRODUCCIÓN');
    console.log('');

    // Verificar tablas
    const tablasQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('pensionados', 'consumo_pensionados', 'prefacturas_pensionados')
      ORDER BY table_name;
    `;

    const tablas = await client.query(tablasQuery);
    
    log.section('📊 TABLAS:');
    if (tablas.rows.length === 3) {
      log.success('✓ Las 3 tablas están instaladas correctamente:');
      tablas.rows.forEach(t => log.data(t.table_name));
    } else {
      log.error(`✗ Solo ${tablas.rows.length}/3 tablas instaladas`);
      tablas.rows.forEach(t => log.data(t.table_name));
    }

    // Verificar funciones
    console.log('');
    const funcionesQuery = `
      SELECT proname 
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

    const funciones = await client.query(funcionesQuery);
    
    log.section('⚙️  FUNCIONES:');
    if (funciones.rows.length === 5) {
      log.success('✓ Las 5 funciones están instaladas correctamente');
    } else {
      log.error(`✗ Solo ${funciones.rows.length}/5 funciones instaladas`);
    }
    funciones.rows.forEach(f => log.data(f.proname));

    // Verificar triggers
    console.log('');
    const triggersQuery = `
      SELECT tgname, tgrelid::regclass as tabla
      FROM pg_trigger 
      WHERE tgname IN (
        'trigger_pensionados_updated_at',
        'trigger_prefacturas_pensionados_updated_at',
        'trigger_consumo_estadisticas'
      )
      ORDER BY tgname;
    `;

    const triggers = await client.query(triggersQuery);
    
    log.section('⚡ TRIGGERS:');
    if (triggers.rows.length === 3) {
      log.success('✓ Los 3 triggers están instalados correctamente:');
      triggers.rows.forEach(t => log.data(`${t.tgname} → ${t.tabla}`));
    } else {
      log.error(`✗ Solo ${triggers.rows.length}/3 triggers instalados`);
      triggers.rows.forEach(t => log.data(`${t.tgname} → ${t.tabla}`));
    }

    // Verificar índices
    console.log('');
    const indicesQuery = `
      SELECT COUNT(*) as total
      FROM pg_indexes 
      WHERE tablename IN ('pensionados', 'consumo_pensionados', 'prefacturas_pensionados');
    `;

    const indices = await client.query(indicesQuery);
    
    log.section('📇 ÍNDICES:');
    log.success(`✓ ${indices.rows[0].total} índices creados`);

    // Resultado final
    log.title();
    const todoOk = tablas.rows.length === 3 && funciones.rows.length === 5 && triggers.rows.length === 3;
    
    if (todoOk) {
      log.success('🎉 SISTEMA DE PENSIONADOS INSTALADO CORRECTAMENTE EN PRODUCCIÓN');
      log.title();
      console.log('');
      log.info('✓ Puedes empezar a usar el sistema inmediatamente');
      log.info('✓ Accede desde: Dashboard → Pensionados');
      log.info('✓ Registra consumos desde: Checkout → Consumo Pensionado');
    } else {
      log.error('⚠️ HAY PROBLEMAS EN LA INSTALACIÓN');
      log.title();
      log.warning('Algunos componentes no se instalaron correctamente');
    }

    console.log('');

  } catch (error) {
    log.title();
    log.error('Error durante la verificación:');
    console.error(error);
    log.title();
  } finally {
    await client.end();
    console.log('');
  }
}

verificar();

