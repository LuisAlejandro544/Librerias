# Stridb ⚡

**Stridb** (Strict IndexedDB) es un motor de base de datos local robusto, estrictamente tipado, de alto rendimiento y directo, diseñado para el almacenamiento local estructurado en el navegador utilizando **IndexedDB**.

Inspirado en la simplicidad sintáctica de SQLite y la rigidez de TypeScript, Stridb erradica el desorden del almacenamiento local desestructurado (la infame "sopa de claves-valores") introduciendo una arquitectura basada en tablas con esquemas explícitos, restricciones lógicas de integridad, criptografía AES-GCM integrada de grado militar por columna, bóvedas seguras de claves de API de LLMs y mecanismos avanzados de resiliencia y auto-limpieza ante inactividad.

---

## 🌟 Características Clave

1. **Estructura Estricta (Anti Sopa de Datos)**: Define tablas relacionales con columnas de tipos fijos (`INTEGER`, `TEXT`, `BOOLEAN`, `JSON`, `DATETIME`).
2. **Sintaxis Directa y Chaining**: Haz consultas lógicas complejas sin verbosidad. Filtra, ordena, selecciona campos y aplica límites en una sola línea.
3. **Módulo de Depuración en Caliente (`StridbDebug`)**: Monitorea el tiempo de ejecución de las consultas (en milisegundos), planes de ejecución e infracciones de restricciones lógicas directamente en la consola con estilos CSS visuales de alto contraste.
4. **Seguridad de Transacciones**: Ejecuta múltiples operaciones mutadoras agrupadas atómicamente. Si una falla, se ejecuta un *rollback* completo de forma automática.
5. **Portabilidad de Datos (Backup & Restore)**: Exporta e importa bases de datos completas o tablas individuales a archivos JSON portables en un par de líneas de código.
6. **Encriptación Simétrica por Columna (`StridbCrypto`)**: Cifra columnas específicas de forma transparente usando AES-GCM (criptografía web nativa del cliente) antes de guardarlas en IndexedDB.
7. **Bóveda Segura de Claves de API de LLMs (`StridbLLMKeyVault`)**: Almacena de forma ultra-segura tus claves de API de Inteligencia Artificial (Gemini, OpenAI, Anthropic) cifradas con una clave maestra local en el dispositivo.
8. **Auto-Destrucción por Inactividad (`StridbInactivityManager`)**: Configura temporizadores de inactividad que purgan de forma segura e inmediata todo el almacenamiento de IndexedDB si el usuario está ausente por un tiempo específico.
9. **Persistencia contra Eliminación Dinámica (`StridbStoragePersistence`)**: Solicita almacenamiento persistente al navegador para bloquear que este purgue de forma automática la base de datos IndexedDB si el disco está lleno.
10. **Desarrollo Modular Ultra**: Separación física total de responsabilidades para un mantenimiento limpio y tree-shaking óptimo.

---

## 🚀 Instalación Rápida

Stridb está diseñado bajo los estándares modernos de ESM y TypeScript:

```bash
# Instalación local desde tu repositorio corporativo o repositorio JSR
npx jsr add @librerias/stridb
```

---

## 💡 Ejemplo Práctico de Uso

### 1. Definición del Esquema de la Base de Datos

```typescript
import { createStridbDatabase } from './stridb';

// Inicializa una base de datos estructurada
export const db = createStridbDatabase("tienda_local_db", 1);

// Define la tabla de productos con sus restricciones y columna encriptada
db.table("productos", (table) => {
  table.integer("id").primaryKey().autoIncrement();
  table.text("nombre").notNull().unique();
  table.integer("precio").notNull().default(0);
  table.text("secret_note").encrypted(); // Columna transparente cifrada con AES-GCM!
  table.boolean("disponible").default(true);
  table.datetime("fecha_creacion").default(() => new Date());
});
```

### 2. Configurar Clave Maestra de Encriptación

```typescript
// Establece la llave maestra simétrica para descifrado en caliente
db.setEncryptionKey("MiSuperClaveSegura123");
```

### 3. Insertar Registros Estrictos

```typescript
// La inserción valida automáticamente los tipos y cifra 'secret_note'
await db.insert("productos", {
  nombre: "Auriculares Inalámbricos Pro",
  precio: 89,
  secret_note: "Margen de ganancia: 45%",
  disponible: true
});
```

### 4. Bóveda Segura de Claves LLM (`KeyVault`)

```typescript
import { StridbLLMKeyVault } from './stridb';

// Guarda la API key cifrada con la llave maestra
await StridbLLMKeyVault.saveKey("Gemini", "Producción Main", "AIzaSy...", "MiSuperClaveSegura123");

// Recupera la API key en texto plano listo para enviar peticiones al backend
const apiKey = await StridbLLMKeyVault.retrieveKey("Gemini", "Producción Main", "MiSuperClaveSegura123");
console.log(apiKey); // "AIzaSy..."
```

### 5. Configurar Auto-Destrucción por Inactividad

```typescript
import { StridbInactivityManager } from './stridb';

// Eliminará automáticamente toda la base si transcurren 5 minutos de inactividad
StridbInactivityManager.configureAutoDestruct(db, 300000, () => {
  console.warn("La base de datos se autodestruyó por seguridad tras 5 minutos de inactividad.");
});
```

### 6. Solicitar Persistencia al Navegador

```typescript
import { StridbStoragePersistence } from './stridb';

// Bloquea que el navegador limpie nuestro almacenamiento local IndexedDB
const exito = await StridbStoragePersistence.requestPersistence();
console.log("¿Almacenamiento persistente bloqueado?:", exito);
```

---

## 🛠️ Arquitectura Modular

Stridb se construye sobre el principio de **Desarrollo Modular Ultra**. Cada archivo tiene una única y estricta función:

- **`Database.ts`**: Coordina las conexiones a IndexedDB, migraciones de versión y despacha operaciones CRUD.
- **`Schema.ts`**: Define los tipos de datos compatibles (`INTEGER`, `TEXT`, `BOOLEAN`, `JSON`, `DATETIME`) y valida registros contra esquemas lógicos.
- **`Query.ts`**: Motor de consultas con sintaxis fluida (*Chaining*), ordenamientos lógicos en memoria y limits.
- **`Crypto.ts`**: Cifrado y descifrado simétrico AES-GCM nativo del cliente para columnas seguras.
- **`KeyVault.ts`**: Bóveda local cifrada e independiente para almacenar credenciales de LLM con alta protección.
- **`InactivityManager.ts`**: Gestor de monitoreo de actividad e inactividad para purgado seguro automatizado.
- **`StoragePersistence.ts`**: Interfaz de comunicación con la API de Storage nativa del navegador para asegurar permanencia física de los datos.
- **`Debug.ts`**: Módulo de telemetría de consola que inyecta bitácoras estilizadas e informa sobre la velocidad de procesamiento.
- **`Transaction.ts`**: Gestor de transacciones IndexedDB con protección transaccional para revertir escrituras parciales.
- **`Backup.ts`**: Exportador e importador dinámico en formato estructurado JSON.

---

## 📜 Licencia

Distribuido bajo la Licencia **Apache 2.0**. Consulta el archivo [LICENSE](./LICENSE) para conocer el texto completo de la licencia original.
