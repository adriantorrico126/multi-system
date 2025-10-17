/**
 * =====================================================
 * DIAGNÓSTICO DE ERROR - AGREGAR PRODUCTOS A MESA
 * Producción - DigitalOcean PostgreSQL
 * =====================================================
 */

require('dotenv').config();
const { Client } = require('pg');

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

async function diagnosticar() {
  const client = new Client(dbConfig);

  try {
    log.title();
    log.section('🔍 DIAGNÓSTICO DE ERROR - AGREGAR PRODUCTOS A MESA');
    log.section('Producción - DigitalOcean PostgreSQL');
    log.title();
    
    await client.connect();
    log.success('Conectado a la base de datos de PRODUCCIÓN');
    log.info(`Base de datos: ${dbConfig.database}`);
    log.info(`Host: ${dbConfig.host}`);
    console.log('');

    // =====================================================
    // 1. VERIFICAR MESA 5
    // =====================================================
    log.title();
    log.section('📋 PASO 1: Verificando Mesa 5');
    log.divider();

    const mesa5Query = `
      SELECT 
        id_mesa,
        numero,
        capacidad,
        estado,
        total_acumulado,
        hora_apertura,
        id_sucursal,
        id_restaurante,
        id_venta_actual,
        created_at,
        updated_at
      FROM mesas
      WHERE numero = 5
      LIMIT 5;
    `;

    const mesa5Result = await client.query(mesa5Query);

    if (mesa5Result.rows.length === 0) {
      log.error('No se encontró ninguna Mesa 5 en la base de datos');
    } else {
      log.success(`Se encontraron ${mesa5Result.rows.length} mesa(s) con número 5:`);
      console.log('');
      
      mesa5Result.rows.forEach((mesa, index) => {
        log.section(`Mesa 5 #${index + 1}:`);
        log.data(`ID: ${mesa.id_mesa}`);
        log.data(`Sucursal: ${mesa.id_sucursal}`);
        log.data(`Restaurante: ${mesa.id_restaurante}`);
        log.data(`Estado: ${mesa.estado}`);
        log.data(`Total Acumulado: ${mesa.total_acumulado === null ? 'NULL ⚠️' : `Bs ${mesa.total_acumulado}`}`);
        log.data(`Hora Apertura: ${mesa.hora_apertura || 'NULL'}`);
        log.data(`Venta Actual: ${mesa.id_venta_actual || 'NULL'}`);
        log.data(`Capacidad: ${mesa.capacidad}`);
        console.log('');
        
        // Detectar problema potencial
        if (mesa.total_acumulado === null) {
          log.error('⚠️ PROBLEMA DETECTADO: total_acumulado es NULL');
          log.warning('Esto causará error al intentar sumar: NULL + total');
        }
      });
    }

    // =====================================================
    // 2. VERIFICAR ESTRUCTURA DE TABLA MESAS
    // =====================================================
    log.title();
    log.section('📊 PASO 2: Verificando Estructura de Tabla MESAS');
    log.divider();

    const estructuraMesasQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'mesas'
      ORDER BY ordinal_position;
    `;

    const estructuraMesas = await client.query(estructuraMesasQuery);
    
    log.info(`Columnas de la tabla MESAS (${estructuraMesas.rows.length} columnas):`);
    console.log('');
    
    estructuraMesas.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '✓ NULL permitido' : '✗ NOT NULL';
      const defaultVal = col.column_default ? ` [DEFAULT: ${col.column_default.substring(0, 30)}]` : '';
      
      if (col.column_name === 'total_acumulado') {
        log.warning(`${col.column_name}: ${col.data_type} - ${nullable}${defaultVal}`);
        
        if (col.is_nullable === 'YES' && !col.column_default) {
          log.error('⚠️ PROBLEMA: total_acumulado permite NULL y no tiene DEFAULT');
          log.warning('Solución: Debería tener DEFAULT 0');
        }
      } else {
        log.data(`${col.column_name}: ${col.data_type} - ${nullable}${defaultVal}`);
      }
    });

    // =====================================================
    // 3. VERIFICAR TABLA detalle_ventas_modificadores
    // =====================================================
    log.title();
    log.section('🔧 PASO 3: Verificando Tabla detalle_ventas_modificadores');
    log.divider();

    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'detalle_ventas_modificadores'
      ) as existe;
    `;

    const tableExists = await client.query(checkTableQuery);

    if (!tableExists.rows[0].existe) {
      log.error('⚠️ PROBLEMA CRÍTICO: Tabla detalle_ventas_modificadores NO EXISTE');
      log.warning('El código intenta insertar en esta tabla pero no existe');
    } else {
      log.success('Tabla detalle_ventas_modificadores existe');
      
      const columnasModificadoresQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'detalle_ventas_modificadores'
        ORDER BY ordinal_position;
      `;

      const columnasMod = await client.query(columnasModificadoresQuery);
      
      console.log('');
      log.info('Columnas de detalle_ventas_modificadores:');
      columnasMod.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        log.data(`${col.column_name}: ${col.data_type} ${nullable}`);
      });

      // Verificar columnas necesarias
      const columnasNecesarias = ['id_detalle_venta', 'id_modificador', 'cantidad', 'precio_unitario', 'subtotal'];
      console.log('');
      log.info('Verificando columnas necesarias:');
      
      columnasNecesarias.forEach(col => {
        const existe = columnasMod.rows.some(c => c.column_name === col);
        if (existe) {
          log.success(`Columna '${col}' existe`);
        } else {
          log.error(`⚠️ Columna '${col}' NO EXISTE`);
        }
      });
    }

    // =====================================================
    // 4. VERIFICAR VENTAS ACTIVAS DE MESA 5
    // =====================================================
    log.title();
    log.section('🛒 PASO 4: Verificando Ventas Activas de Mesa 5');
    log.divider();

    const ventasMesa5Query = `
      SELECT 
        v.id_venta,
        v.id_mesa,
        v.total,
        v.estado,
        v.tipo_servicio,
        v.created_at,
        m.numero as mesa_numero,
        m.estado as mesa_estado
      FROM ventas v
      JOIN mesas m ON v.id_mesa = m.id_mesa
      WHERE m.numero = 5
      AND v.estado IN ('recibido', 'en_preparacion')
      ORDER BY v.created_at DESC
      LIMIT 5;
    `;

    const ventasMesa5 = await client.query(ventasMesa5Query);

    if (ventasMesa5.rows.length === 0) {
      log.info('No hay ventas activas (recibido/en_preparacion) para Mesa 5');
    } else {
      log.success(`Se encontraron ${ventasMesa5.rows.length} venta(s) activa(s):`);
      console.log('');
      
      ventasMesa5.rows.forEach((venta, index) => {
        log.section(`Venta #${index + 1}:`);
        log.data(`ID Venta: ${venta.id_venta}`);
        log.data(`Total: Bs ${venta.total}`);
        log.data(`Estado: ${venta.estado}`);
        log.data(`Mesa Estado: ${venta.mesa_estado}`);
        log.data(`Fecha: ${venta.created_at}`);
        console.log('');
      });
    }

    // =====================================================
    // 5. VERIFICAR CONSTRAINTS Y FOREIGN KEYS
    // =====================================================
    log.title();
    log.section('🔒 PASO 5: Verificando Constraints');
    log.divider();

    const constraintsQuery = `
      SELECT 
        conname as constraint_name,
        contype as constraint_type,
        conrelid::regclass as table_name
      FROM pg_constraint
      WHERE conrelid::regclass::text IN ('mesas', 'ventas', 'detalle_ventas', 'detalle_ventas_modificadores')
      ORDER BY conrelid::regclass::text, contype;
    `;

    const constraints = await client.query(constraintsQuery);
    
    log.info(`Se encontraron ${constraints.rows.length} constraint(s):`);
    console.log('');
    
    let currentTable = '';
    constraints.rows.forEach(c => {
      if (c.table_name !== currentTable) {
        currentTable = c.table_name;
        log.section(`Tabla: ${c.table_name}`);
      }
      
      const tipo = {
        'c': 'CHECK',
        'f': 'FOREIGN KEY',
        'p': 'PRIMARY KEY',
        'u': 'UNIQUE'
      }[c.constraint_type] || c.constraint_type;
      
      log.data(`[${tipo}] ${c.constraint_name}`);
    });

    // =====================================================
    // 6. SIMULACIÓN DEL ERROR
    // =====================================================
    log.title();
    log.section('🧪 PASO 6: Simulando el Error');
    log.divider();

    if (mesa5Result.rows.length > 0) {
      const mesa = mesa5Result.rows[0];
      const totalNuevo = 7.50; // Coca Cola ejemplo

      console.log('');
      log.info('Simulando: total_acumulado + total_nuevo');
      log.data(`mesa.total_acumulado = ${mesa.total_acumulado}`);
      log.data(`total_nuevo = ${totalNuevo}`);
      
      try {
        const resultado = mesa.total_acumulado + totalNuevo;
        log.success(`Resultado: ${resultado}`);
        
        if (isNaN(resultado)) {
          log.error('⚠️ PROBLEMA: El resultado es NaN (Not a Number)');
          log.warning('Esto ocurre cuando total_acumulado es NULL');
        }
      } catch (error) {
        log.error(`⚠️ Error en la operación: ${error.message}`);
      }
    }

    // =====================================================
    // 7. VERIFICAR PRODUCTOS
    // =====================================================
    log.title();
    log.section('🥤 PASO 7: Verificando Producto "Coca Cola"');
    log.divider();

    const cocaColaQuery = `
      SELECT 
        id_producto,
        nombre,
        precio,
        stock_actual,
        activo,
        id_categoria,
        id_restaurante
      FROM productos
      WHERE LOWER(nombre) LIKE '%coca%'
      OR LOWER(nombre) LIKE '%cola%'
      LIMIT 5;
    `;

    const cocaCola = await client.query(cocaColaQuery);

    if (cocaCola.rows.length === 0) {
      log.warning('No se encontró producto "Coca Cola"');
    } else {
      log.success(`Se encontraron ${cocaCola.rows.length} producto(s) similar(es) a Coca Cola:`);
      console.log('');
      
      cocaCola.rows.forEach((prod, index) => {
        log.section(`Producto #${index + 1}:`);
        log.data(`ID: ${prod.id_producto}`);
        log.data(`Nombre: ${prod.nombre}`);
        log.data(`Precio: Bs ${prod.precio}`);
        log.data(`Stock: ${prod.stock_actual}`);
        log.data(`Activo: ${prod.activo ? 'Sí' : 'No'}`);
        log.data(`Restaurante: ${prod.id_restaurante}`);
        console.log('');
      });
    }

    // =====================================================
    // 8. RESUMEN Y RECOMENDACIONES
    // =====================================================
    log.title();
    log.section('📝 RESUMEN Y SOLUCIONES');
    log.title();

    console.log('');
    log.section('🔍 PROBLEMAS DETECTADOS:');
    console.log('');

    const problemas = [];

    // Verificar total_acumulado NULL
    if (mesa5Result.rows.length > 0 && mesa5Result.rows[0].total_acumulado === null) {
      problemas.push({
        num: 1,
        titulo: 'total_acumulado es NULL en Mesa 5',
        descripcion: 'La operación NULL + 7.50 = NULL causa error',
        solucion: 'UPDATE mesas SET total_acumulado = 0 WHERE total_acumulado IS NULL'
      });
    }

    // Verificar tabla detalle_ventas_modificadores
    if (!tableExists.rows[0].existe) {
      problemas.push({
        num: problemas.length + 1,
        titulo: 'Tabla detalle_ventas_modificadores no existe',
        descripcion: 'El código intenta insertar modificadores pero la tabla no existe',
        solucion: 'Crear la tabla detalle_ventas_modificadores'
      });
    }

    if (problemas.length === 0) {
      log.success('✓ No se detectaron problemas evidentes');
      log.info('El error 500 puede estar en otra parte. Revisar logs del servidor.');
    } else {
      problemas.forEach(p => {
        log.error(`${p.num}. ${p.titulo}`);
        log.data(`Descripción: ${p.descripcion}`);
        log.data(`Solución: ${p.solucion}`);
        console.log('');
      });
    }

    log.title();
    log.section('🔧 SCRIPTS DE SOLUCIÓN DISPONIBLES:');
    log.divider();
    log.data('1. fix_total_acumulado_null.sql - Corregir total_acumulado NULL');
    log.data('2. create_detalle_ventas_modificadores.sql - Crear tabla faltante');
    log.title();

  } catch (error) {
    log.title();
    log.error('Error durante el diagnóstico:');
    console.error(error);
    log.title();
  } finally {
    await client.end();
    log.info('Conexión cerrada');
    console.log('');
  }
}

// Ejecutar diagnóstico
console.log('');
diagnosticar()
  .then(() => {
    console.log('');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });

