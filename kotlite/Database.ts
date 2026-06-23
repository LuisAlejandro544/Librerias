/**
 * Kotlite DB - Database Orchestrator (Kotlin DSL Facade)
 * Orquestador principal que une el almacenamiento, esquemas y la reactividad.
 */

import { StorageEngine, getOptimalStorage } from './Storage';
import { TableSchema, TableSchemaBuilder } from './Schema';
import { KotliteTable } from './Table';
import { RowData } from './Query';

export type DatabaseConfigLambda = (dbBuilder: KotliteDatabaseBuilder) => void;
export type SubscriptionCallback = (tableName: string, rows: RowData[]) => void;

export class KotliteDatabase {
  private dbName: string;
  private storage: StorageEngine;
  private tables: Record<string, KotliteTable> = {};
  private subscribers: Set<SubscriptionCallback> = new Set();

  constructor(
    dbName: string,
    schemas: Record<string, TableSchema>,
    storageSpec?: StorageEngine
  ) {
    this.dbName = dbName;
    this.storage = storageSpec ?? getOptimalStorage();
    this.initializeTables(schemas);
  }

  /**
   * Revive las tablas persistidas e inicializa sus escuchadores locales de sincronización
   */
  private initializeTables(schemas: Record<string, TableSchema>) {
    for (const [tableName, schema] of Object.entries(schemas)) {
      const storageKey = `kotlite:${this.dbName}:${tableName}`;
      const savedData = this.storage.getItem(storageKey);
      let initialRows: RowData[] = [];

      if (savedData) {
        try {
          initialRows = JSON.parse(savedData);
        } catch (e) {
          console.error(
            `[Kotlite Database Warn] No se pudieron revivir los registros guardados de la tabla '${tableName}'. Iniciando vacía.`,
            e
          );
        }
      }

      // Crear el manejador de operaciones e inyectar el guardado automático reactivo
      this.tables[tableName] = new KotliteTable(
        schema,
        initialRows,
        (updatedRows) => {
          // 1. Guardar de forma atómica e instantánea en el motor persistente
          this.storage.setItem(storageKey, JSON.stringify(updatedRows));
          // 2. Transmitir el nuevo estado de datos a todos los hooks y UI suscritos
          this.notifySubscribers(tableName, updatedRows);
        }
      );
    }
  }

  /**
   * Retorna el manejador de operaciones CRUD para la tabla solicitada
   */
  table(name: string): KotliteTable {
    const tableInstance = this.tables[name];
    if (!tableInstance) {
      throw new Error(
        `[Kotlite Database Error] Intento de consultar la tabla no registrada '${name}' en la base de datos '${this.dbName}'.`
      );
    }
    return tableInstance;
  }

  /**
   * Suscribe una función reactiva que detectará inserciones, modificaciones o borrados en tiempo real.
   * Retorna una función para cancelar la suscripción de forma limpia (Prevención de Fugados de Memoria).
   */
  subscribe(callback: SubscriptionCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(tableName: string, rows: RowData[]) {
    this.subscribers.forEach((callback) => {
      try {
        callback(tableName, rows);
      } catch (e) {
        console.error(`[Kotlite Callback Crash] Error ejecutando callback de suscripción:`, e);
      }
    });
  }

  /**
   * Resetea (trunco) todas las tablas vinculadas a este espacio de base de datos
   */
  clearAllTables(): void {
    for (const tableName of Object.keys(this.tables)) {
      this.tables[tableName].truncate();
    }
  }
}

/**
 * Constructor de esquemas declarativos que define tablas usando closures funcionales.
 */
export class KotliteDatabaseBuilder {
  private schemas: Record<string, TableSchema> = {};

  /**
   * Registra una tabla especificando su nombre y un constructor DSL de columnas
   */
  table(
    tableName: string,
    schemaLambda: (schemaBuilder: TableSchemaBuilder) => void
  ): KotliteDatabaseBuilder {
    const sBuilder = new TableSchemaBuilder(tableName);
    schemaLambda(sBuilder);
    this.schemas[tableName] = sBuilder.buildTableSchema();
    return this;
  }

  getSchemas(): Record<string, TableSchema> {
    return this.schemas;
  }
}

/**
 * Función primordial y punto de entrada (DSL Facade) que configura e instancia la base de datos Kotlite.
 * 
 * @example
 * const db = createKotliteDatabase("chat_room", (db) => {
 *   db.table("messages", (t) => {
 *     t.integer("id").primaryKey()
 *     t.text("sender")
 *     t.boolean("read").default(false)
 *     t.datetime("sentAt").default(() => new Date().toISOString())
 *   })
 * })
 */
export function createKotliteDatabase(
  dbName: string,
  configLambda: DatabaseConfigLambda,
  customStorage?: StorageEngine
): KotliteDatabase {
  const dbBuilder = new KotliteDatabaseBuilder();
  configLambda(dbBuilder);
  return new KotliteDatabase(dbName, dbBuilder.getSchemas(), customStorage);
}
