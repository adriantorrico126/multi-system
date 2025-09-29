"""
Generador de scripts de migración
"""
import logging
from typing import Dict, List, Any
from config import OUTPUT_DIR, MIGRATION_SCRIPT_FILE

logger = logging.getLogger(__name__)

class MigrationGenerator:
    """Generador de scripts de migración SQL"""
    
    def __init__(self):
        self.migration_script = []
        self.safety_checks = []
    
    def generate_migration_script(self, differences: Dict[str, Dict[str, List]]) -> str:
        """Generar script de migración basado en las diferencias"""
        logger.info("Generando script de migración...")
        
        self.migration_script = []
        self.safety_checks = []
        
        # Encabezado del script
        self._add_header()
        
        # Verificaciones de seguridad
        self._add_safety_checks()
        
        # Extensiones
        self._migrate_extensions(differences.get('extensions', {}))
        
        # Tipos personalizados
        self._migrate_types(differences.get('types', {}))
        
        # Secuencias
        self._migrate_sequences(differences.get('sequences', {}))
        
        # Tablas
        self._migrate_tables(differences.get('tables', {}))
        
        # Columnas
        self._migrate_columns(differences.get('columns', {}))
        
        # Restricciones
        self._migrate_constraints(differences.get('constraints', {}))
        
        # Índices
        self._migrate_indexes(differences.get('indexes', {}))
        
        # Funciones
        self._migrate_functions(differences.get('functions', {}))
        
        # Triggers
        self._migrate_triggers(differences.get('triggers', {}))
        
        # Vistas
        self._migrate_views(differences.get('views', {}))
        
        # Finalización
        self._add_footer()
        
        script_content = "\n".join(self.migration_script)
        logger.info("Script de migración generado exitosamente")
        return script_content
    
    def _add_header(self):
        """Añadir encabezado del script"""
        self.migration_script.extend([
            "-- ========================================",
            "-- SCRIPT DE MIGRACIÓN DE ESQUEMA",
            "-- Generado automáticamente",
            "-- ========================================",
            "",
            "-- IMPORTANTE: Este script contiene solo cambios estructurales",
            "-- No afecta los datos existentes en la base de datos",
            "",
            "BEGIN;",
            "",
            "-- Verificaciones de seguridad",
            "DO $$",
            "BEGIN",
            "    -- Verificar que estamos en el entorno correcto",
            "    IF current_database() = 'defaultdb' THEN",
            "        RAISE NOTICE 'Aplicando migración en base de datos de producción: %', current_database();",
            "    ELSE",
            "        RAISE WARNING 'Base de datos actual: %. Verificar que es el entorno correcto.', current_database();",
            "    END IF;",
            "END $$;",
            ""
        ])
    
    def _add_safety_checks(self):
        """Añadir verificaciones de seguridad"""
        self.safety_checks.extend([
            "-- Verificar que no hay transacciones activas",
            "SELECT pg_sleep(1); -- Pausa de seguridad",
            ""
        ])
    
    def _add_footer(self):
        """Añadir pie del script"""
        self.migration_script.extend([
            "",
            "-- ========================================",
            "-- FIN DE LA MIGRACIÓN",
            "-- ========================================",
            "",
            "COMMIT;",
            "",
            "-- Verificar que la migración fue exitosa",
            "DO $$",
            "BEGIN",
            "    RAISE NOTICE 'Migración completada exitosamente en: %', now();",
            "END $$;"
        ])
    
    def _migrate_extensions(self, extensions_diff: Dict[str, List]):
        """Migrar extensiones"""
        if extensions_diff.get('added'):
            self.migration_script.append("-- EXTENSIONES")
            for ext in extensions_diff['added']:
                self.migration_script.append(f"CREATE EXTENSION IF NOT EXISTS {ext['extname']};")
            self.migration_script.append("")
    
    def _migrate_types(self, types_diff: Dict[str, List]):
        """Migrar tipos personalizados"""
        if types_diff.get('added'):
            self.migration_script.append("-- TIPOS PERSONALIZADOS")
            for type_obj in types_diff['added']:
                self.migration_script.append(f"-- Tipo: {type_obj['type_name']}")
                # Nota: Los tipos personalizados requieren definición completa
                self.migration_script.append(f"-- Definición: {type_obj['type_definition']}")
                self.migration_script.append("-- [REQUIERE DEFINICIÓN MANUAL]")
            self.migration_script.append("")
    
    def _migrate_sequences(self, sequences_diff: Dict[str, List]):
        """Migrar secuencias"""
        if sequences_diff.get('added'):
            self.migration_script.append("-- SECUENCIAS")
            for seq in sequences_diff['added']:
                self.migration_script.append(f"CREATE SEQUENCE IF NOT EXISTS {seq['sequence_schema']}.{seq['sequence_name']};")
            self.migration_script.append("")
    
    def _migrate_tables(self, tables_diff: Dict[str, List]):
        """Migrar tablas"""
        if tables_diff.get('added'):
            self.migration_script.append("-- TABLAS")
            for table in tables_diff['added']:
                self.migration_script.append(f"CREATE TABLE IF NOT EXISTS {table['schemaname']}.{table['tablename']} ();")
                self.migration_script.append(f"COMMENT ON TABLE {table['schemaname']}.{table['tablename']} IS 'Tabla creada por migración automática';")
            self.migration_script.append("")
    
    def _migrate_columns(self, columns_diff: Dict[str, List]):
        """Migrar columnas"""
        if columns_diff.get('added'):
            self.migration_script.append("-- COLUMNAS")
            
            # Agrupar columnas por tabla
            columns_by_table = {}
            for col in columns_diff['added']:
                table_key = f"{col['table_schema']}.{col['table_name']}"
                if table_key not in columns_by_table:
                    columns_by_table[table_key] = []
                columns_by_table[table_key].append(col)
            
            for table_key, columns in columns_by_table.items():
                self.migration_script.append(f"-- Columnas para {table_key}")
                for col in columns:
                    col_def = self._build_column_definition(col)
                    self.migration_script.append(f"ALTER TABLE {table_key} ADD COLUMN IF NOT EXISTS {col['column_name']} {col_def};")
                self.migration_script.append("")
    
    def _migrate_constraints(self, constraints_diff: Dict[str, List]):
        """Migrar restricciones"""
        if constraints_diff.get('added'):
            self.migration_script.append("-- RESTRICCIONES")
            
            # Agrupar por tipo de restricción
            pk_constraints = []
            fk_constraints = []
            unique_constraints = []
            check_constraints = []
            
            for constraint in constraints_diff['added']:
                if constraint['constraint_type'] == 'PRIMARY KEY':
                    pk_constraints.append(constraint)
                elif constraint['constraint_type'] == 'FOREIGN KEY':
                    fk_constraints.append(constraint)
                elif constraint['constraint_type'] == 'UNIQUE':
                    unique_constraints.append(constraint)
                elif constraint['constraint_type'] == 'CHECK':
                    check_constraints.append(constraint)
            
            # Claves primarias
            for constraint in pk_constraints:
                constraint_name = f'"{constraint["constraint_name"]}"' if constraint['constraint_name'][0].isdigit() else constraint['constraint_name']
                self.migration_script.append(f"DO $$")
                self.migration_script.append(f"BEGIN")
                self.migration_script.append(f"    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '{constraint['constraint_name']}' AND table_name = '{constraint['table_name']}' AND table_schema = '{constraint['table_schema']}') THEN")
                self.migration_script.append(f"        ALTER TABLE {constraint['table_schema']}.{constraint['table_name']} ADD CONSTRAINT {constraint_name} PRIMARY KEY ({constraint['column_name']});")
                self.migration_script.append(f"    END IF;")
                self.migration_script.append(f"END $$;")
            
            # Claves foráneas
            for constraint in fk_constraints:
                constraint_name = f'"{constraint["constraint_name"]}"' if constraint['constraint_name'][0].isdigit() else constraint['constraint_name']
                self.migration_script.append(f"DO $$")
                self.migration_script.append(f"BEGIN")
                self.migration_script.append(f"    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '{constraint['constraint_name']}' AND table_name = '{constraint['table_name']}' AND table_schema = '{constraint['table_schema']}') THEN")
                self.migration_script.append(f"        ALTER TABLE {constraint['table_schema']}.{constraint['table_name']} ADD CONSTRAINT {constraint_name} FOREIGN KEY ({constraint['column_name']}) REFERENCES {constraint['foreign_table_schema']}.{constraint['foreign_table_name']}({constraint['foreign_column_name']});")
                self.migration_script.append(f"    END IF;")
                self.migration_script.append(f"END $$;")
            
            # Restricciones únicas
            for constraint in unique_constraints:
                constraint_name = f'"{constraint["constraint_name"]}"' if constraint['constraint_name'][0].isdigit() else constraint['constraint_name']
                self.migration_script.append(f"DO $$")
                self.migration_script.append(f"BEGIN")
                self.migration_script.append(f"    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '{constraint['constraint_name']}' AND table_name = '{constraint['table_name']}' AND table_schema = '{constraint['table_schema']}') THEN")
                self.migration_script.append(f"        ALTER TABLE {constraint['table_schema']}.{constraint['table_name']} ADD CONSTRAINT {constraint_name} UNIQUE ({constraint['column_name']});")
                self.migration_script.append(f"    END IF;")
                self.migration_script.append(f"END $$;")
            
            # Restricciones de verificación
            for constraint in check_constraints:
                constraint_name = f'"{constraint["constraint_name"]}"' if constraint['constraint_name'][0].isdigit() else constraint['constraint_name']
                # Saltar restricciones CCHECK sin definición válida
                if constraint.get('check_clause'):
                    self.migration_script.append(f"DO $$")
                    self.migration_script.append(f"BEGIN")
                    self.migration_script.append(f"    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '{constraint['constraint_name']}' AND table_name = '{constraint['table_name']}' AND table_schema = '{constraint['table_schema']}') THEN")
                    self.migration_script.append(f"        ALTER TABLE {constraint['table_schema']}.{constraint['table_name']} ADD CONSTRAINT {constraint_name} CHECK ({constraint['check_clause']});")
                    self.migration_script.append(f"    END IF;")
                    self.migration_script.append(f"END $$;")
                else:
                    self.migration_script.append(f"-- SKIP: Constraint CHECK {constraint_name} sin condición válida")
            
            self.migration_script.append("")
    
    def _migrate_indexes(self, indexes_diff: Dict[str, List]):
        """Migrar índices"""
        if indexes_diff.get('added'):
            self.migration_script.append("-- ÍNDICES")
            for index in indexes_diff['added']:
                index_name = f'"{index["indexname"]}"' if index['indexname'][0].isdigit() else index['indexname']
                
                self.migration_script.append(f"DO $$")
                self.migration_script.append(f"BEGIN")
                self.migration_script.append(f"    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = '{index['indexname']}' AND schemaname = '{index['schemaname']}') THEN")
                self.migration_script.append(f"        {index['indexdef']};")
                self.migration_script.append(f"    END IF;")
                self.migration_script.append(f"END $$;")
            self.migration_script.append("")
    
    def _migrate_functions(self, functions_diff: Dict[str, List]):
        """Migrar funciones"""
        if functions_diff.get('added'):
            self.migration_script.append("-- FUNCIONES")
            for func in functions_diff['added']:
                self.migration_script.append(f"-- Función: {func['function_name']}")
                # Usar CREATE OR REPLACE para funciones
                func_def = func['definition'].replace('CREATE FUNCTION', 'CREATE OR REPLACE FUNCTION')
                self.migration_script.append(f"{func_def};")
                self.migration_script.append("")
    
    def _migrate_triggers(self, triggers_diff: Dict[str, List]):
        """Migrar triggers"""
        if triggers_diff.get('added'):
            self.migration_script.append("-- TRIGGERS")
            for trigger in triggers_diff['added']:
                self.migration_script.append(f"-- Trigger: {trigger['trigger_name']}")
                self.migration_script.append(f"CREATE TRIGGER {trigger['trigger_name']}")
                self.migration_script.append(f"    {trigger['action_timing']} {trigger['event_manipulation']}")
                self.migration_script.append(f"    ON {trigger['event_object_table']}")
                self.migration_script.append(f"    FOR EACH {trigger['action_orientation']}")
                self.migration_script.append(f"    {trigger['action_statement']};")
                self.migration_script.append("")
    
    def _migrate_views(self, views_diff: Dict[str, List]):
        """Migrar vistas"""
        if views_diff.get('added'):
            self.migration_script.append("-- VISTAS")
            for view in views_diff['added']:
                self.migration_script.append(f"-- Vista: {view['table_name']}")
                self.migration_script.append(f"CREATE OR REPLACE VIEW {view['table_schema']}.{view['table_name']} AS {view['view_definition']};")
                self.migration_script.append("")
    
    def _build_column_definition(self, col: Dict[str, Any]) -> str:
        """Construir definición de columna"""
        col_def = col['data_type']
        
        # Solo agregar precisión/escala para tipos específicos
        if col['data_type'] in ['character varying', 'varchar', 'char'] and col.get('character_maximum_length'):
            col_def += f"({col['character_maximum_length']})"
        elif col['data_type'] in ['numeric', 'decimal'] and col.get('numeric_precision'):
            if col.get('numeric_scale'):
                col_def += f"({col['numeric_precision']},{col['numeric_scale']})"
            else:
                col_def += f"({col['numeric_precision']})"
        elif col['data_type'] in ['timestamp', 'time', 'interval'] and col.get('datetime_precision'):
            col_def += f"({col['datetime_precision']})"
        
        if col.get('column_default'):
            col_def += f" DEFAULT {col['column_default']}"
        
        if col.get('is_nullable') == 'NO':
            col_def += " NOT NULL"
        
        return col_def
    
    def save_migration_script(self, script_content: str):
        """Guardar script de migración"""
        filepath = f"{OUTPUT_DIR}/{MIGRATION_SCRIPT_FILE}"
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(script_content)
        logger.info(f"Script de migración guardado en {filepath}")
    
    def generate_rollback_script(self, differences: Dict[str, Dict[str, List]]) -> str:
        """Generar script de rollback"""
        rollback_script = []
        
        rollback_script.extend([
            "-- ========================================",
            "-- SCRIPT DE ROLLBACK",
            "-- Generado automáticamente",
            "-- ========================================",
            "",
            "BEGIN;",
            ""
        ])
        
        # Rollback en orden inverso
        if differences.get('views', {}).get('added'):
            rollback_script.append("-- ELIMINAR VISTAS")
            for view in differences['views']['added']:
                rollback_script.append(f"DROP VIEW IF EXISTS {view['table_schema']}.{view['table_name']};")
            rollback_script.append("")
        
        if differences.get('triggers', {}).get('added'):
            rollback_script.append("-- ELIMINAR TRIGGERS")
            for trigger in differences['triggers']['added']:
                rollback_script.append(f"DROP TRIGGER IF EXISTS {trigger['trigger_name']} ON {trigger['event_object_table']};")
            rollback_script.append("")
        
        if differences.get('functions', {}).get('added'):
            rollback_script.append("-- ELIMINAR FUNCIONES")
            for func in differences['functions']['added']:
                rollback_script.append(f"DROP FUNCTION IF EXISTS {func['schema_name']}.{func['function_name']};")
            rollback_script.append("")
        
        if differences.get('indexes', {}).get('added'):
            rollback_script.append("-- ELIMINAR ÍNDICES")
            for index in differences['indexes']['added']:
                rollback_script.append(f"DROP INDEX IF EXISTS {index['schemaname']}.{index['indexname']};")
            rollback_script.append("")
        
        if differences.get('constraints', {}).get('added'):
            rollback_script.append("-- ELIMINAR RESTRICCIONES")
            for constraint in differences['constraints']['added']:
                rollback_script.append(f"ALTER TABLE {constraint['table_schema']}.{constraint['table_name']} DROP CONSTRAINT IF EXISTS {constraint['constraint_name']};")
            rollback_script.append("")
        
        if differences.get('columns', {}).get('added'):
            rollback_script.append("-- ELIMINAR COLUMNAS")
            columns_by_table = {}
            for col in differences['columns']['added']:
                table_key = f"{col['table_schema']}.{col['table_name']}"
                if table_key not in columns_by_table:
                    columns_by_table[table_key] = []
                columns_by_table[table_key].append(col)
            
            for table_key, columns in columns_by_table.items():
                for col in columns:
                    rollback_script.append(f"ALTER TABLE {table_key} DROP COLUMN IF EXISTS {col['column_name']};")
            rollback_script.append("")
        
        if differences.get('tables', {}).get('added'):
            rollback_script.append("-- ELIMINAR TABLAS")
            for table in differences['tables']['added']:
                rollback_script.append(f"DROP TABLE IF EXISTS {table['schemaname']}.{table['tablename']};")
            rollback_script.append("")
        
        if differences.get('sequences', {}).get('added'):
            rollback_script.append("-- ELIMINAR SECUENCIAS")
            for seq in differences['sequences']['added']:
                rollback_script.append(f"DROP SEQUENCE IF EXISTS {seq['sequence_schema']}.{seq['sequence_name']};")
            rollback_script.append("")
        
        rollback_script.extend([
            "COMMIT;",
            "",
            "DO $$",
            "BEGIN",
            "    RAISE NOTICE 'Rollback completado exitosamente en: %', now();",
            "END $$;"
        ])
        
        return "\n".join(rollback_script)
