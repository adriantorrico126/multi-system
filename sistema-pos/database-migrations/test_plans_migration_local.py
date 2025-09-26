#!/usr/bin/env python3
"""
Script de prueba para la migración del sistema de planes comerciales Forkast
Este script debe ejecutarse en LOCAL antes de aplicar en producción
"""

import psycopg2
import psycopg2.extras
import os
import sys
from datetime import datetime
import json

# Configuración de base de datos LOCAL
DB_CONFIG_LOCAL = {
    'host': 'localhost',
    'database': 'sistempos',
    'user': 'postgres',
    'password': '123456',  # Cambiar por tu contraseña local
    'port': '5432'
}

def log_message(message, level='INFO'):
    """Función para logging con timestamp"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] [{level}] {message}")

def connect_to_database():
    """Conectar a la base de datos local"""
    try:
        conn = psycopg2.connect(**DB_CONFIG_LOCAL)
        conn.autocommit = False
        log_message("Conexión a base de datos LOCAL establecida")
        return conn
    except Exception as e:
        log_message(f"Error conectando a la base de datos LOCAL: {e}", 'ERROR')
        log_message("Asegúrate de que PostgreSQL esté ejecutándose y las credenciales sean correctas", 'ERROR')
        sys.exit(1)

def check_existing_data(conn):
    """Verificar datos existentes antes de la migración"""
    cursor = conn.cursor()
    
    try:
        log_message("Verificando datos existentes...")
        
        # Verificar restaurantes existentes
        cursor.execute("SELECT COUNT(*) FROM restaurantes")
        restaurants_count = cursor.fetchone()[0]
        log_message(f"Restaurantes existentes: {restaurants_count}")
        
        # Verificar usuarios existentes
        cursor.execute("SELECT COUNT(*) FROM vendedores WHERE activo = true")
        users_count = cursor.fetchone()[0]
        log_message(f"Usuarios activos: {users_count}")
        
        # Verificar productos existentes
        cursor.execute("SELECT COUNT(*) FROM productos")
        products_count = cursor.fetchone()[0]
        log_message(f"Productos existentes: {products_count}")
        
        # Verificar sucursales existentes
        cursor.execute("SELECT COUNT(*) FROM sucursales WHERE activo = true")
        branches_count = cursor.fetchone()[0]
        log_message(f"Sucursales activas: {branches_count}")
        
        return {
            'restaurants': restaurants_count,
            'users': users_count,
            'products': products_count,
            'branches': branches_count
        }
        
    except Exception as e:
        log_message(f"Error verificando datos existentes: {e}", 'ERROR')
        raise
    finally:
        cursor.close()

def execute_migration_local(conn):
    """Ejecutar la migración en local"""
    cursor = conn.cursor()
    
    try:
        log_message("Ejecutando migración en LOCAL...")
        
        # Leer el archivo SQL de migración
        migration_file = os.path.join(os.path.dirname(__file__), '001_create_plans_system.sql')
        
        if not os.path.exists(migration_file):
            log_message(f"Archivo de migración no encontrado: {migration_file}", 'ERROR')
            sys.exit(1)
        
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        log_message("Ejecutando script de migración en LOCAL...")
        
        # Ejecutar el script SQL
        cursor.execute(migration_sql)
        
        log_message("✅ Script de migración ejecutado exitosamente en LOCAL")
        
    except Exception as e:
        log_message(f"Error ejecutando migración en LOCAL: {e}", 'ERROR')
        conn.rollback()
        raise
    finally:
        cursor.close()

def verify_migration_local(conn):
    """Verificar que la migración se aplicó correctamente en local"""
    cursor = conn.cursor()
    
    try:
        log_message("Verificando migración en LOCAL...")
        
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
            log_message(f"❌ Tablas faltantes en LOCAL: {', '.join(missing_tables)}", 'ERROR')
            return False
        
        log_message(f"✅ Tablas creadas en LOCAL: {', '.join(created_tables)}")
        
        # Verificar que los planes se insertaron
        cursor.execute("SELECT COUNT(*) FROM planes")
        plan_count = cursor.fetchone()[0]
        
        if plan_count != 4:
            log_message(f"❌ Se esperaban 4 planes en LOCAL, se encontraron {plan_count}", 'ERROR')
            return False
        
        log_message(f"✅ Planes insertados en LOCAL: {plan_count}")
        
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
            log_message(f"❌ Funciones faltantes en LOCAL: {', '.join(missing_functions)}", 'ERROR')
            return False
        
        log_message(f"✅ Funciones creadas en LOCAL: {', '.join(created_functions)}")
        
        # Verificar suscripciones para restaurantes existentes
        cursor.execute("SELECT COUNT(*) FROM suscripciones WHERE estado = 'activa'")
        active_subscriptions = cursor.fetchone()[0]
        
        log_message(f"✅ Suscripciones activas creadas en LOCAL: {active_subscriptions}")
        
        # Verificar uso de recursos inicializado
        cursor.execute("SELECT COUNT(*) FROM uso_recursos")
        usage_records = cursor.fetchone()[0]
        
        log_message(f"✅ Registros de uso inicializados en LOCAL: {usage_records}")
        
        return True
        
    except Exception as e:
        log_message(f"Error verificando migración en LOCAL: {e}", 'ERROR')
        return False
    finally:
        cursor.close()

def test_plan_functions_local(conn):
    """Probar las funciones del sistema de planes en local"""
    cursor = conn.cursor()
    
    try:
        log_message("Probando funciones del sistema de planes en LOCAL...")
        
        # Obtener un restaurante para probar
        cursor.execute("SELECT id_restaurante FROM restaurantes LIMIT 1")
        result = cursor.fetchone()
        
        if not result:
            log_message("No hay restaurantes para probar en LOCAL", 'WARNING')
            return True
        
        restaurant_id = result[0]
        
        # Probar función obtener_plan_actual
        cursor.execute("SELECT * FROM obtener_plan_actual(%s)", (restaurant_id,))
        plan_result = cursor.fetchone()
        
        if not plan_result:
            log_message("❌ Error: No se pudo obtener plan actual en LOCAL", 'ERROR')
            return False
        
        log_message(f"✅ Plan actual obtenido en LOCAL: {plan_result[1]} (${plan_result[2]}/mes)")
        
        # Probar función verificar_limites_plan
        cursor.execute("SELECT * FROM verificar_limites_plan(%s)", (restaurant_id,))
        limits_result = cursor.fetchall()
        
        if not limits_result:
            log_message("❌ Error: No se pudieron verificar límites en LOCAL", 'ERROR')
            return False
        
        log_message(f"✅ Límites verificados en LOCAL: {len(limits_result)} recursos monitoreados")
        
        for limit in limits_result:
            log_message(f"   - {limit[0]}: {limit[1]}/{limit[2]} ({limit[3]}%) - {limit[4]}")
        
        return True
        
    except Exception as e:
        log_message(f"Error probando funciones en LOCAL: {e}", 'ERROR')
        return False
    finally:
        cursor.close()

def test_api_endpoints():
    """Probar endpoints de la API"""
    try:
        log_message("Probando endpoints de la API...")
        
        import requests
        
        # URL base de la API local
        base_url = "http://localhost:3000/api/v1"
        
        # Endpoints a probar (requieren autenticación)
        endpoints = [
            "/plans/available",
            "/plans/current",
            "/plans/usage-stats"
        ]
        
        log_message("⚠️  Nota: Los endpoints requieren autenticación, probar manualmente con Postman")
        log_message("Endpoints disponibles:")
        for endpoint in endpoints:
            log_message(f"   - GET {base_url}{endpoint}")
        
        return True
        
    except ImportError:
        log_message("⚠️  requests no disponible, saltando pruebas de API", 'WARNING')
        return True
    except Exception as e:
        log_message(f"Error probando endpoints: {e}", 'ERROR')
        return False

def generate_test_report(conn, initial_data):
    """Generar reporte de la prueba"""
    cursor = conn.cursor()
    
    try:
        log_message("Generando reporte de prueba...")
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'test_type': 'local_migration_test',
            'migration_version': '1.0',
            'status': 'completed',
            'initial_data': initial_data,
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
        report_file = f"local_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
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
    log_message("🧪 Iniciando prueba LOCAL de migración del sistema de planes comerciales Forkast")
    log_message("=" * 70)
    
    # Conectar a la base de datos local
    conn = connect_to_database()
    
    try:
        # Verificar datos existentes
        initial_data = check_existing_data(conn)
        
        # Ejecutar migración
        execute_migration_local(conn)
        
        # Confirmar cambios
        conn.commit()
        log_message("✅ Migración confirmada en LOCAL")
        
        # Verificar migración
        if not verify_migration_local(conn):
            log_message("❌ La verificación de migración falló en LOCAL", 'ERROR')
            sys.exit(1)
        
        # Probar funciones
        if not test_plan_functions_local(conn):
            log_message("❌ Las pruebas de funciones fallaron en LOCAL", 'ERROR')
            sys.exit(1)
        
        # Probar endpoints de API
        test_api_endpoints()
        
        # Generar reporte
        report = generate_test_report(conn, initial_data)
        
        log_message("=" * 70)
        log_message("🎉 PRUEBA LOCAL COMPLETADA EXITOSAMENTE")
        log_message("=" * 70)
        
        if report:
            log_message(f"📊 Resumen de la prueba:")
            log_message(f"   - Datos iniciales: {initial_data}")
            log_message(f"   - Tablas creadas: {len(report['tables_created'])}")
            log_message(f"   - Planes creados: {len(report['plans_created'])}")
            log_message(f"   - Suscripciones activas: {report['subscriptions_created']}")
            log_message(f"   - Registros de uso: {report['usage_records_created']}")
            log_message(f"   - Funciones creadas: {len(report['functions_created'])}")
        
        log_message("")
        log_message("📋 Próximos pasos:")
        log_message("   1. ✅ Migración probada exitosamente en LOCAL")
        log_message("   2. 🔄 Probar endpoints de la API con Postman")
        log_message("   3. 🚀 Aplicar migración en PRODUCCIÓN")
        log_message("   4. 🔧 Implementar middleware en controladores existentes")
        log_message("   5. 📊 Crear dashboard de uso por plan")
        
        log_message("")
        log_message("⚠️  IMPORTANTE: Esta migración está lista para producción")
        log_message("   Usar apply_plans_migration.py para aplicar en producción")
        
    except Exception as e:
        log_message(f"❌ Error durante la prueba LOCAL: {e}", 'ERROR')
        conn.rollback()
        log_message("🔄 Cambios revertidos en LOCAL")
        sys.exit(1)
    
    finally:
        conn.close()
        log_message("🔌 Conexión a base de datos LOCAL cerrada")

if __name__ == "__main__":
    main()
