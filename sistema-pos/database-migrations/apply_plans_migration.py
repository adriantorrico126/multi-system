#!/usr/bin/env python3
"""
Script para aplicar la migración del sistema de planes comerciales Forkast
Fecha: 2024-01-XX
Versión: 1.0

IMPORTANTE: Este script debe ejecutarse con cuidado en producción
"""

import psycopg2
import psycopg2.extras
import os
import sys
from datetime import datetime
import json

# Configuración de base de datos
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'sistempos'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
    'port': os.getenv('DB_PORT', '5432')
}

def log_message(message, level='INFO'):
    """Función para logging con timestamp"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] [{level}] {message}")

def connect_to_database():
    """Conectar a la base de datos"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        log_message("Conexión a base de datos establecida")
        return conn
    except Exception as e:
        log_message(f"Error conectando a la base de datos: {e}", 'ERROR')
        sys.exit(1)

def check_database_backup():
    """Verificar que existe un backup reciente"""
    log_message("Verificando backup de base de datos...")
    
    # En producción, verificar que existe un backup reciente
    backup_required = os.getenv('REQUIRE_BACKUP', 'false').lower() == 'true'
    
    if backup_required:
        log_message("⚠️  ATENCIÓN: Se requiere backup antes de continuar", 'WARNING')
        response = input("¿Has hecho backup de la base de datos? (yes/no): ")
        if response.lower() != 'yes':
            log_message("Operación cancelada por falta de backup", 'ERROR')
            sys.exit(1)
    
    log_message("✅ Verificación de backup completada")

def check_existing_tables(conn):
    """Verificar si las tablas del sistema de planes ya existen"""
    cursor = conn.cursor()
    
    try:
        # Verificar tablas existentes
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('planes', 'suscripciones', 'uso_recursos', 'auditoria_planes', 'alertas_limites')
            ORDER BY table_name
        """)
        
        existing_tables = [row[0] for row in cursor.fetchall()]
        
        if existing_tables:
            log_message(f"⚠️  Las siguientes tablas ya existen: {', '.join(existing_tables)}", 'WARNING')
            response = input("¿Deseas continuar? Esto puede causar conflictos (yes/no): ")
            if response.lower() != 'yes':
                log_message("Operación cancelada por el usuario", 'INFO')
                sys.exit(0)
        
        log_message("✅ Verificación de tablas existentes completada")
        
    except Exception as e:
        log_message(f"Error verificando tablas existentes: {e}", 'ERROR')
        raise
    finally:
        cursor.close()

def execute_migration(conn):
    """Ejecutar la migración del sistema de planes"""
    cursor = conn.cursor()
    
    try:
        log_message("Iniciando migración del sistema de planes...")
        
        # Leer el archivo SQL de migración
        migration_file = os.path.join(os.path.dirname(__file__), '001_create_plans_system.sql')
        
        if not os.path.exists(migration_file):
            log_message(f"Archivo de migración no encontrado: {migration_file}", 'ERROR')
            sys.exit(1)
        
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        log_message("Ejecutando script de migración...")
        
        # Ejecutar el script SQL
        cursor.execute(migration_sql)
        
        log_message("✅ Script de migración ejecutado exitosamente")
        
    except Exception as e:
        log_message(f"Error ejecutando migración: {e}", 'ERROR')
        conn.rollback()
        raise
    finally:
        cursor.close()

def verify_migration(conn):
    """Verificar que la migración se aplicó correctamente"""
    cursor = conn.cursor()
    
    try:
        log_message("Verificando migración...")
        
        # Verificar que las tablas se crearon
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('planes', 'suscripciones', 'uso_recursos', 'auditoria_planes', 'alertas_limites')
            ORDER BY table_name
        """)
        
        created_tables = [row[0] for row in cursor.fetchall()]
        expected_tables = ['planes', 'suscripciones', 'uso_recursos', 'auditoria_planes', 'alertas_limites']
        
        missing_tables = set(expected_tables) - set(created_tables)
        if missing_tables:
            log_message(f"❌ Tablas faltantes: {', '.join(missing_tables)}", 'ERROR')
            return False
        
        log_message(f"✅ Tablas creadas: {', '.join(created_tables)}")
        
        # Verificar que los planes se insertaron
        cursor.execute("SELECT COUNT(*) FROM planes")
        plan_count = cursor.fetchone()[0]
        
        if plan_count != 4:
            log_message(f"❌ Se esperaban 4 planes, se encontraron {plan_count}", 'ERROR')
            return False
        
        log_message(f"✅ Planes insertados: {plan_count}")
        
        # Verificar que las funciones se crearon
        cursor.execute("""
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name IN ('obtener_plan_actual', 'verificar_limites_plan')
            ORDER BY routine_name
        """)
        
        created_functions = [row[0] for row in cursor.fetchall()]
        expected_functions = ['obtener_plan_actual', 'verificar_limites_plan']
        
        missing_functions = set(expected_functions) - set(created_functions)
        if missing_functions:
            log_message(f"❌ Funciones faltantes: {', '.join(missing_functions)}", 'ERROR')
            return False
        
        log_message(f"✅ Funciones creadas: {', '.join(created_functions)}")
        
        # Verificar suscripciones para restaurantes existentes
        cursor.execute("SELECT COUNT(*) FROM suscripciones WHERE estado = 'activa'")
        active_subscriptions = cursor.fetchone()[0]
        
        log_message(f"✅ Suscripciones activas creadas: {active_subscriptions}")
        
        # Verificar uso de recursos inicializado
        cursor.execute("SELECT COUNT(*) FROM uso_recursos")
        usage_records = cursor.fetchone()[0]
        
        log_message(f"✅ Registros de uso inicializados: {usage_records}")
        
        return True
        
    except Exception as e:
        log_message(f"Error verificando migración: {e}", 'ERROR')
        return False
    finally:
        cursor.close()

def test_plan_functions(conn):
    """Probar las funciones del sistema de planes"""
    cursor = conn.cursor()
    
    try:
        log_message("Probando funciones del sistema de planes...")
        
        # Obtener un restaurante para probar
        cursor.execute("SELECT id_restaurante FROM restaurantes LIMIT 1")
        result = cursor.fetchone()
        
        if not result:
            log_message("No hay restaurantes para probar", 'WARNING')
            return True
        
        restaurant_id = result[0]
        
        # Probar función obtener_plan_actual
        cursor.execute("SELECT * FROM obtener_plan_actual(%s)", (restaurant_id,))
        plan_result = cursor.fetchone()
        
        if not plan_result:
            log_message("❌ Error: No se pudo obtener plan actual", 'ERROR')
            return False
        
        log_message(f"✅ Plan actual obtenido: {plan_result[1]} (${plan_result[2]}/mes)")
        
        # Probar función verificar_limites_plan
        cursor.execute("SELECT * FROM verificar_limites_plan(%s)", (restaurant_id,))
        limits_result = cursor.fetchall()
        
        if not limits_result:
            log_message("❌ Error: No se pudieron verificar límites", 'ERROR')
            return False
        
        log_message(f"✅ Límites verificados: {len(limits_result)} recursos monitoreados")
        
        for limit in limits_result:
            log_message(f"   - {limit[0]}: {limit[1]}/{limit[2]} ({limit[3]}%) - {limit[4]}")
        
        return True
        
    except Exception as e:
        log_message(f"Error probando funciones: {e}", 'ERROR')
        return False
    finally:
        cursor.close()

def generate_migration_report(conn):
    """Generar reporte de la migración"""
    cursor = conn.cursor()
    
    try:
        log_message("Generando reporte de migración...")
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'migration_version': '1.0',
            'status': 'completed',
            'tables_created': [],
            'plans_created': [],
            'subscriptions_created': 0,
            'usage_records_created': 0,
            'functions_created': []
        }
        
        # Obtener información de tablas creadas
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('planes', 'suscripciones', 'uso_recursos', 'auditoria_planes', 'alertas_limites')
            ORDER BY table_name
        """)
        report['tables_created'] = [row[0] for row in cursor.fetchall()]
        
        # Obtener información de planes creados
        cursor.execute("SELECT nombre, precio_mensual FROM planes ORDER BY orden_display")
        report['plans_created'] = [{'nombre': row[0], 'precio': float(row[1])} for row in cursor.fetchall()]
        
        # Obtener información de suscripciones
        cursor.execute("SELECT COUNT(*) FROM suscripciones WHERE estado = 'activa'")
        report['subscriptions_created'] = cursor.fetchone()[0]
        
        # Obtener información de registros de uso
        cursor.execute("SELECT COUNT(*) FROM uso_recursos")
        report['usage_records_created'] = cursor.fetchone()[0]
        
        # Obtener información de funciones creadas
        cursor.execute("""
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name IN ('obtener_plan_actual', 'verificar_limites_plan')
            ORDER BY routine_name
        """)
        report['functions_created'] = [row[0] for row in cursor.fetchall()]
        
        # Guardar reporte
        report_file = f"migration_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        log_message(f"✅ Reporte guardado en: {report_file}")
        
        return report
        
    except Exception as e:
        log_message(f"Error generando reporte: {e}", 'ERROR')
        return None
    finally:
        cursor.close()

def main():
    """Función principal"""
    log_message("🚀 Iniciando migración del sistema de planes comerciales Forkast")
    log_message("=" * 60)
    
    # Verificar backup
    check_database_backup()
    
    # Conectar a la base de datos
    conn = connect_to_database()
    
    try:
        # Verificar tablas existentes
        check_existing_tables(conn)
        
        # Ejecutar migración
        execute_migration(conn)
        
        # Confirmar cambios
        conn.commit()
        log_message("✅ Migración confirmada en la base de datos")
        
        # Verificar migración
        if not verify_migration(conn):
            log_message("❌ La verificación de migración falló", 'ERROR')
            sys.exit(1)
        
        # Probar funciones
        if not test_plan_functions(conn):
            log_message("❌ Las pruebas de funciones fallaron", 'ERROR')
            sys.exit(1)
        
        # Generar reporte
        report = generate_migration_report(conn)
        
        log_message("=" * 60)
        log_message("🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE")
        log_message("=" * 60)
        
        if report:
            log_message(f"📊 Resumen:")
            log_message(f"   - Tablas creadas: {len(report['tables_created'])}")
            log_message(f"   - Planes creados: {len(report['plans_created'])}")
            log_message(f"   - Suscripciones activas: {report['subscriptions_created']}")
            log_message(f"   - Registros de uso: {report['usage_records_created']}")
            log_message(f"   - Funciones creadas: {len(report['functions_created'])}")
        
        log_message("")
        log_message("📋 Próximos pasos:")
        log_message("   1. Implementar middleware de control de planes en el backend")
        log_message("   2. Crear sistema de permisos granulares")
        log_message("   3. Implementar contadores de uso en tiempo real")
        log_message("   4. Crear dashboard de uso por plan")
        log_message("   5. Probar el sistema completo en entorno de desarrollo")
        
    except Exception as e:
        log_message(f"❌ Error durante la migración: {e}", 'ERROR')
        conn.rollback()
        log_message("🔄 Cambios revertidos")
        sys.exit(1)
    
    finally:
        conn.close()
        log_message("🔌 Conexión a base de datos cerrada")

if __name__ == "__main__":
    main()
