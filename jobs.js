// jobs.js - Simulación de GitHub Actions

const fs = require('fs');

// Variables de entorno
console.log("NODE_ENV =", process.env.NODE_ENV || "development");
console.log("DATABASE_URL =", process.env.DATABASE_URL || "no definida");

console.log("\n=== JOB 1: TEST ===");
// Job 1: test
try {
    fs.writeFileSync('output.txt', 'datos de prueba');
    console.log("Job TEST completado: archivo output.txt creado");
} catch (err) {
    console.error("Error en Job TEST:", err);
    process.exit(1); // falla el workflow
}

console.log("\n=== JOB 2: BUILD ===");
// Job 2: build (depende de test)
try {
    const data = fs.readFileSync('output.txt', 'utf8');
    console.log("Contenido de output.txt:", data);
    console.log("Job BUILD completado con éxito");
    process.exit(0); // éxito
} catch (err) {
    console.error("Error en Job BUILD:", err);
    process.exit(1); // falla el workflow
}
