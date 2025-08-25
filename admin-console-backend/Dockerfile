# --- Etapa 1: Construcción (Builder) ---
FROM node:18-alpine AS builder

# Establecer el directorio de trabajo
WORKDIR /usr/src/app

# Copiar los archivos de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (incluidas las de desarrollo para poder construir)
RUN npm install

# Copiar todo el código fuente (incluida la carpeta src)
COPY . .

# Ejecutar el script de construcción para generar la carpeta /dist
RUN npm run build

# --- Etapa 2: Producción ---
FROM node:18-alpine

# Establecer el directorio de trabajo
WORKDIR /usr/src/app

# Copiar solo el package.json para instalar dependencias de producción
COPY package*.json ./
RUN npm ci --only=production

# Copiar la carpeta 'dist' generada en la etapa de 'builder'
COPY --from=builder /usr/src/app/dist ./dist

# Exponer el puerto de la aplicación
EXPOSE 8080

# Comando para iniciar la aplicación
CMD [ "node", "dist/index.js" ]
