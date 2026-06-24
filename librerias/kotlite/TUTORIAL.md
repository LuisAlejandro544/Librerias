# Guía Interactiva y Tutorial Completo de Kotlite DB (v1.0.0)

¡Bienvenido al tutorial oficial de **Kotlite DB**! Este documento está diseñado para ayudarte a dominar el motor de base de datos relacional y reactivo inspirado en el DSL de Kotlin. Aquí aprenderás a estructurar esquemas, implementar persistencia avanzada, utilizar IndexedDB y herramientas de depuración, así como migrar tus datos de Kotlin nativo a la web.

---

## 🚀 1. Configuración de Esquemas y DSL de Kotlin

La base de datos se configura de manera completamente declarativa mediante lambdas de Chaining de estilo Kotlin.

```typescript
import { createKotliteDatabase } from './kotlite';

// Creación declarativa e inmutable de la base de datos
export const db = createKotliteDatabase("mi_app_db", (builder) => {
  // Tabla de Usuarios
  builder.table("usuarios", (t) => {
    t.integer("id").primaryKey(); // Autoincremental implícito
    t.text("nombre").notNull();
    t.text("email").unique();
    t.boolean("activo").default(true);
    t.datetime("creadoEn").default(() => new Date().toISOString());
  });

  // Tabla de Tareas (con Clave Foránea / Relación 1:N)
  builder.table("tareas", (t) => {
    t.integer("id").primaryKey();
    t.integer("usuarioId").notNull().references("usuarios", "id", "CASCADE");
    t.text("descripcion");
    t.boolean("completado").default(false);
  });
});
```

---

## 🗄️ 2. Persistencia Estricta e IndexedDB

Por defecto, Kotlite DB utiliza un motor de almacenamiento en memoria `InMemoryStorageEngine` o `LocalStorageEngine` con prefijos aislados y seguros. En la versión **1.0.0** puedes conmutar a **IndexedDB** para manejar cantidades masivas de datos mediante el patrón **Write-Through Cache**.

### Configuración con IndexedDB:

```typescript
import { createKotliteDatabase, getOptimalStorage } from './kotlite';

// 1. Obtener el almacenamiento híbrido optimizado para IndexedDB
const storageEngine = getOptimalStorage(true); // true = Priorizar IndexedDB

export const db = createKotliteDatabase("tienda_db", (builder) => {
  builder.table("productos", (t) => {
    t.integer("id").primaryKey();
    t.text("nombre");
    t.real("precio");
  });
}, storageEngine);

// 2. Inicialización en el cliente (ej. en React / Next.js)
// Llama al método init() para poblar síncronamente el caché en memoria desde IndexedDB
useEffect(() => {
  const prepararBaseDeDatos = async () => {
    await db.init();
    console.log("¡Caché de IndexedDB cargada síncronamente en caliente!");
  };
  prepararBaseDeDatos();
}, []);
```

---

## 🔍 3. Operaciones CRUD y Consultas de Colección

Kotlite DB permite buscar, ordenar y filtrar registros usando una interfaz que emula la sintaxis de colecciones fluida de Kotlin:

```typescript
// --- INSERCIÓN ---
db.table("usuarios").insert({ nombre: "Alejandro", email: "ale@kotlite.com" });

// --- CONSULTA EN CADENA ---
const usuariosActivos = db.table("usuarios")
  .query()
  .where(u => u.activo === true)
  .orderBy("nombre", "ASC")
  .limit(10)
  .execute();

// --- ACTUALIZACIÓN ---
db.table("usuarios").update(
  u => u.id === 1,
  { nombre: "Luis Alejandro" }
);

// --- ELIMINACIÓN (Con integridad referencial CASCADE) ---
db.table("usuarios").delete(u => u.id === 1); 
// Esto eliminará automáticamente las tareas asociadas al usuario con ID 1
```

---

## 🛠️ 4. Herramientas de Depuración (Debug Suite)

Kotlite DB incluye un suite de diagnóstico en consola que te ayuda a capturar errores de rendimiento y restricciones de forma inmediata en tu consola de desarrollador:

```typescript
import { KotliteDebugger } from './kotlite';

// Habilitar o deshabilitar logs detallados de depuración (ej. desactivar en producción)
KotliteDebugger.enabled = true;

// Registrar una violación de restricción personalizada o inspeccionar una tabla
const filas = db.table("usuarios").all();
KotliteDebugger.inspectTable("usuarios", db.table("usuarios").getSchema(), filas);
```

### ¿Qué captura automáticamente el Debugger?
1. **TYPE_MISMATCH**: Al intentar insertar un tipo de dato inválido.
2. **CONSTRAINT_VIOLATION**: Al duplicar un valor con restricción `unique` o ingresar nulos en campos `notNull`.
3. **PERFORMANCE_WARNING**: Si una consulta o tabla maneja volúmenes muy altos o tarda más de 50ms.

---

## 📲 5. Guía de Migración de Kotlin a Web (Fiel a Room)

Si tienes una aplicación en Android escrita en Kotlin usando **Room** o **SQLite** nativo, Kotlite te permite llevar los datos e inclusive el esquema de forma sumamente sencilla con la utilidad `KotliteMigrationBridge`:

### Paso 1: Definir los campos de tu entidad Kotlin
```typescript
import { KotliteMigrationBridge, KotlinEntityField } from './kotlite';

const camposKotlin: KotlinEntityField[] = [
  { name: "id", kotlinType: "Int", isPrimaryKey: true, isNullable: false },
  { name: "title", kotlinType: "String", isPrimaryKey: false, isNullable: false },
  { name: "completed", kotlinType: "Boolean", isPrimaryKey: false, isNullable: false }
];

// Genera automáticamente el código DSL de Kotlite correspondiente
const codigoDSL = KotliteMigrationBridge.generateDSLFromKotlinSchema("todos", camposKotlin);
console.log(codigoDSL);
```

### Paso 2: Importar volcado JSON desde Room/SQLite
En Android, puedes exportar la base de datos de Room en formato JSON. Utiliza el puente de migración para adaptarla y guardarla directamente:

```typescript
const dumpDeRoomAndroid = [
  { id: 101, title: "Tarea de Android", completed: 1 }, // Note que usa enteros para booleanos
  { id: 102, title: "Completar testing", completed: 0 }
];

const resultado = KotliteMigrationBridge.importKotlinDump(
  db.table("tareas"),
  dumpDeRoomAndroid,
  { ignoreErrors: true, clearBeforeImport: true }
);

console.log(`¡Migración exitosa! ${resultado.importedCount} registros migrados desde Android.`);
```

---

¡Disfruta desarrollando con **Kotlite DB v1.0.0**! Modifica y adapta el código según las pautas de contribución.
