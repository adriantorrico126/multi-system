#!/usr/bin/env python3
"""
Sistema de Migraciones de Base de Datos
Sistema POS - Pago Diferido

Este script maneja las migraciones de base de datos de manera profesional,
permitiendo aplicar cambios de desarrollo a producción de forma controlada.
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import logging
from datetime import datetime
from typing import List, Dict, Any
import json
from dotenv import load_dotenv

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migrations.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class DatabaseMigrator:
    def __init__(self, config: Dict[str, str]):
        """
        Inicializa el migrador con la configuración de base de datos
        
        Args:
            config: Diccionario con configuración de conexión a la DB
        """
        self.config = config
        self.connection = None
        
    def connect(self):
        """Establece conexión con la base de datos"""
        try:
            self.connection = psycopg2.connect(
                host=self.config['host'],
                port=self.config['port'],
                user=self.config['user'],
                password=self.config['password'],
                database=self.config['database']
            )
            self.connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            logger.info(f"[OK] Conectado a la base de datos: {self.config['database']}")
            return True
        except Exception as e:
            logger.error(f"[ERROR] Error conectando a la base de datos: {e}")
            return False
    
    def disconnect(self):
        """Cierra la conexión con la base de datos"""
        if self.connection:
            self.connection.close()
            logger.info("[INFO] Conexión cerrada")
    
    def execute_sql(self, sql: str, params: tuple = None) -> bool:
        """
        Ejecuta una consulta SQL
        
        Args:
            sql: Consulta SQL a ejecutar
            params: Parámetros para la consulta (opcional)
            
        Returns:
            bool: True si la ejecución fue exitosa
        """
        try:
            cursor = self.connection.cursor()
            cursor.execute(sql, params)
            cursor.close()
            logger.info("[OK] Consulta ejecutada exitosamente")
            return True
        except Exception as e:
            logger.error(f"[ERROR] Error ejecutando consulta: {e}")
            logger.error(f"SQL: {sql}")
            return False
    
    def execute_sql_file(self, file_path: str) -> bool:
        """
        Ejecuta un archivo SQL completo
        
        Args:
            file_path: Ruta al archivo SQL
            
        Returns:
            bool: True si la ejecución fue exitosa
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                sql_content = file.read()
            
            # Manejar bloques DO $$ correctamente
            commands = self._split_sql_commands(sql_content)
            
            cursor = self.connection.cursor()
            for command in commands:
                if command.strip():
                    cursor.execute(command)
            cursor.close()
            
            logger.info(f"[OK] Archivo SQL ejecutado: {file_path}")
            return True
        except Exception as e:
            logger.error(f"[ERROR] Error ejecutando archivo SQL {file_path}: {e}")
            return False
    
    def _split_sql_commands(self, sql_content: str) -> List[str]:
        """
        Divide el contenido SQL en comandos individuales,
        manejando correctamente los bloques DO $$
        """
        commands = []
        current_command = ""
        in_do_block = False
        dollar_count = 0
        
        lines = sql_content.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or line.startswith('--'):
                continue
                
            # Detectar inicio de bloque DO $$
            if 'DO $$' in line:
                in_do_block = True
                dollar_count = line.count('$$')
                current_command += line + '\n'
                continue
            
            # Si estamos en un bloque DO $$
            if in_do_block:
                current_command += line + '\n'
                dollar_count += line.count('$$')
                
                # Si encontramos $$ de cierre, terminar el bloque
                if dollar_count >= 2:
                    in_do_block = False
                    dollar_count = 0
                    commands.append(current_command.strip())
                    current_command = ""
                continue
            
            # Comando normal
            current_command += line + '\n'
            
            # Si termina con ; y no estamos en un bloque, agregar comando
            if line.endswith(';') and not in_do_block:
                commands.append(current_command.strip())
                current_command = ""
        
        # Agregar último comando si existe
        if current_command.strip():
            commands.append(current_command.strip())
        
        return [cmd for cmd in commands if cmd.strip()]
    
    def check_migration_table(self) -> bool:
        """Verifica si existe la tabla de migraciones"""
        try:
            cursor = self.connection.cursor()
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'migrations'
                );
            """)
            exists = cursor.fetchone()[0]
            cursor.close()
            return exists
        except Exception as e:
            logger.error(f"[ERROR] Error verificando tabla de migraciones: {e}")
            return False
    
    def create_migration_table(self) -> bool:
        """Crea la tabla de migraciones si no existe"""
        sql = """
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            migration_name VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            description TEXT,
            status VARCHAR(50) DEFAULT 'completed'
        );
        """
        return self.execute_sql(sql)
    
    def get_executed_migrations(self) -> List[str]:
        """Obtiene la lista de migraciones ya ejecutadas"""
        try:
            cursor = self.connection.cursor()
            cursor.execute("SELECT migration_name FROM migrations ORDER BY id")
            migrations = [row[0] for row in cursor.fetchall()]
            cursor.close()
            return migrations
        except Exception as e:
            logger.error(f"[ERROR] Error obteniendo migraciones ejecutadas: {e}")
            return []
    
    def mark_migration_executed(self, migration_name: str, description: str = "") -> bool:
        """Marca una migración como ejecutada"""
        sql = """
        INSERT INTO migrations (migration_name, description, status)
        VALUES (%s, %s, 'completed')
        ON CONFLICT (migration_name) DO NOTHING;
        """
        return self.execute_sql(sql, (migration_name, description))
    
    def run_migration(self, migration_file: str) -> bool:
        """
        Ejecuta una migración específica
        
        Args:
            migration_file: Nombre del archivo de migración
            
        Returns:
            bool: True si la migración fue exitosa
        """
        migration_name = os.path.basename(migration_file).replace('.sql', '')
        
        # Verificar si ya fue ejecutada
        executed_migrations = self.get_executed_migrations()
        if migration_name in executed_migrations:
            logger.info(f"[SKIP] Migración ya ejecutada: {migration_name}")
            return True
        
        logger.info(f"[RUN] Ejecutando migración: {migration_name}")
        
        # Ejecutar la migración
        success = self.execute_sql_file(migration_file)
        
        if success:
            # Marcar como ejecutada
            self.mark_migration_executed(migration_name, f"Migración ejecutada el {datetime.now()}")
            logger.info(f"[OK] Migración completada: {migration_name}")
        else:
            logger.error(f"[ERROR] Migración falló: {migration_name}")
        
        return success
    
    def run_all_migrations(self, migrations_dir: str = "migrations") -> bool:
        """
        Ejecuta todas las migraciones pendientes
        
        Args:
            migrations_dir: Directorio donde están las migraciones
            
        Returns:
            bool: True si todas las migraciones fueron exitosas
        """
        if not os.path.exists(migrations_dir):
            logger.error(f"[ERROR] Directorio de migraciones no encontrado: {migrations_dir}")
            return False
        
        # Obtener archivos SQL ordenados
        sql_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])
        
        if not sql_files:
            logger.info("[INFO] No hay migraciones para ejecutar")
            return True
        
        logger.info(f"[INFO] Encontradas {len(sql_files)} migraciones")
        
        # Crear tabla de migraciones si no existe
        if not self.check_migration_table():
            logger.info("[INFO] Creando tabla de migraciones...")
            if not self.create_migration_table():
                return False
        
        # Ejecutar cada migración
        all_success = True
        for sql_file in sql_files:
            migration_path = os.path.join(migrations_dir, sql_file)
            if not self.run_migration(migration_path):
                all_success = False
                break
        
        return all_success

def load_config(environment: str) -> Dict[str, str]:
    """
    Carga la configuración según el entorno
    
    Args:
        environment: 'local' o 'production'
        
    Returns:
        Dict con configuración de base de datos
    """
    if environment == 'production':
        return {
            'host': os.environ.get('DB_HOST'),
            'port': os.environ.get('DB_PORT'),
            'user': os.environ.get('DB_USER'),
            'password': os.environ.get('DB_PASSWORD'),
            'database': os.environ.get('DB_DATABASE')
        }
    elif environment == 'local':
        return {
            'host': 'localhost',
            'port': '5432',
            'user': 'postgres',
            'password': '6951230Anacleta',
            'database': 'sistempos'
        }
    else:
        raise ValueError(f"Entorno no válido: {environment}. Usa 'local' o 'production'")

def main():
    """Función principal"""
    load_dotenv()
    if len(sys.argv) < 2:
        print("Uso: python migrate.py <entorno> [migración_específica]")
        print("Entornos: local, production")
        print("Ejemplo: python migrate.py production")
        print("Ejemplo: python migrate.py local 001_add_pago_diferido_tables.sql")
        sys.exit(1)
    
    environment = sys.argv[1]
    specific_migration = sys.argv[2] if len(sys.argv) > 2 else None
    
    logger.info(f"[RUN] Iniciando migraciones para entorno: {environment}")
    
    # Cargar configuración
    try:
        config = load_config(environment)
    except ValueError as e:
        logger.error(f"[ERROR] {e}")
        sys.exit(1)
    
    # Crear migrador
    migrator = DatabaseMigrator(config)
    
    try:
        # Conectar a la base de datos
        if not migrator.connect():
            sys.exit(1)
        
        # Ejecutar migraciones
        if specific_migration:
            # Ejecutar migración específica
            migration_path = os.path.join("migrations", specific_migration)
            if not os.path.exists(migration_path):
                logger.error(f"❌ Archivo de migración no encontrado: {migration_path}")
                sys.exit(1)
            
            success = migrator.run_migration(migration_path)
        else:
            # Ejecutar todas las migraciones
            success = migrator.run_all_migrations()
        
        if success:
            logger.info("[SUCCESS] ¡Todas las migraciones completadas exitosamente!")
        else:
            logger.error("[ERROR] Algunas migraciones fallaron")
            sys.exit(1)
            
    except KeyboardInterrupt:
        logger.info("[INFO] Migración interrumpida por el usuario")
        sys.exit(1)
    except Exception as e:
        logger.error(f"[ERROR] Error inesperado: {e}")
        sys.exit(1)
    finally:
        migrator.disconnect()

if __name__ == "__main__":
    main()
