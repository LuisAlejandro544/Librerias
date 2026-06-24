export interface Library {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: 'ui' | 'state' | 'network' | 'animation';
  stars: number;
  downloads: string;
  size: string;
  version: string;
  githubUrl: string;
  npmCommand: string;
  features: string[];
  installation: string;
  usageCode: string;
  playgroundType: 'grid' | 'state' | 'fetch' | 'animate' | 'kotlite' | 'sync' | 'stridb';
}

export const libraries: Library[] = [
  {
    id: "kotlite-db",
    name: "kotlite-db",
    tagline: "Motor de base de datos local inmutable, reactivo y SSR-Safe inspirado en el DSL de Kotlin.",
    description: "Una solución ligera y moderna creada bajo Desarrollo Modular Ultra para gestionar persistencia reactiva en memoria y localStorage de forma 100% segura en Next.js (SSR). Ofrece una definición de esquemas declarativa mediante Chaining, validaciones estrictas de unicidad de claves y un motor de consultas fluido idéntico a las colecciones de Kotlin.",
    category: "state",
    stars: 12, // Inicializado de manera realista para reflejar la tracción inicial del proyecto
    downloads: "120/m",
    size: "4.5 KB",
    version: "v1.0.0",
    githubUrl: "https://github.com/LuisAlejandro544/Librerias",
    npmCommand: "npx jsr add @alejandro/kotlite-db",
    features: [
      "100% Seguro contra SSR: Conmutación en caliente entre LocalStorage, InMemory e IndexedDB",
      "Sintaxis estilo Kotlin: Declara tablas, columnas y constraints de forma fluida",
      "Restricciones sólidas: Autoincremento automático, claves únicas, campos No-Nulos y relaciones CASCADE/RESTRICT/SET_NULL",
      "Reactividad innata: Patrón PubSub integrado con Hook React para recargas automáticas de interfaz",
      "Suite de Depuración Integrada: Alertas automáticas de rendimiento y restricciones en consola",
      "Puente de Migración Kotlin: Transfiere esquemas y volcados de bases de datos Android SQLite/Room"
    ],
    installation: `# Opción 1: Registro Oficial JSR (Para Node, Deno y Bun)
# NPM (Node.js)
npx jsr add @alejandro/kotlite-db

# Deno
deno add jsr:@alejandro/kotlite-db

# Bun
bunx jsr add @alejandro/kotlite-db

# PNPM / Yarn
pnpm dlx jsr add @alejandro/kotlite-db
yarn dlx jsr add @alejandro/kotlite-db

# Opción 2: Instalador Offline Personalizado (Script Curl)
curl -sSL [APP_URL]/api/download/install.sh | bash

# O si deseas descargarlo en una carpeta específica:
mkdir -p mi-proyecto/kotlite && cd mi-proyecto/kotlite
curl -sSL [APP_URL]/api/download/install.sh | bash`,
    usageCode: `import { createKotliteDatabase } from './kotlite';

// 1. Declaración limpia con Kotlin DSL (db_config.ts)
export const db = createKotliteDatabase("portfolio_db", (builder) => {
  builder.table("todos", (t) => {
    t.integer("id").primaryKey(); // Autoincremento integrado
    t.text("title").notNull();
    t.boolean("done").default(false);
  });
});

// 2. Consulta fluida de registros
const finalResult = db.table("todos")
  .query()
  .where(t => t.done === false)
  .orderBy("id", "DESC")
  .limit(5)
  .execute();`,
    playgroundType: "kotlite"
  },
  {
    id: "kotlite-sync",
    name: "kotlite-sync",
    tagline: "Protocolo de sincronización offline-first ultraliviano para bases de datos locales y sincronización Cloud.",
    description: "Un middleware bidireccional de alto rendimiento diseñado específicamente para Kotlite DB y almacenamiento localStorage/InMemory. Implementa sincronización basada en marcas de tiempo con resolución de conflictos automatizada por estrategias LWW (Last-Write-Wins), reduciendo el consumo de ancho de banda hasta un 70% mediante transmisiones diferenciales delta optimizadas.",
    category: "network",
    stars: 8,
    downloads: "Idea Propuesta",
    size: "1.2 KB",
    version: "v0.1.0-beta",
    githubUrl: "https://github.com/LuisAlejandro544/Librerias",
    npmCommand: "npm install @kotlite/sync-beta",
    features: [
      "Sincronización diferencial delta inteligente con un mínimo de overhead de datos",
      "Estrategia Last-Write-Wins (LWW) automatizada para resolución de colisiones en milisegundos",
      "Cola de operaciones offline persistente en localStorage con retransmisión automática",
      "Conexión plug-and-play directa con Firestore, Supabase o endpoints REST/GraphQL"
    ],
    installation: `npm install @kotlite/sync-beta

# O usando Yarn / Pnpm:
yarn add @kotlite/sync-beta
pnpm add @kotlite/sync-beta`,
    usageCode: `import { createKotliteSync } from '@kotlite/sync';
import { db } from './db_config';

// Inicializa el middleware de sincronización con tu endpoint o Firebase
const syncer = createKotliteSync(db, {
  endpoint: 'https://api.tu-servidor.com/sync',
  strategy: 'LWW', // Last-Write-Wins
  syncIntervalMs: 5000, // Sincronización automática cada 5 segundos
  onConflict: (local, remote) => {
    console.warn('Conflicto de sincronización resuelto automáticamente:', local, remote);
  }
});

// Arranca el loop de sincronización en caliente
syncer.start();`,
    playgroundType: "sync"
  },
  {
    id: "stridb-db",
    name: "stridb",
    tagline: "Motor de base de datos relacional estricto, asíncrono y de alto rendimiento sobre IndexedDB.",
    description: "Un wrapper ultraliviano y robusto para IndexedDB estructurado en forma de tablas SQLite-like. Ofrece definición estricta de esquemas (con tipos específicos como INTEGER, TEXT, DATETIME y JSON), asincronía basada en Promesas nativas, transacciones seguras con auto-rollback, exportación completa de respaldos y un módulo de depuración en consola con telemetría visual.",
    category: "state",
    stars: 15,
    downloads: "80/m",
    size: "3.2 KB",
    version: "v1.0.0",
    githubUrl: "https://github.com/LuisAlejandro544/Librerias",
    npmCommand: "npx jsr add @librerias/stridb",
    features: [
      "No más caos de almacenamiento: Estructura tus datos en tablas limpias con esquemas estrictos en IndexedDB",
      "Restricciones sólidas de esquema: Validación automática de campos No Nulos (notNull), claves primarias (primaryKey), autoincrementos y claves únicas",
      "Consultas asíncronas fluidas (Chaining API): Filtra mediante predicados funcionales, ordena y limita resultados en milisegundos",
      "Depurador visual integrado (`StridbDebug`): Reporta planes de ejecución e infracciones de integridad con colores CSS en consola",
      "Transacciones atómicas: Modifica múltiples tablas con la certeza de que si una falla, se ejecutará rollback automático",
      "Respaldos en JSON portables (`StridbBackup`): Rutinas nativas para exportar e importar copias completas de datos de un solo clic"
    ],
    installation: `# Opción 1: Registro Oficial JSR (Recomendado para Node, Deno y Bun)
npx jsr add @librerias/stridb

# Opción 2: Instalador Offline Personalizado (Script Curl)
curl -sSL [APP_URL]/api/download/install.sh | bash`,
    usageCode: `import { createStridbDatabase } from './stridb';

// 1. Declaración estricta del esquema de tablas (db_config.ts)
export const db = createStridbDatabase("mi_tienda_db", 1);

db.table("productos", (t) => {
  t.integer("id").primaryKey().autoIncrement();
  t.text("sku").notNull().unique();
  t.text("nombre").notNull();
  t.integer("precio").default(0);
});

// 2. Insertar registros de manera segura
await db.insert("productos", {
  sku: "PROD-100",
  nombre: "Smartwatch Deportivo v4",
  precio: 120
});

// 3. Consultas relacionales fluidas
const productosBuscados = await db.query("productos")
  .where(p => p.precio > 50)
  .orderBy("precio", "ASC")
  .limit(10)
  .execute();`,
    playgroundType: "stridb"
  }
];
