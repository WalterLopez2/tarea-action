# GitHub Actions - Guía Rápida de Referencia

## Estructura Básica de un Workflow

```yaml
name: Nombre del Workflow

on: [push, pull_request]  # Eventos que lo disparan

jobs:
  job-name:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: echo "Hello World"
```

---

## Eventos Comunes (Triggers)

```yaml
# Push a rama específica
on:
  push:
    branches: [ main, develop ]

# Pull Request
on:
  pull_request:
    branches: [ main ]

# Schedule (cron)
on:
  schedule:
    - cron: '0 8 * * *'  # Diario a las 8 AM UTC

# Manual
on:
  workflow_dispatch:

# Múltiples eventos
on: [push, pull_request, workflow_dispatch]
```

---

## Runners (Sistemas Operativos)

```yaml
runs-on: ubuntu-latest      # Linux
runs-on: windows-latest     # Windows
runs-on: macos-latest       # macOS
```

---

## Actions Más Usadas

```yaml
# Checkout del código
- uses: actions/checkout@v3

# Setup Node.js
- uses: actions/setup-node@v3
  with:
    node-version: '18'

# Setup Python
- uses: actions/setup-python@v4
  with:
    python-version: '3.11'

# Cache de dependencias
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

# Upload artifact
- uses: actions/upload-artifact@v3
  with:
    name: my-artifact
    path: path/to/file

# Download artifact
- uses: actions/download-artifact@v3
  with:
    name: my-artifact
```

---

## Jobs y Dependencias

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
  
  build:
    needs: test  # Se ejecuta después de 'test'
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
  
  deploy:
    needs: [test, build]  # Se ejecuta después de ambos
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying..."
```

---

## Matrix Strategy

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [16, 18, 20]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node }}
      - run: npm test
```

---

## Variables de Entorno

```yaml
env:
  GLOBAL_VAR: "valor global"

jobs:
  my-job:
    runs-on: ubuntu-latest
    env:
      JOB_VAR: "valor del job"
    
    steps:
      - name: Step con variable
        env:
          STEP_VAR: "valor del step"
        run: |
          echo "Global: $GLOBAL_VAR"
          echo "Job: $JOB_VAR"
          echo "Step: $STEP_VAR"
```

---

## Secrets

```yaml
steps:
  - name: Usar secret
    env:
      API_KEY: ${{ secrets.API_KEY }}
    run: |
      # Usa $API_KEY aquí
      # NUNCA hagas echo del secret
```

---

## Outputs entre Steps y Jobs

### Entre steps (mismo job)

```yaml
steps:
  - id: step1
    run: echo "result=42" >> $GITHUB_OUTPUT
  
  - name: Usar output
    run: echo "Resultado: ${{ steps.step1.outputs.result }}"
```

### Entre jobs

```yaml
jobs:
  job1:
    runs-on: ubuntu-latest
    outputs:
      my-output: ${{ steps.step1.outputs.value }}
    steps:
      - id: step1
        run: echo "value=hello" >> $GITHUB_OUTPUT
  
  job2:
    needs: job1
    runs-on: ubuntu-latest
    steps:
      - run: echo "Output de job1: ${{ needs.job1.outputs.my-output }}"
```

---

## Timeouts

```yaml
jobs:
  my-job:
    runs-on: ubuntu-latest
    timeout-minutes: 10  # Falla si tarda más de 10 minutos
    steps:
      - run: npm test
```

---

## Condicionales

```yaml
steps:
  - name: Solo en main
    if: github.ref == 'refs/heads/main'
    run: echo "En rama main"
  
  - name: Solo en PR
    if: github.event_name == 'pull_request'
    run: echo "En pull request"
  
  - id: test
    run: exit 1
    continue-on-error: true
  
  - name: Si test falló
    if: steps.test.outcome == 'failure'
    run: echo "Test failed"
  
  - name: Siempre ejecutar
    if: always()
    run: echo "Cleanup"
```

---

## Docker

### Ejecutar en contenedor

```yaml
jobs:
  my-job:
    runs-on: ubuntu-latest
    container:
      image: node:18
      env:
        NODE_ENV: production
    steps:
      - run: npm test
```

### Servicios (databases, etc.)

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: password
        ports:
          - 5432:5432
    steps:
      - run: psql -h localhost -U postgres
```

---

## Log Commands

```yaml
steps:
  - name: Log examples
    run: |
      echo "Normal output"
      echo "::debug::Debug message"
      echo "::notice::Notice message"
      echo "::warning::Warning message"
      echo "::error::Error message"
      
      echo "::group::Group title"
      # Grouped output
      echo "::endgroup::"
```

---

## Variables de Contexto Útiles

```yaml
steps:
  - name: Context variables
    run: |
      echo "Repo: ${{ github.repository }}"
      echo "Rama: ${{ github.ref }}"
      echo "SHA: ${{ github.sha }}"
      echo "Actor: ${{ github.actor }}"
      echo "Evento: ${{ github.event_name }}"
      echo "Run number: ${{ github.run_number }}"
      
      echo "Runner OS: ${{ runner.os }}"
      echo "Runner arch: ${{ runner.arch }}"
      
      echo "Job status: ${{ job.status }}"
```

---

## Cheat Sheet de Sintaxis Cron

```
# Formato: minuto hora día mes día-semana
# ┌─────── minuto (0-59)
# │ ┌───── hora (0-23)
# │ │ ┌─── día del mes (1-31)
# │ │ │ ┌─ mes (1-12)
# │ │ │ │ ┌ día de la semana (0-6, 0=Domingo)
# │ │ │ │ │
# * * * * *

'0 0 * * *'      # Diario a medianoche
'0 */6 * * *'    # Cada 6 horas
'0 9 * * 1-5'    # 9 AM, Lunes a Viernes
'0 0 1 * *'      # Primer día del mes
'*/15 * * * *'   # Cada 15 minutos
'0 8 * * *'      # Diario a las 8 AM
```

---

## Debugging

```yaml
steps:
  # Ver todo el contexto de GitHub
  - name: Dump GitHub context
    run: echo '${{ toJSON(github) }}'
  
  # Ver variables de entorno
  - name: Ver env vars
    run: env | sort
  
  # Enable bash debug mode
  - name: Debug mode
    run: |
      set -x  # Muestra cada comando antes de ejecutarlo
      # tus comandos aquí
```

---

## Comandos Útiles del Sistema

```yaml
steps:
  - name: System info
    run: |
      # CPU
      nproc
      lscpu
      
      # Memoria
      free -h
      
      # Disco
      df -h
      
      # Procesos
      ps aux | head
      
      # Red
      ip addr
      curl -I https://github.com
      
      # Variables de entorno
      env | sort
```

---

## Template Completo

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

env:
  NODE_VERSION: '18'

jobs:
  lint:
    name: Lint Code
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    name: Run Tests
    needs: lint
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results-${{ matrix.os }}
          path: test-results/

  build:
    name: Build Application
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: dist/

  deploy:
    name: Deploy
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v3
      - uses: actions/download-artifact@v3
        with:
          name: build-artifacts
          path: dist/
      - name: Deploy to production
        run: echo "Deploying..."
```

---

## Recursos

- **Documentación**: https://docs.github.com/en/actions
- **Marketplace**: https://github.com/marketplace?type=actions
- **Ejecutar localmente**: https://github.com/nektos/act
- **Microsoft Learn**: https://learn.microsoft.com/en-us/training/modules/introduction-to-github-actions/

---

## Tips Finales

1. Usa `name` descriptivos para jobs y steps
2. Configura `timeout-minutes` para evitar jobs colgados
3. Usa caching para dependencias
4. Nunca incluyas secrets en el código
5. Usa matrix para tests multi-plataforma
6. Haz commits pequeños para feedback rápido
7. Lee los logs cuando algo falla
8. Usa `workflow_dispatch` para testing manual

---

**Guarda este documento como referencia rápida**
