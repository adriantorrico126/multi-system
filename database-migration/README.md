# Sistema de Migración de Base de Datos PostgreSQL

Este sistema permite migrar cambios estructurales de una base de datos PostgreSQL local a una de producción de manera segura, sin afectar los datos existentes.

## 🚀 Características

- **Migración segura**: Solo cambios estructurales, sin afectar datos
- **Backup automático**: Crea respaldos antes de cada migración
- **Validación**: Verifica scripts antes de ejecutarlos
- **Rollback**: Genera scripts de reversión automáticamente
- **Reportes detallados**: Compara esquemas y genera reportes
- **Modo dry-run**: Prueba migraciones sin ejecutarlas

## 📋 Requisitos

- Python 3.8+
- PostgreSQL 12+
- Acceso a ambas bases de datos (local y producción)
- Herramientas de línea de comandos de PostgreSQL (pg_dump, psql)

## 🛠️ Instalación

1. **Instalar dependencias**:
```bash
cd database-migration
pip install -r requirements.txt
```

2. **Verificar configuración**:
   - Revisar `config.py` para ajustar credenciales si es necesario
   - Asegurar que las herramientas de PostgreSQL estén en el PATH

## 📖 Uso

### Comandos disponibles

```bash
# Probar conexiones
python main.py test

# Extraer esquemas
python main.py extract

# Comparar esquemas
python main.py compare

# Generar script de migración
python main.py generate

# Ejecutar migración (dry-run)
python main.py dry-run

# Ejecutar migración real
python main.py migrate

# Ver estado del sistema
python main.py status
```

### Flujo de trabajo recomendado

1. **Probar conexiones**:
```bash
python main.py test
```

2. **Extraer y comparar esquemas**:
```bash
python main.py extract
python main.py compare
```

3. **Generar script de migración**:
```bash
python main.py generate
```

4. **Probar migración (dry-run)**:
```bash
python main.py dry-run
```

5. **Ejecutar migración real**:
```bash
python main.py migrate
```

## 📁 Estructura de archivos

```
database-migration/
├── config.py              # Configuración de conexiones
├── database_manager.py     # Gestor de conexiones
├── schema_extractor.py     # Extractor de esquemas
├── schema_comparator.py    # Comparador de esquemas
├── migration_generator.py  # Generador de scripts
├── migration_runner.py     # Ejecutor de migraciones
├── main.py                # Script principal
├── requirements.txt       # Dependencias Python
├── README.md             # Este archivo
└── migration_output/     # Archivos generados
    ├── local_schema.sql
    ├── production_schema.sql
    ├── migration_script.sql
    ├── rollback_script.sql
    └── schema_diff_report.txt
```

## 🔧 Configuración

### Credenciales de base de datos

Editar `config.py`:

```python
# Base de datos local
LOCAL_DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'user': 'postgres',
    'password': 'tu_password_local',
    'database': 'tu_db_local'
}

# Base de datos de producción
PRODUCTION_DB_CONFIG = {
    'host': 'tu_host_produccion',
    'port': 25060,
    'user': 'tu_usuario',
    'password': 'tu_password',
    'database': 'tu_db_produccion'
}
```

## 🛡️ Seguridad

### Verificaciones automáticas

- **No DROP**: El sistema evita comandos destructivos
- **Backup obligatorio**: Crea respaldos antes de migrar
- **Validación de scripts**: Verifica sintaxis y seguridad
- **Transacciones**: Usa BEGIN/COMMIT para atomicidad

### Comandos prohibidos

El sistema detecta y rechaza:
- `DROP TABLE`
- `DROP DATABASE`
- `TRUNCATE`
- `DELETE FROM`

## 📊 Tipos de objetos migrados

- ✅ **Tablas**: Creación de nuevas tablas
- ✅ **Columnas**: Adición de nuevas columnas
- ✅ **Índices**: Creación de índices
- ✅ **Restricciones**: Claves primarias, foráneas, únicas
- ✅ **Funciones**: Funciones y procedimientos
- ✅ **Triggers**: Triggers de base de datos
- ✅ **Vistas**: Vistas y vistas materializadas
- ✅ **Secuencias**: Secuencias de números
- ✅ **Tipos**: Tipos de datos personalizados
- ✅ **Extensiones**: Extensiones de PostgreSQL

## 🔄 Proceso de migración

### 1. Extracción de esquemas
- Conecta a ambas bases de datos
- Extrae metadatos de todos los objetos
- Guarda esquemas en archivos SQL

### 2. Comparación
- Compara esquemas local vs producción
- Identifica objetos añadidos, removidos y modificados
- Genera reporte detallado de diferencias

### 3. Generación de scripts
- Crea script de migración con solo cambios necesarios
- Genera script de rollback automáticamente
- Incluye verificaciones de seguridad

### 4. Ejecución
- Crea backup de producción
- Valida script de migración
- Ejecuta migración en transacción
- Confirma éxito o rollback automático

## 📝 Ejemplo de uso

```bash
# 1. Probar conexiones
$ python main.py test
🔍 Probando conexiones...
✅ Conexión local exitosa
✅ Conexión de producción exitosa

# 2. Extraer esquemas
$ python main.py extract
📊 Extrayendo esquemas...
Extrayendo esquema local...
Extrayendo esquema de producción...
✅ Esquemas extraídos exitosamente

# 3. Comparar esquemas
$ python main.py compare
🔍 Comparando esquemas...

📋 RESUMEN DE CAMBIOS:
+----------+-----------+-----------+-------------+-------+
| Tipo de Objeto | Añadidos | Removidos | Modificados | Total |
+----------+-----------+-----------+-------------+-------+
| Tables   |     2     |     0     |      0      |   2   |
| Columns  |     5     |     0     |      0      |   5   |
| Indexes  |     3     |     0     |      0      |   3   |
+----------+-----------+-----------+-------------+-------+

# 4. Generar migración
$ python main.py generate
📝 Generando script de migración...
✅ Scripts de migración generados exitosamente
📁 Script de migración: migration_script.sql
📁 Script de rollback: rollback_script.sql

# 5. Probar migración
$ python main.py dry-run
🧪 MODO DRY RUN - Validando script sin ejecutar...
✅ Script de migración válido

# 6. Ejecutar migración
$ python main.py migrate
🚀 Ejecutando migración...
Creando backup de la base de datos...
Backup creado exitosamente: backup_pre_migration_20241201_143022.sql
Ejecutando migración...
✅ Migración ejecutada exitosamente
```

## 🚨 Solución de problemas

### Error de conexión
- Verificar credenciales en `config.py`
- Comprobar que PostgreSQL esté ejecutándose
- Verificar firewall y red

### Error de permisos
- Asegurar que el usuario tenga permisos suficientes
- Verificar que las herramientas de PostgreSQL estén instaladas

### Error de validación
- Revisar el script generado manualmente
- Verificar que no contenga comandos prohibidos
- Comprobar sintaxis SQL

## 📞 Soporte

Para problemas o preguntas:
1. Revisar logs en `migration.log`
2. Verificar estado con `python main.py status`
3. Consultar reportes en `migration_output/`

## 🔄 Actualizaciones

Para actualizar el sistema:
1. Hacer backup de la configuración
2. Actualizar código
3. Reinstalar dependencias si es necesario
4. Probar con `python main.py test`
