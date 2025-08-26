# Usar una imagen base de Node.js ligera y específica
FROM node:18-alpine

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar los archivos de dependencias
COPY package*.json ./

# Instalar solo las dependencias de producción
RUN npm ci --only=production

# Copiar el resto del código fuente
COPY . .

# Exponer el puerto en el que corre la aplicación (asumiremos 3000, cámbialo si es otro)
EXPOSE 3000

# El comando para iniciar la aplicación (ajústalo si tu archivo principal es otro)
CMD [ "node", "db_test.js" ]