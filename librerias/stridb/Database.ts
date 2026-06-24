/**
 * Stridb Database Coordinator
 * Connects to IndexedDB, creates ObjectStores dynamically, handles upgrades and provides reactive hooks.
 */

import { TableSchema, TableSchemaBuilder, validateRecord } from "./Schema";
import { StridbQuery } from "./Query";
import { StridbDebug } from "./Debug";
import { StridbCrypto } from "./Crypto";

type SubscriberCallback = (table: string, action: string, data?: any) => void;

export class StridbDatabase {
  private idb: IDBDatabase | null = null;
  private tables: Map<string, TableSchema> = new Map();
  private subscribers: Set<SubscriberCallback> = new Set();
  private isConnecting = false;
  private connectionPromise: Promise<IDBDatabase> | null = null;

  constructor(
    public readonly dbName: string,
    public readonly version: number = 1
  ) {}

  /**
   * Sets the Master Password for column-level encryption.
   */
  public setEncryptionKey(key: string): StridbDatabase {
    StridbCrypto.setMasterKey(key);
    return this;
  }

  /**
   * Registers a new table with its columns/constraints.
   */
  public table(name: string, configure: (builder: TableSchemaBuilder) => void): StridbDatabase {
    const builder = new TableSchemaBuilder(name);
    configure(builder);
    const schema = builder.build();
    this.tables.set(name, schema);
    return this;
  }

  /**
   * Safe getter for standard operations on a specific table.
   */
  public getTableSchema(name: string): TableSchema {
    const schema = this.tables.get(name);
    if (!schema) {
      throw new Error(`La tabla '${name}' no está registrada en el esquema de '${this.dbName}'`);
    }
    return schema;
  }

  /**
   * Genera una firma estructurada en formato string JSON de todas las tablas y columnas
   * registradas. Se utiliza en el motor de Auto-Migración para detectar cambios estructurales.
   */
  public getSchemaSignature(): string {
    const signatureObj: Record<string, any> = {};
    const sortedTableNames = Array.from(this.tables.keys()).sort();
    for (const tableName of sortedTableNames) {
      const schema = this.tables.get(tableName)!;
      const sanitizedColumns: Record<string, any> = {};
      for (const [colName, colDef] of Object.entries(schema.columns)) {
        sanitizedColumns[colName] = {
          type: colDef.type,
          primaryKey: colDef.primaryKey,
          autoIncrement: colDef.autoIncrement,
          notNull: colDef.notNull,
          unique: colDef.unique,
          encrypt: colDef.encrypt,
          hasDefault: colDef.default !== undefined
        };
      }
      signatureObj[tableName] = sanitizedColumns;
    }
    return JSON.stringify(signatureObj);
  }

  /**
   * Establishes the asynchronous connection with IndexedDB.
   */
  public connect(): Promise<IDBDatabase> {
    if (this.idb) return Promise.resolve(this.idb);
    if (this.isConnecting && this.connectionPromise) return this.connectionPromise;

    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      // Calcular versión activa usando Auto-Migración si está en el cliente
      let activeVersion = this.version;
      let currentSig = "";

      if (typeof window !== "undefined" && window.localStorage) {
        currentSig = this.getSchemaSignature();
        const storedSig = localStorage.getItem(`stridb_sig_${this.dbName}`);
        const storedVer = localStorage.getItem(`stridb_ver_${this.dbName}`);
        const parsedStoredVer = storedVer ? parseInt(storedVer, 10) : this.version;

        if (!storedSig) {
          // Primera inicialización de firma
          localStorage.setItem(`stridb_sig_${this.dbName}`, currentSig);
          localStorage.setItem(`stridb_ver_${this.dbName}`, String(this.version));
          activeVersion = this.version;
        } else if (storedSig !== currentSig) {
          // Cambio estructural detectado! Auto-incrementamos versión de IDB
          activeVersion = parsedStoredVer + 1;
          StridbDebug.warn(`[Auto-Migración] ¡Estructura de base de datos modificada! Elevando versión física de '${this.dbName}' a ${activeVersion}.`);
        } else {
          // Sin cambios en el esquema. Mantener la versión más alta registrada
          activeVersion = parsedStoredVer;
        }
      }

      StridbDebug.info(`Iniciando conexión con IndexedDB '${this.dbName}' (versión: ${activeVersion})`);
      const request = indexedDB.open(this.dbName, activeVersion);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        StridbDebug.info(`[Auto-Migración] Ciclo de actualización ejecutado para '${this.dbName}' (Física: ${event.oldVersion} -> ${event.newVersion})`);

        for (const [tableName, schema] of this.tables.entries()) {
          if (!db.objectStoreNames.contains(tableName)) {
            // Crear ObjectStore desde cero
            let keyPath: string | null = null;
            let autoIncrement = false;

            for (const [colName, colDef] of Object.entries(schema.columns)) {
              if (colDef.primaryKey) {
                keyPath = colName;
                autoIncrement = !!colDef.autoIncrement;
                break;
              }
            }

            const options: IDBObjectStoreParameters = {};
            if (keyPath) {
              options.keyPath = keyPath;
              options.autoIncrement = autoIncrement;
            } else {
              options.keyPath = "_id";
              options.autoIncrement = true;
            }

            const store = db.createObjectStore(tableName, options);
            StridbDebug.success(`[Auto-Migración] Nueva Tabla '${tableName}' creada con éxito.`);

            // Crear índices secundarios
            for (const [colName, colDef] of Object.entries(schema.columns)) {
              if (colName === keyPath || colName === "_id") continue;
              store.createIndex(colName, colName, { unique: !!colDef.unique });
            }
          } else {
            // MIGRAR TABLA EXISTENTE: Actualizar índices dinámicamente
            StridbDebug.info(`[Auto-Migración] Analizando y migrando tabla existente: '${tableName}'`);
            const store = event.target.transaction.objectStore(tableName);

            let keyPath: string | null = null;
            for (const [colName, colDef] of Object.entries(schema.columns)) {
              if (colDef.primaryKey) {
                keyPath = colName;
                break;
              }
            }

            // Crear índices nuevos
            for (const [colName, colDef] of Object.entries(schema.columns)) {
              if (colName === keyPath || colName === "_id") continue;

              if (!store.indexNames.contains(colName)) {
                store.createIndex(colName, colName, { unique: !!colDef.unique });
                StridbDebug.success(`[Auto-Migración] Índice '${colName}' añadido dinámicamente en '${tableName}'`);
              }
            }

            // Eliminar índices antiguos que ya no están en el esquema
            const indexNames = Array.from(store.indexNames) as string[];
            for (const indexName of indexNames) {
              if (!schema.columns[indexName]) {
                store.deleteIndex(indexName);
                StridbDebug.warn(`[Auto-Migración] Eliminando índice obsoleto '${indexName}' de la tabla '${tableName}'`);
              }
            }
          }
        }
      };

      request.onsuccess = (event: any) => {
        this.idb = event.target.result;
        this.isConnecting = false;

        // Persistir firma y versión activa tras conexión aprobada
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem(`stridb_sig_${this.dbName}`, currentSig);
          localStorage.setItem(`stridb_ver_${this.dbName}`, String(activeVersion));
        }

        StridbDebug.success(`Base de datos Stridb '${this.dbName}' conectada (versión activa: ${activeVersion}).`);
        resolve(event.target.result as IDBDatabase);
      };

      request.onerror = (event: any) => {
        this.isConnecting = false;
        const err = event.target.error;
        StridbDebug.error(`Error de conexión con IndexedDB '${this.dbName}'`, err);
        reject(err);
      };
    });

    return this.connectionPromise;
  }

  /**
   * Helper function to get DB instance safely.
   */
  private async getDB(): Promise<IDBDatabase> {
    await this.connect();
    if (!this.idb) {
      throw new Error(`No se pudo conectar a la base de datos '${this.dbName}'`);
    }
    return this.idb;
  }

  /**
   * Closes the active IndexedDB connection.
   */
  public close(): void {
    if (this.idb) {
      this.idb.close();
      this.idb = null;
      this.connectionPromise = null;
      StridbDebug.info(`Conexión con IndexedDB '${this.dbName}' cerrada.`);
    }
  }

  /**
   * Closes connection and deletes the database from IndexedDB entirely.
   */
  public async destroy(): Promise<boolean> {
    this.close();
    
    if (typeof window === "undefined" || !window.indexedDB) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.deleteDatabase(this.dbName);

      request.onsuccess = () => {
        StridbDebug.success(`Base de datos '${this.dbName}' eliminada de IndexedDB con éxito.`);
        this.notify("*", "destroy");
        resolve(true);
      };

      request.onerror = (e: any) => {
        StridbDebug.error(`Error al eliminar la base de datos '${this.dbName}'`, e.target.error);
        reject(e.target.error);
      };

      request.onblocked = () => {
        StridbDebug.warn(`La eliminación de '${this.dbName}' está bloqueada. Por favor, cierra otras pestañas o conexiones.`);
        resolve(true);
      };
    });
  }

  /**
   * Query builder instantiator.
   */
  public query<T = any>(tableName: string): StridbQuery<T> {
    const schema = this.getTableSchema(tableName);
    return new StridbQuery<T>(schema, () => this.getDB());
  }

  /**
   * Direct INSERT action.
   */
  public async insert(tableName: string, data: any): Promise<any> {
    const startTime = performance.now();
    const db = await this.getDB();
    const schema = this.getTableSchema(tableName);
    const validated = validateRecord(schema, data, false);
    const record = await StridbCrypto.encryptRecord(schema, validated);

    return new Promise((resolve, reject) => {
      const tx = db.transaction([tableName], "readwrite");
      const store = tx.objectStore(tableName);

      const request = store.add(record);

      request.onsuccess = async (event: any) => {
        const insertedId = event.target.result;
        
        // Retrieve and merge auto-generated primary key back to record
        let keyPath: string | null = null;
        for (const [colName, colDef] of Object.entries(schema.columns)) {
          if (colDef.primaryKey) {
            keyPath = colName;
            break;
          }
        }
        
        const finalRecord = { ...record };
        if (keyPath) {
          finalRecord[keyPath] = insertedId;
        } else {
          finalRecord._id = insertedId;
        }

        const decryptedRecord = await StridbCrypto.decryptRecord(schema, finalRecord);

        const duration = performance.now() - startTime;
        StridbDebug.success(`Registro insertado en '${tableName}' con ID: ${insertedId} (${duration.toFixed(1)}ms)`, decryptedRecord);

        // Notify subscribers
        this.notify(tableName, "insert", decryptedRecord);
        resolve(decryptedRecord);
      };

      request.onerror = (event: any) => {
        const err = event.target.error;
        // Check for ConstraintError (Unique key constraint)
        if (err?.name === "ConstraintError") {
          reject(new Error(`Violación de Clave Única: Ya existe un registro con ese valor indexado en '${tableName}'.`));
        } else {
          reject(err);
        }
      };
    });
  }

  /**
   * Direct UPDATE action by primary key or query condition.
   */
  public async update(tableName: string, id: any, updatedFields: any): Promise<number> {
    const startTime = performance.now();
    const db = await this.getDB();
    const schema = this.getTableSchema(tableName);
    const deltaValidated = validateRecord(schema, updatedFields, true);
    const delta = await StridbCrypto.encryptRecord(schema, deltaValidated);

    return new Promise((resolve, reject) => {
      const tx = db.transaction([tableName], "readwrite");
      const store = tx.objectStore(tableName);

      // Find primary key path
      let keyPath = "_id";
      for (const [colName, colDef] of Object.entries(schema.columns)) {
        if (colDef.primaryKey) {
          keyPath = colName;
          break;
        }
      }

      const getRequest = store.get(id);

      getRequest.onsuccess = (event: any) => {
        const existing = event.target.result;
        if (!existing) {
          reject(new Error(`Registro no encontrado para actualizar en '${tableName}' con ID: ${id}`));
          return;
        }

        const merged = { ...existing, ...delta };
        const putRequest = store.put(merged);

        putRequest.onsuccess = async () => {
          const decryptedMerged = await StridbCrypto.decryptRecord(schema, merged);
          const duration = performance.now() - startTime;
          StridbDebug.success(`Registro actualizado en '${tableName}' con ID: ${id} (${duration.toFixed(1)}ms)`, decryptedMerged);
          this.notify(tableName, "update", decryptedMerged);
          resolve(1);
        };

        putRequest.onerror = (e: any) => {
          reject(e.target.error);
        };
      };

      getRequest.onerror = (e: any) => {
        reject(e.target.error);
      };
    });
  }

  /**
   * Direct DELETE action by ID.
   */
  public async delete(tableName: string, id: any): Promise<boolean> {
    const startTime = performance.now();
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([tableName], "readwrite");
      const store = tx.objectStore(tableName);

      const request = store.delete(id);

      request.onsuccess = () => {
        const duration = performance.now() - startTime;
        StridbDebug.success(`Registro eliminado en '${tableName}' con ID: ${id} (${duration.toFixed(1)}ms)`);
        this.notify(tableName, "delete", { id });
        resolve(true);
      };

      request.onerror = (e: any) => {
        reject(e.target.error);
      };
    });
  }

  /**
   * Truncates/Clears all records inside a table.
   */
  public async truncate(tableName: string): Promise<boolean> {
    const startTime = performance.now();
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([tableName], "readwrite");
      const store = tx.objectStore(tableName);

      const request = store.clear();

      request.onsuccess = () => {
        const duration = performance.now() - startTime;
        StridbDebug.success(`Tabla '${tableName}' vaciada (truncada) con éxito (${duration.toFixed(1)}ms)`);
        this.notify(tableName, "truncate");
        resolve(true);
      };

      request.onerror = (e: any) => {
        reject(e.target.error);
      };
    });
  }

  /**
   * Reactive state event subscriptions.
   */
  public subscribe(callback: SubscriberCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify(table: string, action: string, data?: any) {
    for (const sub of this.subscribers) {
      try {
        sub(table, action, data);
      } catch (err) {
        console.error("Subscriber notification error: ", err);
      }
    }
  }
}

/**
 * Singleton database registry helper
 */
const dbInstances = new Map<string, StridbDatabase>();

export function createStridbDatabase(name: string, version = 1): StridbDatabase {
  if (dbInstances.has(name)) {
    return dbInstances.get(name)!;
  }
  const db = new StridbDatabase(name, version);
  dbInstances.set(name, db);
  return db;
}
