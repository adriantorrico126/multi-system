"""
Configuración para el sistema de migración de base de datos
"""
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de la base de datos local
LOCAL_DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'user': 'postgres',
    'password': os.getenv('LOCAL_DB_PASSWORD'),
    'database': 'sistempos'
}

# Configuración de la base de datos de producción
PRODUCTION_DB_CONFIG = {
    'host': 'db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com',
    'port': 25060,
    'user': 'doadmin',
    'password': os.getenv('PROD_DB_PASSWORD'),
    'database': 'defaultdb'
}

# Configuración de archivos de salida
OUTPUT_DIR = 'migration_output'
SCHEMA_EXTRACT_FILE = 'local_schema.sql'
PRODUCTION_SCHEMA_FILE = 'production_schema.sql'
MIGRATION_SCRIPT_FILE = 'migration_script.sql'
DIFF_REPORT_FILE = 'schema_diff_report.txt'

# Tipos de objetos a migrar
MIGRATABLE_OBJECTS = [
    'tables',
    'columns', 
    'indexes',
    'constraints',
    'functions',
    'triggers',
    'views',
    'sequences',
    'types',
    'extensions'
]

# Esquemas a excluir de la migración
EXCLUDED_SCHEMAS = [
    'information_schema',
    'pg_catalog',
    'pg_toast',
    'pg_temp_1',
    'pg_toast_temp_1'
]
