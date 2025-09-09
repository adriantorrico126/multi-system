#!/usr/bin/env python3
"""
Script para corregir el problema de prefacturas con datos históricos en producción.
CORREGIDO para la estructura real de la base de datos de producción.
"""

import psycopg2
import logging
import sys
from datetime import datetime
import os

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('fix_prefactura_produccion_corregido.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def get_database_connection():
    """Obtener conexión a la base de datos de producción"""
    try:
        # Configuración de producción - ajustar según sea necesario
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432'),
            database=os.getenv('DB_NAME', 'vegetarian_restaurant'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'password')
        )
        logger.info("✅ Conexión a base de datos establecida")
        return conn
    except Exception as e:
        logger.error(f"❌ Error conectando a la base de datos: {e}")
        raise

def execute_sql_file(conn, sql_file_path):
    """Ejecutar archivo SQL con manejo de errores"""
    try:
        with open(sql_file_path, 'r', encoding='utf-8') as file:
            sql_content = file.read()
        
        cursor = conn.cursor()
        
        # Dividir el contenido en comandos individuales
        commands = sql_content.split(';')
        
        for i, command in enumerate(commands):
            command = command.strip()
            if command and not command.startswith('--'):
                try:
                    logger.info(f"Ejecutando comando {i+1}/{len(commands)}")
                    cursor.execute(command)
                    conn.commit()
                    logger.info(f"✅ Comando {i+1} ejecutado exitosamente")
                except Exception as e:
                    logger.error(f"❌ Error en comando {i+1}: {e}")
                    logger.error(f"Comando problemático: {command[:100]}...")
                    conn.rollback()
                    raise
        
        cursor.close()
        logger.info("✅ Todos los comandos SQL ejecutados exitosamente")
        
    except Exception as e:
        logger.error(f"❌ Error ejecutando archivo SQL: {e}")
        raise

def verify_prefacturas_fix(conn):
    """Verificar que la corrección se aplicó correctamente"""
    try:
        cursor = conn.cursor()
        
        # Verificar prefacturas abiertas
        cursor.execute("""
            SELECT 
                p.id_prefactura,
                p.id_mesa,
                p.fecha_apertura,
                p.estado,
                p.total_acumulado,
                m.numero as mesa_numero
            FROM prefacturas p
            JOIN mesas m ON p.id_mesa = m.id_mesa
            WHERE p.estado = 'abierta'
            ORDER BY p.fecha_apertura DESC
        """)
        
        prefacturas = cursor.fetchall()
        logger.info(f"📊 Prefacturas abiertas encontradas: {len(prefacturas)}")
        
        for prefactura in prefacturas:
            logger.info(f"  - Prefactura ID {prefactura[0]}: Mesa {prefactura[5]}, Total: {prefactura[4]}, Fecha: {prefactura[2]}")
        
        # Verificar que no hay prefacturas sin fecha_apertura
        cursor.execute("""
            SELECT COUNT(*) 
            FROM prefacturas 
            WHERE estado = 'abierta' AND fecha_apertura IS NULL
        """)
        
        count_sin_fecha = cursor.fetchone()[0]
        if count_sin_fecha == 0:
            logger.info("✅ Todas las prefacturas abiertas tienen fecha_apertura")
        else:
            logger.warning(f"⚠️ Aún hay {count_sin_fecha} prefacturas sin fecha_apertura")
        
        # Verificar que las funciones SQL existen
        cursor.execute("""
            SELECT proname FROM pg_proc 
            WHERE proname IN ('get_ventas_sesion_actual', 'get_total_sesion_actual')
        """)
        
        funciones = cursor.fetchall()
        logger.info(f"📊 Funciones SQL creadas: {len(funciones)}")
        for funcion in funciones:
            logger.info(f"  - {funcion[0]}")
        
        cursor.close()
        
    except Exception as e:
        logger.error(f"❌ Error verificando corrección: {e}")
        raise

def main():
    """Función principal"""
    logger.info("🚀 Iniciando corrección de prefacturas en producción (CORREGIDO)")
    logger.info(f"📅 Fecha y hora: {datetime.now()}")
    
    conn = None
    try:
        # Conectar a la base de datos
        conn = get_database_connection()
        
        # Ejecutar script de corrección
        sql_file_path = 'sistema-pos/database-migrations/fix_prefactura_produccion_corregido.sql'
        if not os.path.exists(sql_file_path):
            logger.error(f"❌ Archivo SQL no encontrado: {sql_file_path}")
            return False
        
        logger.info(f"📄 Ejecutando script: {sql_file_path}")
        execute_sql_file(conn, sql_file_path)
        
        # Verificar que la corrección se aplicó
        logger.info("🔍 Verificando corrección...")
        verify_prefacturas_fix(conn)
        
        logger.info("✅ Corrección de prefacturas completada exitosamente")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error durante la corrección: {e}")
        if conn:
            conn.rollback()
        return False
        
    finally:
        if conn:
            conn.close()
            logger.info("🔌 Conexión a base de datos cerrada")

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
