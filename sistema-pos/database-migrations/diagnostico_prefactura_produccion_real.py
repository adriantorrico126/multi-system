#!/usr/bin/env python3
"""
Script para diagnosticar el problema de prefacturas con datos históricos en producción.
CONFIGURADO con las credenciales reales de producción.
"""

import psycopg2
import logging
import sys
from datetime import datetime
import os
from dotenv import load_dotenv

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('diagnostico_prefactura_produccion_real.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def get_database_connection():
    """Obtener conexión a la base de datos de producción con credenciales reales"""
    try:
        # Credenciales reales de producción
        conn = psycopg2.connect(
            host=os.environ.get('DB_HOST'),
            port=os.environ.get('DB_PORT'),
            database=os.environ.get('DB_DATABASE'),
            user=os.environ.get('DB_USER'),
            password=os.environ.get('DB_PASSWORD')
        )
        logger.info("✅ Conexión a base de datos de producción establecida")
        return conn
    except Exception as e:
        logger.error(f"❌ Error conectando a la base de datos de producción: {e}")
        raise

def diagnosticar_prefacturas(conn):
    """Diagnosticar el estado actual de las prefacturas"""
    try:
        cursor = conn.cursor()
        
        logger.info("🔍 DIAGNÓSTICO DE PREFACTURAS EN PRODUCCIÓN")
        logger.info("=" * 60)
        
        # 1. Verificar prefacturas abiertas
        cursor.execute("""
            SELECT 
                p.id_prefactura,
                p.id_mesa,
                p.fecha_apertura,
                p.fecha_cierre,
                p.estado,
                p.total_acumulado,
                m.numero as mesa_numero,
                m.estado as estado_mesa,
                m.hora_apertura
            FROM prefacturas p
            JOIN mesas m ON p.id_mesa = m.id_mesa
            WHERE p.estado = 'abierta'
            ORDER BY p.fecha_apertura DESC
        """)
        
        prefacturas = cursor.fetchall()
        logger.info(f"📊 Prefacturas abiertas encontradas: {len(prefacturas)}")
        
        for prefactura in prefacturas:
            logger.info(f"""
  Prefactura ID: {prefactura[0]}
  Mesa: {prefactura[6]} (ID: {prefactura[1]})
  Estado Mesa: {prefactura[7]}
  Fecha Apertura Prefactura: {prefactura[2]}
  Hora Apertura Mesa: {prefactura[8]}
  Total Acumulado: {prefactura[5]}
  Estado: {prefactura[4]}
            """)
        
        # 2. Verificar prefacturas sin fecha_apertura
        cursor.execute("""
            SELECT 
                p.id_prefactura,
                p.id_mesa,
                p.estado,
                m.numero as mesa_numero
            FROM prefacturas p
            JOIN mesas m ON p.id_mesa = m.id_mesa
            WHERE p.estado = 'abierta' AND p.fecha_apertura IS NULL
        """)
        
        prefacturas_sin_fecha = cursor.fetchall()
        logger.info(f"⚠️ Prefacturas sin fecha_apertura: {len(prefacturas_sin_fecha)}")
        
        for prefactura in prefacturas_sin_fecha:
            logger.warning(f"  - Prefactura ID {prefactura[0]}: Mesa {prefactura[3]} SIN fecha_apertura")
        
        # 3. Para cada prefactura abierta, verificar las ventas que está mostrando
        for prefactura in prefacturas:
            prefactura_id = prefactura[0]
            mesa_id = prefactura[1]
            mesa_numero = prefactura[6]
            fecha_apertura = prefactura[2]
            hora_apertura_mesa = prefactura[8]
            
            logger.info(f"\n🔍 ANALIZANDO PREFACTURA ID {prefactura_id} (Mesa {mesa_numero})")
            
            # Determinar fecha de referencia
            fecha_referencia = fecha_apertura if fecha_apertura else hora_apertura_mesa
            logger.info(f"📅 Fecha de referencia: {fecha_referencia}")
            
            # Verificar todas las ventas de la mesa
            cursor.execute("""
                SELECT 
                    v.id_venta,
                    v.fecha,
                    v.total,
                    v.estado,
                    COUNT(dv.id_detalle) as items_count
                FROM ventas v
                LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
                WHERE v.id_mesa = %s
                GROUP BY v.id_venta, v.fecha, v.total, v.estado
                ORDER BY v.fecha DESC
            """, (mesa_id,))
            
            todas_ventas = cursor.fetchall()
            logger.info(f"📊 Total de ventas para mesa {mesa_numero}: {len(todas_ventas)}")
            
            # Mostrar las últimas 5 ventas
            for i, venta in enumerate(todas_ventas[:5]):
                logger.info(f"  Venta {i+1}: ID={venta[0]}, Estado={venta[3]}, Total={venta[2]}, Items={venta[4]}, Fecha={venta[1]}")
            
            # Verificar ventas de la sesión actual
            cursor.execute("""
                SELECT 
                    v.id_venta,
                    v.fecha,
                    v.total,
                    v.estado,
                    COUNT(dv.id_detalle) as items_count
                FROM ventas v
                LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
                WHERE v.id_mesa = %s
                  AND v.fecha >= %s
                  AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'pagado', 'completada', 'pendiente', 'recibido')
                GROUP BY v.id_venta, v.fecha, v.total, v.estado
                ORDER BY v.fecha DESC
            """, (mesa_id, fecha_referencia))
            
            ventas_sesion = cursor.fetchall()
            logger.info(f"📊 Ventas de la sesión actual: {len(ventas_sesion)}")
            
            # Mostrar las ventas de la sesión actual
            for i, venta in enumerate(ventas_sesion):
                logger.info(f"  Sesión {i+1}: ID={venta[0]}, Estado={venta[3]}, Total={venta[2]}, Items={venta[4]}, Fecha={venta[1]}")
            
            # Calcular total de la sesión actual
            cursor.execute("""
                SELECT COALESCE(SUM(dv.subtotal), 0) as total_sesion
                FROM ventas v
                JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
                WHERE v.id_mesa = %s
                  AND v.fecha >= %s
                  AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'pagado', 'completada', 'pendiente', 'recibido')
            """, (mesa_id, fecha_referencia))
            
            total_sesion = cursor.fetchone()[0]
            logger.info(f"💰 Total de la sesión actual: {total_sesion}")
            logger.info(f"💰 Total en prefactura: {prefactura[5]}")
            
            # Verificar si hay discrepancia
            if abs(float(total_sesion) - float(prefactura[5])) > 0.01:
                logger.warning(f"⚠️ DISCREPANCIA EN PREFACTURA {prefactura_id}:")
                logger.warning(f"   Total calculado: {total_sesion}")
                logger.warning(f"   Total en prefactura: {prefactura[5]}")
                logger.warning(f"   Diferencia: {abs(float(total_sesion) - float(prefactura[5]))}")
            else:
                logger.info(f"✅ Total de prefactura coincide con cálculo de sesión")
        
        cursor.close()
        
    except Exception as e:
        logger.error(f"❌ Error durante diagnóstico: {e}")
        raise

def verificar_funciones_sql(conn):
    """Verificar si las funciones SQL necesarias existen"""
    try:
        cursor = conn.cursor()
        
        logger.info("\n🔍 VERIFICANDO FUNCIONES SQL")
        logger.info("=" * 50)
        
        # Verificar función get_ventas_sesion_actual
        cursor.execute("""
            SELECT EXISTS(
                SELECT 1 FROM pg_proc 
                WHERE proname = 'get_ventas_sesion_actual'
            )
        """)
        
        existe_funcion_ventas = cursor.fetchone()[0]
        logger.info(f"📊 Función get_ventas_sesion_actual existe: {existe_funcion_ventas}")
        
        # Verificar función get_total_sesion_actual
        cursor.execute("""
            SELECT EXISTS(
                SELECT 1 FROM pg_proc 
                WHERE proname = 'get_total_sesion_actual'
            )
        """)
        
        existe_funcion_total = cursor.fetchone()[0]
        logger.info(f"📊 Función get_total_sesion_actual existe: {existe_funcion_total}")
        
        # Verificar índices
        cursor.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename IN ('ventas', 'prefacturas')
            AND indexname LIKE '%fecha%'
        """)
        
        indices_fecha = cursor.fetchall()
        logger.info(f"📊 Índices de fecha encontrados: {len(indices_fecha)}")
        for indice in indices_fecha:
            logger.info(f"  - {indice[0]}")
        
        cursor.close()
        
    except Exception as e:
        logger.error(f"❌ Error verificando funciones SQL: {e}")
        raise

def verificar_estructura_tablas(conn):
    """Verificar la estructura de las tablas críticas"""
    try:
        cursor = conn.cursor()
        
        logger.info("\n🔍 VERIFICANDO ESTRUCTURA DE TABLAS")
        logger.info("=" * 50)
        
        # Verificar estructura de prefacturas
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'prefacturas'
            ORDER BY ordinal_position
        """)
        
        columnas_prefacturas = cursor.fetchall()
        logger.info("📊 Estructura de tabla prefacturas:")
        for columna in columnas_prefacturas:
            logger.info(f"  - {columna[0]}: {columna[1]} (nullable: {columna[2]})")
        
        # Verificar estructura de ventas
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'ventas'
            ORDER BY ordinal_position
        """)
        
        columnas_ventas = cursor.fetchall()
        logger.info("📊 Estructura de tabla ventas:")
        for columna in columnas_ventas:
            logger.info(f"  - {columna[0]}: {columna[1]} (nullable: {columna[2]})")
        
        cursor.close()
        
    except Exception as e:
        logger.error(f"❌ Error verificando estructura de tablas: {e}")
        raise

def main():
    """Función principal"""
    load_dotenv()
    logger.info("🚀 Iniciando diagnóstico de prefacturas en producción (CON CREDENCIALES REALES)")
    logger.info(f"📅 Fecha y hora: {datetime.now()}")
    
    conn = None
    try:
        # Conectar a la base de datos
        conn = get_database_connection()
        
        # Verificar estructura de tablas
        verificar_estructura_tablas(conn)
        
        # Ejecutar diagnóstico
        diagnosticar_prefacturas(conn)
        
        # Verificar funciones SQL
        verificar_funciones_sql(conn)
        
        logger.info("\n✅ Diagnóstico completado")
        logger.info("📋 Revisar el archivo de log para detalles completos")
        
    except Exception as e:
        logger.error(f"❌ Error durante diagnóstico: {e}")
        return False
        
    finally:
        if conn:
            conn.close()
            logger.info("🔌 Conexión a base de datos cerrada")

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
