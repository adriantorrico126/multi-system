"""
Comparador de esquemas de base de datos
"""
import logging
from typing import Dict, List, Any, Tuple
from tabulate import tabulate
from config import OUTPUT_DIR, DIFF_REPORT_FILE

logger = logging.getLogger(__name__)

class SchemaComparator:
    """Comparador de esquemas de PostgreSQL"""
    
    def __init__(self):
        self.differences = {
            'tables': {'added': [], 'removed': [], 'modified': []},
            'columns': {'added': [], 'removed': [], 'modified': []},
            'indexes': {'added': [], 'removed': [], 'modified': []},
            'constraints': {'added': [], 'removed': [], 'modified': []},
            'functions': {'added': [], 'removed': [], 'modified': []},
            'triggers': {'added': [], 'removed': [], 'modified': []},
            'views': {'added': [], 'removed': [], 'modified': []},
            'sequences': {'added': [], 'removed': [], 'modified': []},
            'types': {'added': [], 'removed': [], 'modified': []},
            'extensions': {'added': [], 'removed': [], 'modified': []}
        }
    
    def compare_schemas(self, local_schema: Dict[str, List[Dict[str, Any]]], 
                       production_schema: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Dict[str, List]]:
        """Comparar dos esquemas y encontrar diferencias"""
        logger.info("Iniciando comparación de esquemas...")
        
        for object_type in self.differences.keys():
            self._compare_objects(object_type, local_schema.get(object_type, []), 
                                production_schema.get(object_type, []))
        
        logger.info("Comparación de esquemas completada")
        return self.differences
    
    def _compare_objects(self, object_type: str, local_objects: List[Dict[str, Any]], 
                        production_objects: List[Dict[str, Any]]):
        """Comparar objetos específicos entre esquemas"""
        local_dict = self._create_object_dict(local_objects, object_type)
        production_dict = self._create_object_dict(production_objects, object_type)
        
        # Objetos añadidos (en local pero no en producción)
        for key, obj in local_dict.items():
            if key not in production_dict:
                self.differences[object_type]['added'].append(obj)
            else:
                # Verificar si el objeto fue modificado
                if self._objects_differ(obj, production_dict[key], object_type):
                    self.differences[object_type]['modified'].append({
                        'local': obj,
                        'production': production_dict[key]
                    })
        
        # Objetos removidos (en producción pero no en local)
        for key, obj in production_dict.items():
            if key not in local_dict:
                self.differences[object_type]['removed'].append(obj)
    
    def _create_object_dict(self, objects: List[Dict[str, Any]], object_type: str) -> Dict[str, Dict[str, Any]]:
        """Crear diccionario de objetos para comparación rápida"""
        obj_dict = {}
        
        for obj in objects:
            key = self._get_object_key(obj, object_type)
            obj_dict[key] = obj
        
        return obj_dict
    
    def _get_object_key(self, obj: Dict[str, Any], object_type: str) -> str:
        """Obtener clave única para el objeto"""
        if object_type == 'tables':
            return f"{obj['schemaname']}.{obj['tablename']}"
        elif object_type == 'columns':
            return f"{obj['table_schema']}.{obj['table_name']}.{obj['column_name']}"
        elif object_type == 'indexes':
            return f"{obj['schemaname']}.{obj['indexname']}"
        elif object_type == 'constraints':
            return f"{obj['table_schema']}.{obj['table_name']}.{obj['constraint_name']}"
        elif object_type == 'functions':
            return f"{obj['schema_name']}.{obj['function_name']}"
        elif object_type == 'triggers':
            return f"{obj['trigger_schema']}.{obj['trigger_name']}"
        elif object_type == 'views':
            return f"{obj['table_schema']}.{obj['table_name']}"
        elif object_type == 'sequences':
            return f"{obj['sequence_schema']}.{obj['sequence_name']}"
        elif object_type == 'types':
            return f"{obj['schema_name']}.{obj['type_name']}"
        elif object_type == 'extensions':
            return obj['extname']
        
        return str(obj)
    
    def _objects_differ(self, local_obj: Dict[str, Any], production_obj: Dict[str, Any], 
                       object_type: str) -> bool:
        """Verificar si dos objetos son diferentes"""
        # Para columnas, comparar tipo de datos, nullable, default
        if object_type == 'columns':
            return (local_obj.get('data_type') != production_obj.get('data_type') or
                    local_obj.get('is_nullable') != production_obj.get('is_nullable') or
                    local_obj.get('column_default') != production_obj.get('column_default'))
        
        # Para funciones, comparar definición
        elif object_type == 'functions':
            return local_obj.get('definition') != production_obj.get('definition')
        
        # Para triggers, comparar definición
        elif object_type == 'triggers':
            return (local_obj.get('action_statement') != production_obj.get('action_statement') or
                    local_obj.get('action_timing') != production_obj.get('action_timing'))
        
        # Para vistas, comparar definición
        elif object_type == 'views':
            return local_obj.get('view_definition') != production_obj.get('view_definition')
        
        # Para otros objetos, comparar todos los campos relevantes
        else:
            for key in local_obj.keys():
                if key in production_obj and local_obj[key] != production_obj[key]:
                    return True
        
        return False
    
    def generate_diff_report(self, differences: Dict[str, Dict[str, List]]) -> str:
        """Generar reporte de diferencias"""
        report = []
        report.append("=" * 80)
        report.append("REPORTE DE DIFERENCIAS DE ESQUEMA")
        report.append("=" * 80)
        report.append("")
        
        total_changes = 0
        
        for object_type, changes in differences.items():
            added_count = len(changes['added'])
            removed_count = len(changes['removed'])
            modified_count = len(changes['modified'])
            
            if added_count > 0 or removed_count > 0 or modified_count > 0:
                total_changes += added_count + removed_count + modified_count
                
                report.append(f"\n{object_type.upper()}:")
                report.append("-" * 40)
                
                if added_count > 0:
                    report.append(f"  AÑADIDOS ({added_count}):")
                    for obj in changes['added']:
                        report.append(f"    + {self._format_object(obj, object_type)}")
                
                if removed_count > 0:
                    report.append(f"  REMOVIDOS ({removed_count}):")
                    for obj in changes['removed']:
                        report.append(f"    - {self._format_object(obj, object_type)}")
                
                if modified_count > 0:
                    report.append(f"  MODIFICADOS ({modified_count}):")
                    for change in changes['modified']:
                        report.append(f"    ~ {self._format_object(change['local'], object_type)}")
        
        report.append(f"\n{'=' * 80}")
        report.append(f"TOTAL DE CAMBIOS: {total_changes}")
        report.append(f"{'=' * 80}")
        
        return "\n".join(report)
    
    def _format_object(self, obj: Dict[str, Any], object_type: str) -> str:
        """Formatear objeto para el reporte"""
        if object_type == 'tables':
            return f"{obj['schemaname']}.{obj['tablename']}"
        elif object_type == 'columns':
            return f"{obj['table_schema']}.{obj['table_name']}.{obj['column_name']} ({obj['data_type']})"
        elif object_type == 'indexes':
            return f"{obj['schemaname']}.{obj['indexname']}"
        elif object_type == 'constraints':
            return f"{obj['table_schema']}.{obj['table_name']}.{obj['constraint_name']} ({obj['constraint_type']})"
        elif object_type == 'functions':
            return f"{obj['schema_name']}.{obj['function_name']}"
        elif object_type == 'triggers':
            return f"{obj['trigger_schema']}.{obj['trigger_name']}"
        elif object_type == 'views':
            return f"{obj['table_schema']}.{obj['table_name']}"
        elif object_type == 'sequences':
            return f"{obj['sequence_schema']}.{obj['sequence_name']}"
        elif object_type == 'types':
            return f"{obj['schema_name']}.{obj['type_name']}"
        elif object_type == 'extensions':
            return f"{obj['extname']} (v{obj['extversion']})"
        
        return str(obj)
    
    def save_diff_report(self, report: str):
        """Guardar reporte de diferencias"""
        filepath = f"{OUTPUT_DIR}/{DIFF_REPORT_FILE}"
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(report)
        logger.info(f"Reporte de diferencias guardado en {filepath}")
    
    def has_changes(self) -> bool:
        """Verificar si hay cambios pendientes"""
        for object_type, changes in self.differences.items():
            if (len(changes['added']) > 0 or 
                len(changes['removed']) > 0 or 
                len(changes['modified']) > 0):
                return True
        return False
    
    def get_summary_table(self) -> str:
        """Obtener tabla resumen de cambios"""
        headers = ["Tipo de Objeto", "Añadidos", "Removidos", "Modificados", "Total"]
        rows = []
        
        for object_type, changes in self.differences.items():
            added = len(changes['added'])
            removed = len(changes['removed'])
            modified = len(changes['modified'])
            total = added + removed + modified
            
            if total > 0:
                rows.append([object_type.title(), added, removed, modified, total])
        
        if rows:
            return tabulate(rows, headers=headers, tablefmt="grid")
        else:
            return "No se encontraron diferencias entre los esquemas."
