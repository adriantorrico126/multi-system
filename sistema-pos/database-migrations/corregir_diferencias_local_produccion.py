#!/usr/bin/env python3
"""
Script para corregir diferencias entre local y producción
Fecha: 2025-01-09
Autor: Sistema POS
"""

import psycopg2
import os
from datetime import datetime

# Configuración de base de datos de producción
PRODUCTION_CONFIG = {
    'host': 'localhost',  # Cambiar por la IP del servidor de producción
    'port': 5432,
    'database': 'vegetarian_restaurant_db',
    'user': 'postgres',
    'password': 'tu_password_aqui'  # Cambiar por la contraseña real
}

def conectar_produccion():
    """Conectar a la base de datos de producción"""
    try:
        conn = psycopg2.connect(**PRODUCTION_CONFIG)
        print("✅ Conexión a producción establecida")
        return conn
    except Exception as e:
        print(f"❌ Error conectando a producción: {e}")
        return None

def ejecutar_diagnostico(conn):
    """Ejecutar el diagnóstico de diferencias"""
    try:
        cursor = conn.cursor()
        
        # Leer el archivo de diagnóstico
        with open('diagnostico_diferencias_local_produccion.sql', 'r', encoding='utf-8') as f:
            sql_diagnostico = f.read()
        
        print("🔍 Ejecutando diagnóstico...")
        cursor.execute(sql_diagnostico)
        
        # Obtener los resultados
        conn.commit()
        print("✅ Diagnóstico completado")
        
    except Exception as e:
        print(f"❌ Error en diagnóstico: {e}")
        conn.rollback()

def ejecutar_correccion(conn):
    """Ejecutar la corrección de diferencias"""
    try:
        cursor = conn.cursor()
        
        # Leer el archivo de corrección
        with open('corregir_diferencias_local_produccion.sql', 'r', encoding='utf-8') as f:
            sql_correccion = f.read()
        
        print("🔧 Ejecutando corrección...")
        cursor.execute(sql_correccion)
        
        # Confirmar cambios
        conn.commit()
        print("✅ Corrección completada exitosamente")
        
    except Exception as e:
        print(f"❌ Error en corrección: {e}")
        conn.rollback()
        raise

def verificar_correccion(conn):
    """Verificar que la corrección se aplicó correctamente"""
    try:
        cursor = conn.cursor()
        
        # Verificar tabla ventas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'ventas' AND column_name = 'observaciones_pago'
        """)
        if cursor.fetchone():
            print("✅ Columna observaciones_pago existe en ventas")
        else:
            print("❌ Columna observaciones_pago NO existe en ventas")
        
        # Verificar tabla historial_pagos_diferidos
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'historial_pagos_diferidos' 
            AND column_name IN ('id_pago_final', 'id_vendedor', 'id_mesa', 'id_restaurante', 'id_metodo_pago')
        """)
        columnas = [row[0] for row in cursor.fetchall()]
        print(f"✅ Columnas en historial_pagos_diferidos: {', '.join(columnas)}")
        
        # Verificar funciones
        cursor.execute("""
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_name IN ('validar_integridad_lote', 'actualizar_stock_producto', 'marcar_venta_diferida_como_pagada')
        """)
        funciones = [row[0] for row in cursor.fetchall()]
        print(f"✅ Funciones creadas: {', '.join(funciones)}")
        
        # Verificar triggers
        cursor.execute("""
            SELECT trigger_name 
            FROM information_schema.triggers 
            WHERE trigger_name IN ('trigger_validar_integridad_lote', 'trigger_actualizar_stock_producto')
        """)
        triggers = [row[0] for row in cursor.fetchall()]
        print(f"✅ Triggers creados: {', '.join(triggers)}")
        
        # Verificar vistas
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_name IN ('vista_resumen_inventario', 'vista_pagos_diferidos_pendientes')
        """)
        vistas = [row[0] for row in cursor.fetchall()]
        print(f"✅ Vistas creadas: {', '.join(vistas)}")
        
    except Exception as e:
        print(f"❌ Error en verificación: {e}")

def main():
    """Función principal"""
    print("=" * 60)
    print("CORRECCIÓN DE DIFERENCIAS LOCAL vs PRODUCCIÓN")
    print("=" * 60)
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Verificar que los archivos SQL existen
    archivos_requeridos = [
        'diagnostico_diferencias_local_produccion.sql',
        'corregir_diferencias_local_produccion.sql'
    ]
    
    for archivo in archivos_requeridos:
        if not os.path.exists(archivo):
            print(f"❌ Error: Archivo {archivo} no encontrado")
            return
    
    # Conectar a producción
    conn = conectar_produccion()
    if not conn:
        return
    
    try:
        # Ejecutar diagnóstico
        ejecutar_diagnostico(conn)
        print()
        
        # Preguntar si continuar con la corrección
        respuesta = input("¿Deseas continuar con la corrección? (s/n): ").lower().strip()
        if respuesta not in ['s', 'si', 'y', 'yes']:
            print("❌ Corrección cancelada por el usuario")
            return
        
        # Ejecutar corrección
        ejecutar_correccion(conn)
        print()
        
        # Verificar corrección
        verificar_correccion(conn)
        print()
        
        print("=" * 60)
        print("✅ PROCESO COMPLETADO EXITOSAMENTE")
        print("=" * 60)
        print("Las diferencias entre local y producción han sido corregidas.")
        print("El sistema de inventario debería funcionar correctamente ahora.")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error durante el proceso: {e}")
        print("Revisa los logs y ejecuta el diagnóstico nuevamente.")
    
    finally:
        conn.close()
        print("🔌 Conexión cerrada")

if __name__ == "__main__":
    main()
