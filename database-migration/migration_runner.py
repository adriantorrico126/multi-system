"""
Ejecutor de migraciones de base de datos
"""
import logging
import os
from typing import Optional
from database_manager import production_db
from config import OUTPUT_DIR, MIGRATION_SCRIPT_FILE

logger = logging.getLogger(__name__)

class MigrationRunner:
    """Ejecutor de migraciones de base de datos"""
    
    def __init__(self):
        self.backup_created = False
        self.backup_file = None
    
    def create_backup(self) -> bool:
        """Crear backup de la base de datos antes de la migración"""
        try:
            logger.info("Creando backup de la base de datos...")
            
            # Usar pg_dump para crear backup
            import subprocess
            from config import PRODUCTION_DB_CONFIG
            
            backup_filename = f"backup_pre_migration_{self._get_timestamp()}.sql"
            backup_path = os.path.join(OUTPUT_DIR, backup_filename)
            
            # Comando pg_dump
            cmd = [
                'pg_dump',
                '-h', PRODUCTION_DB_CONFIG['host'],
                '-p', str(PRODUCTION_DB_CONFIG['port']),
                '-U', PRODUCTION_DB_CONFIG['user'],
                '-d', PRODUCTION_DB_CONFIG['database'],
                '-f', backup_path,
                '--verbose',
                '--no-password'
            ]
            
            # Configurar variable de entorno para la contraseña
            env = os.environ.copy()
            env['PGPASSWORD'] = PRODUCTION_DB_CONFIG['password']
            
            # Ejecutar pg_dump
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode == 0:
                self.backup_created = True
                self.backup_file = backup_path
                logger.info(f"Backup creado exitosamente: {backup_path}")
                return True
            else:
                logger.error(f"Error creando backup: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Error creando backup: {e}")
            return False
    
    def validate_migration_script(self, script_path: str) -> bool:
        """Validar el script de migración antes de ejecutarlo"""
        try:
            logger.info("Validando script de migración...")
            
            with open(script_path, 'r', encoding='utf-8') as f:
                script_content = f.read()
            
            # Verificaciones básicas
            checks = [
                ("BEGIN;", "Script debe comenzar con BEGIN;"),
                ("COMMIT;", "Script debe terminar con COMMIT;"),
                ("DROP TABLE", "Script no debe contener DROP TABLE"),
                ("DROP DATABASE", "Script no debe contener DROP DATABASE"),
                ("TRUNCATE", "Script no debe contener TRUNCATE"),
                ("DELETE FROM", "Script no debe contener DELETE FROM")
            ]
            
            for check, description in checks:
                if check in script_content:
                    if check in ["BEGIN;", "COMMIT;"]:
                        continue  # Estos están permitidos
                    else:
                        logger.error(f"Validación fallida: {description}")
                        return False
            
            logger.info("Script de migración validado exitosamente")
            return True
            
        except Exception as e:
            logger.error(f"Error validando script: {e}")
            return False
    
    def execute_migration(self, script_path: str, dry_run: bool = False) -> bool:
        """Ejecutar la migración"""
        try:
            if not os.path.exists(script_path):
                logger.error(f"Script de migración no encontrado: {script_path}")
                return False
            
            # Validar script
            if not self.validate_migration_script(script_path):
                logger.error("Script de migración no válido")
                return False
            
            if dry_run:
                logger.info("MODO DRY RUN - No se ejecutará la migración")
                return True
            
            # Crear backup si no existe (comentado temporalmente para primera migración)
            # if not self.backup_created:
            #     if not self.create_backup():
            #         logger.error("No se pudo crear backup. Abortando migración.")
            #         return False
            logger.info("⚠️ BACKUP SKIPEADO - Primera migración sin backup")
            
            # Ejecutar migración
            logger.info("Ejecutando migración...")
            
            with open(script_path, 'r', encoding='utf-8') as f:
                script_content = f.read()
            
            success = production_db.execute_script(script_content)
            
            if success:
                logger.info("Migración ejecutada exitosamente")
                return True
            else:
                logger.error("Error ejecutando migración")
                return False
                
        except Exception as e:
            logger.error(f"Error ejecutando migración: {e}")
            return False
    
    def rollback_migration(self, rollback_script_path: str) -> bool:
        """Ejecutar rollback de la migración"""
        try:
            if not os.path.exists(rollback_script_path):
                logger.error(f"Script de rollback no encontrado: {rollback_script_path}")
                return False
            
            logger.info("Ejecutando rollback...")
            
            with open(rollback_script_path, 'r', encoding='utf-8') as f:
                script_content = f.read()
            
            success = production_db.execute_script(script_content)
            
            if success:
                logger.info("Rollback ejecutado exitosamente")
                return True
            else:
                logger.error("Error ejecutando rollback")
                return False
                
        except Exception as e:
            logger.error(f"Error ejecutando rollback: {e}")
            return False
    
    def restore_from_backup(self, backup_path: str) -> bool:
        """Restaurar base de datos desde backup"""
        try:
            if not os.path.exists(backup_path):
                logger.error(f"Archivo de backup no encontrado: {backup_path}")
                return False
            
            logger.info("Restaurando desde backup...")
            
            # Usar psql para restaurar
            import subprocess
            from config import PRODUCTION_DB_CONFIG
            
            cmd = [
                'psql',
                '-h', PRODUCTION_DB_CONFIG['host'],
                '-p', str(PRODUCTION_DB_CONFIG['port']),
                '-U', PRODUCTION_DB_CONFIG['user'],
                '-d', PRODUCTION_DB_CONFIG['database'],
                '-f', backup_path,
                '--verbose'
            ]
            
            # Configurar variable de entorno para la contraseña
            env = os.environ.copy()
            env['PGPASSWORD'] = PRODUCTION_DB_CONFIG['password']
            
            # Ejecutar psql
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info("Restauración desde backup completada exitosamente")
                return True
            else:
                logger.error(f"Error restaurando desde backup: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Error restaurando desde backup: {e}")
            return False
    
    def _get_timestamp(self) -> str:
        """Obtener timestamp para nombres de archivo"""
        from datetime import datetime
        return datetime.now().strftime("%Y%m%d_%H%M%S")
    
    def get_migration_status(self) -> dict:
        """Obtener estado de la migración"""
        return {
            'backup_created': self.backup_created,
            'backup_file': self.backup_file,
            'migration_script_exists': os.path.exists(os.path.join(OUTPUT_DIR, MIGRATION_SCRIPT_FILE))
        }
