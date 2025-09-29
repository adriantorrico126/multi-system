"""
Extractor de esquemas de base de datos PostgreSQL
"""
import os
import logging
from typing import Dict, List, Any
from database_manager import local_db, production_db
from config import EXCLUDED_SCHEMAS, OUTPUT_DIR

logger = logging.getLogger(__name__)

class SchemaExtractor:
    """Extractor de esquemas de PostgreSQL"""
    
    def __init__(self):
        self.ensure_output_dir()
    
    def ensure_output_dir(self):
        """Crear directorio de salida si no existe"""
        if not os.path.exists(OUTPUT_DIR):
            os.makedirs(OUTPUT_DIR)
            logger.info(f"Directorio {OUTPUT_DIR} creado")
    
    def extract_tables(self, db_manager) -> List[Dict[str, Any]]:
        """Extraer información de tablas"""
        query = """
        SELECT 
            schemaname,
            tablename,
            tableowner,
            hasindexes,
            hasrules,
            hastriggers,
            rowsecurity
        FROM pg_tables 
        WHERE schemaname NOT IN %s
        ORDER BY schemaname, tablename;
        """
        return db_manager.execute_query(query, (tuple(EXCLUDED_SCHEMAS),))
    
    def extract_columns(self, db_manager) -> List[Dict[str, Any]]:
        """Extraer información de columnas"""
        query = """
        SELECT 
            table_schema,
            table_name,
            column_name,
            ordinal_position,
            column_default,
            is_nullable,
            data_type,
            character_maximum_length,
            numeric_precision,
            numeric_scale,
            datetime_precision,
            udt_name
        FROM information_schema.columns 
        WHERE table_schema NOT IN %s
        ORDER BY table_schema, table_name, ordinal_position;
        """
        return db_manager.execute_query(query, (tuple(EXCLUDED_SCHEMAS),))
    
    def extract_indexes(self, db_manager) -> List[Dict[str, Any]]:
        """Extraer información de índices"""
        query = """
        SELECT 
            schemaname,
            tablename,
            indexname,
            indexdef
        FROM pg_indexes 
        WHERE schemaname NOT IN %s
        ORDER BY schemaname, tablename, indexname;
        """
        return db_manager.execute_query(query, (tuple(EXCLUDED_SCHEMAS),))
    
    def extract_constraints(self, db_manager) -> List[Dict[str, Any]]:
        """Extraer información de restricciones"""
        query = """
        SELECT 
            tc.table_schema,
            tc.table_name,
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.delete_rule,
            rc.update_rule,
            cc.check_clause
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
        LEFT JOIN information_schema.check_constraints cc
            ON tc.constraint_name = cc.constraint_name
        LEFT JOIN information_schema.referential_constraints rc 
            ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_schema NOT IN %s
        ORDER BY tc.table_schema, tc.table_name, tc.constraint_name;
        """
        return db_manager.execute_query(query, (tuple(EXCLUDED_SCHEMAS),))
    
    def extract_functions(self, db_manager) -> List[Dict[str, Any]]:
        """Extraer información de funciones"""
        query = """
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_result(p.oid) as return_type,
            pg_get_function_arguments(p.oid) as arguments,
            pg_get_functiondef(p.oid) as definition,
            p.prokind as function_kind
        FROM pg_proc p
        LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname NOT IN %s
        ORDER BY n.nspname, p.proname;
        """
        return db_manager.execute_query(query, (tuple(EXCLUDED_SCHEMAS),))
    
    def extract_triggers(self, db_manager) -> List[Dict[str, Any]]:
        """Extraer información de triggers"""
        query = """
        SELECT 
            trigger_schema,
            trigger_name,
            event_manipulation,
            event_object_table,
            action_statement,
            action_timing,
            action_orientation
        FROM information_schema.triggers 
        WHERE trigger_schema NOT IN %s
        ORDER BY trigger_schema, event_object_table, trigger_name;
        """
        return db_manager.execute_query(query, (tuple(EXCLUDED_SCHEMAS),))
    
    def extract_views(self, db_manager) -> List[Dict[str, Any]]:
        """Extraer información de vistas"""
        query = """
        SELECT 
            table_schema,
            table_name,
            view_definition
        FROM information_schema.views 
        WHERE table_schema NOT IN %s
        ORDER BY table_schema, table_name;
        """
        return db_manager.execute_query(query, (tuple(EXCLUDED_SCHEMAS),))
    
    def extract_sequences(self, db_manager) -> List[Dict[str, Any]]:
        """Extraer información de secuencias"""
        query = """
        SELECT 
            sequence_schema,
            sequence_name,
            data_type,
            start_value,
            minimum_value,
            maximum_value,
            increment,
            cycle_option
        FROM information_schema.sequences 
        WHERE sequence_schema NOT IN %s
        ORDER BY sequence_schema, sequence_name;
        """
        return db_manager.execute_query(query, (tuple(EXCLUDED_SCHEMAS),))
    
    def extract_types(self, db_manager) -> List[Dict[str, Any]]:
        """Extraer información de tipos personalizados"""
        query = """
        SELECT 
            n.nspname as schema_name,
            t.typname as type_name,
            t.typtype as type_type,
            t.typcategory as type_category,
            pg_catalog.format_type(t.oid, NULL) as type_definition
        FROM pg_type t
        LEFT JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname NOT IN %s
        AND t.typtype IN ('c', 'e', 'd')  -- composite, enum, domain
        ORDER BY n.nspname, t.typname;
        """
        return db_manager.execute_query(query, (tuple(EXCLUDED_SCHEMAS),))
    
    def extract_extensions(self, db_manager) -> List[Dict[str, Any]]:
        """Extraer información de extensiones"""
        query = """
        SELECT 
            extname,
            extversion,
            extrelocatable,
            extnamespace::regnamespace as schema_name
        FROM pg_extension
        ORDER BY extname;
        """
        return db_manager.execute_query(query)
    
    def extract_complete_schema(self, db_manager, schema_name: str = "local") -> Dict[str, List[Dict[str, Any]]]:
        """Extraer esquema completo"""
        logger.info(f"Extrayendo esquema {schema_name}...")
        
        schema = {
            'tables': self.extract_tables(db_manager),
            'columns': self.extract_columns(db_manager),
            'indexes': self.extract_indexes(db_manager),
            'constraints': self.extract_constraints(db_manager),
            'functions': self.extract_functions(db_manager),
            'triggers': self.extract_triggers(db_manager),
            'views': self.extract_views(db_manager),
            'sequences': self.extract_sequences(db_manager),
            'types': self.extract_types(db_manager),
            'extensions': self.extract_extensions(db_manager)
        }
        
        logger.info(f"Esquema {schema_name} extraído exitosamente")
        return schema
    
    def save_schema_to_file(self, schema: Dict[str, List[Dict[str, Any]]], filename: str):
        """Guardar esquema en archivo SQL"""
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"-- Esquema extraído automáticamente\n")
            f.write(f"-- Fecha: {self._get_current_timestamp()}\n\n")
            
            # Extensiones
            if schema['extensions']:
                f.write("-- EXTENSIONES\n")
                for ext in schema['extensions']:
                    f.write(f"CREATE EXTENSION IF NOT EXISTS {ext['extname']};\n")
                f.write("\n")
            
            # Tipos personalizados
            if schema['types']:
                f.write("-- TIPOS PERSONALIZADOS\n")
                for type_obj in schema['types']:
                    f.write(f"-- Tipo: {type_obj['type_name']}\n")
                    f.write(f"-- Definición: {type_obj['type_definition']}\n\n")
                f.write("\n")
            
            # Secuencias
            if schema['sequences']:
                f.write("-- SECUENCIAS\n")
                for seq in schema['sequences']:
                    f.write(f"CREATE SEQUENCE IF NOT EXISTS {seq['sequence_schema']}.{seq['sequence_name']};\n")
                f.write("\n")
            
            # Tablas
            if schema['tables']:
                f.write("-- TABLAS\n")
                for table in schema['tables']:
                    f.write(f"-- Tabla: {table['schemaname']}.{table['tablename']}\n")
                    f.write(f"CREATE TABLE IF NOT EXISTS {table['schemaname']}.{table['tablename']} ();\n")
                f.write("\n")
            
            # Columnas
            if schema['columns']:
                f.write("-- COLUMNAS\n")
                current_table = None
                for col in schema['columns']:
                    table_key = f"{col['table_schema']}.{col['table_name']}"
                    if current_table != table_key:
                        current_table = table_key
                        f.write(f"\n-- Columnas de {table_key}\n")
                    
                    col_def = self._build_column_definition(col)
                    f.write(f"ALTER TABLE {table_key} ADD COLUMN IF NOT EXISTS {col['column_name']} {col_def};\n")
                f.write("\n")
            
            # Restricciones
            if schema['constraints']:
                f.write("-- RESTRICCIONES\n")
                for constraint in schema['constraints']:
                    if constraint['constraint_type'] == 'PRIMARY KEY':
                        f.write(f"ALTER TABLE {constraint['table_schema']}.{constraint['table_name']} ADD CONSTRAINT {constraint['constraint_name']} PRIMARY KEY ({constraint['column_name']});\n")
                    elif constraint['constraint_type'] == 'FOREIGN KEY':
                        f.write(f"ALTER TABLE {constraint['table_schema']}.{constraint['table_name']} ADD CONSTRAINT {constraint['constraint_name']} FOREIGN KEY ({constraint['column_name']}) REFERENCES {constraint['foreign_table_schema']}.{constraint['foreign_table_name']}({constraint['foreign_column_name']});\n")
                    elif constraint['constraint_type'] == 'UNIQUE':
                        f.write(f"ALTER TABLE {constraint['table_schema']}.{constraint['table_name']} ADD CONSTRAINT {constraint['constraint_name']} UNIQUE ({constraint['column_name']});\n")
                f.write("\n")
            
            # Índices
            if schema['indexes']:
                f.write("-- ÍNDICES\n")
                for index in schema['indexes']:
                    f.write(f"-- Índice: {index['indexname']}\n")
                    f.write(f"{index['indexdef']};\n\n")
            
            # Funciones
            if schema['functions']:
                f.write("-- FUNCIONES\n")
                for func in schema['functions']:
                    f.write(f"-- Función: {func['function_name']}\n")
                    f.write(f"{func['definition']};\n\n")
            
            # Triggers
            if schema['triggers']:
                f.write("-- TRIGGERS\n")
                for trigger in schema['triggers']:
                    f.write(f"-- Trigger: {trigger['trigger_name']}\n")
                    f.write(f"CREATE TRIGGER {trigger['trigger_name']} {trigger['action_timing']} {trigger['event_manipulation']} ON {trigger['event_object_table']} FOR EACH {trigger['action_orientation']} {trigger['action_statement']};\n\n")
            
            # Vistas
            if schema['views']:
                f.write("-- VISTAS\n")
                for view in schema['views']:
                    f.write(f"-- Vista: {view['table_name']}\n")
                    f.write(f"CREATE OR REPLACE VIEW {view['table_schema']}.{view['table_name']} AS {view['view_definition']};\n\n")
        
        logger.info(f"Esquema guardado en {filepath}")
    
    def _build_column_definition(self, col: Dict[str, Any]) -> str:
        """Construir definición de columna"""
        col_def = col['data_type']
        
        # Solo agregar precisión/escala para tipos específicos
        if col['data_type'] in ['character varying', 'varchar', 'char'] and col['character_maximum_length']:
            col_def += f"({col['character_maximum_length']})"
        elif col['data_type'] in ['numeric', 'decimal'] and col['numeric_precision']:
            if col['numeric_scale']:
                col_def += f"({col['numeric_precision']},{col['numeric_scale']})"
            else:
                col_def += f"({col['numeric_precision']})"
        elif col['data_type'] in ['timestamp', 'time', 'interval'] and col['datetime_precision']:
            col_def += f"({col['datetime_precision']})"
        
        if col['column_default']:
            col_def += f" DEFAULT {col['column_default']}"
        
        if col['is_nullable'] == 'NO':
            col_def += " NOT NULL"
        
        return col_def
    
    def _get_current_timestamp(self) -> str:
        """Obtener timestamp actual"""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
