#!/usr/bin/env python3
"""
Script de Respaldo para Base de Datos
Sistema POS - Pago Diferido

Este script crea respaldos de la base de datos antes de ejecutar migraciones
"""

import os
import sys
import subprocess
import datetime
from migrate import DatabaseMigrator, load_config

def create_backup(environment: str, backup_dir: str = "backups"):
    """
    Crea un respaldo de la base de datos
    
    Args:
        environment: 'local' o 'production'
        backup_dir: Directorio donde guardar los respaldos
    """
    config = load_config(environment)
    
    # Crear directorio de respaldos si no existe
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    
    # Generar nombre del archivo de respaldo
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"{environment}_{config['database']}_{timestamp}.sql"
    backup_path = os.path.join(backup_dir, backup_filename)
    
    print(f"🔄 Creando respaldo de {environment}...")
    print(f"📁 Archivo: {backup_path}")
    
    # Comando pg_dump
    dump_command = f"""pg_dump -h {config['host']} -p {config['port']} -U {config['user']} -d {config['database']} --no-password > {backup_path}"""
    
    # Establecer variable de entorno para la contraseña
    env = os.environ.copy()
    env['PGPASSWORD'] = config['password']
    
    try:
        result = subprocess.run(
            dump_command, 
            shell=True, 
            env=env, 
            capture_output=True, 
            text=True
        )
        
        if result.returncode == 0:
            # Verificar que el archivo se creó y tiene contenido
            if os.path.exists(backup_path) and os.path.getsize(backup_path) > 0:
                print(f"✅ Respaldo creado exitosamente: {backup_path}")
                print(f"📊 Tamaño: {os.path.getsize(backup_path)} bytes")
                return backup_path
            else:
                print(f"❌ El archivo de respaldo está vacío o no se creó")
                return None
        else:
            print(f"❌ Error creando respaldo: {result.stderr}")
            return None
            
    except Exception as e:
        print(f"❌ Error ejecutando pg_dump: {e}")
        return None

def restore_backup(environment: str, backup_path: str):
    """
    Restaura un respaldo de la base de datos
    
    Args:
        environment: 'local' o 'production'
        backup_path: Ruta al archivo de respaldo
    """
    config = load_config(environment)
    
    if not os.path.exists(backup_path):
        print(f"❌ Archivo de respaldo no encontrado: {backup_path}")
        return False
    
    print(f"🔄 Restaurando respaldo en {environment}...")
    print(f"📁 Archivo: {backup_path}")
    
    # Comando psql para restaurar
    restore_command = f"""psql -h {config['host']} -p {config['port']} -U {config['user']} -d {config['database']} --no-password < {backup_path}"""
    
    # Establecer variable de entorno para la contraseña
    env = os.environ.copy()
    env['PGPASSWORD'] = config['password']
    
    try:
        result = subprocess.run(
            restore_command, 
            shell=True, 
            env=env, 
            capture_output=True, 
            text=True
        )
        
        if result.returncode == 0:
            print(f"✅ Respaldo restaurado exitosamente")
            return True
        else:
            print(f"❌ Error restaurando respaldo: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error ejecutando psql: {e}")
        return False

def list_backups(backup_dir: str = "backups"):
    """Lista los respaldos disponibles"""
    if not os.path.exists(backup_dir):
        print(f"❌ Directorio de respaldos no encontrado: {backup_dir}")
        return []
    
    backups = []
    for filename in os.listdir(backup_dir):
        if filename.endswith('.sql'):
            filepath = os.path.join(backup_dir, filename)
            size = os.path.getsize(filepath)
            modified = datetime.datetime.fromtimestamp(os.path.getmtime(filepath))
            backups.append({
                'filename': filename,
                'filepath': filepath,
                'size': size,
                'modified': modified
            })
    
    # Ordenar por fecha de modificación (más reciente primero)
    backups.sort(key=lambda x: x['modified'], reverse=True)
    
    return backups

def main():
    """Función principal"""
    if len(sys.argv) < 2:
        print("Uso: python backup.py <comando> [argumentos]")
        print("Comandos:")
        print("  create <entorno>     - Crear respaldo")
        print("  restore <entorno> <archivo> - Restaurar respaldo")
        print("  list                 - Listar respaldos disponibles")
        print("Ejemplos:")
        print("  python backup.py create local")
        print("  python backup.py create production")
        print("  python backup.py restore local backups/local_sistempos_20250109_143022.sql")
        print("  python backup.py list")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "create":
        if len(sys.argv) < 3:
            print("❌ Especifica el entorno: local o production")
            sys.exit(1)
        
        environment = sys.argv[2]
        if environment not in ['local', 'production']:
            print("❌ Entorno no válido. Usa 'local' o 'production'")
            sys.exit(1)
        
        backup_path = create_backup(environment)
        if backup_path:
            print(f"\n💡 Para restaurar este respaldo:")
            print(f"python backup.py restore {environment} {backup_path}")
    
    elif command == "restore":
        if len(sys.argv) < 4:
            print("❌ Especifica el entorno y archivo de respaldo")
            sys.exit(1)
        
        environment = sys.argv[2]
        backup_path = sys.argv[3]
        
        if environment not in ['local', 'production']:
            print("❌ Entorno no válido. Usa 'local' o 'production'")
            sys.exit(1)
        
        # Confirmar antes de restaurar
        print(f"⚠️ ADVERTENCIA: Esto sobrescribirá la base de datos {environment}")
        print(f"📁 Archivo: {backup_path}")
        confirm = input("¿Continuar? (escribe 'SI' para confirmar): ")
        
        if confirm == 'SI':
            restore_backup(environment, backup_path)
        else:
            print("❌ Operación cancelada")
    
    elif command == "list":
        backups = list_backups()
        if backups:
            print("📋 Respaldo disponibles:")
            print("-" * 80)
            for backup in backups:
                size_mb = backup['size'] / (1024 * 1024)
                print(f"📁 {backup['filename']}")
                print(f"   📊 Tamaño: {size_mb:.2f} MB")
                print(f"   📅 Modificado: {backup['modified'].strftime('%Y-%m-%d %H:%M:%S')}")
                print()
        else:
            print("ℹ️ No hay respaldos disponibles")
    
    else:
        print(f"❌ Comando no válido: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()
