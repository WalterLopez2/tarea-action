# Ejercicios Avanzados de GitHub Actions
## Para profundizar en CI/CD y Sistemas Operativos

---

## Ejercicio 1: Pipeline con Stages

**Objetivo:** Crear un pipeline completo con múltiples stages (test, build, deploy)

### Tareas:
1. Crea un workflow con 4 jobs:
   - `lint`: Verificación de estilo de código
   - `test`: Ejecución de tests
   - `build`: Build de la aplicación
   - `deploy`: Simulación de deployment

2. Configura dependencias:
   - `test` depende de `lint`
   - `build` depende de `test`
   - `deploy` depende de `build`

3. El job `deploy` solo debe ejecutarse en la rama `main`

### Código de ejemplo:

```yaml
name: Pipeline Completo

on:
  push:
    branches: [ main, develop ]

jobs:
  lint:
    name: Lint Code
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run linter
        run: echo "Running linter..."
  
  test:
    name: Run Tests
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
  
  build:
    name: Build App
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build
        run: echo "Building app..."
  
  deploy:
    name: Deploy
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: echo "Deploying..."
```

---

## Ejercicio 2: Caching de Dependencias

**Objetivo:** Optimizar el tiempo de ejecución usando cache

### Tareas:
1. Agrega caching para `node_modules`
2. Compara tiempos de ejecución con y sin cache
3. Observa el "Cache hit ratio" en los logs

### Código de ejemplo:

```yaml
jobs:
  test-with-cache:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'  # Caching automático de npm
      
      # O caching manual:
      - name: Cache node modules
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
      
      - run: npm install
      - run: npm test
```

**Preguntas:**
- ¿Cuánto tiempo se ahorra con el cache?
- ¿Qué pasa si cambias el `package.json`?
- ¿Cómo se relaciona esto con sistemas de archivos en SO?

---

## Ejercicio 3: Variables de Entorno y Secrets

**Objetivo:** Manejar configuración sensible de forma segura

### Tareas:
1. Crea secrets en tu repositorio (Settings > Secrets)
2. Usa esos secrets en un workflow
3. Configura diferentes variables para diferentes entornos

### Código de ejemplo:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    env:
      API_URL: ${{ secrets.API_URL }}
      API_KEY: ${{ secrets.API_KEY }}
      NODE_ENV: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy
        run: |
          echo "Deploying to: $API_URL"
          # NO imprimas el API_KEY (es secreto)
          # echo $API_KEY  # ¡NUNCA hagas esto!
```

**Importante:** GitHub oculta automáticamente los valores de secrets en los logs.

**Preguntas:**
- ¿Por qué son importantes las variables de entorno en SO?
- ¿Cómo se pasan variables entre procesos?
- ¿Qué diferencia hay entre variables de entorno y secrets?

---

## Ejercicio 4: Artifacts y Persistencia

**Objetivo:** Compartir archivos entre jobs usando artifacts

### Tareas:
1. En el job de `build`, crea un archivo de resultado
2. Súbelo como artifact
3. En el job de `deploy`, descarga y usa ese artifact

### Código de ejemplo:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build
        run: |
          mkdir -p build
          echo "Build completed at $(date)" > build/info.txt
          echo "Version: 1.0.0" >> build/info.txt
      
      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: build/
          retention-days: 5
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v3
        with:
          name: build-files
          path: build/
      
      - name: Use artifact
        run: cat build/info.txt
```

**Preguntas:**
- ¿Por qué los archivos no persisten entre jobs?
- ¿Cómo se relaciona esto con procesos en SO?
- ¿Qué son los "retention days"?

---

## Ejercicio 5: Self-Hosted Runner

**Objetivo:** Entender la diferencia entre runners de GitHub y propios

### Tareas (teóricas, ya que requiere infraestructura):
1. Lee sobre self-hosted runners
2. Identifica casos de uso para runners propios
3. Compara recursos: GitHub-hosted vs Self-hosted

### Comparación:

| Aspecto | GitHub-hosted | Self-hosted |
|---------|--------------|-------------|
| Setup | Automático | Manual |
| Mantenimiento | GitHub | Tú |
| Costo | Incluido/limitado | Hardware propio |
| Seguridad | Aislado | Tu red |
| Personalización | Limitada | Total |
| Recursos | Fijos | Configurables |

**Preguntas:**
- ¿Cuándo usarías un self-hosted runner?
- ¿Qué consideraciones de SO son importantes?
- ¿Cómo afecta la seguridad del SO?

---

## Ejercicio 6: Docker en GitHub Actions

**Objetivo:** Usar contenedores Docker en workflows

### Tareas:
1. Crea un Dockerfile simple
2. Construye la imagen en GitHub Actions
3. Ejecuta tests dentro del contenedor

### Código de ejemplo:

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "test"]
```

**Workflow:**
```yaml
jobs:
  docker-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t cicd-app:test .
      
      - name: Run tests in container
        run: docker run cicd-app:test
      
      - name: Show container info
        run: |
          docker ps -a
          docker images
```

**Preguntas:**
- ¿Cómo se relacionan los contenedores con procesos en SO?
- ¿Qué recursos del SO usa Docker?
- ¿Ventajas de testear en contenedores?

---

## Ejercicio 7: Matrix Strategy Avanzado

**Objetivo:** Crear matrices complejas para testing exhaustivo

### Tareas:
1. Crea una matriz con múltiples dimensiones
2. Incluye/excluye combinaciones específicas
3. Analiza el paralelismo

### Código de ejemplo:

```yaml
jobs:
  test-matrix:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [16, 18, 20]
        include:
          # Configuraciones especiales
          - os: ubuntu-latest
            node: 20
            experimental: true
        exclude:
          # Excluir Node 16 en Windows
          - os: windows-latest
            node: 16
    
    runs-on: ${{ matrix.os }}
    continue-on-error: ${{ matrix.experimental || false }}
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node }}
      - run: npm test
```

**Preguntas:**
- ¿Cuántas combinaciones se ejecutan?
- ¿Cómo se ejecutan en paralelo?
- ¿Límites de concurrencia en GitHub Actions?

---

## Ejercicio 8: Monitoreo y Debugging

**Objetivo:** Aprender a debuggear workflows fallidos

### Tareas:
1. Introduce un error intencional
2. Usa debug logging
3. Habilita step debugging

### Código de ejemplo:

```yaml
jobs:
  debug-example:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Habilitar debug output
      - name: Enable debug
        run: echo "ACTIONS_STEP_DEBUG=true" >> $GITHUB_ENV
      
      - name: Debug info
        run: |
          echo "::debug::This is a debug message"
          echo "::warning::This is a warning"
          echo "::error::This is an error"
          
          echo "Current directory: $(pwd)"
          echo "Files:"
          ls -la
          
          echo "Environment variables:"
          env | sort
      
      - name: Conditional debugging
        if: runner.debug == '1'
        run: |
          echo "Debug mode enabled!"
          set -x  # Enable bash debug mode
          # Tus comandos aquí
```

**Comandos útiles para debugging:**
```yaml
# Ver variables de contexto
- run: echo '${{ toJSON(github) }}'
- run: echo '${{ toJSON(runner) }}'
- run: echo '${{ toJSON(job) }}'

# Ver archivos
- run: find . -type f

# Ver procesos
- run: ps aux

# Ver variables de entorno
- run: env | sort
```

---

## Ejercicio 9: Reusable Workflows

**Objetivo:** Crear workflows reutilizables

### Tareas:
1. Crea un workflow reutilizable
2. Llámalo desde otro workflow
3. Pasa parámetros entre workflows

### Workflow reutilizable (`.github/workflows/reusable-test.yml`):
```yaml
name: Reusable Test Workflow

on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string
      os:
        required: false
        type: string
        default: 'ubuntu-latest'
    outputs:
      test-result:
        description: "Result of the tests"
        value: ${{ jobs.test.outputs.result }}

jobs:
  test:
    runs-on: ${{ inputs.os }}
    outputs:
      result: ${{ steps.test.outcome }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ inputs.node-version }}
      - id: test
        run: npm test
```

### Workflow que lo usa:
```yaml
name: Use Reusable Workflow

on: [push]

jobs:
  call-test:
    uses: ./.github/workflows/reusable-test.yml
    with:
      node-version: '18'
      os: 'ubuntu-latest'
```

---

## Ejercicio 10: Performance y Recursos

**Objetivo:** Analizar uso de recursos del sistema

### Tareas:
1. Monitorea CPU, memoria y disco durante la ejecución
2. Identifica cuellos de botella
3. Optimiza el workflow

### Código de ejemplo:

```yaml
jobs:
  performance-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: System info before
        run: |
          echo "=== RECURSOS INICIALES ==="
          echo "CPU:"
          nproc
          lscpu | grep "Model name"
          echo ""
          echo "Memoria:"
          free -h
          echo ""
          echo "Disco:"
          df -h
          echo ""
          echo "Procesos:"
          ps aux | wc -l
      
      - name: Heavy operation
        run: |
          # Simular operación pesada
          npm install
          npm test
      
      - name: System info after
        if: always()
        run: |
          echo "=== RECURSOS DESPUÉS ==="
          free -h
          df -h
          
      - name: Time measurement
        run: |
          echo "Job duration: ${{ job.duration }}"
          echo "Workflow duration: ${{ github.workflow_run_duration }}"
```

**Preguntas:**
- ¿Cuánta memoria usa tu workflow?
- ¿Cuánto espacio en disco se utiliza?
- ¿Cómo optimizarías el uso de recursos?

---

## Recursos para Seguir Aprendiendo

### Documentación Avanzada
- [Contexts](https://docs.github.com/en/actions/learn-github-actions/contexts)
- [Expressions](https://docs.github.com/en/actions/learn-github-actions/expressions)
- [Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments)
- [Security hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

### Actions útiles del Marketplace
- `codecov/codecov-action` - Reportes de cobertura
- `JamesIves/github-pages-deploy-action` - Deploy a GitHub Pages
- `docker/build-push-action` - Build y push de imágenes Docker
- `actions/dependency-review-action` - Revisión de dependencias

### Herramientas
- [nektos/act](https://github.com/nektos/act) - Ejecutar Actions localmente
- [GitHub CLI](https://cli.github.com/) - Gestionar workflows desde terminal

---

## Evaluación Final

Para completar estos ejercicios avanzados, deberías poder:

- Crear pipelines complejos con múltiples stages
- Optimizar workflows con caching
- Manejar secrets y configuración segura
- Compartir datos entre jobs con artifacts
- Usar Docker en workflows
- Crear y usar workflows reutilizables
- Debuggear workflows fallidos
- Analizar y optimizar recursos
- Implementar estrategias de testing avanzadas

---

**Sigue experimentando y aprendiendo**
