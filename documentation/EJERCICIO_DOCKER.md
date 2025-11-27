# Ejercicio: Docker y GitHub Packages
## Publicación Automática de Contenedores con GitHub Actions

---

## Objetivos

1. Crear un Dockerfile para contenerizar la aplicación
2. Configurar Docker Compose para orquestación local
3. Automatizar la publicación de imágenes Docker a GitHub Container Registry
4. Publicar automáticamente cuando se crea un release con tag (ej: v0.0.1)

---

## Parte 1: Dockerfile

### ¿Qué es un Dockerfile?

Un Dockerfile es un archivo de texto que contiene instrucciones para construir una imagen Docker. Define:
- La imagen base a usar
- Las dependencias a instalar
- Los archivos a copiar
- El comando a ejecutar

### Nuestro Dockerfile

```dockerfile
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
```

### Explicación de cada sección:

1. **FROM node:18-alpine**
   - Usa Node.js 18 en Alpine Linux (imagen ligera)
   - Alpine es una distribución mínima (~5MB vs ~900MB de Ubuntu)

2. **LABEL**
   - Metadatos de la imagen
   - Útil para documentación y organización

3. **WORKDIR /app**
   - Establece el directorio de trabajo dentro del contenedor
   - Todos los comandos siguientes se ejecutan aquí

4. **COPY package*.json ./**
   - Copia primero solo los archivos de dependencias
   - Aprovecha el cache de Docker (si package.json no cambia, usa cache)

5. **RUN npm ci --only=production**
   - Instala dependencias de producción
   - `npm ci` es más rápido y reproducible que `npm install`

6. **COPY index.js . y COPY test.js .**
   - Copia el código fuente

7. **EXPOSE 3000**
   - Documenta qué puerto usa la aplicación
   - No abre el puerto (eso se hace con `-p` en `docker run`)

8. **USER nodejs**
   - Crea y usa un usuario no-root por seguridad
   - Principio de menor privilegio

9. **CMD ["node", "index.js"]**
   - Comando que se ejecuta al iniciar el contenedor

### Construir la imagen localmente:

```bash
# Construir la imagen
docker build -t cicd-demo:latest .

# Ver la imagen creada
docker images

# Ejecutar el contenedor
docker run --rm cicd-demo:latest

# Ver logs
docker logs <container-id>
```

---

## Parte 2: Docker Compose

### ¿Qué es Docker Compose?

Docker Compose permite definir y ejecutar aplicaciones Docker multi-contenedor usando un archivo YAML.

### Nuestro docker-compose.yml

```yaml
version: '3.8'

services:
  # Aplicación principal
  app:
    build:
      context: .
      dockerfile: Dockerfile
    image: cicd-demo-app:latest
    container_name: cicd-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    networks:
      - app-network

  # Servicio de prueba - ejecuta los tests
  test:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: cicd-test
    command: npm test
    environment:
      - NODE_ENV=test
    networks:
      - app-network
    depends_on:
      - app
    profiles:
      - test

networks:
  app-network:
    driver: bridge
```

### Explicación:

1. **version: '3.8'**
   - Versión del formato de Docker Compose

2. **services**
   - Define los contenedores que componen la aplicación

3. **app (servicio principal)**
   - `build`: Construye desde el Dockerfile local
   - `image`: Nombre de la imagen resultante
   - `container_name`: Nombre del contenedor
   - `restart`: Política de reinicio
   - `environment`: Variables de entorno
   - `networks`: Red a la que pertenece

4. **test (servicio de testing)**
   - `command`: Sobrescribe el CMD del Dockerfile
   - `depends_on`: Espera a que `app` inicie
   - `profiles`: Solo se ejecuta cuando se especifica

5. **networks**
   - Define redes personalizadas
   - Los contenedores en la misma red pueden comunicarse

### Usar Docker Compose:

```bash
# Levantar los servicios
docker-compose up

# Levantar en background
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ejecutar el servicio de test
docker-compose --profile test up

# Parar los servicios
docker-compose down

# Reconstruir las imágenes
docker-compose build

# Ver estado de los servicios
docker-compose ps
```

---

## Parte 3: GitHub Actions Workflow

### Workflow: publish-docker.yml

Este workflow:
1. Se dispara cuando se crea un release con tag
2. Construye la imagen Docker
3. La publica en GitHub Container Registry (ghcr.io)
4. Genera múltiples tags automáticamente

```yaml
name: Build and Publish Docker Image

# Se ejecuta cuando se crea un release con tag (ej: v0.0.1)
on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      tag:
        description: 'Tag version (e.g., v0.0.1)'
        required: true
        default: 'v0.0.1'

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    name: Build and Push Docker Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout código
        uses: actions/checkout@v3

      - name: Configurar Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login a GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extraer metadata para Docker
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=semver,pattern={{major}}
            type=sha
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build y Push de imagen Docker
        uses: docker/build-push-action@v4
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Componentes clave:

1. **Trigger on release**
   ```yaml
   on:
     release:
       types: [published]
   ```
   - Se ejecuta al publicar un release en GitHub

2. **Permisos**
   ```yaml
   permissions:
     contents: read
     packages: write
   ```
   - `packages: write` permite publicar en GitHub Packages

3. **Docker Buildx**
   - Permite builds multi-plataforma (amd64, arm64)
   - Usa cache para acelerar builds

4. **Login a GitHub Container Registry**
   - Usa `GITHUB_TOKEN` automático
   - No requiere crear secrets manualmente

5. **Metadata extraction**
   - Genera tags automáticamente desde el tag del release
   - Ejemplo: `v0.0.1` genera:
     - `ghcr.io/usuario/repo:0.0.1`
     - `ghcr.io/usuario/repo:0.0`
     - `ghcr.io/usuario/repo:0`
     - `ghcr.io/usuario/repo:latest`
     - `ghcr.io/usuario/repo:sha-abc123`

6. **Build and Push**
   - Construye para múltiples arquitecturas
   - Usa cache de GitHub Actions
   - Sube automáticamente a ghcr.io

---

## Parte 4: Paso a Paso - Publicar tu Primera Imagen

### Paso 1: Preparar el repositorio

1. Copia estos archivos a tu repositorio:
   - `Dockerfile`
   - `docker-compose.yml`
   - `publish-docker.yml` (en `.github/workflows/`)

2. Haz commit y push:
   ```bash
   git add Dockerfile docker-compose.yml .github/workflows/publish-docker.yml
   git commit -m "Add Docker support and publish workflow"
   git push origin main
   ```

### Paso 2: Configurar el paquete como público

1. Ve a Settings > Actions > General
2. En "Workflow permissions", asegúrate que está en "Read and write permissions"
3. Guarda los cambios

### Paso 3: Crear un Release con Tag

**Opción A: Desde la interfaz de GitHub**

1. Ve a tu repositorio en GitHub
2. Click en "Releases" (lado derecho)
3. Click en "Create a new release"
4. En "Choose a tag", escribe: `v0.0.1`
5. En "Release title", escribe: `Release v0.0.1`
6. En "Description", escribe:
   ```
   Primera versión con soporte Docker

   Cambios:
   - Agregado Dockerfile
   - Agregado docker-compose.yml
   - Publicación automática a GitHub Packages
   ```
7. Click en "Publish release"

**Opción B: Desde la línea de comandos**

```bash
# Crear un tag
git tag -a v0.0.1 -m "Release v0.0.1"

# Subir el tag
git push origin v0.0.1

# Crear el release usando GitHub CLI
gh release create v0.0.1 \
  --title "Release v0.0.1" \
  --notes "Primera versión con soporte Docker"
```

### Paso 4: Verificar el Workflow

1. Ve a la pestaña "Actions" en tu repositorio
2. Verás el workflow "Build and Publish Docker Image" ejecutándose
3. Click en el workflow para ver los detalles
4. Observa cada step:
   - Checkout del código
   - Configuración de Docker Buildx
   - Login a GitHub Container Registry
   - Extracción de metadata
   - Build y Push de la imagen
   - Test de la imagen

### Paso 5: Ver tu imagen en GitHub Packages

1. Ve a tu repositorio en GitHub
2. Click en "Packages" (lado derecho)
3. Verás tu imagen Docker publicada
4. Click en la imagen para ver:
   - Tags disponibles
   - Instrucciones de uso
   - Información de la imagen

---

## Parte 5: Usar la Imagen Publicada

### Hacer la imagen pública

1. Ve a tu paquete en GitHub
2. Click en "Package settings"
3. En "Danger Zone", click en "Change visibility"
4. Selecciona "Public"
5. Confirma el cambio

### Pull y Run de la imagen

```bash
# Login a GitHub Container Registry (si el paquete es privado)
echo $GITHUB_TOKEN | docker login ghcr.io -u TU_USUARIO --password-stdin

# Pull de la imagen
docker pull ghcr.io/tu-usuario/tu-repo:latest

# Ejecutar la imagen
docker run --rm ghcr.io/tu-usuario/tu-repo:latest

# O usar un tag específico
docker pull ghcr.io/tu-usuario/tu-repo:0.0.1
docker run --rm ghcr.io/tu-usuario/tu-repo:0.0.1
```

### Usar en docker-compose

Actualiza `docker-compose.yml`:

```yaml
services:
  app:
    image: ghcr.io/tu-usuario/tu-repo:latest
    # Ya no necesitas "build" si usas la imagen publicada
    container_name: cicd-app
    restart: unless-stopped
```

Luego:

```bash
docker-compose pull
docker-compose up
```

---

## Parte 6: Versionado Semántico

### Formato de tags

Usa [Semantic Versioning](https://semver.org/):

- **v1.0.0**: Versión mayor (breaking changes)
- **v0.1.0**: Versión menor (nuevas features, backward compatible)
- **v0.0.1**: Patch (bug fixes)

### Ejemplos de releases:

```bash
# Primera versión
git tag -a v0.0.1 -m "Initial release"

# Bug fix
git tag -a v0.0.2 -m "Fix calculation error"

# Nueva feature
git tag -a v0.1.0 -m "Add new math functions"

# Breaking change
git tag -a v1.0.0 -m "Refactor API"

# Subir todos los tags
git push origin --tags
```

### Tags automáticos generados:

Para release `v1.2.3`, el workflow genera:
- `ghcr.io/usuario/repo:1.2.3`
- `ghcr.io/usuario/repo:1.2`
- `ghcr.io/usuario/repo:1`
- `ghcr.io/usuario/repo:latest`
- `ghcr.io/usuario/repo:sha-abc123`

Esto permite a los usuarios elegir qué nivel de actualización quieren:
- `latest`: Siempre la última versión
- `1`: Última versión de la v1
- `1.2`: Última patch de la v1.2
- `1.2.3`: Versión específica

---

## Parte 7: Mejores Prácticas

### Dockerfile

1. **Usa imágenes base pequeñas**
   - Prefiere Alpine Linux cuando sea posible
   - Reduce superficie de ataque y tamaño de imagen

2. **Multi-stage builds** (para aplicaciones compiladas)
   ```dockerfile
   # Stage 1: Build
   FROM node:18 AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   # Stage 2: Production
   FROM node:18-alpine
   WORKDIR /app
   COPY --from=builder /app/dist ./dist
   CMD ["node", "dist/index.js"]
   ```

3. **No incluir archivos innecesarios**
   - Crea `.dockerignore`:
   ```
   node_modules
   npm-debug.log
   .git
   .gitignore
   .env
   README.md
   .github
   ```

4. **Usa usuarios no-root**
   - Siempre ejecuta como usuario sin privilegios

5. **Escanea vulnerabilidades**
   - Agrega a tu workflow:
   ```yaml
   - name: Scan de vulnerabilidades
     uses: aquasecurity/trivy-action@master
     with:
       image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
       format: 'sarif'
       output: 'trivy-results.sarif'
   ```

### Docker Compose

1. **Usa variables de entorno**
   ```yaml
   services:
     app:
       env_file:
         - .env
   ```

2. **Define health checks**
   ```yaml
   services:
     app:
       healthcheck:
         test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000')"]
         interval: 30s
         timeout: 10s
         retries: 3
   ```

3. **Limita recursos**
   ```yaml
   services:
     app:
       deploy:
         resources:
           limits:
             cpus: '0.5'
             memory: 512M
   ```

### GitHub Packages

1. **Haz públicos los paquetes cuando sea apropiado**
   - Facilita el uso para otros
   - No requiere autenticación para pull

2. **Mantén imágenes limpias**
   - Borra tags antiguos regularmente
   - GitHub tiene límites de almacenamiento

3. **Documenta en el README**
   - Instrucciones de cómo usar la imagen
   - Variables de entorno soportadas
   - Ejemplos de uso

---

## Parte 8: Ejercicios Adicionales

### Ejercicio 1: Multi-stage Build

Modifica el Dockerfile para usar multi-stage builds que:
1. Una etapa compile/transpile el código
2. Otra etapa contenga solo lo necesario para producción

### Ejercicio 2: Agregar Base de Datos

Expande docker-compose.yml para incluir:
1. PostgreSQL o MongoDB
2. Volúmenes persistentes
3. Variables de entorno para la conexión

### Ejercicio 3: Health Checks

Agrega health checks a:
1. El Dockerfile
2. El docker-compose.yml
3. El workflow de GitHub Actions

### Ejercicio 4: Scan de Seguridad

Implementa escaneo de vulnerabilidades:
1. Usa Trivy en el workflow
2. Falla el build si hay vulnerabilidades críticas
3. Genera reportes de seguridad

### Ejercicio 5: Optimización de Cache

Optimiza el Dockerfile para:
1. Maximizar uso de cache de Docker
2. Reducir tamaño de imagen final
3. Reducir tiempo de build

---

## Recursos Adicionales

### Documentación

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [GitHub Actions Docker](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)

### Herramientas

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Dive](https://github.com/wagoodman/dive) - Explorar capas de imágenes Docker
- [Hadolint](https://github.com/hadolint/hadolint) - Linter para Dockerfiles
- [Trivy](https://github.com/aquasecurity/trivy) - Scanner de vulnerabilidades

### Comandos útiles

```bash
# Ver espacio usado por Docker
docker system df

# Limpiar recursos no usados
docker system prune -a

# Ver capas de una imagen
docker history ghcr.io/usuario/repo:latest

# Inspeccionar imagen
docker inspect ghcr.io/usuario/repo:latest

# Ver logs en tiempo real
docker logs -f <container-id>

# Ejecutar shell en contenedor
docker exec -it <container-id> sh

# Copiar archivos desde/hacia contenedor
docker cp <container-id>:/app/file.txt ./
docker cp ./file.txt <container-id>:/app/
```

---

## Troubleshooting

### Error: permission denied while trying to connect to Docker daemon

**Solución:**
```bash
# Linux/Mac
sudo usermod -aG docker $USER
# Logout y login nuevamente

# O ejecuta con sudo
sudo docker build -t app .
```

### Error: cannot push to GitHub Packages

**Solución:**
1. Verifica que el paquete sea público o tengas permisos
2. Verifica workflow permissions en Settings > Actions
3. Asegúrate que `GITHUB_TOKEN` tenga permisos de `packages: write`

### Imagen muy grande

**Solución:**
1. Usa Alpine Linux como base
2. Implementa multi-stage builds
3. Minimiza capas (combina comandos RUN)
4. Usa `.dockerignore`

### Build lento

**Solución:**
1. Usa cache de Docker Buildx
2. Ordena comandos COPY para maximizar cache
3. Usa `npm ci` en lugar de `npm install`

---

## Conclusión

Has aprendido a:

- Crear un Dockerfile optimizado
- Usar Docker Compose para orquestación local
- Configurar GitHub Actions para publicar automáticamente
- Usar versionado semántico con tags
- Publicar imágenes a GitHub Container Registry
- Consumir imágenes desde GitHub Packages

**Próximos pasos:**

1. Implementa esto en tus proyectos personales
2. Explora Kubernetes para orquestación en producción
3. Aprende sobre CI/CD avanzado con staging/production
4. Implementa testing de imágenes Docker
5. Configura monitoring y logging para contenedores
