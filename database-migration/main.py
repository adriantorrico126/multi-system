"""
Script principal para el sistema de migración de base de datos
"""
import argparse
import logging
import sys
import os
from colorama import init, Fore, Style
from database_manager import local_db, production_db
from schema_extractor import SchemaExtractor
from schema_comparator import SchemaComparator
from migration_generator import MigrationGenerator
from migration_runner import MigrationRunner
from config import OUTPUT_DIR, SCHEMA_EXTRACT_FILE, PRODUCTION_SCHEMA_FILE, MIGRATION_SCRIPT_FILE

# Inicializar colorama para colores en consola
init(autoreset=True)

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class MigrationManager:
    """Gestor principal del sistema de migración"""
    
    def __init__(self):
        self.extractor = SchemaExtractor()
        self.comparator = SchemaComparator()
        self.generator = MigrationGenerator()
        self.runner = MigrationRunner()
    
    def test_connections(self) -> bool:
        """Probar conexiones a ambas bases de datos"""
        print(f"{Fore.CYAN}🔍 Probando conexiones...{Style.RESET_ALL}")
        
        # Probar conexión local
        if local_db.test_connection():
            print(f"{Fore.GREEN}✅ Conexión local exitosa{Style.RESET_ALL}")
        else:
            print(f"{Fore.RED}❌ Error de conexión local{Style.RESET_ALL}")
            return False
        
        # Probar conexión de producción
        if production_db.test_connection():
            print(f"{Fore.GREEN}✅ Conexión de producción exitosa{Style.RESET_ALL}")
        else:
            print(f"{Fore.RED}❌ Error de conexión de producción{Style.RESET_ALL}")
            return False
        
        return True
    
    def extract_schemas(self) -> bool:
        """Extraer esquemas de ambas bases de datos"""
        print(f"{Fore.CYAN}📊 Extrayendo esquemas...{Style.RESET_ALL}")
        
        try:
            # Extraer esquema local
            print("Extrayendo esquema local...")
            local_schema = self.extractor.extract_complete_schema(local_db, "local")
            self.extractor.save_schema_to_file(local_schema, SCHEMA_EXTRACT_FILE)
            
            # Extraer esquema de producción
            print("Extrayendo esquema de producción...")
            production_schema = self.extractor.extract_complete_schema(production_db, "production")
            self.extractor.save_schema_to_file(production_schema, PRODUCTION_SCHEMA_FILE)
            
            print(f"{Fore.GREEN}✅ Esquemas extraídos exitosamente{Style.RESET_ALL}")
            return True
            
        except Exception as e:
            print(f"{Fore.RED}❌ Error extrayendo esquemas: {e}{Style.RESET_ALL}")
            return False
    
    def compare_schemas(self) -> bool:
        """Comparar esquemas y generar reporte de diferencias"""
        print(f"{Fore.CYAN}🔍 Comparando esquemas...{Style.RESET_ALL}")
        
        try:
            # Cargar esquemas
            local_schema = self.extractor.extract_complete_schema(local_db, "local")
            production_schema = self.extractor.extract_complete_schema(production_db, "production")
            
            # Comparar
            differences = self.comparator.compare_schemas(local_schema, production_schema)
            
            # Generar reporte
            report = self.comparator.generate_diff_report(differences)
            self.comparator.save_diff_report(report)
            
            # Mostrar resumen
            summary = self.comparator.get_summary_table()
            print(f"\n{Fore.YELLOW}📋 RESUMEN DE CAMBIOS:{Style.RESET_ALL}")
            print(summary)
            
            if self.comparator.has_changes():
                print(f"{Fore.YELLOW}⚠️  Se encontraron diferencias. Revisar el reporte completo.{Style.RESET_ALL}")
            else:
                print(f"{Fore.GREEN}✅ No se encontraron diferencias entre los esquemas{Style.RESET_ALL}")
            
            return True
            
        except Exception as e:
            print(f"{Fore.RED}❌ Error comparando esquemas: {e}{Style.RESET_ALL}")
            return False
    
    def generate_migration(self) -> bool:
        """Generar script de migración"""
        print(f"{Fore.CYAN}📝 Generando script de migración...{Style.RESET_ALL}")
        
        try:
            # Cargar esquemas
            local_schema = self.extractor.extract_complete_schema(local_db, "local")
            production_schema = self.extractor.extract_complete_schema(production_db, "production")
            
            # Comparar
            differences = self.comparator.compare_schemas(local_schema, production_schema)
            
            if not self.comparator.has_changes():
                print(f"{Fore.GREEN}✅ No hay cambios para migrar{Style.RESET_ALL}")
                return True
            
            # Generar script de migración
            migration_script = self.generator.generate_migration_script(differences)
            self.generator.save_migration_script(migration_script)
            
            # Generar script de rollback
            rollback_script = self.generator.generate_rollback_script(differences)
            rollback_file = os.path.join(OUTPUT_DIR, "rollback_script.sql")
            with open(rollback_file, 'w', encoding='utf-8') as f:
                f.write(rollback_script)
            
            print(f"{Fore.GREEN}✅ Scripts de migración generados exitosamente{Style.RESET_ALL}")
            print(f"📁 Script de migración: {MIGRATION_SCRIPT_FILE}")
            print(f"📁 Script de rollback: rollback_script.sql")
            
            return True
            
        except Exception as e:
            print(f"{Fore.RED}❌ Error generando migración: {e}{Style.RESET_ALL}")
            return False
    
    def execute_migration(self, dry_run: bool = False) -> bool:
        """Ejecutar migración"""
        script_path = os.path.join(OUTPUT_DIR, MIGRATION_SCRIPT_FILE)
        
        if not os.path.exists(script_path):
            print(f"{Fore.RED}❌ Script de migración no encontrado: {script_path}{Style.RESET_ALL}")
            return False
        
        if dry_run:
            print(f"{Fore.YELLOW}🧪 MODO DRY RUN - Validando script sin ejecutar...{Style.RESET_ALL}")
        else:
            print(f"{Fore.CYAN}🚀 Ejecutando migración...{Style.RESET_ALL}")
        
        try:
            success = self.runner.execute_migration(script_path, dry_run)
            
            if success:
                if dry_run:
                    print(f"{Fore.GREEN}✅ Script de migración válido{Style.RESET_ALL}")
                else:
                    print(f"{Fore.GREEN}✅ Migración ejecutada exitosamente{Style.RESET_ALL}")
                return True
            else:
                print(f"{Fore.RED}❌ Error en la migración{Style.RESET_ALL}")
                return False
                
        except Exception as e:
            print(f"{Fore.RED}❌ Error ejecutando migración: {e}{Style.RESET_ALL}")
            return False
    
    def show_status(self):
        """Mostrar estado del sistema"""
        print(f"{Fore.CYAN}📊 ESTADO DEL SISTEMA DE MIGRACIÓN{Style.RESET_ALL}")
        print("=" * 50)
        
        # Estado de conexiones
        local_ok = local_db.test_connection()
        prod_ok = production_db.test_connection()
        
        print(f"Conexión local: {'✅' if local_ok else '❌'}")
        print(f"Conexión producción: {'✅' if prod_ok else '❌'}")
        
        # Estado de archivos
        files_status = [
            (SCHEMA_EXTRACT_FILE, "Esquema local"),
            (PRODUCTION_SCHEMA_FILE, "Esquema producción"),
            (MIGRATION_SCRIPT_FILE, "Script migración"),
            ("rollback_script.sql", "Script rollback")
        ]
        
        print(f"\nArchivos generados:")
        for filename, description in files_status:
            filepath = os.path.join(OUTPUT_DIR, filename)
            exists = os.path.exists(filepath)
            print(f"  {description}: {'✅' if exists else '❌'} ({filename})")
        
        # Estado de migración
        migration_status = self.runner.get_migration_status()
        print(f"\nEstado de migración:")
        print(f"  Backup creado: {'✅' if migration_status['backup_created'] else '❌'}")
        if migration_status['backup_file']:
            print(f"  Archivo backup: {migration_status['backup_file']}")

def main():
    """Función principal"""
    parser = argparse.ArgumentParser(description='Sistema de migración de base de datos PostgreSQL')
    parser.add_argument('action', choices=[
        'test', 'extract', 'compare', 'generate', 'migrate', 'dry-run', 'status'
    ], help='Acción a ejecutar')
    
    args = parser.parse_args()
    
    # Crear directorio de salida
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Inicializar gestor
    manager = MigrationManager()
    
    print(f"{Fore.BLUE}🗄️  SISTEMA DE MIGRACIÓN DE BASE DE DATOS{Style.RESET_ALL}")
    print("=" * 60)
    
    try:
        if args.action == 'test':
            success = manager.test_connections()
            sys.exit(0 if success else 1)
        
        elif args.action == 'extract':
            if not manager.test_connections():
                sys.exit(1)
            success = manager.extract_schemas()
            sys.exit(0 if success else 1)
        
        elif args.action == 'compare':
            if not manager.test_connections():
                sys.exit(1)
            success = manager.compare_schemas()
            sys.exit(0 if success else 1)
        
        elif args.action == 'generate':
            if not manager.test_connections():
                sys.exit(1)
            success = manager.generate_migration()
            sys.exit(0 if success else 1)
        
        elif args.action == 'migrate':
            if not manager.test_connections():
                sys.exit(1)
            success = manager.execute_migration(dry_run=False)
            sys.exit(0 if success else 1)
        
        elif args.action == 'dry-run':
            if not manager.test_connections():
                sys.exit(1)
            success = manager.execute_migration(dry_run=True)
            sys.exit(0 if success else 1)
        
        elif args.action == 'status':
            manager.show_status()
            sys.exit(0)
    
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}⚠️  Operación cancelada por el usuario{Style.RESET_ALL}")
        sys.exit(1)
    except Exception as e:
        print(f"{Fore.RED}❌ Error inesperado: {e}{Style.RESET_ALL}")
        sys.exit(1)

if __name__ == "__main__":
    main()
