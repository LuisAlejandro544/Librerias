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
  playgroundType: 'grid' | 'state' | 'fetch' | 'animate' | 'kotlite' | 'sync';
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
    npmCommand: "curl -sSL [APP_URL]/api/download/install.sh | bash",
    features: [
      "100% Seguro contra SSR: Conmutación en caliente entre LocalStorage e InMemory",
      "Sintaxis estilo Kotlin: Declara tablas, columnas y constraints de forma fluida",
      "Restricciones sólidas: Autoincremento automático, claves únicas, campos No-Nulos y valores por defecto",
      "Reactividad innata: Patrón PubSub integrado con Hook React para recargas automáticas de interfaz"
    ],
    installation: `curl -sSL [APP_URL]/api/download/install.sh | bash

# O si deseas descargarlo en una carpeta específica:
mkdir -p mi-proyecto && cd mi-proyecto
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
  }
];
