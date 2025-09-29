#!/usr/bin/env python3
"""
Script para verificar y comparar métodos de pago entre producción y local
"""

import psycopg2
import psycopg2.extras
import logging
import sys
import os
from datetime import datetime
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('check_metodos_pago.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuración de bases de datos
PRODUCTION_CONFIG = {
    'host': os.getenv('PROD_DB_HOST', 'db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com'),
    'port': int(os.getenv('PROD_DB_PORT', 25060)),
    'user': os.getenv('PROD_DB_USER', 'doadmin'),
    'password': os.getenv('PROD_DB_PASSWORD', 'placeholder_password'),
    'database': os.getenv('PROD_DB_NAME', 'defaultdb')
}

LOCAL_CONFIG = {
    'host': os.getenv('LOCAL_DB_HOST', 'localhost'),
    'port': int(os.getenv('LOCAL_DB_PORT', 5432)),
    'user': os.getenv('LOCAL_DB_USER', 'postgres'),
    'password': os.getenv('LOCAL_DB_PASSWORD', 'password'),
    'database': os.getenv('LOCAL_DB_NAME', 'sistempos')
}

class MetodosPagoChecker:
    def __init__(self):
        self.prod_conn = None
        self.local_conn = None
        self.prod_cursor = None
        self.local_cursor = None
        
    def connect_databases(self):
        """Conectar a ambas bases de datos"""
        try:
            logger.info("Conectando a base de datos de producción...")
            self.prod_conn = psycopg2.connect(**PRODUCTION_CONFIG)
            self.prod_cursor = self.prod_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            logger.info("Conectado a producción")
            
            logger.info("Conectando a base de datos local...")
            self.local_conn = psycopg2.connect(**LOCAL_CONFIG)
            self.local_cursor = self.local_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            logger.info("Conectado a local")
            
        except Exception as e:
            logger.error(f"Error conectando a las bases de datos: {e}")
            raise
    
    def close_connections(self):
        """Cerrar conexiones"""
        if self.prod_cursor:
            self.prod_cursor.close()
        if self.local_cursor:
            self.local_cursor.close()
        if self.prod_conn:
            self.prod_conn.close()
        if self.local_conn:
            self.local_conn.close()
        logger.info("Conexiones cerradas")
    
    def check_table_structure(self):
        """Verificar estructura de la tabla metodos_pago en ambas bases"""
        logger.info("=" * 60)
        logger.info("VERIFICANDO ESTRUCTURA DE TABLA metodos_pago")
        logger.info("=" * 60)
        
        try:
            # Verificar estructura en producción
            logger.info("Estructura en PRODUCCIÓN:")
            self.prod_cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'metodos_pago' 
                ORDER BY ordinal_position
            """)
            prod_columns = self.prod_cursor.fetchall()
            
            if prod_columns:
                for col in prod_columns:
                    logger.info(f"  - {col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']})")
            else:
                logger.warning("Tabla 'metodos_pago' NO EXISTE en producción")
            
            # Verificar estructura en local
            logger.info("\nEstructura en LOCAL:")
            self.local_cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'metodos_pago' 
                ORDER BY ordinal_position
            """)
            local_columns = self.local_cursor.fetchall()
            
            if local_columns:
                for col in local_columns:
                    logger.info(f"  - {col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']})")
            else:
                logger.warning("Tabla 'metodos_pago' NO EXISTE en local")
                
        except Exception as e:
            logger.error(f"Error verificando estructura: {e}")
    
    def check_metodos_pago_data(self):
        """Verificar datos de métodos de pago en ambas bases"""
        logger.info("\n" + "=" * 60)
        logger.info("VERIFICANDO DATOS DE MÉTODOS DE PAGO")
        logger.info("=" * 60)
        
        try:
            # Métodos de pago en producción
            logger.info("Métodos de pago en PRODUCCIÓN:")
            self.prod_cursor.execute("SELECT * FROM metodos_pago ORDER BY id_pago")
            prod_metodos = self.prod_cursor.fetchall()
            
            if prod_metodos:
                logger.info(f"Total: {len(prod_metodos)} métodos de pago")
                for metodo in prod_metodos:
                    logger.info(f"  ID: {metodo['id_pago']} - {metodo['descripcion']} (activo: {metodo['activo']})")
            else:
                logger.warning("No hay métodos de pago en producción")
            
            # Métodos de pago en local
            logger.info("\nMétodos de pago en LOCAL:")
            self.local_cursor.execute("SELECT * FROM metodos_pago ORDER BY id_pago")
            local_metodos = self.local_cursor.fetchall()
            
            if local_metodos:
                logger.info(f"Total: {len(local_metodos)} métodos de pago")
                for metodo in local_metodos:
                    logger.info(f"  ID: {metodo['id_pago']} - {metodo['descripcion']} (activo: {metodo['activo']})")
            else:
                logger.warning("No hay métodos de pago en local")
                
        except Exception as e:
            logger.error(f"Error verificando datos: {e}")
    
    def compare_metodos_pago(self):
        """Comparar métodos de pago entre ambas bases"""
        logger.info("\n" + "=" * 60)
        logger.info("COMPARANDO MÉTODOS DE PAGO")
        logger.info("=" * 60)
        
        try:
            # Obtener métodos de producción
            self.prod_cursor.execute("SELECT * FROM metodos_pago ORDER BY id_pago")
            prod_metodos = {row['descripcion']: row for row in self.prod_cursor.fetchall()}
            
            # Obtener métodos de local
            self.local_cursor.execute("SELECT * FROM metodos_pago ORDER BY id_pago")
            local_metodos = {row['descripcion']: row for row in self.local_cursor.fetchall()}
            
            # Métodos solo en producción
            solo_prod = set(prod_metodos.keys()) - set(local_metodos.keys())
            if solo_prod:
                logger.info("Métodos solo en PRODUCCIÓN:")
                for metodo in solo_prod:
                    logger.info(f"  - {metodo}")
            
            # Métodos solo en local
            solo_local = set(local_metodos.keys()) - set(prod_metodos.keys())
            if solo_local:
                logger.info("Métodos solo en LOCAL:")
                for metodo in solo_local:
                    logger.info(f"  - {metodo}")
            
            # Métodos en ambas (comparar diferencias)
            comunes = set(prod_metodos.keys()) & set(local_metodos.keys())
            if comunes:
                logger.info("Métodos en ambas bases (verificando diferencias):")
                for metodo in comunes:
                    prod = prod_metodos[metodo]
                    local = local_metodos[metodo]
                    diferencias = []
                    
                    if prod['activo'] != local['activo']:
                        diferencias.append(f"activo: prod={prod['activo']}, local={local['activo']}")
                    if prod.get('id_pago') != local.get('id_pago'):
                        diferencias.append(f"id_pago: prod={prod.get('id_pago')}, local={local.get('id_pago')}")
                    
                    if diferencias:
                        logger.info(f"  - {metodo}: {', '.join(diferencias)}")
                    else:
                        logger.info(f"  - {metodo}: IDENTICOS")
                        
        except Exception as e:
            logger.error(f"Error comparando métodos: {e}")
    
    def check_restaurant_metodos_pago(self):
        """Verificar si hay métodos de pago específicos del restaurante"""
        logger.info("\n" + "=" * 60)
        logger.info("VERIFICANDO MÉTODOS DE PAGO DEL RESTAURANTE")
        logger.info("=" * 60)
        
        try:
            # Verificar si existe tabla de relación restaurante-metodos_pago
            self.prod_cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name LIKE '%metodo%' OR table_name LIKE '%pago%'
            """)
            prod_tables = [row['table_name'] for row in self.prod_cursor.fetchall()]
            logger.info(f"Tablas relacionadas con métodos de pago en PRODUCCIÓN: {prod_tables}")
            
            self.local_cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name LIKE '%metodo%' OR table_name LIKE '%pago%'
            """)
            local_tables = [row['table_name'] for row in self.local_cursor.fetchall()]
            logger.info(f"Tablas relacionadas con métodos de pago en LOCAL: {local_tables}")
            
        except Exception as e:
            logger.error(f"Error verificando tablas relacionadas: {e}")
    
    def run_check(self):
        """Ejecutar verificación completa"""
        try:
            logger.info("Iniciando verificación de métodos de pago...")
            
            # Conectar a las bases de datos
            self.connect_databases()
            
            # Verificar estructura de tabla
            self.check_table_structure()
            
            # Verificar datos
            self.check_metodos_pago_data()
            
            # Comparar métodos
            self.compare_metodos_pago()
            
            # Verificar tablas relacionadas
            self.check_restaurant_metodos_pago()
            
            logger.info("\nVerificación completada!")
            
        except Exception as e:
            logger.error(f"Error durante la verificación: {e}")
        finally:
            self.close_connections()

def main():
    """Función principal"""
    logger.info("=" * 60)
    logger.info("VERIFICACIÓN DE MÉTODOS DE PAGO - PRODUCCIÓN vs LOCAL")
    logger.info("=" * 60)
    
    checker = MetodosPagoChecker()
    checker.run_check()

if __name__ == "__main__":
    main()
