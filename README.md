# CI/CD con GitHub Actions - Ejercicio Práctico
## Clase de Sistemas Operativos

Este repositorio contiene el material práctico para aprender sobre CI/CD pipelines usando GitHub Actions, con enfoque en conceptos de sistemas operativos.

## Contenido

- `index.js` - Aplicación simple con funciones matemáticas
- `test.js` - Suite de tests unitarios
- `package.json` - Configuración del proyecto Node.js
- `.github/workflows/` - Workflows de GitHub Actions

## Objetivos de Aprendizaje

1. Entender qué es CI/CD y por qué es importante
2. Aprender a configurar GitHub Actions
3. Relacionar conceptos de CI/CD con sistemas operativos
4. Crear workflows automatizados
5. Ejecutar tests en múltiples sistemas operativos

## Paso a Paso

### Paso 1: Fork o Clonar este Repositorio

```bash
# Opción A: Clonar
git clone <url-de-este-repo>
cd <nombre-del-repo>

# Opción B: Crear desde cero
mkdir cicd-demo
cd cicd-demo
git init
```

### Paso 2: Copiar los Archivos

Si estás creando desde cero, copia estos archivos a tu proyecto:

```
cicd-demo/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── multi-os.yml
│       └── scheduled.yml
├── index.js
├── test.js
├── package.json
└── README.md
```

### Paso 3: Crear el Repositorio en GitHub

1. Ve a GitHub y crea un nuevo repositorio
2. NO inicialices con README (ya tienes uno)
3. Copia los comandos para push

```bash
git add .
git commit -m "Initial commit: Setup CI/CD with GitHub Actions"
git branch -M main
git remote add origin <tu-url-de-github>
git push -u origin main
```

### Paso 4: Ver los Workflows en Acción

1. Ve a tu repositorio en GitHub
2. Haz clic en la pestaña "Actions"
3. Verás tus workflows ejecutándose automáticamente
4. Haz clic en cualquier workflow para ver los detalles

## Workflows Incluidos

### 1. CI Pipeline Básico (`ci.yml`)

**Se ejecuta cuando:**
- Haces push a `main` o `develop`
- Abres un Pull Request
- Lo ejecutas manualmente

**Lo que hace:**
- Ejecuta tests unitarios
- Hace build de la aplicación
- Muestra información del sistema operativo
- Guarda artifacts del build

### 2. Tests Multi-OS (`multi-os.yml`)

**Se ejecuta cuando:**
- Haces push a `main`
- Lo ejecutas manualmente

**Lo que hace:**
- Ejecuta tests en Ubuntu, Windows y macOS
- Prueba con Node.js 16, 18 y 20
- Total: 9 combinaciones de OS + versión
- Muestra comandos específicos de cada SO

### 3. Verificación Programada (`scheduled.yml`)

**Se ejecuta cuando:**
- Diariamente a las 8:00 AM UTC (automático)
- Lo ejecutas manualmente

**Lo que hace:**
- Health check del sistema
- Ejecuta tests de forma programada
- Muestra estadísticas del runner
- Notifica el estado

## Ejecutar Tests Localmente

```bash
# Instalar dependencias
npm install

# Ejecutar tests
npm test

# Ejecutar la aplicación
npm start
```

## Conceptos de Sistemas Operativos

### 1. Procesos y Jobs

```yaml
jobs:
  test:    # Proceso 1
    runs-on: ubuntu-latest
  build:   # Proceso 2 (se ejecuta después)
    needs: test
```

- Cada **job** es como un **proceso** independiente
- Los jobs pueden ejecutarse en **paralelo** (concurrencia)
- Pueden tener **dependencias** entre ellos (`needs`)

### 2. Runners y Recursos

```yaml
runs-on: ubuntu-latest
```

- Los **runners** son máquinas virtuales (VMs)
- Cada runner tiene recursos asignados (CPU, RAM, disco)
- Diferentes sistemas operativos disponibles

### 3. Sistema de Archivos

```yaml
- name: Crear archivo
  run: echo "datos" > output.txt

- name: Leer archivo
  run: cat output.txt
```

- Cada job tiene su propio **workspace**
- Los archivos no persisten entre jobs (por defecto)
- Usa **artifacts** para compartir archivos

### 4. Variables de Entorno

```yaml
env:
  NODE_ENV: production
  DATABASE_URL: ${{ secrets.DB_URL }}
```

- Configuración del entorno de ejecución
- Variables a nivel de workflow, job o step
- Secrets para datos sensibles

### 5. Exit Codes

```javascript
process.exit(0);  // Éxito
process.exit(1);  // Error
```

- Exit code 0 = éxito (workflow continúa)
- Exit code != 0 = error (workflow falla)
- Importante para el control de flujo

## Ejercicios Propuestos

### Ejercicio 1: Modificar Tests
1. Agrega una nueva función a `index.js`
2. Crea tests para esa función en `test.js`
3. Haz commit y push
4. Observa cómo GitHub Actions ejecuta los tests automáticamente

### Ejercicio 2: Agregar Linting
1. Crea un nuevo step en el workflow para ejecutar un linter
2. Instala ESLint como dependencia
3. Configura reglas de linting
4. Verifica que el workflow falle si hay errores de estilo

### Ejercicio 3: Conditional Steps
1. Agrega un step que solo se ejecute en la rama `main`
2. Usa la condición: `if: github.ref == 'refs/heads/main'`
3. Este step podría simular un deployment

### Ejercicio 4: Matriz Personalizada
1. Modifica el workflow multi-OS
2. Agrega más combinaciones de SO y versiones
3. Observa cómo aumenta el tiempo de ejecución

### Ejercicio 5: Artifacts
1. Modifica el workflow para generar un archivo de log
2. Guarda ese log como artifact
3. Descarga el artifact desde GitHub UI

## Entendiendo los Logs

Cuando ves los logs de un workflow, observa:

1. **Set up job**
   - Inicialización del runner
   - Asignación de recursos
   - Configuración del entorno

2. **Cada step**
   - Comandos ejecutados
   - Salida estándar (stdout)
   - Errores (stderr)
   - Tiempo de ejecución

3. **Complete job**
   - Limpieza de recursos
   - Exit code final
   - Tiempo total

## Preguntas para Reflexionar

1. ¿Cómo se relacionan los jobs de GitHub Actions con los procesos en un SO?
2. ¿Qué pasa con el filesystem cuando termina un job?
3. ¿Por qué es importante testear en múltiples sistemas operativos?
4. ¿Cómo maneja GitHub Actions la concurrencia de workflows?
5. ¿Qué recursos del sistema usa un runner?
6. ¿Cómo se comunican los procesos en un pipeline de CI/CD?

## Recursos Adicionales

### Documentación Oficial
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)

### Herramientas Útiles
- [act](https://github.com/nektos/act) - Ejecutar GitHub Actions localmente
- [actionlint](https://github.com/rhysd/actionlint) - Linter para workflows

### Tutoriales
- [Microsoft Learn - GitHub Actions](https://learn.microsoft.com/en-us/training/modules/introduction-to-github-actions/)
- [GitHub Skills](https://skills.github.com/)

## Mejores Prácticas

1. Mantén los workflows simples y enfocados
2. Usa `name` descriptivos para cada step
3. Configura timeouts para evitar workflows colgados
4. Usa caching para dependencias
5. Documenta tus workflows
6. Nunca incluyas secrets en el código
7. Usa matrix strategy para tests multi-entorno
8. Falla rápido: pon los tests más rápidos primero

## Troubleshooting

### El workflow no se ejecuta
- Verifica que el archivo esté en `.github/workflows/`
- Revisa que la sintaxis YAML sea correcta
- Confirma que el evento disparador sea correcto

### Los tests fallan
- Ejecuta los tests localmente primero
- Revisa los logs detallados en GitHub Actions
- Verifica las dependencias y versiones

### Timeout
- Reduce el scope de cada job
- Aumenta el timeout si es necesario
- Optimiza scripts pesados

## Evaluación

Al completar este ejercicio, deberías ser capaz de:

- Explicar qué es CI/CD
- Crear workflows de GitHub Actions
- Configurar triggers (eventos)
- Definir jobs y steps
- Ejecutar tests en múltiples SO
- Leer y entender logs de workflows
- Relacionar CI/CD con conceptos de SO

## Contacto

¿Preguntas o problemas? Abre un issue en este repositorio.

---

**Feliz aprendizaje**

*Recuerda: La mejor forma de aprender es practicando. Experimenta con diferentes configuraciones y observa qué pasa.*
