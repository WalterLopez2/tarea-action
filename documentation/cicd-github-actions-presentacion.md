# CI/CD Pipeline y GitHub Actions
## Presentación para Sistemas Operativos

---

## Agenda

1. Introducción a CI/CD
2. ¿Qué es GitHub Actions?
3. Componentes de GitHub Actions
4. Relación con Sistemas Operativos
5. Ejercicio Práctico

---

# PARTE 1: TEORÍA

## ¿Qué es CI/CD?

### Continuous Integration (CI)
- **Integración Continua**: práctica de fusionar cambios de código frecuentemente
- Los desarrolladores integran código al repositorio principal varias veces al día
- Cada integración se verifica automáticamente mediante builds y tests
- **Objetivo**: detectar errores rápidamente

### Continuous Deployment/Delivery (CD)
- **Continuous Delivery**: el código está siempre en estado "deployable"
- **Continuous Deployment**: cada cambio que pasa los tests se despliega automáticamente
- **Objetivo**: reducir el tiempo entre escribir código y ponerlo en producción

### Beneficios de CI/CD
- Detección temprana de errores
- Reducción de riesgos en deployments
- Feedback rápido para desarrolladores
- Entregas más frecuentes y confiables
- Menos trabajo manual y repetitivo

---

## ¿Qué es GitHub Actions?

GitHub Actions es una plataforma de **automatización** integrada en GitHub que permite:

- Automatizar workflows de desarrollo
- Construir pipelines de CI/CD
- Ejecutar scripts en respuesta a eventos
- Probar, construir y desplegar código automáticamente

### ¿Por qué GitHub Actions?

1. **Integrado**: Está dentro de GitHub, no necesitas servicios externos
2. **Basado en eventos**: Reacciona a eventos del repositorio (push, pull request, etc.)
3. **Flexible**: Soporta múltiples lenguajes y plataformas
4. **Gratuito**: 2000 minutos gratis al mes para repositorios privados

---

## Componentes de GitHub Actions

### 1. Workflows (Flujos de trabajo)
- Archivos YAML que definen procesos automatizados
- Se almacenan en `.github/workflows/` en tu repositorio
- Pueden tener múltiples jobs que se ejecutan en paralelo o secuencialmente

```yaml
name: Mi Primer Workflow
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: echo "¡Hola Mundo!"
```

### 2. Events (Eventos)
Disparadores que inician un workflow:

- **push**: Cuando se hace push al repositorio
- **pull_request**: Cuando se crea o actualiza un PR
- **schedule**: Ejecución programada (cron)
- **workflow_dispatch**: Ejecución manual
- **release**: Cuando se publica un release

```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * *'  # Diario a medianoche
```

### 3. Jobs (Trabajos)
- Conjunto de steps que se ejecutan en el mismo runner
- Por defecto, los jobs se ejecutan en paralelo
- Pueden tener dependencias entre ellos

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Run tests
        run: npm test
  
  deploy:
    needs: test  # Se ejecuta después de test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        run: ./deploy.sh
```

### 4. Steps (Pasos)
- Tareas individuales dentro de un job
- Pueden ejecutar comandos o usar actions
- Se ejecutan secuencialmente

### 5. Actions (Acciones)
- Comandos reutilizables
- Pueden ser creadas por la comunidad o por ti
- Se encuentran en el GitHub Marketplace

```yaml
steps:
  - uses: actions/checkout@v3  # Action de la comunidad
  - uses: actions/setup-node@v3
    with:
      node-version: '18'
```

### 6. Runners (Ejecutores)
Servidores que ejecutan los workflows:

- **GitHub-hosted runners**: Ubuntu, Windows, macOS
- **Self-hosted runners**: Tus propios servidores

```yaml
jobs:
  build:
    runs-on: ubuntu-latest  # Runner de GitHub
    # runs-on: self-hosted  # Tu propio runner
```

---

## Relación con Sistemas Operativos

### ¿Por qué esto es relevante para SO?

1. **Procesos y Concurrencia**
   - Cada job se ejecuta como un proceso independiente
   - Los jobs pueden correr en paralelo (concurrencia)
   - Los runners gestionan recursos del sistema

2. **Gestión de Recursos**
   - CPU, memoria, y almacenamiento son asignados a cada runner
   - Límites de tiempo de ejecución (timeout)
   - Cleanup automático después de cada job

3. **Sistema de Archivos**
   - Cada job tiene su propio workspace
   - Persistencia de datos entre steps usando artifacts
   - Acceso al filesystem del runner

4. **Diferentes Sistemas Operativos**
   - Puedes ejecutar workflows en Linux, Windows, o macOS
   - Importante para testing cross-platform
   - Cada SO tiene sus propios comandos y herramientas

5. **Variables de Entorno**
   - Configuración de variables de entorno del sistema
   - Secrets y configuración segura
   - Acceso a variables del sistema operativo

6. **Networking**
   - Los runners tienen acceso a internet
   - Pueden comunicarse con servicios externos
   - Configuración de puertos y servicios

---

# PARTE 2: PRÁCTICA

## Ejercicio Práctico: Crear tu Primer Workflow

### Requisitos Previos
- Cuenta de GitHub
- Repositorio (puede ser nuevo)
- Editor de texto

---

## Paso 1: Crear la estructura del proyecto

1. Crea un nuevo repositorio en GitHub o usa uno existente
2. Clona el repositorio localmente:
```bash
git clone <tu-repositorio-url>
cd <tu-repositorio>
```

---

## Paso 2: Crear un archivo de aplicación simple

Vamos a crear una aplicación Node.js simple para testear.

**Crear `package.json`:**
```json
{
  "name": "cicd-demo",
  "version": "1.0.0",
  "description": "Demo de CI/CD con GitHub Actions",
  "main": "index.js",
  "scripts": {
    "test": "node test.js",
    "start": "node index.js"
  }
}
```

**Crear `index.js`:**
```javascript
function suma(a, b) {
    return a + b;
}

function resta(a, b) {
    return a - b;
}

console.log("Aplicación iniciada");
console.log("Suma(5, 3):", suma(5, 3));
console.log("Resta(10, 4):", resta(10, 4));

module.exports = { suma, resta };
```

**Crear `test.js`:**
```javascript
const { suma, resta } = require('./index.js');

function test() {
    let passed = 0;
    let failed = 0;

    // Test 1: Suma
    if (suma(2, 3) === 5) {
        console.log("Test 1 pasó: suma(2, 3) = 5");
        passed++;
    } else {
        console.log("Test 1 falló");
        failed++;
    }

    // Test 2: Resta
    if (resta(10, 4) === 6) {
        console.log("Test 2 pasó: resta(10, 4) = 6");
        passed++;
    } else {
        console.log("Test 2 falló");
        failed++;
    }

    // Test 3: Suma con negativos
    if (suma(-5, 3) === -2) {
        console.log("Test 3 pasó: suma(-5, 3) = -2");
        passed++;
    } else {
        console.log("Test 3 falló");
        failed++;
    }

    console.log(`\nResultados: ${passed} pasaron, ${failed} fallaron`);
    
    if (failed > 0) {
        process.exit(1); // Salir con código de error
    }
}

test();
```

---

## Paso 3: Crear tu primer Workflow

Crea el directorio y archivo del workflow:

```bash
mkdir -p .github/workflows
```

**Crear `.github/workflows/ci.yml`:**

```yaml
name: CI Pipeline

# Eventos que disparan el workflow
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:  # Permite ejecución manual

# Jobs a ejecutar
jobs:
  # Job 1: Test
  test:
    name: Ejecutar Tests
    runs-on: ubuntu-latest
    
    steps:
      # Step 1: Checkout del código
      - name: Checkout código
        uses: actions/checkout@v3
      
      # Step 2: Setup Node.js
      - name: Configurar Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      # Step 3: Instalar dependencias (si las hay)
      - name: Instalar dependencias
        run: npm install
      
      # Step 4: Ejecutar tests
      - name: Ejecutar tests
        run: npm test
      
      # Step 5: Mostrar información del sistema
      - name: Info del Sistema
        run: |
          echo "Sistema Operativo: $RUNNER_OS"
          echo "Arquitectura: $RUNNER_ARCH"
          uname -a
          node --version
          npm --version

  # Job 2: Build (se ejecuta después de test)
  build:
    name: Build de la aplicación
    needs: test  # Depende de que test pase
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout código
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Build
        run: |
          echo "Building application..."
          npm install
          node index.js
          echo "Build completado!"
      
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: app-build
          path: .
```

---

## Paso 4: Workflow Multi-OS (Avanzado)

**Crear `.github/workflows/multi-os.yml`:**

```yaml
name: Multi-OS Testing

on:
  push:
    branches: [ main ]

jobs:
  test-matrix:
    name: Test en ${{ matrix.os }}
    runs-on: ${{ matrix.os }}
    
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [16, 18, 20]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Ejecutar tests
        run: npm test
      
      - name: Información del SO
        run: |
          echo "OS: ${{ matrix.os }}"
          echo "Node: ${{ matrix.node-version }}"
```

---

## Paso 5: Workflow con Schedule

**Crear `.github/workflows/scheduled.yml`:**

```yaml
name: Verificación Programada

on:
  schedule:
    # Ejecutar todos los días a las 8 AM UTC
    - cron: '0 8 * * *'
  workflow_dispatch:  # También permite ejecución manual

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Health Check
        run: |
          echo "Ejecutando health check..."
          npm test
          echo "Sistema saludable!"
```

---

## Paso 6: Commit y Push

```bash
git add .
git commit -m "Add CI/CD workflows with GitHub Actions"
git push origin main
```

---

## Paso 7: Ver los Workflows en Acción

1. Ve a tu repositorio en GitHub
2. Haz clic en la pestaña **"Actions"**
3. Verás tus workflows ejecutándose
4. Haz clic en un workflow para ver los detalles
5. Explora los logs de cada step

---

## Entendiendo los Logs

### Estructura del Output
```
├── Workflow Name
│   ├── Job 1: Test
│   │   ├── Set up job
│   │   ├── Checkout código
│   │   ├── Configurar Node.js
│   │   ├── Ejecutar tests
│   │   └── Complete job
│   └── Job 2: Build
│       ├── Set up job
│       ├── Checkout código
│       └── ...
```

### Información del Runner
En cada log verás:
- Sistema operativo usado
- Recursos asignados
- Tiempo de ejecución
- Variables de entorno

---

## Ejercicios Adicionales

### Ejercicio 1: Agregar Linting
Modifica el workflow para incluir un linter:

```yaml
- name: Lint code
  run: |
    npm install eslint --save-dev
    npx eslint index.js || echo "Warning: Lint issues found"
```

### Ejercicio 2: Badges
Agrega badges a tu README:

```markdown
![CI Pipeline](https://github.com/<usuario>/<repo>/workflows/CI%20Pipeline/badge.svg)
```

### Ejercicio 3: Conditional Steps
Ejecuta steps solo en ciertas condiciones:

```yaml
- name: Deploy (solo en main)
  if: github.ref == 'refs/heads/main'
  run: echo "Desplegando a producción..."
```

### Ejercicio 4: Secrets
Usa secrets para información sensible:

```yaml
- name: Deploy
  env:
    API_KEY: ${{ secrets.API_KEY }}
  run: ./deploy.sh
```

---

## Conceptos de SO en Acción

### 1. Procesos y Jobs
```yaml
jobs:
  job1:
    runs-on: ubuntu-latest  # Proceso 1
  job2:
    runs-on: ubuntu-latest  # Proceso 2 (paralelo)
```

### 2. Sistema de Archivos
```yaml
- name: Crear archivo
  run: echo "datos" > output.txt

- name: Leer archivo
  run: cat output.txt
```

### 3. Variables de Entorno
```yaml
env:
  NODE_ENV: production
  DATABASE_URL: ${{ secrets.DB_URL }}
```

### 4. Exit Codes
```javascript
// En tu script de test
if (failed > 0) {
    process.exit(1); // Exit code != 0 = falla el workflow
}
```

---

## Recursos Adicionales

### Documentación
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Microsoft Learn - GitHub Actions](https://learn.microsoft.com/en-us/training/modules/introduction-to-github-actions/)

### Actions Útiles
- `actions/checkout@v3`: Checkout del código
- `actions/setup-node@v3`: Configurar Node.js
- `actions/upload-artifact@v3`: Subir archivos
- `actions/download-artifact@v3`: Descargar archivos
- `actions/cache@v3`: Cachear dependencias

### Herramientas
- [act](https://github.com/nektos/act): Ejecutar GitHub Actions localmente
- [actionlint](https://github.com/rhysd/actionlint): Linter para workflows

---

## Preguntas para Reflexionar

1. ¿Cómo se relacionan los conceptos de procesos e hilos con los Jobs y Steps?
2. ¿Qué ventajas tiene usar runners en diferentes sistemas operativos?
3. ¿Cómo gestiona GitHub Actions los recursos del sistema (CPU, memoria)?
4. ¿Qué pasa con el filesystem entre diferentes jobs?
5. ¿Cómo se manejan los errores y exit codes en el contexto del SO?

---

## Mejores Prácticas

1. **Mantén los workflows simples**: Un workflow = una responsabilidad
2. **Usa caching**: Para dependencias (npm, pip, etc.)
3. **Falla rápido**: Pon los tests más rápidos primero
4. **Usa matrix builds**: Para testear múltiples versiones/OS
5. **Documenta**: Usa `name` descriptivos en cada step
6. **Secrets seguros**: Nunca hardcodees credenciales
7. **Timeout**: Define timeouts para evitar workflows colgados
8. **Artifacts**: Guarda logs y builds importantes

---

## Conclusiones

### ¿Qué aprendimos?

- CI/CD automatiza el proceso de desarrollo
- GitHub Actions facilita la implementación de CI/CD
- Los workflows están compuestos de eventos, jobs, y steps
- Los runners ejecutan los workflows en diferentes SO
- Existen muchas conexiones con conceptos de sistemas operativos

### Próximos Pasos

1. Implementa CI/CD en tus proyectos personales
2. Explora el GitHub Marketplace para actions útiles
3. Experimenta con diferentes triggers y configuraciones
4. Aprende sobre Continuous Deployment a servicios cloud
5. Crea tus propias custom actions

---

## Preguntas y Respuestas

**¿Dudas sobre el contenido?**

**¿Problemas con el ejercicio práctico?**

**¿Ideas para expandir el tema?**

---

## Tarea (Opcional)

1. Crea un repositorio con un proyecto simple
2. Implementa un workflow de CI que:
   - Ejecute tests automáticamente
   - Funcione en al menos 2 sistemas operativos diferentes
   - Tenga al menos 2 jobs con dependencias
3. Agrega un README con badges del workflow
4. Documenta lo que aprendiste sobre cómo los runners gestionan recursos

---

**¡Gracias por tu atención!**

*"La automatización es el futuro del desarrollo de software"*
