/**
 * Stridb - Strict, Direct, High-Performance IndexedDB Database
 * Entry point for modular database architecture.
 */

export { createStridbDatabase, StridbDatabase } from "./Database";
export { TableSchemaBuilder, ColumnBuilder } from "./Schema";
export type { TableSchema, ColumnType } from "./Schema";
export { StridbQuery } from "./Query";
export { StridbDebug } from "./Debug";
export { StridbTransaction } from "./Transaction";
export { StridbBackup } from "./Backup";
export { StridbCrypto } from "./Crypto";
export { StridbStoragePersistence } from "./StoragePersistence";
export { StridbInactivityManager } from "./InactivityManager";
export { StridbLLMKeyVault } from "./KeyVault";
export type { LLMKeyRecord } from "./KeyVault";
export { useStridbQuery } from "./Hooks";

