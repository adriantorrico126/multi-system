/**
 * Utilidades del Sistema
 * Manejo de archivos, logs, configuración y utilidades generales
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

class SystemUtils {
  constructor() {
    this.appDataPath = this.getAppDataPath();
    this.logsPath = path.join(this.appDataPath, 'logs');
    this.configPath = path.join(this.appDataPath, 'config');
    this.printoutsPath = path.join(this.appDataPath, 'printouts');
    
    // Crear directorios necesarios
    this.ensureDirectories();
  }

  /**
   * Obtiene la ruta de datos de la aplicación según el sistema operativo
   */
  getAppDataPath() {
    const platform = os.platform();
    const appName = 'SitemmAgenteImpresion';
    
    switch (platform) {
      case 'win32':
        return path.join(process.env.APPDATA || process.env.LOCALAPPDATA, appName);
      case 'darwin':
        return path.join(os.homedir(), 'Library', 'Application Support', appName);
      case 'linux':
        return path.join(os.homedir(), '.config', appName);
      default:
        return path.join(process.cwd(), 'data');
    }
  }

  /**
   * Asegura que existan los directorios necesarios
   */
  ensureDirectories() {
    const directories = [
      this.appDataPath,
      this.logsPath,
      this.configPath,
      this.printoutsPath
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Guarda un archivo de configuración
   */
  saveConfig(configName, configData) {
    try {
      const configFile = path.join(this.configPath, `${configName}.json`);
      const configString = JSON.stringify(configData, null, 2);
      
      fs.writeFileSync(configFile, configString, 'utf8');
      
      return {
        success: true,
        path: configFile,
        message: 'Configuración guardada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error al guardar configuración'
      };
    }
  }

  /**
   * Carga un archivo de configuración
   */
  loadConfig(configName) {
    try {
      const configFile = path.join(this.configPath, `${configName}.json`);
      
      if (!fs.existsSync(configFile)) {
        return {
          success: false,
          error: 'Archivo de configuración no encontrado',
          message: 'No existe configuración previa'
        };
      }

      const configString = fs.readFileSync(configFile, 'utf8');
      const configData = JSON.parse(configString);
      
      return {
        success: true,
        data: configData,
        message: 'Configuración cargada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error al cargar configuración'
      };
    }
  }

  /**
   * Guarda un archivo de salida de impresión (modo DRY_RUN)
   */
  savePrintout(content, ticketId) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `ticket_${ticketId}_${timestamp}.txt`;
      const filepath = path.join(this.printoutsPath, filename);
      
      fs.writeFileSync(filepath, content, 'utf8');
      
      return {
        success: true,
        path: filepath,
        filename,
        message: 'Archivo de impresión guardado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error al guardar archivo de impresión'
      };
    }
  }

  /**
   * Obtiene información del sistema
   */
  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      username: os.userInfo().username,
      homedir: os.homedir(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      uptime: os.uptime(),
      nodeVersion: process.version,
      appDataPath: this.appDataPath
    };
  }

  /**
   * Genera un ID único para el agente
   */
  generateAgentId() {
    return uuidv4();
  }

  /**
   * Valida una configuración
   */
  validateConfig(config) {
    const errors = [];

    // Validar configuración del servidor
    if (!config.server?.url) {
      errors.push('URL del servidor no especificada');
    }

    if (!config.agent?.restauranteId) {
      errors.push('ID del restaurante no especificado');
    }

    if (!config.agent?.token) {
      errors.push('Token de autenticación no especificado');
    }

    if (!config.printer?.type) {
      errors.push('Tipo de impresora no especificado');
    }

    if (!config.printer?.interface) {
      errors.push('Interfaz de impresora no especificada');
    }

    return {
      isValid: errors.length === 0,
      errors,
      message: errors.length === 0 ? 'Configuración válida' : 'Configuración inválida'
    };
  }

  /**
   * Limpia archivos antiguos
   */
  cleanupOldFiles(directory, maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 días por defecto
    try {
      if (!fs.existsSync(directory)) return;

      const files = fs.readdirSync(directory);
      const now = Date.now();
      let deletedCount = 0;

      files.forEach(file => {
        const filepath = path.join(directory, file);
        const stats = fs.statSync(filepath);
        const age = now - stats.mtime.getTime();

        if (age > maxAge) {
          fs.unlinkSync(filepath);
          deletedCount++;
        }
      });

      return {
        success: true,
        deletedCount,
        message: `${deletedCount} archivos antiguos eliminados`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error al limpiar archivos antiguos'
      };
    }
  }

  /**
   * Obtiene estadísticas de uso de disco
   */
  getDiskUsage() {
    try {
      const stats = fs.statSync(this.appDataPath);
      const totalSize = this.calculateDirectorySize(this.appDataPath);
      
      return {
        success: true,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        lastModified: stats.mtime,
        message: 'Estadísticas de disco obtenidas'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error al obtener estadísticas de disco'
      };
    }
  }

  /**
   * Calcula el tamaño de un directorio recursivamente
   */
  calculateDirectorySize(dirPath) {
    let totalSize = 0;

    try {
      const items = fs.readdirSync(dirPath);
      
      items.forEach(item => {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          totalSize += this.calculateDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
        }
      });
    } catch (error) {
      // Ignorar errores de acceso
    }

    return totalSize;
  }

  /**
   * Crea un backup de la configuración
   */
  createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(this.appDataPath, 'backups');
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupPath = path.join(backupDir, `config_backup_${timestamp}.json`);
      
      // Copiar archivos de configuración
      const configFiles = fs.readdirSync(this.configPath);
      const backupData = {};
      
      configFiles.forEach(file => {
        if (file.endsWith('.json')) {
          const configName = path.basename(file, '.json');
          const configPath = path.join(this.configPath, file);
          const configContent = fs.readFileSync(configPath, 'utf8');
          backupData[configName] = JSON.parse(configContent);
        }
      });

      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
      
      return {
        success: true,
        path: backupPath,
        message: 'Backup creado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error al crear backup'
      };
    }
  }
}

module.exports = SystemUtils;
