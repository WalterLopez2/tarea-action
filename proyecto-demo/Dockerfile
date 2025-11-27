# Usa una imagen base de Node.js
FROM node:18-alpine

# Información del mantenedor
LABEL maintainer="tu-email@example.com"
LABEL description="Aplicación de demostración CI/CD con GitHub Actions"

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm ci --only=production

# Copia el código de la aplicación
COPY index.js .
COPY test.js .

# Expone el puerto (aunque esta app no es un servidor, es para demostración)
EXPOSE 3000

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Comando por defecto
CMD ["node", "index.js"]
