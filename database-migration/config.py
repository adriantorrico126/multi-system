"""
Configuración para el sistema de migración de base de datos
"""
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de la base de datos local
LOCAL_DB_CONFIG = {
    'host': os.getenv('LOCAL_DB_HOST', 'localhost'),
    'port': int(os.getenv('LOCAL_DB_PORT', 5432)),
    'user': os.getenv('LOCAL_DB_USER', 'postgres'),
    'password': os.getenv('LOCAL_DB_PASSWORD', 'password'),
    'database': os.getenv('LOCAL_DB_NAME', 'sistempos')
}

# Configuración de la base de datos de producción
PRODUCTION_DB_CONFIG = {
    'host': os.getenv('PROD_DB_HOST', 'db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com'),
    'port': int(os.getenv('PROD_DB_PORT', 25060)),
    'user': os.getenv('PROD_DB_USER', 'doadmin'),
    'password': os.getenv('PROD_DB_PASSWORD', 'placeholder_password'),
    'database': os.getenv('PROD_DB_NAME', 'defaultdb')
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
