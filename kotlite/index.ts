/**
 * Kotlite DB - SQLite-like Local Storage Engine inspired by Kotlin DSL
 * 
 * Un motor de base de datos modular, reactivo, tipado y superligero
 * diseñado para browsers, Next.js (SSR safe) y React.
 */

// Exportación de clases y funciones (valores ejecutables)
export {
  InMemoryStorageEngine,
  LocalStorageEngine,
  getOptimalStorage,
} from './Storage';

export {
  ColumnBuilder,
  TableSchemaBuilder,
} from './Schema';

export {
  QueryBuilder,
} from './Query';

export {
  KotliteTable,
} from './Table';

export {
  KotliteDatabase,
  KotliteDatabaseBuilder,
  createKotliteDatabase,
} from './Database';

export {
  KotliteSyncManager,
} from './Sync';

export {
  KotliteCrypto,
} from './Crypto';

export {
  KotliteRelationsEngine,
} from './Relations';

// Exportación de Tipos e Interfaces (declaraciones de tipos para TypeScript)
export type { StorageEngine } from './Storage';
export type { ColumnType, ColumnDefinition, TableSchema, ForeignKeyDefinition } from './Schema';
export type { RowData } from './Query';
export type { DatabaseConfigLambda, SubscriptionCallback } from './Database';
export type { KotliteBackup, ImportOptions, ImportResult } from './Sync';
