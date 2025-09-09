#!/usr/bin/env python3
"""
Script para verificar y actualizar el código del backend en producción.
Este script asegura que el código de producción tenga las correcciones para prefacturas.
"""

import os
import shutil
import logging
import sys
from datetime import datetime

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('actualizar_backend_produccion.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def verificar_archivos_codigo():
    """Verificar que los archivos de código local tienen las correcciones"""
    archivos_criticos = [
        'sistema-pos/vegetarian_restaurant_backend/src/controllers/mesaController.js',
        'sistema-pos/vegetarian_restaurant_backend/src/models/mesaModel.js'
    ]
    
    logger.info("🔍 Verificando archivos de código local...")
    
    for archivo in archivos_criticos:
        if not os.path.exists(archivo):
            logger.error(f"❌ Archivo no encontrado: {archivo}")
            return False
        
        # Verificar que el archivo tiene las correcciones necesarias
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
            
            if 'fecha_apertura' in contenido and 'fecha >= $' in contenido:
                logger.info(f"✅ {archivo} tiene las correcciones necesarias")
            else:
                logger.warning(f"⚠️ {archivo} puede no tener todas las correcciones")
    
    return True

def crear_backup_produccion():
    """Crear backup del código de producción"""
    logger.info("💾 Creando backup del código de producción...")
    
    # Configurar rutas según el entorno
    ruta_produccion = os.getenv('BACKEND_PRODUCTION_PATH', '/path/to/production/backend')
    ruta_backup = f"backup_backend_produccion_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    if not os.path.exists(ruta_produccion):
        logger.error(f"❌ Ruta de producción no encontrada: {ruta_produccion}")
        logger.info("💡 Configurar la variable BACKEND_PRODUCTION_PATH")
        return False
    
    try:
        shutil.copytree(ruta_produccion, ruta_backup)
        logger.info(f"✅ Backup creado en: {ruta_backup}")
        return True
    except Exception as e:
        logger.error(f"❌ Error creando backup: {e}")
        return False

def actualizar_archivos_codigo():
    """Actualizar archivos de código en producción"""
    logger.info("🔄 Actualizando archivos de código en producción...")
    
    archivos_a_actualizar = [
        {
            'local': 'sistema-pos/vegetarian_restaurant_backend/src/controllers/mesaController.js',
            'produccion': 'src/controllers/mesaController.js'
        },
        {
            'local': 'sistema-pos/vegetarian_restaurant_backend/src/models/mesaModel.js',
            'produccion': 'src/models/mesaModel.js'
        }
    ]
    
    ruta_produccion = os.getenv('BACKEND_PRODUCTION_PATH', '/path/to/production/backend')
    
    for archivo in archivos_a_actualizar:
        ruta_local = archivo['local']
        ruta_prod = os.path.join(ruta_produccion, archivo['produccion'])
        
        if not os.path.exists(ruta_local):
            logger.error(f"❌ Archivo local no encontrado: {ruta_local}")
            continue
        
        try:
            # Copiar archivo local a producción
            shutil.copy2(ruta_local, ruta_prod)
            logger.info(f"✅ Actualizado: {archivo['produccion']}")
        except Exception as e:
            logger.error(f"❌ Error actualizando {archivo['produccion']}: {e}")

def verificar_correcciones_aplicadas():
    """Verificar que las correcciones se aplicaron correctamente"""
    logger.info("🔍 Verificando que las correcciones se aplicaron...")
    
    archivos_verificar = [
        'src/controllers/mesaController.js',
        'src/models/mesaModel.js'
    ]
    
    ruta_produccion = os.getenv('BACKEND_PRODUCTION_PATH', '/path/to/production/backend')
    
    for archivo in archivos_verificar:
        ruta_completa = os.path.join(ruta_produccion, archivo)
        
        if not os.path.exists(ruta_completa):
            logger.error(f"❌ Archivo no encontrado en producción: {archivo}")
            continue
        
        try:
            with open(ruta_completa, 'r', encoding='utf-8') as f:
                contenido = f.read()
                
                # Verificar correcciones específicas
                correcciones = [
                    'fecha_apertura',
                    'fecha >= $',
                    'ORDER BY fecha_apertura DESC',
                    'LIMIT 1'
                ]
                
                correcciones_encontradas = sum(1 for corr in correcciones if corr in contenido)
                logger.info(f"📊 {archivo}: {correcciones_encontradas}/{len(correcciones)} correcciones encontradas")
                
        except Exception as e:
            logger.error(f"❌ Error verificando {archivo}: {e}")

def reiniciar_servicio_backend():
    """Reiniciar el servicio del backend"""
    logger.info("🔄 Reiniciando servicio del backend...")
    
    comando_reinicio = os.getenv('BACKEND_RESTART_COMMAND', 'systemctl restart backend-service')
    
    try:
        import subprocess
        result = subprocess.run(comando_reinicio, shell=True, capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info("✅ Servicio del backend reiniciado exitosamente")
        else:
            logger.error(f"❌ Error reiniciando servicio: {result.stderr}")
            
    except Exception as e:
        logger.error(f"❌ Error ejecutando comando de reinicio: {e}")

def main():
    """Función principal"""
    logger.info("🚀 Iniciando actualización del backend en producción")
    logger.info(f"📅 Fecha y hora: {datetime.now()}")
    
    try:
        # 1. Verificar archivos locales
        if not verificar_archivos_codigo():
            logger.error("❌ Archivos locales no verificados correctamente")
            return False
        
        # 2. Crear backup de producción
        if not crear_backup_produccion():
            logger.error("❌ No se pudo crear backup de producción")
            return False
        
        # 3. Actualizar archivos de código
        actualizar_archivos_codigo()
        
        # 4. Verificar correcciones aplicadas
        verificar_correcciones_aplicadas()
        
        # 5. Reiniciar servicio (opcional)
        reiniciar_servicio_backend()
        
        logger.info("✅ Actualización del backend completada")
        logger.info("📋 Revisar el archivo de log para detalles completos")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error durante la actualización: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
