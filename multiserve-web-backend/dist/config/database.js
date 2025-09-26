import { Pool } from 'pg';
import { dbConfig } from './index.js';
import { logError, logInfo } from './logger.js';
// Pool de conexiones a PostgreSQL
const pool = new Pool(dbConfig);
// Configurar eventos del pool
pool.on('connect', (client) => {
    logInfo('Nueva conexión a la base de datos establecida', {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
    });
});
pool.on('error', (err, client) => {
    logError('Error inesperado en cliente inactivo de la base de datos', err);
});
pool.on('remove', (client) => {
    logInfo('Cliente de base de datos removido del pool');
});
// Función para probar la conexión
export const testConnection = async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        logInfo('✅ Conexión a la base de datos exitosa');
        return true;
    }
    catch (error) {
        logError('❌ Error conectando a la base de datos', error);
        return false;
    }
};
// Función para ejecutar queries con manejo de errores
export const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        logInfo('Query ejecutada', {
            query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            duration: `${duration}ms`,
            rows: result.rowCount,
        });
        return result;
    }
    catch (error) {
        const duration = Date.now() - start;
        logError('Error ejecutando query', error, {
            query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            duration: `${duration}ms`,
            params,
        });
        throw error;
    }
};
// Función para transacciones
export const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
// Función para obtener un cliente del pool
export const getClient = async () => {
    return await pool.connect();
};
// Función para cerrar el pool
export const closePool = async () => {
    await pool.end();
    logInfo('Pool de conexiones cerrado');
};
// Función para obtener estadísticas del pool
export const getPoolStats = () => {
    return {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
    };
};
// Función para inicializar tablas de la página web
export const initializeWebTables = async () => {
    try {
        logInfo('Inicializando tablas de la página web...');
        // Tabla de solicitudes de demo
        await query(`
      CREATE TABLE IF NOT EXISTS solicitudes_demo (
        id_solicitud SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        telefono VARCHAR(20) NOT NULL,
        restaurante VARCHAR(100) NOT NULL,
        plan_interes VARCHAR(50),
        tipo_negocio VARCHAR(50),
        mensaje TEXT,
        horario_preferido VARCHAR(50),
        estado VARCHAR(20) DEFAULT 'pendiente',
        fecha_solicitud TIMESTAMP DEFAULT NOW(),
        ip_address INET,
        user_agent TEXT,
        procesado_por INTEGER,
        fecha_procesamiento TIMESTAMP,
        observaciones TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
        // Tabla de eventos de conversión
        await query(`
      CREATE TABLE IF NOT EXISTS conversion_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        plan_name VARCHAR(50),
        user_agent TEXT,
        referrer TEXT,
        session_id VARCHAR(100),
        ip_address INET,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
        // Tabla de sesiones de usuario
        await query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(100) UNIQUE NOT NULL,
        ip_address INET,
        user_agent TEXT,
        referrer TEXT,
        landing_page VARCHAR(500),
        utm_source VARCHAR(100),
        utm_medium VARCHAR(100),
        utm_campaign VARCHAR(100),
        utm_term VARCHAR(100),
        utm_content VARCHAR(100),
        country VARCHAR(50),
        city VARCHAR(100),
        device_type VARCHAR(50),
        browser VARCHAR(100),
        os VARCHAR(100),
        first_visit TIMESTAMP DEFAULT NOW(),
        last_visit TIMESTAMP DEFAULT NOW(),
        visit_count INTEGER DEFAULT 1,
        is_converted BOOLEAN DEFAULT FALSE,
        conversion_event VARCHAR(50),
        conversion_timestamp TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
        // Tabla de newsletter
        await query(`
      CREATE TABLE IF NOT EXISTS newsletter_suscriptores (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        nombre VARCHAR(100),
        estado VARCHAR(20) DEFAULT 'activo',
        fecha_suscripcion TIMESTAMP DEFAULT NOW(),
        fecha_baja TIMESTAMP,
        fuente VARCHAR(50),
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
        // Crear índices para optimizar consultas
        await query(`
      CREATE INDEX IF NOT EXISTS idx_solicitudes_demo_email ON solicitudes_demo(email);
      CREATE INDEX IF NOT EXISTS idx_solicitudes_demo_fecha ON solicitudes_demo(fecha_solicitud);
      CREATE INDEX IF NOT EXISTS idx_solicitudes_demo_estado ON solicitudes_demo(estado);
      
      CREATE INDEX IF NOT EXISTS idx_conversion_events_type ON conversion_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_conversion_events_timestamp ON conversion_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_conversion_events_session ON conversion_events(session_id);
      
      CREATE INDEX IF NOT EXISTS idx_user_sessions_session ON user_sessions(session_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_converted ON user_sessions(is_converted);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_first_visit ON user_sessions(first_visit);
      
      CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_suscriptores(email);
      CREATE INDEX IF NOT EXISTS idx_newsletter_estado ON newsletter_suscriptores(estado);
    `);
        logInfo('✅ Tablas de la página web inicializadas correctamente');
    }
    catch (error) {
        logError('❌ Error inicializando tablas de la página web', error);
        throw error;
    }
};
export default pool;
//# sourceMappingURL=database.js.map