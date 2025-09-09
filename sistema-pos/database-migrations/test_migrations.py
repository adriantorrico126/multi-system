#!/usr/bin/env python3
"""
Script de Prueba para el Sistema de Migraciones
Verifica que las migraciones se ejecuten correctamente
"""

import os
import sys
import subprocess
import time

def run_command(command):
    """Ejecuta un comando y retorna el resultado"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def test_local_connection():
    """Prueba la conexión local"""
    print("🔍 Probando conexión local...")
    success, stdout, stderr = run_command("python migrate.py local")
    
    if success:
        print("✅ Conexión local exitosa")
        return True
    else:
        print(f"❌ Error en conexión local: {stderr}")
        return False

def test_production_connection():
    """Prueba la conexión a producción (solo verificación)"""
    print("🔍 Probando conexión a producción...")
    success, stdout, stderr = run_command("python migrate.py production")
    
    if success:
        print("✅ Conexión a producción exitosa")
        return True
    else:
        print(f"❌ Error en conexión a producción: {stderr}")
        return False

def check_migration_files():
    """Verifica que los archivos de migración existan"""
    print("🔍 Verificando archivos de migración...")
    
    required_files = [
        "migrate.py",
        "migrations/001_add_pago_diferido_tables.sql",
        "migrations/002_cleanup_metodos_pago.sql",
        "requirements.txt",
        "README.md"
    ]
    
    all_exist = True
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - NO ENCONTRADO")
            all_exist = False
    
    return all_exist

def install_dependencies():
    """Instala las dependencias de Python"""
    print("🔍 Instalando dependencias...")
    success, stdout, stderr = run_command("pip install -r requirements.txt")
    
    if success:
        print("✅ Dependencias instaladas correctamente")
        return True
    else:
        print(f"❌ Error instalando dependencias: {stderr}")
        return False

def main():
    """Función principal de prueba"""
    print("🚀 Iniciando pruebas del Sistema de Migraciones")
    print("=" * 50)
    
    # Verificar archivos
    if not check_migration_files():
        print("❌ Faltan archivos necesarios")
        return False
    
    # Instalar dependencias
    if not install_dependencies():
        print("❌ No se pudieron instalar las dependencias")
        return False
    
    print("\n" + "=" * 50)
    print("📋 Resumen de Pruebas:")
    
    # Probar conexiones
    local_ok = test_local_connection()
    production_ok = test_production_connection()
    
    print("\n" + "=" * 50)
    if local_ok and production_ok:
        print("🎉 ¡Todas las pruebas pasaron exitosamente!")
        print("\n📝 Próximos pasos:")
        print("1. Ejecutar migraciones en local: python migrate.py local")
        print("2. Verificar funcionalidad del sistema")
        print("3. Ejecutar en producción: python migrate.py production")
        return True
    else:
        print("💥 Algunas pruebas fallaron")
        print("\n🔧 Verificar:")
        print("- Credenciales de base de datos")
        print("- Conectividad de red")
        print("- Instalación de dependencias")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
