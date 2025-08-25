# Usar una imagen base de Node.js ligera y específica
FROM node:18-alpine

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar los archivos de dependencias
COPY package*.json ./

# Instalar solo las dependencias de producción
RUN npm ci --only=production

# Copiar el código fuente compilado
COPY dist ./dist

# Exponer el puerto en el que corre la aplicación (el del error era 8080)
EXPOSE 8080

# El comando para iniciar la aplicación
CMD [ "node", "dist/index.js" ]