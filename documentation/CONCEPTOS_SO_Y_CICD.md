# Conexión entre CI/CD y Sistemas Operativos
## Conceptos fundamentales de SO aplicados en GitHub Actions

---

## Introducción

Este documento explica cómo los conceptos de sistemas operativos que estudias en clase se aplican directamente en los pipelines de CI/CD con GitHub Actions.

---

## 1. Procesos y Jobs

### Concepto de SO
Un **proceso** es un programa en ejecución. El sistema operativo gestiona múltiples procesos, asignándoles CPU, memoria y recursos.

### En GitHub Actions
Cada **job** en un workflow es análogo a un proceso:

```yaml
jobs:
  test:        # Proceso 1
    runs-on: ubuntu-latest
  build:       # Proceso 2
    runs-on: ubuntu-latest
```

**Similitudes:**
- Cada job tiene su propio espacio de memoria
- Cada job tiene su PID (Process ID) en el runner
- Los jobs pueden ejecutarse en paralelo (concurrencia)
- El SO del runner gestiona la asignación de recursos

**Ejemplo práctico:**
```yaml
jobs:
  show-process-info:
    runs-on: ubuntu-latest
    steps:
      - name: Ver información del proceso
        run: |
          echo "PID actual: $$"
          echo "PPID (Parent Process ID): $PPID"
          echo "Procesos en el sistema:"
          ps aux | head -20
```

---

## 2. Concurrencia y Paralelismo

### Concepto de SO
- **Concurrencia**: Múltiples tareas progresando (no necesariamente al mismo tiempo)
- **Paralelismo**: Múltiples tareas ejecutándose simultáneamente
- El scheduler del SO decide qué proceso ejecutar y cuándo

### En GitHub Actions

```yaml
jobs:
  test-1:
    runs-on: ubuntu-latest
    # Se ejecutan en paralelo
  
  test-2:
    runs-on: ubuntu-latest
    # Se ejecutan en paralelo
  
  deploy:
    needs: [test-1, test-2]  # Secuencial después de test-1 y test-2
    runs-on: ubuntu-latest
```

**Observaciones:**
- Jobs sin `needs` se ejecutan en **paralelo**
- Jobs con `needs` se ejecutan **secuencialmente**
- GitHub Actions puede ejecutar múltiples jobs simultáneamente (paralelismo real)

**Límites de concurrencia:**
- Free tier: 20 workflows concurrentes para repos privados
- Cada runner puede ejecutar 1 job a la vez
- Múltiples runners = paralelismo real

**Ejercicio:**
```yaml
jobs:
  # Estos 3 jobs se ejecutan en paralelo
  job-a:
    runs-on: ubuntu-latest
    steps:
      - run: sleep 10 && echo "Job A done"
  
  job-b:
    runs-on: ubuntu-latest
    steps:
      - run: sleep 10 && echo "Job B done"
  
  job-c:
    runs-on: ubuntu-latest
    steps:
      - run: sleep 10 && echo "Job C done"
  
  # Este job espera a que los 3 anteriores terminen
  summary:
    needs: [job-a, job-b, job-c]
    runs-on: ubuntu-latest
    steps:
      - run: echo "All jobs completed"
```

---

## 3. Gestión de Memoria y Recursos

### Concepto de SO
El SO asigna y gestiona:
- Memoria RAM para cada proceso
- Espacio de direcciones virtual
- Límites de memoria (memory limits)

### En GitHub Actions

**Recursos de un GitHub-hosted runner:**
- **CPU**: 2 cores
- **RAM**: 7 GB
- **Disco**: 14 GB (SSD)

```yaml
jobs:
  memory-test:
    runs-on: ubuntu-latest
    steps:
      - name: Ver recursos disponibles
        run: |
          echo "=== CPU ==="
          nproc
          lscpu
          
          echo "=== MEMORIA ==="
          free -h
          cat /proc/meminfo | grep -i mem
          
          echo "=== DISCO ==="
          df -h
          
          echo "=== LÍMITES DEL PROCESO ==="
          ulimit -a
```

**Resource limits:**
- Tiempo máximo por job: 6 horas (configurable con `timeout-minutes`)
- Memoria: No hay límite explícito, pero el runner tiene 7GB total
- Disco: 14GB compartidos entre todos los jobs del workflow

**Ejemplo con timeout:**
```yaml
jobs:
  task-with-timeout:
    runs-on: ubuntu-latest
    timeout-minutes: 10  # Falla si tarda más de 10 minutos
    steps:
      - run: npm test
```

---

## 4. Sistema de Archivos

### Concepto de SO
- Estructura jerárquica de archivos y directorios
- Permisos de archivos (read, write, execute)
- Inodos y metadata
- Sistemas de archivos (ext4, NTFS, APFS)

### En GitHub Actions

**Estructura del filesystem:**
```
/home/runner/
├── work/
│   └── <repo>/
│       └── <repo>/      # Tu código (GITHUB_WORKSPACE)
├── .npm/                # Cache de npm
└── _temp/               # Archivos temporales
```

**Workspace de un job:**
```yaml
jobs:
  filesystem-demo:
    runs-on: ubuntu-latest
    steps:
      - name: Ver estructura
        run: |
          echo "Workspace: $GITHUB_WORKSPACE"
          echo "Home: $HOME"
          echo "Temp: $RUNNER_TEMP"
          
          echo "Contenido del workspace:"
          ls -la $GITHUB_WORKSPACE
          
          echo "Permisos:"
          ls -l
      
      - name: Crear archivos
        run: |
          echo "Hello" > test.txt
          chmod 755 test.txt
          ls -l test.txt
      
      - name: Información del filesystem
        run: |
          df -T  # Tipo de filesystem
          mount | grep "^/dev"
```

**Persistencia entre steps:**
- Los archivos persisten entre steps del mismo job
- Los archivos NO persisten entre diferentes jobs
- Usa artifacts para compartir archivos entre jobs

**Ejemplo:**
```yaml
jobs:
  job-1:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Data" > file.txt
      - run: cat file.txt  # Funciona (mismo job)
      
      - uses: actions/upload-artifact@v3
        with:
          name: my-file
          path: file.txt
  
  job-2:
    needs: job-1
    runs-on: ubuntu-latest
    steps:
      - run: cat file.txt  # Error: file.txt no existe
      
      - uses: actions/download-artifact@v3
        with:
          name: my-file
      
      - run: cat file.txt  # Funciona (descargado)
```

---

## 5. Variables de Entorno

### Concepto de SO
Variables del sistema que configuran el comportamiento de procesos:
- `PATH`: Rutas para buscar ejecutables
- `HOME`: Directorio home del usuario
- `USER`: Usuario actual
- Variables personalizadas

### En GitHub Actions

**Variables predefinidas:**
```yaml
jobs:
  env-demo:
    runs-on: ubuntu-latest
    steps:
      - name: Ver variables
        run: |
          echo "Runner OS: $RUNNER_OS"
          echo "Runner Arch: $RUNNER_ARCH"
          echo "Home: $HOME"
          echo "Path: $PATH"
          echo "User: $USER"
          echo "Shell: $SHELL"
          
          echo "GitHub Workspace: $GITHUB_WORKSPACE"
          echo "GitHub Event: $GITHUB_EVENT_NAME"
          echo "GitHub Actor: $GITHUB_ACTOR"
          
          echo "Todas las variables:"
          env | sort
```

**Variables personalizadas:**
```yaml
env:
  GLOBAL_VAR: "valor global"

jobs:
  my-job:
    runs-on: ubuntu-latest
    env:
      JOB_VAR: "valor del job"
    
    steps:
      - name: Paso con variable
        env:
          STEP_VAR: "valor del step"
        run: |
          echo "Global: $GLOBAL_VAR"
          echo "Job: $JOB_VAR"
          echo "Step: $STEP_VAR"
```

**Scope de variables:**
- Workflow level (todo el workflow)
- Job level (solo ese job)
- Step level (solo ese step)

---

## 6. Interprocess Communication (IPC)

### Concepto de SO
Mecanismos para que procesos se comuniquen:
- Pipes
- Sockets
- Shared memory
- Message queues
- Signals

### En GitHub Actions

**Comunicación entre steps (mismo job):**

1. **Via archivos:**
```yaml
steps:
  - name: Paso 1
    run: echo "Hello" > message.txt
  
  - name: Paso 2
    run: cat message.txt
```

2. **Via environment files:**
```yaml
steps:
  - name: Set variable
    run: echo "MY_VAR=valor" >> $GITHUB_ENV
  
  - name: Use variable
    run: echo $MY_VAR
```

3. **Via outputs:**
```yaml
steps:
  - id: paso1
    run: echo "result=42" >> $GITHUB_OUTPUT
  
  - name: Use output
    run: echo "Result: ${{ steps.paso1.outputs.result }}"
```

**Comunicación entre jobs:**

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
      - run: echo "Got: ${{ needs.job1.outputs.my-output }}"
```

---

## 7. Signals y Exit Codes

### Concepto de SO
- Exit codes indican el resultado de un proceso
- Exit code 0 = éxito
- Exit code != 0 = error
- Signals (SIGTERM, SIGKILL, etc.) para controlar procesos

### En GitHub Actions

```yaml
jobs:
  exit-code-demo:
    runs-on: ubuntu-latest
    steps:
      - name: Success (exit 0)
        run: |
          echo "Todo bien"
          exit 0
      
      - name: Este step se ejecuta
        run: echo "Continúa"
      
      - name: Error (exit 1)
        run: |
          echo "Error!"
          exit 1
      
      - name: Este step NO se ejecuta
        run: echo "No llegarás aquí"
```

**Continue on error:**
```yaml
steps:
  - name: Puede fallar
    continue-on-error: true
    run: exit 1
  
  - name: Se ejecuta aunque el anterior falle
    run: echo "Ejecutado"
```

**Conditional execution:**
```yaml
steps:
  - id: test
    run: exit 1
    continue-on-error: true
  
  - name: Si test falló
    if: steps.test.outcome == 'failure'
    run: echo "Tests failed"
  
  - name: Si test pasó
    if: steps.test.outcome == 'success'
    run: echo "Tests passed"
```

---

## 8. Scheduling y Cron Jobs

### Concepto de SO
- Cron: Demonio de Unix/Linux para ejecutar tareas programadas
- Crontab: Tabla de tareas programadas
- Sintaxis: minuto hora día mes día-de-semana

### En GitHub Actions

```yaml
on:
  schedule:
    # Sintaxis de cron
    - cron: '0 8 * * *'  # Diario a las 8 AM UTC
```

**Ejemplos de cron:**
```yaml
on:
  schedule:
    - cron: '0 0 * * *'     # Diario a medianoche
    - cron: '0 */6 * * *'   # Cada 6 horas
    - cron: '0 9 * * 1-5'   # 9 AM, Lunes a Viernes
    - cron: '0 0 1 * *'     # Primer día del mes
    - cron: '*/15 * * * *'  # Cada 15 minutos
```

**Ejemplo práctico:**
```yaml
name: Backup Diario

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM cada día

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Realizar backup
        run: |
          echo "Backup iniciado: $(date)"
          # Comandos de backup aquí
```

---

## 9. Virtualización y Contenedores

### Concepto de SO
- **VM**: Virtualización completa del hardware
- **Contenedor**: Virtualización a nivel de SO
- Docker: Contenedores ligeros que comparten el kernel del host

### En GitHub Actions

**Los runners son VMs:**
- Cada runner es una VM completa
- Sistema operativo completo (Ubuntu/Windows/macOS)
- Aislamiento completo entre jobs

**Uso de Docker en workflows:**
```yaml
jobs:
  docker-job:
    runs-on: ubuntu-latest
    
    # Opción 1: Ejecutar en un contenedor
    container:
      image: node:18
      env:
        NODE_ENV: production
    
    steps:
      - uses: actions/checkout@v3
      - run: npm test
```

```yaml
jobs:
  build-docker:
    runs-on: ubuntu-latest
    
    steps:
      # Opción 2: Usar Docker manualmente
      - uses: actions/checkout@v3
      
      - name: Build image
        run: docker build -t myapp .
      
      - name: Run container
        run: docker run myapp npm test
      
      - name: Ver contenedores
        run: |
          docker ps -a
          docker images
```

**Servicios (containers de larga duración):**
```yaml
jobs:
  test-with-db:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: password
        ports:
          - 5432:5432
    
    steps:
      - name: Test con base de datos
        run: |
          psql -h localhost -U postgres -c "SELECT 1"
```

---

## 10. Networking

### Concepto de SO
- Stack TCP/IP
- Puertos y sockets
- Localhost vs. red externa
- DNS resolution

### En GitHub Actions

**Runners tienen acceso a internet:**
```yaml
jobs:
  network-test:
    runs-on: ubuntu-latest
    steps:
      - name: Test conectividad
        run: |
          # DNS resolution
          nslookup google.com
          
          # Ping (ICMP)
          ping -c 4 google.com
          
          # HTTP request
          curl https://api.github.com/repos/actions/checkout
          
          # Ver interfaces de red
          ip addr show
          
          # Ver conexiones activas
          netstat -tulpn
```

**Puerto forwarding con servicios:**
```yaml
jobs:
  service-test:
    runs-on: ubuntu-latest
    services:
      nginx:
        image: nginx
        ports:
          - 8080:80  # host:container
    
    steps:
      - name: Test service
        run: |
          curl http://localhost:8080
```

**Limitaciones de red:**
- Los runners NO pueden comunicarse entre sí
- Firewall rules aplican
- No puedes abrir puertos al exterior

---

## 11. Permisos y Seguridad

### Concepto de SO
- Usuarios y grupos
- Permisos (rwx)
- Principio de menor privilegio
- sudo/root

### En GitHub Actions

**Usuario del runner:**
```yaml
jobs:
  permissions-test:
    runs-on: ubuntu-latest
    steps:
      - name: Ver usuario
        run: |
          whoami
          id
          groups
          
          # El usuario 'runner' tiene sudo sin password
          sudo whoami
```

**Permisos de archivos:**
```yaml
steps:
  - name: Crear archivo con permisos
    run: |
      echo "secret" > file.txt
      chmod 600 file.txt  # Solo owner puede leer/escribir
      ls -l file.txt
```

**GitHub token permissions:**
```yaml
permissions:
  contents: read      # Leer contenido del repo
  pull-requests: write  # Escribir en PRs
  issues: write       # Escribir issues

jobs:
  my-job:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
```

---

## 12. Logging y Debugging

### Concepto de SO
- stdout (salida estándar)
- stderr (salida de error)
- Log files
- syslog

### En GitHub Actions

**Tipos de logs:**
```yaml
steps:
  - name: Diferentes tipos de output
    run: |
      echo "Normal output (stdout)"
      echo "Error message (stderr)" >&2
      
      # GitHub Actions log commands
      echo "::debug::Debug message"
      echo "::notice::Notice message"
      echo "::warning::Warning message"
      echo "::error::Error message"
```

**Grouping:**
```yaml
steps:
  - name: Grouped output
    run: |
      echo "::group::Installing dependencies"
      npm install
      echo "::endgroup::"
      
      echo "::group::Running tests"
      npm test
      echo "::endgroup::"
```

**Debug mode:**
```yaml
steps:
  - name: Debug info
    run: |
      if [ "$RUNNER_DEBUG" == "1" ]; then
        set -x  # Enable bash debug mode
        # Comandos con debug verbose
      fi
```

---

## Ejercicio Integrador

Crea un workflow que demuestre todos estos conceptos:

```yaml
name: Sistema Operativo en Acción

on: [push]

jobs:
  analisis-sistema:
    name: Análisis Completo del Sistema
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - uses: actions/checkout@v3
      
      - name: 1. Información del Proceso
        run: |
          echo "=== PROCESO ==="
          echo "PID: $$"
          echo "PPID: $PPID"
          ps -p $$ -o pid,ppid,cmd,stat
      
      - name: 2. Recursos del Sistema
        run: |
          echo "=== RECURSOS ==="
          echo "CPU cores: $(nproc)"
          echo "Memoria total: $(free -h | awk '/^Mem:/{print $2}')"
          echo "Disco disponible: $(df -h / | awk 'NR==2{print $4}')"
      
      - name: 3. Sistema de Archivos
        run: |
          echo "=== FILESYSTEM ==="
          echo "Workspace: $GITHUB_WORKSPACE"
          echo "Tipo: $(df -T $GITHUB_WORKSPACE | awk 'NR==2{print $2}')"
          ls -la
      
      - name: 4. Variables de Entorno
        run: |
          echo "=== VARIABLES ==="
          echo "PATH: $PATH"
          echo "USER: $USER"
          env | grep -E "GITHUB_|RUNNER_" | sort
      
      - name: 5. Red
        run: |
          echo "=== NETWORKING ==="
          ip addr show
          curl -I https://github.com
      
      - name: 6. Exit Codes
        run: |
          echo "=== EXIT CODES ==="
          true && echo "Comando exitoso: $?"
          false || echo "Comando fallido: $?"
```

---

## Conclusión

GitHub Actions no es solo una herramienta de CI/CD; es una plataforma que te permite aplicar y entender conceptos fundamentales de sistemas operativos en un contexto real y práctico.

Cada vez que ejecutas un workflow:
- Creas y gestionas procesos
- Asignas y liberas recursos
- Manipulas el filesystem
- Configuras variables de entorno
- Gestionas la concurrencia
- Trabajas con diferentes sistemas operativos

**Estos son exactamente los mismos conceptos que estudias en tu clase de Sistemas Operativos.**

---

## Para Reflexionar

1. ¿Cómo se relaciona un job de GitHub Actions con un proceso en tu computadora?
2. ¿Qué papel juega el sistema operativo del runner?
3. ¿Cómo se gestiona la memoria en un runner?
4. ¿Por qué los archivos no persisten entre jobs?
5. ¿Qué ventajas tiene ejecutar en contenedores?
6. ¿Cómo se asemeja la matriz de builds al concepto de concurrencia?

**La práctica con GitHub Actions te dará una comprensión más profunda de cómo funcionan los sistemas operativos en el mundo real.**
