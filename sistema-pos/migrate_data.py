#!/usr/bin/env python3
"""
Script de migración de datos de producción a local
Migra todos los datos del restaurante ID 10 (Pizzeria Il Capriccio)
"""

import psycopg2
import psycopg2.extras
import logging
from datetime import datetime
import sys
import os

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuración de bases de datos
PRODUCTION_CONFIG = {
    'host': 'db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com',
    'port': 25060,
    'user': 'doadmin',
    'password': os.getenv('PROD_DB_PASSWORD'),
    'database': 'defaultdb'
}

LOCAL_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'user': 'postgres',
    'password': os.getenv('LOCAL_DB_PASSWORD'),
    'database': 'sistempos'
}

# ID del restaurante a migrar
RESTAURANT_ID = 10

class DatabaseMigrator:
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
    
    def get_restaurant_info(self):
        """Obtener información del restaurante"""
        try:
            self.prod_cursor.execute(
                "SELECT * FROM restaurantes WHERE id_restaurante = %s", 
                (RESTAURANT_ID,)
            )
            restaurant = self.prod_cursor.fetchone()
            if restaurant:
                logger.info(f"Restaurante encontrado: {restaurant['nombre']}")
                return restaurant
            else:
                logger.error(f"Restaurante ID {RESTAURANT_ID} no encontrado en producción")
                return None
        except Exception as e:
            logger.error(f"Error obteniendo información del restaurante: {e}")
            return None
    
    def migrate_restaurant(self, restaurant_data):
        """Migrar datos del restaurante"""
        try:
            # Verificar si el restaurante ya existe en local
            self.local_cursor.execute(
                "SELECT id_restaurante FROM restaurantes WHERE id_restaurante = %s", 
                (RESTAURANT_ID,)
            )
            existing = self.local_cursor.fetchone()
            
            if existing:
                logger.info(f"Restaurante ID {RESTAURANT_ID} ya existe en local, actualizando...")
                self.local_cursor.execute("""
                    UPDATE restaurantes 
                    SET nombre = %s, direccion = %s, ciudad = %s, telefono = %s, email = %s, activo = %s
                    WHERE id_restaurante = %s
                """, (
                    restaurant_data['nombre'], restaurant_data['direccion'], 
                    restaurant_data['ciudad'], restaurant_data['telefono'], 
                    restaurant_data['email'], restaurant_data['activo'], 
                    RESTAURANT_ID
                ))
            else:
                logger.info(f"Insertando nuevo restaurante...")
                self.local_cursor.execute("""
                    INSERT INTO restaurantes (id_restaurante, nombre, direccion, ciudad, telefono, email, activo, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    RESTAURANT_ID, restaurant_data['nombre'], restaurant_data['direccion'],
                    restaurant_data['ciudad'], restaurant_data['telefono'], restaurant_data['email'],
                    restaurant_data['activo'], restaurant_data['created_at']
                ))
            
            self.local_conn.commit()
            logger.info("Restaurante migrado exitosamente")
            
        except Exception as e:
            logger.error(f"Error migrando restaurante: {e}")
            self.local_conn.rollback()
            raise
    
    def migrate_sucursales(self):
        """Migrar sucursales del restaurante"""
        try:
            logger.info("Migrando sucursales...")
            
            self.prod_cursor.execute(
                "SELECT * FROM sucursales WHERE id_restaurante = %s", 
                (RESTAURANT_ID,)
            )
            sucursales = self.prod_cursor.fetchall()
            
            for sucursal in sucursales:
                # Verificar si existe
                self.local_cursor.execute(
                    "SELECT id_sucursal FROM sucursales WHERE id_sucursal = %s", 
                    (sucursal['id_sucursal'],)
                )
                existing = self.local_cursor.fetchone()
                
                if existing:
                    logger.info(f"Sucursal {sucursal['id_sucursal']} ya existe, actualizando...")
                    self.local_cursor.execute("""
                        UPDATE sucursales 
                        SET nombre = %s, ciudad = %s, direccion = %s, activo = %s, created_at = %s
                        WHERE id_sucursal = %s
                    """, (
                        sucursal['nombre'], sucursal['ciudad'], sucursal['direccion'],
                        sucursal['activo'], sucursal['created_at'], sucursal['id_sucursal']
                    ))
                else:
                    logger.info(f"Insertando sucursal {sucursal['id_sucursal']}: {sucursal['nombre']}")
                    self.local_cursor.execute("""
                        INSERT INTO sucursales (id_sucursal, nombre, ciudad, direccion, activo, created_at, id_restaurante)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        sucursal['id_sucursal'], sucursal['nombre'], sucursal['ciudad'],
                        sucursal['direccion'], sucursal['activo'], sucursal['created_at'],
                        RESTAURANT_ID
                    ))
            
            self.local_conn.commit()
            logger.info(f"{len(sucursales)} sucursales migradas")
            
        except Exception as e:
            logger.error(f"Error migrando sucursales: {e}")
            self.local_conn.rollback()
            raise
    
    def migrate_categorias(self):
        """Migrar categorías del restaurante"""
        try:
            logger.info("Migrando categorías...")
            
            self.prod_cursor.execute(
                "SELECT * FROM categorias WHERE id_restaurante = %s", 
                (RESTAURANT_ID,)
            )
            categorias = self.prod_cursor.fetchall()
            
            for categoria in categorias:
                # Verificar si existe
                self.local_cursor.execute(
                    "SELECT id_categoria FROM categorias WHERE id_categoria = %s", 
                    (categoria['id_categoria'],)
                )
                existing = self.local_cursor.fetchone()
                
                if existing:
                    logger.info(f"Categoría {categoria['id_categoria']} ya existe, actualizando...")
                    self.local_cursor.execute("""
                        UPDATE categorias 
                        SET nombre = %s, activo = %s, created_at = %s
                        WHERE id_categoria = %s
                    """, (
                        categoria['nombre'], categoria['activo'], categoria['created_at'],
                        categoria['id_categoria']
                    ))
                else:
                    logger.info(f"Insertando categoría {categoria['id_categoria']}: {categoria['nombre']}")
                    self.local_cursor.execute("""
                        INSERT INTO categorias (id_categoria, nombre, activo, created_at, id_restaurante)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (
                        categoria['id_categoria'], categoria['nombre'], categoria['activo'],
                        categoria['created_at'], RESTAURANT_ID
                    ))
            
            self.local_conn.commit()
            logger.info(f"{len(categorias)} categorías migradas")
            
        except Exception as e:
            logger.error(f"Error migrando categorías: {e}")
            self.local_conn.rollback()
            raise
    
    def migrate_productos(self):
        """Migrar productos del restaurante"""
        try:
            logger.info("Migrando productos...")
            
            self.prod_cursor.execute("""
                SELECT p.*, c.nombre as categoria_nombre 
                FROM productos p
                LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
                WHERE p.id_restaurante = %s
            """, (RESTAURANT_ID,))
            productos = self.prod_cursor.fetchall()
            
            for producto in productos:
                # Verificar si existe
                self.local_cursor.execute(
                    "SELECT id_producto FROM productos WHERE id_producto = %s", 
                    (producto['id_producto'],)
                )
                existing = self.local_cursor.fetchone()
                
                if existing:
                    logger.info(f"Producto {producto['id_producto']} ya existe, actualizando...")
                    self.local_cursor.execute("""
                        UPDATE productos 
                        SET nombre = %s, precio = %s, id_categoria = %s, stock_actual = %s, 
                            activo = %s, imagen_url = %s, created_at = %s
                        WHERE id_producto = %s
                    """, (
                        producto['nombre'], producto['precio'], producto['id_categoria'],
                        producto['stock_actual'], producto['activo'], producto['imagen_url'],
                        producto['created_at'], producto['id_producto']
                    ))
                else:
                    logger.info(f"Insertando producto {producto['id_producto']}: {producto['nombre']} (${producto['precio']})")
                    self.local_cursor.execute("""
                        INSERT INTO productos (id_producto, nombre, precio, id_categoria, stock_actual, activo, imagen_url, created_at, id_restaurante)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        producto['id_producto'], producto['nombre'], producto['precio'],
                        producto['id_categoria'], producto['stock_actual'], producto['activo'],
                        producto['imagen_url'], producto['created_at'], RESTAURANT_ID
                    ))
            
            self.local_conn.commit()
            logger.info(f"{len(productos)} productos migrados")
            
        except Exception as e:
            logger.error(f"Error migrando productos: {e}")
            self.local_conn.rollback()
            raise
    
    def migrate_metodos_pago(self):
        """Migrar métodos de pago"""
        try:
            logger.info("Migrando metodos de pago...")
            
            self.prod_cursor.execute("SELECT * FROM metodos_pago")
            metodos = self.prod_cursor.fetchall()
            
            for metodo in metodos:
                # Verificar si existe por ID o por descripción
                self.local_cursor.execute(
                    "SELECT id_pago FROM metodos_pago WHERE id_pago = %s OR descripcion = %s", 
                    (metodo['id_pago'], metodo['descripcion'])
                )
                existing = self.local_cursor.fetchone()
                
                if not existing:
                    logger.info(f"Insertando metodo de pago: {metodo['descripcion']}")
                    # Usar valores por defecto para created_at y updated_at si no existen
                    created_at = metodo.get('created_at', datetime.now())
                    updated_at = metodo.get('updated_at', datetime.now())
                    
                    self.local_cursor.execute("""
                        INSERT INTO metodos_pago (id_pago, descripcion, activo, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (
                        metodo['id_pago'], metodo['descripcion'], metodo['activo'],
                        created_at, updated_at
                    ))
                else:
                    logger.info(f"Metodo de pago ya existe: {metodo['descripcion']}")
            
            self.local_conn.commit()
            logger.info(f"Métodos de pago migrados")
            
        except Exception as e:
            logger.error(f"Error migrando métodos de pago: {e}")
            self.local_conn.rollback()
            raise
    
    def migrate_mesas(self):
        """Migrar mesas del restaurante"""
        try:
            logger.info("Migrando mesas...")
            
            self.prod_cursor.execute("""
                SELECT m.*, s.nombre as sucursal_nombre
                FROM mesas m
                LEFT JOIN sucursales s ON m.id_sucursal = s.id_sucursal
                WHERE m.id_restaurante = %s
            """, (RESTAURANT_ID,))
            mesas = self.prod_cursor.fetchall()
            
            for mesa in mesas:
                # Verificar si existe
                self.local_cursor.execute(
                    "SELECT id_mesa FROM mesas WHERE id_mesa = %s", 
                    (mesa['id_mesa'],)
                )
                existing = self.local_cursor.fetchone()
                
                if existing:
                    logger.info(f"Mesa {mesa['id_mesa']} ya existe, actualizando...")
                    self.local_cursor.execute("""
                        UPDATE mesas 
                        SET numero = %s, id_sucursal = %s, capacidad = %s, estado = %s,
                            total_acumulado = %s, created_at = %s, updated_at = %s
                        WHERE id_mesa = %s
                    """, (
                        mesa['numero'], mesa['id_sucursal'], mesa['capacidad'], mesa['estado'],
                        mesa['total_acumulado'], mesa['created_at'], mesa['updated_at'],
                        mesa['id_mesa']
                    ))
                else:
                    logger.info(f"Insertando mesa {mesa['id_mesa']}: Mesa {mesa['numero']} ({mesa['sucursal_nombre']})")
                    self.local_cursor.execute("""
                        INSERT INTO mesas (id_mesa, numero, id_sucursal, capacidad, estado, total_acumulado, created_at, updated_at, id_restaurante)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        mesa['id_mesa'], mesa['numero'], mesa['id_sucursal'], mesa['capacidad'],
                        mesa['estado'], mesa['total_acumulado'], mesa['created_at'], mesa['updated_at'],
                        RESTAURANT_ID
                    ))
            
            self.local_conn.commit()
            logger.info(f"{len(mesas)} mesas migradas")
            
        except Exception as e:
            logger.error(f"Error migrando mesas: {e}")
            self.local_conn.rollback()
            raise
    
    def run_migration(self):
        """Ejecutar migración completa"""
        try:
            logger.info("Iniciando migración de datos...")
            logger.info(f"Migrando restaurante ID: {RESTAURANT_ID}")
            
            # Conectar a las bases de datos
            self.connect_databases()
            
            # Obtener información del restaurante
            restaurant_data = self.get_restaurant_info()
            if not restaurant_data:
                logger.error("No se pudo obtener información del restaurante")
                return False
            
            # Migrar datos en orden (respetando dependencias)
            self.migrate_restaurant(restaurant_data)
            self.migrate_sucursales()
            self.migrate_categorias()
            self.migrate_productos()
            self.migrate_metodos_pago()
            self.migrate_mesas()
            
            logger.info("Migración completada exitosamente!")
            return True
            
        except Exception as e:
            logger.error(f"Error durante la migración: {e}")
            return False
        finally:
            self.close_connections()

def main():
    """Función principal"""
    logger.info("=" * 60)
    logger.info("MIGRACIÓN DE DATOS - PRODUCCIÓN A LOCAL")
    logger.info("=" * 60)
    
    migrator = DatabaseMigrator()
    success = migrator.run_migration()
    
    if success:
        logger.info("Migración completada exitosamente")
        sys.exit(0)
    else:
        logger.error("Migración falló")
        sys.exit(1)

if __name__ == "__main__":
    main()
