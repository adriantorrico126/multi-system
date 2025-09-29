"""
Gestor de conexiones y operaciones de base de datos
"""
import psycopg2
import psycopg2.extras
from contextlib import contextmanager
from typing import Dict, List, Any, Optional
import logging
from config import LOCAL_DB_CONFIG, PRODUCTION_DB_CONFIG

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    """Gestor de conexiones y operaciones de base de datos"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.connection = None
    
    @contextmanager
    def get_connection(self):
        """Context manager para conexiones de base de datos"""
        conn = None
        try:
            conn = psycopg2.connect(**self.config)
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Error de conexión: {e}")
            raise
        finally:
            if conn:
                conn.close()
    
    def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """Ejecutar una consulta y retornar resultados"""
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()
    
    def execute_script(self, script: str) -> bool:
        """Ejecutar un script SQL completo"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(script)
                    conn.commit()
                    logger.info("Script ejecutado exitosamente")
                    return True
        except Exception as e:
            logger.error(f"Error ejecutando script: {e}")
            return False
    
    def test_connection(self) -> bool:
        """Probar la conexión a la base de datos"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    result = cursor.fetchone()
                    return result[0] == 1
        except Exception as e:
            logger.error(f"Error de conexión: {e}")
            return False

# Instancias globales
local_db = DatabaseManager(LOCAL_DB_CONFIG)
production_db = DatabaseManager(PRODUCTION_DB_CONFIG)
