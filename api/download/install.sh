#!/bin/bash
# ==============================================================================
# 🌌 KOTLITE DB - INSTALADOR DE CÓDIGO FUENTE (DEVELOPMENT INTEGRATOR)
# Inspirado en Kotlin DSL y gobernado por Desarrollo Modular Ultra
# ==============================================================================

set -e

# Colores visuales premium
COLOR_TITLE="\033[1;36m"
COLOR_SUCCESS="\033[1;32m"
COLOR_INFO="\033[1;34m"
COLOR_WARN="\033[1;33m"
COLOR_RESET="\033[0m"

echo -e "${COLOR_TITLE}"
echo "======================================================================"
echo "    📦  KOTLITE DB - INSTALADOR EN CALIENTE PARA DESARROLLADORES"
echo "======================================================================"
echo -e "${COLOR_RESET}"

echo -e "${COLOR_INFO}👉 Preparando la instalación en el directorio actual...${COLOR_RESET}"

# Crear el directorio kotlite
if [ -d "kotlite" ]; then
    echo -e "${COLOR_WARN}⚠️  Se detectó que la carpeta 'kotlite' ya existe.${COLOR_RESET}"
    read -p "¿Deseas sobreescribir los archivos actuales? (s/n): " confirm
    if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
        echo -e "${COLOR_WARN}❌ Instalación cancelada por el usuario.${COLOR_RESET}"
        exit 0
    fi
else
    mkdir -p kotlite
fi

# Generación dinámica de los archivos

echo "📦 Creando kotlite/Storage.ts..."
cat << 'EOF' > kotlite/Storage.ts
/**
 * Kotlite DB - Storage Engine Abstraction
 * Permite alternar de forma transparente entre LocalStorage física y
 * un motor InMemory (evitando crasheos de SSR en Next.js).
 */

export interface StorageEngine {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

export class InMemoryStorageEngine implements StorageEngine {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export class LocalStorageEngine implements StorageEngine {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error("Kotlite Storage Error: No se pudo escribir en localStorage", e);
    }
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {}
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.clear();
    } catch {}
  }
}

/**
 * Retorna el motor adecuado para el entorno actual de ejecución
 */
export function getOptimalStorage(): StorageEngine {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    return new LocalStorageEngine();
  }
  return new InMemoryStorageEngine();
}

EOF

echo "📦 Creando kotlite/Schema.ts..."
cat << 'EOF' > kotlite/Schema.ts
/**
 * Kotlite DB - Schema & DD Builder (Kotlin DSL Mirror)
 * Gestiona la definición de tipos, columnas y restricciones.
 */

export type ColumnType = 'INTEGER' | 'TEXT' | 'REAL' | 'BOOLEAN' | 'DATETIME';

export interface ForeignKeyDefinition {
  parentTable: string;
  parentColumn: string;
  onDelete?: 'CASCADE' | 'RESTRICT' | 'SET_NULL';
}

export interface ColumnDefinition {
  name: string;
  type: ColumnType;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isNullable: boolean;
  defaultValue?: any;
  foreignKey?: ForeignKeyDefinition;
}

/**
 * Permite configurar las columnas utilizando encadenamiento de funciones (Chaining)
 * idéntico al DSL de declaración en Kotlin.
 */
export class ColumnBuilder {
  private col: ColumnDefinition;

  constructor(name: string, type: ColumnType) {
    this.col = {
      name,
      type,
      isPrimaryKey: false,
      isUnique: false,
      isNullable: true,
    };
  }

  /**
   * Configura la columna como Clave Primaria (implica No Nulo)
   */
  primaryKey(): ColumnBuilder {
    this.col.isPrimaryKey = true;
    this.col.isNullable = false;
    return this;
  }

  /**
   * Restringe la columna para guardar únicamente valores únicos
   */
  unique(): ColumnBuilder {
    this.col.isUnique = true;
    return this;
  }

  /**
   * Configura la columna para no permitir valores Nulos
   */
  notNull(): ColumnBuilder {
    this.col.isNullable = false;
    return this;
  }

  /**
   * Permite valores Nulos en esta columna
   */
  nullable(): ColumnBuilder {
    this.col.isNullable = true;
    return this;
  }

  /**
   * Asigna un valor predeterminado si no se provee en el INSERT
   */
  default(value: any): ColumnBuilder {
    this.col.defaultValue = value;
    return this;
  }

  /**
   * Define una restricción de clave foránea apuntando a otra tabla/columna.
   */
  references(
    parentTable: string,
    parentColumn: string,
    options?: { onDelete?: 'CASCADE' | 'RESTRICT' | 'SET_NULL' } | 'CASCADE' | 'RESTRICT' | 'SET_NULL'
  ): ColumnBuilder {
    let onDelete: 'CASCADE' | 'RESTRICT' | 'SET_NULL' = 'RESTRICT';
    if (typeof options === 'string') {
      onDelete = options;
    } else if (options && options.onDelete) {
      onDelete = options.onDelete;
    }

    this.col.foreignKey = {
      parentTable,
      parentColumn,
      onDelete,
    };
    return this;
  }

  build(): ColumnDefinition {
    return this.col;
  }
}

export interface TableSchema {
  name: string;
  columns: Record<string, ColumnDefinition>;
}

/**
 * Espejo del inicializador de tablas de Kotlin.
 * Ofrece métodos fluidos para declarar tipos específicos de SQL local.
 */
export class TableSchemaBuilder {
  private name: string;
  private columns: Record<string, ColumnDefinition> = {};

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Crea una columna numérica de tipo Entero
   */
  integer(name: string): ColumnBuilder {
    const builder = new ColumnBuilder(name, 'INTEGER');
    this.columns[name] = builder.build(); // Guardamos por referencia para aplicar mutaciones del Chaining
    return builder;
  }

  /**
   * Crea una columna de cadena de Texto
   */
  text(name: string): ColumnBuilder {
    const builder = new ColumnBuilder(name, 'TEXT');
    this.columns[name] = builder.build();
    return builder;
  }

  /**
   * Crea una columna decimal / flotante
   */
  real(name: string): ColumnBuilder {
    const builder = new ColumnBuilder(name, 'REAL');
    this.columns[name] = builder.build();
    return builder;
  }

  /**
   * Crea una columna de tipo Booleano (1 o 0 de forma interna)
   */
  boolean(name: string): ColumnBuilder {
    const builder = new ColumnBuilder(name, 'BOOLEAN');
    this.columns[name] = builder.build();
    return builder;
  }

  /**
   * Crea una columna de Fecha y Hora (serializa/deserializa texto de forma automática)
   */
  datetime(name: string): ColumnBuilder {
    const builder = new ColumnBuilder(name, 'DATETIME');
    this.columns[name] = builder.build();
    return builder;
  }

  buildTableSchema(): TableSchema {
    return {
      name: this.name,
      columns: this.columns
    };
  }
}

EOF

echo "📦 Creando kotlite/Query.ts..."
cat << 'EOF' > kotlite/Query.ts
/**
 * Kotlite DB - Query Engine
 * Motor de consultas encadenadas similar a las operaciones de colecciones en Kotlin.
 */

export type RowData = Record<string, any>;

export class QueryBuilder {
  private rows: RowData[];

  constructor(rows: RowData[]) {
    this.rows = [...rows]; // Copiamos el array para mantener inmutabilidad celular
  }

  /**
   * Filtra registros mediante un predicado booleano lambda (similar al .filter { } de Kotlin)
   * 
   * @example
   * query.where(user => user.active && user.age > 18)
   */
  where(predicate: (row: RowData) => boolean): QueryBuilder {
    this.rows = this.rows.filter(predicate);
    return this;
  }

  /**
   * Ordena los resultados por el nombre de columna indicado de forma ascendente o descendente.
   * 
   * @example
   * query.orderBy("createdAt", "DESC")
   */
  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this.rows.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];

      if (valA === undefined || valB === undefined) return 0;
      if (valA === null && valB !== null) return direction === 'ASC' ? -1 : 1;
      if (valB === null && valA !== null) return direction === 'ASC' ? 1 : -1;

      // Ordenar cadenas
      if (typeof valA === 'string' && typeof valB === 'string') {
        const order = valA.localeCompare(valB);
        return direction === 'ASC' ? order : -order;
      }

      // Ordenar números o booleanos
      if (direction === 'ASC') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valB > valA ? 1 : valB < valA ? -1 : 0;
      }
    });

    return this;
  }

  /**
   * Omite los primeros N registros (útil para paginación)
   */
  offset(count: number): QueryBuilder {
    this.rows = this.rows.slice(count);
    return this;
  }

  /**
   * Limita la cantidad de filas retornadas por la consulta
   */
  limit(count: number): QueryBuilder {
    this.rows = this.rows.slice(0, count);
    return this;
  }

  /**
   * Ejecuta la consulta y retorna el array de filas final
   */
  execute(): RowData[] {
    return this.rows;
  }

  /**
   * Helper conveniente para retornar únicamente el primer Match de la fila o null si no se encuentra nada
   */
  firstOrNull(): RowData | null {
    return this.rows.length > 0 ? this.rows[0] : null;
  }

  /**
   * Cuenta los registros que superaron el filtro y retorna su longitud
   */
  count(): number {
    return this.rows.length;
  }
}

EOF

echo "📦 Creando kotlite/Table.ts..."
cat << 'EOF' > kotlite/Table.ts
/**
 * Kotlite DB - Table Handler
 * Administra el CRUD (Creación, Lectura, Actualización, Borrado) de registros
 * de forma inmutable, con validaciones continuas de esquema y restricciones.
 */

import { TableSchema, ColumnType } from './Schema';
import { RowData, QueryBuilder } from './Query';
import { KotliteRelationsEngine } from './Relations';

export class KotliteTable {
  private schema: TableSchema;
  private rows: RowData[] = [];
  private onStateChanged: (rows: RowData[]) => void;
  private getTables?: () => Record<string, KotliteTable>;

  constructor(
    schema: TableSchema,
    initialRows: RowData[],
    onStateChanged: (rows: RowData[]) => void,
    getTables?: () => Record<string, KotliteTable>
  ) {
    this.schema = schema;
    this.rows = initialRows;
    this.onStateChanged = onStateChanged;
    this.getTables = getTables;
  }

  getSchema(): TableSchema {
    return this.schema;
  }

  getTableName(): string {
    return this.schema.name;
  }

  /**
   * Valida en tiempo real si la fila cumple con todos las restricciones físicas y tipos del Schema
   */
  private validateRow(row: RowData, isUpdate: boolean, oldRow?: RowData) {
    const columns = this.schema.columns;

    for (const [colName, colDef] of Object.entries(columns)) {
      const val = row[colName];

      // 1. Confirmar campos de no-nulidad obligatoria
      if (!colDef.isNullable && (val === undefined || val === null)) {
        // En una actualización, si el valor se omite del payload, conservamos el actual seguro
        if (isUpdate && val === undefined) {
          continue;
        }
        if (colDef.defaultValue === undefined && !colDef.isPrimaryKey) {
          throw new Error(
            `[Kotlite Constraint Error] La columna No-Nula '${colName}' requiere un valor o un valor predeterminado en la tabla '${this.schema.name}'.`
          );
        }
      }

      // 2. Controlar integridad de datos
      if (val !== undefined && val !== null) {
        this.validateType(colName, val, colDef.type);
      }
    }

    // 3. Controlar restricciones de Clave Primaria & Unicidad (Evitar duplicidades)
    for (const [colName, colDef] of Object.entries(columns)) {
      if (colDef.isPrimaryKey || colDef.isUnique) {
        const val = row[colName];
        if (val === undefined || val === null) continue;

        // Comparamos el valor ingresado contra toda la base de datos excluyendo,
        // si es un UPDATE, la fila origen para permitir modificaciones sin autorechazos.
        const hashConflict = this.rows.some((existingRow) => {
          if (oldRow && existingRow === oldRow) return false;
          return existingRow[colName] === val;
        });

        if (hashConflict) {
          throw new Error(
            `[Kotlite Constraint Error] Violación de unicidad en '${colName}'. El registro con valor '${val}' ya existe en la tabla '${this.schema.name}'.`
          );
        }
      }
    }
  }

  /**
   * Cast en caliente de tipos SQLLite a JS
   */
  private validateType(colName: string, value: any, type: ColumnType) {
    switch (type) {
      case 'INTEGER':
        if (!Number.isInteger(Number(value))) {
          throw new Error(
            `[Kotlite Type Mismatch] Columna '${colName}' requiere un número entero (INTEGER), se envió: '${value}' (${typeof value}).`
          );
        }
        break;
      case 'REAL':
        if (typeof value !== 'number' || isNaN(value)) {
          throw new Error(
            `[Kotlite Type Mismatch] Columna '${colName}' requiere un número de punto flotante (REAL), se envió: '${value}'.`
          );
        }
        break;
      case 'TEXT':
        if (typeof value !== 'string') {
          throw new Error(
            `[Kotlite Type Mismatch] Columna '${colName}' requiere cadenas de texto (TEXT), se envió: '${value}' (${typeof value}).`
          );
        }
        break;
      case 'BOOLEAN':
        if (typeof value !== 'boolean' && value !== 0 && value !== 1) {
          throw new Error(
            `[Kotlite Type Mismatch] Columna '${colName}' requiere un tipo Booleano (BOOLEAN), se envió: '${value}'.`
          );
        }
        break;
      case 'DATETIME':
        const isValidDateObj = value instanceof Date && !isNaN(value.getTime());
        const isValidDateStr = typeof value === 'string' && !isNaN(Date.parse(value));
        if (!isValidDateObj && !isValidDateStr) {
          throw new Error(
            `[Kotlite Type Mismatch] Columna '${colName}' requiere una fecha válida o cadena ISO-DATE, se envió: '${value}'.`
          );
        }
        break;
    }
  }

  /**
   * Inserta un elemento en la base de datos con autoincremento dinámico de ID primarios.
   * Retorna el registro consolidado al usuario.
   */
  insert(data: RowData): RowData {
    const newRow = { ...data };
    const columns = this.schema.columns;

    // 1. Simular Claves Primarias autoincrementales (SQLite behaviour) si no se proveen
    for (const [colName, colDef] of Object.entries(columns)) {
      if (
        colDef.isPrimaryKey &&
        colDef.type === 'INTEGER' &&
        (newRow[colName] === undefined || newRow[colName] === null)
      ) {
        const allIds = this.rows
          .map((r) => r[colName] as number)
          .filter((id) => Number.isInteger(id));
        const maxId = allIds.length > 0 ? Math.max(...allIds) : 0;
        newRow[colName] = maxId + 1;
      }

      // 2. Colocar valores por defecto si el payload omite la columna
      if (newRow[colName] === undefined && colDef.defaultValue !== undefined) {
        const defaultValue = colDef.defaultValue;
        newRow[colName] =
          typeof defaultValue === 'function' ? defaultValue() : defaultValue;
      }
    }

    // Validar propiedades consolidadas antes de guardar
    this.validateRow(newRow, false);

    // Validar integridad referencial (Claves Foráneas)
    if (this.getTables) {
      const tables = this.getTables();
      const getter = (tblName: string) => tables[tblName]?.all() || [];
      KotliteRelationsEngine.validateInsertion(this.schema.name, newRow, this.schema, getter);
    }

    this.rows.push(newRow);
    this.onStateChanged([...this.rows]);

    return newRow;
  }

  /**
   * Construye una consulta interactiva sobre la tabla
   */
  query(): QueryBuilder {
    return new QueryBuilder(this.rows);
  }

  /**
   * Retorna instantáneamente todas las filas sin filtros
   */
  all(): RowData[] {
    return [...this.rows];
  }

  /**
   * Modifica filas que cumplan las condiciones del predicado lambda de Kotlin.
   * Retorna el recuento de elementos alterados.
   */
  update(predicate: (row: RowData) => boolean, updates: Partial<RowData>): number {
    let affectedCounter = 0;

    const modifiedRows = this.rows.map((row) => {
      if (predicate(row)) {
        affectedCounter++;
        const draftRow = { ...row, ...updates };
        this.validateRow(draftRow, true, row); // Verifica integridad de unicidades
        
        // Validar integridad referencial (Claves Foráneas) en actualizaciones
        if (this.getTables) {
          const tables = this.getTables();
          const getter = (tblName: string) => tables[tblName]?.all() || [];
          KotliteRelationsEngine.validateInsertion(this.schema.name, draftRow, this.schema, getter);
        }
        
        return draftRow;
      }
      return row;
    });

    if (affectedCounter > 0) {
      this.rows = modifiedRows;
      this.onStateChanged([...this.rows]);
    }

    return affectedCounter;
  }

  /**
   * Elimina cualquier fila que coincida con la lambda de búsqueda.
   * Retorna el número de registros purgados.
   */
  delete(predicate: (row: RowData) => boolean, skipFkCheck: boolean = false): number {
    const startCount = this.rows.length;

    // Si no se pide omitir la verificación y contamos con acceso a las tablas relacionadas, ejecutamos trigger onDelete
    if (!skipFkCheck && this.getTables) {
      const tables = this.getTables();
      const rowsToDelete = this.rows.filter(predicate);

      for (const row of rowsToDelete) {
        for (const [colName, colDef] of Object.entries(this.schema.columns)) {
          if (colDef.isPrimaryKey) {
            KotliteRelationsEngine.handleParentDeletion(
              this.schema.name,
              row,
              colName,
              tables
            );
          }
        }
      }
    }

    this.rows = this.rows.filter((row) => !predicate(row));
    const deletedCount = startCount - this.rows.length;

    if (deletedCount > 0) {
      this.onStateChanged([...this.rows]);
    }

    return deletedCount;
  }

  /**
   * Trunca (vacía) completamente la tabla
   */
  truncate(): void {
    this.rows = [];
    this.onStateChanged([]);
  }
}

EOF

echo "📦 Creando kotlite/Database.ts..."
cat << 'EOF' > kotlite/Database.ts
/**
 * Kotlite DB - Database Orchestrator (Kotlin DSL Facade)
 * Orquestador principal que une el almacenamiento, esquemas y la reactividad.
 */

import { StorageEngine, getOptimalStorage } from './Storage';
import { TableSchema, TableSchemaBuilder } from './Schema';
import { KotliteTable } from './Table';
import { RowData } from './Query';
import { KotliteCrypto } from './Crypto';

export type DatabaseConfigLambda = (dbBuilder: KotliteDatabaseBuilder) => void;
export type SubscriptionCallback = (tableName: string, rows: RowData[]) => void;

export class KotliteDatabase {
  private dbName: string;
  private storage: StorageEngine;
  private tables: Record<string, KotliteTable> = {};
  private subscribers: Set<SubscriptionCallback> = new Set();
  private crypto?: KotliteCrypto;

  constructor(
    dbName: string,
    schemas: Record<string, TableSchema>,
    storageSpec?: StorageEngine,
    encryptionKey?: string
  ) {
    this.dbName = dbName;
    this.storage = storageSpec ?? getOptimalStorage();
    if (encryptionKey) {
      this.crypto = new KotliteCrypto(encryptionKey);
    }
    this.initializeTables(schemas);
  }

  /**
   * Revive las tablas persistidas e inicializa sus escuchadores locales de sincronización
   */
  private initializeTables(schemas: Record<string, TableSchema>) {
    for (const [tableName, schema] of Object.entries(schemas)) {
      const storageKey = `kotlite:${this.dbName}:${tableName}`;
      let savedData = this.storage.getItem(storageKey);
      let initialRows: RowData[] = [];

      if (savedData) {
        try {
          if (this.crypto) {
            savedData = this.crypto.decrypt(savedData);
          }
          initialRows = JSON.parse(savedData);
        } catch (e) {
          console.error(
            `[Kotlite Database Warn] No se pudieron revivir o descifrar los registros guardados de la tabla '${tableName}'. Iniciando vacía.`,
            e
          );
        }
      }

      // Crear el manejador de operaciones e inyectar el guardado automático reactivo
      this.tables[tableName] = new KotliteTable(
        schema,
        initialRows,
        (updatedRows) => {
          let serialized = JSON.stringify(updatedRows);
          if (this.crypto) {
            serialized = this.crypto.encrypt(serialized);
          }
          // 1. Guardar de forma atómica e instantánea en el motor persistente
          this.storage.setItem(storageKey, serialized);
          // 2. Transmitir el nuevo estado de datos a todos los hooks y UI suscritos
          this.notifySubscribers(tableName, updatedRows);
        },
        () => this.tables
      );
    }
  }

  getTables(): Record<string, KotliteTable> {
    return this.tables;
  }

  getDatabaseName(): string {
    return this.dbName;
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
  customStorage?: StorageEngine,
  encryptionKey?: string
): KotliteDatabase {
  const dbBuilder = new KotliteDatabaseBuilder();
  configLambda(dbBuilder);
  return new KotliteDatabase(dbName, dbBuilder.getSchemas(), customStorage, encryptionKey);
}

EOF

echo "📦 Creando kotlite/Sync.ts..."
cat << 'EOF' > kotlite/Sync.ts
/**
 * Kotlite DB - JSON Exporter & Synchronizer
 * Motor modular para exportación, importación segura, copias de seguridad
 * y sincronización remota con soporte para transacciones simuladas (Rollback).
 */

import { KotliteDatabase } from './Database';
import { RowData } from './Query';

export interface KotliteBackup {
  dbName: string;
  version: string;
  exportedAt: string;
  data: Record<string, RowData[]>;
}

export interface ImportOptions {
  /**
   * 'overwrite': Vacía por completo las tablas antes de insertar los datos nuevos.
   * 'merge': Si el ID primario ya existe, lo actualiza (Upsert). Si no existe, lo inserta.
   */
  mode?: 'overwrite' | 'merge';
  /**
   * Si es true, detiene todo el proceso de importación y restaura el estado original si falla una validación.
   */
  transactional?: boolean;
}

export interface ImportResult {
  success: boolean;
  importedCount: Record<string, number>;
  message: string;
  errors?: string[];
}

export class KotliteSyncManager {
  private db: KotliteDatabase;

  constructor(db: KotliteDatabase) {
    this.db = db;
  }

  /**
   * Exporta todo el estado de la base de datos a un objeto tipado.
   */
  exportObject(): KotliteBackup {
    const backup: KotliteBackup = {
      dbName: this.db.getDatabaseName(),
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      data: {}
    };

    const tables = this.db.getTables();
    for (const [tableName, tableInstance] of Object.entries(tables)) {
      backup.data[tableName] = tableInstance.all();
    }

    return backup;
  }

  /**
   * Exporta todo el estado como una cadena JSON formateada de forma legible.
   */
  exportJson(pretty: boolean = true): string {
    const backup = this.exportObject();
    return JSON.stringify(backup, null, pretty ? 2 : undefined);
  }

  /**
   * Sincroniza e importa datos de un objeto o cadena de texto JSON.
   * Cuenta con un sistema automático de restauración (Rollback) si ocurre algún error de integridad.
   */
  importJson(
    backupInput: string | KotliteBackup,
    options: ImportOptions = {}
  ): ImportResult {
    const mode = options.mode ?? 'merge';
    const transactional = options.transactional ?? true;

    let backup: KotliteBackup;

    try {
      if (typeof backupInput === 'string') {
        backup = JSON.parse(backupInput);
      } else {
        backup = backupInput;
      }
    } catch (e: any) {
      return {
        success: false,
        importedCount: {},
        message: "Error de análisis: La entrada de datos no es un JSON válido.",
        errors: [e.message]
      };
    }

    // Validar esquema mínimo del backup
    if (!backup || typeof backup.data !== 'object' || !backup.dbName) {
      return {
        success: false,
        importedCount: {},
        message: "Estructura inválida: El backup no contiene metadatos o tabla de datos válidos."
      };
    }

    const registeredTables = this.db.getTables();
    const importedCount: Record<string, number> = {};
    const errors: string[] = [];

    // Sistema de seguridad: Hacer una foto del estado inicial por si requerimos Rollback transaccional
    const backupStateSnapshot: Record<string, RowData[]> = {};
    if (transactional) {
      for (const [tName, tInstance] of Object.entries(registeredTables)) {
        backupStateSnapshot[tName] = tInstance.all();
      }
    }

    try {
      // Iterar sobre las tablas provistas en el JSON
      for (const [tableName, rowsToImport] of Object.entries(backup.data)) {
        const tableInstance = registeredTables[tableName];

        // Omitir si la tabla importada no existe en la estructura declarada de la base de datos
        if (!tableInstance) {
          errors.push(`La tabla '${tableName}' no existe en el esquema actual de la base de datos.`);
          continue;
        }

        if (!Array.isArray(rowsToImport)) {
          errors.push(`Los datos provistos para la tabla '${tableName}' deben ser una lista (Array).`);
          continue;
        }

        importedCount[tableName] = 0;

        // Si es overwrite, vaciar la tabla por completo antes
        if (mode === 'overwrite') {
          tableInstance.truncate();
        }

        const schema = tableInstance.getSchema();
        // Buscar si tiene columna Primary Key
        const primaryKeyColName = Object.entries(schema.columns).find(
          ([_, colDef]) => colDef.isPrimaryKey
        )?.[0];

        for (const row of rowsToImport) {
          if (mode === 'merge' && primaryKeyColName) {
            const rowId = row[primaryKeyColName];

            if (rowId !== undefined && rowId !== null) {
              // Buscar si ya existe el registro con esa ID
              const existingRow = tableInstance.all().find(r => r[primaryKeyColName] === rowId);

              if (existingRow) {
                // Actualizar registro selectivamente
                tableInstance.update(r => r[primaryKeyColName] === rowId, row);
                importedCount[tableName]++;
                continue;
              }
            }
          }

          // Si es merge pero no existía, o si es overwrite, insertamos el nuevo registro
          tableInstance.insert(row);
          importedCount[tableName]++;
        }
      }

      return {
        success: true,
        importedCount,
        message: `Sincronización JSON completada con éxito (${mode}).`
      };

    } catch (err: any) {
      // ROLLBACK: Restaurar estado original si falló la validación estricta y es transaccional
      if (transactional) {
        for (const [tName, originalRows] of Object.entries(backupStateSnapshot)) {
          const tableInstance = registeredTables[tName];
          if (tableInstance) {
            tableInstance.truncate();
            for (const row of originalRows) {
              // Insertamos directamente los originales de vuelta de forma segura
              tableInstance.insert(row);
            }
          }
        }
      }

      return {
        success: false,
        importedCount: {},
        message: "Sincronización abortada por fallas de integridad o tipos en los datos importados.",
        errors: [err.message || "Error desconocido"]
      };
    }
  }

  /**
   * Realiza un fetch asíncrono a una URL externa de tipo API/JSON, descarga el estado,
   * y lo sincroniza de forma atómica en tu base de datos local.
   */
  async syncFromRemoteUrl(
    url: string,
    options: ImportOptions & { headers?: HeadersInit } = {}
  ): Promise<ImportResult> {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          ...(options.headers || {})
        }
      });

      if (!response.ok) {
        throw new Error(`Código de estado HTTP incorrecto: ${response.status} ${response.statusText}`);
      }

      const backupData = await response.json();
      return this.importJson(backupData, options);

    } catch (e: any) {
      return {
        success: false,
        importedCount: {},
        message: `Error al conectar con la pasarela de sincronización remota.`,
        errors: [e.message]
      };
    }
  }
}

EOF

echo "📦 Creando kotlite/Crypto.ts..."
cat << 'EOF' > kotlite/Crypto.ts
/**
 * Kotlite DB - Synchronous Symmetric Cryptography Engine
 * 
 * Implementa un cifrado simétrico por bloques (basado en XXTEA, un estándar criptográfico
 * seguro, extremadamente rápido y síncrono) para cifrar datos sensibles antes de ser
 * escritos en LocalStorage. Esto evita APIs asíncronas de WebCrypto que romperían los renders de React.
 */

export class KotliteCrypto {
  private keyInts: Uint32Array;

  constructor(secretKey: string) {
    this.keyInts = this.deriveKey(secretKey);
  }

  /**
   * Deriva una clave de 128 bits (4 enteros de 32 bits) a partir de una frase de paso.
   * Utiliza un algoritmo de hashing interno para asegurar dispersión de bits de alta entropía.
   */
  private deriveKey(key: string): Uint32Array {
    const keyBytes = new TextEncoder().encode(key);
    const ints = new Uint32Array(4);
    
    // Algoritmo FNV-1a de 32 bits para hashes dispersos y derivación limpia
    for (let i = 0; i < keyBytes.length; i++) {
      const byte = keyBytes[i];
      for (let j = 0; j < 4; j++) {
        ints[j] = (ints[j] ^ (byte + j * 13)) * 16777619;
      }
    }

    // Asegurar que ninguna clave sea completamente cero
    for (let j = 0; j < 4; j++) {
      if (ints[j] === 0) ints[j] = 0x9E3779B9 + j;
    }

    return ints;
  }

  /**
   * Cifra una cadena de texto a formato seguro Hexadecimal.
   */
  encrypt(plainText: string): string {
    if (!plainText) return "";
    const encoder = new TextEncoder();
    const bytes = encoder.encode(plainText);
    
    // Convertir bytes a enteros de 32 bits (añadiendo padding seguro)
    const length = bytes.length;
    const wordCount = Math.max(2, Math.ceil((length + 4) / 4));
    const data = new Uint32Array(wordCount);
    
    // Almacenar longitud real al inicio de los enteros de datos para padding
    data[0] = length;
    for (let i = 0; i < length; i++) {
      const wordIdx = Math.floor((i + 4) / 4);
      const byteShift = ((i + 4) % 4) * 8;
      data[wordIdx] |= bytes[i] << byteShift;
    }

    this.teaEncrypt(data, this.keyInts);

    // Convertir enteros cifrados a cadena Hexadecimal compacta
    let hex = "";
    for (let i = 0; i < data.length; i++) {
      const h = data[i].toString(16).padStart(8, '0');
      hex += h;
    }
    return hex;
  }

  /**
   * Desencripta un hash Hexadecimal de vuelta a su cadena original.
   */
  decrypt(cipherHex: string): string {
    if (!cipherHex || cipherHex.length % 8 !== 0) {
      throw new Error("[Kotlite Crypto Error] Los datos cifrados están corruptos o el formato Hexadecimal es inválido.");
    }

    const wordCount = cipherHex.length / 8;
    const data = new Uint32Array(wordCount);
    for (let i = 0; i < wordCount; i++) {
      data[i] = parseInt(cipherHex.substring(i * 8, (i + 1) * 8), 16);
    }

    this.teaDecrypt(data, this.keyInts);

    // Extraer longitud real y decodificar bytes
    const length = data[0];
    if (length > (data.length - 1) * 4 || length < 0) {
      throw new Error("[Kotlite Crypto Error] Clave secreta incorrecta o datos manipulados. No se pudo descifrar.");
    }

    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      const wordIdx = Math.floor((i + 4) / 4);
      const byteShift = ((i + 4) % 4) * 8;
      bytes[i] = (data[wordIdx] >>> byteShift) & 0xFF;
    }

    return new TextDecoder().decode(bytes);
  }

  /**
   * Implementación de Cifrado por bloques XXTEA (Symmetric Block Cipher)
   */
  private teaEncrypt(v: Uint32Array, k: Uint32Array): void {
    const n = v.length;
    const DELTA = 0x9e3779b9;
    let q = Math.floor(6 + 52 / n);
    let sum = 0;
    let z = v[n - 1];
    let y = v[0];

    while (q-- > 0) {
      sum = (sum + DELTA) | 0;
      const e = (sum >>> 2) & 3;
      for (let p = 0; p < n - 1; p++) {
        y = v[p + 1];
        const mx = (((z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4)) ^ ((sum ^ y) + (k[(p & 3) ^ e] ^ z))) | 0;
        z = v[p] = (v[p] + mx) | 0;
      }
      y = v[0];
      const mx = (((z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4)) ^ ((sum ^ y) + (k[((n - 1) & 3) ^ e] ^ z))) | 0;
      z = v[n - 1] = (v[n - 1] + mx) | 0;
    }
  }

  /**
   * Implementación de Descifrado por bloques XXTEA (Symmetric Block Decipher)
   */
  private teaDecrypt(v: Uint32Array, k: Uint32Array): void {
    const n = v.length;
    const DELTA = 0x9e3779b9;
    const q = Math.floor(6 + 52 / n);
    let sum = (q * DELTA) | 0;
    let z = v[n - 1];
    let y = v[0];

    while (sum !== 0) {
      const e = (sum >>> 2) & 3;
      for (let p = n - 1; p > 0; p--) {
        z = v[p - 1];
        const mx = (((z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4)) ^ ((sum ^ y) + (k[(p & 3) ^ e] ^ z))) | 0;
        y = v[p] = (v[p] - mx) | 0;
      }
      z = v[n - 1];
      const mx = (((z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4)) ^ ((sum ^ y) + (k[(0 & 3) ^ e] ^ z))) | 0;
      y = v[0] = (v[0] - mx) | 0;
      sum = (sum - DELTA) | 0;
    }
  }
}

EOF

echo "📦 Creando kotlite/Relations.ts..."
cat << 'EOF' > kotlite/Relations.ts
/**
 * Kotlite DB - Referential Integrity & Relations Engine
 * 
 * Gestiona de forma modular el análisis y la ejecución de restricciones de claves foráneas,
 * incluyendo inserciones seguras, eliminaciones en cascada (CASCADE), restricciones (RESTRICT)
 * y formateo a nulo (SET_NULL).
 */

import { TableSchema, ForeignKeyDefinition } from './Schema';
import { RowData } from './Query';

export class KotliteRelationsEngine {
  
  /**
   * Valida la integridad referencial antes de insertar o actualizar un registro.
   * Comprueba que la fila hija contenga un ID válido que realmente exista en la tabla padre.
   */
  static validateInsertion(
    childTableName: string,
    childRow: RowData,
    childSchema: TableSchema,
    getAllRowsFromTable: (tableName: string) => RowData[]
  ): void {
    for (const [colName, colDef] of Object.entries(childSchema.columns)) {
      if (colDef.foreignKey) {
        const fk = colDef.foreignKey;
        const childVal = childRow[colName];

        // Si el valor es null o undefined y la columna permite nulos, omitimos la comprobación
        if ((childVal === null || childVal === undefined) && colDef.isNullable) {
          continue;
        }

        // Obtener datos de la tabla padre
        const parentRows = getAllRowsFromTable(fk.parentTable);
        const parentKeyExists = parentRows.some(pRow => pRow[fk.parentColumn] === childVal);

        if (!parentKeyExists) {
          throw new Error(
            `[Violación de Clave Foránea en ${childTableName}.${colName}]: ` +
            `El valor '${childVal}' no existe en la tabla padre '${fk.parentTable}' (columna '${fk.parentColumn}').`
          );
        }
      }
    }
  }

  /**
   * Maneja las acciones de borrado de registros padres (CASCADE, RESTRICT, SET_NULL).
   * Se ejecuta antes de remover físicamente la fila del padre para asegurar que las tablas hijas respondan bien.
   */
  static handleParentDeletion(
    parentTableName: string,
    parentRowToDelete: RowData,
    parentColumnName: string,
    allTables: Record<string, { 
      getSchema: () => TableSchema; 
      all: () => RowData[];
      update: (pred: (r: RowData) => boolean, fields: Partial<RowData>) => void;
      delete: (pred: (r: RowData) => boolean, skipFkCheck?: boolean) => void;
    }>
  ): void {
    const parentVal = parentRowToDelete[parentColumnName];
    if (parentVal === undefined || parentVal === null) return;

    // Buscar dependencias en todas las demás tablas
    for (const [childTableName, childTableInstance] of Object.entries(allTables)) {
      if (childTableName === parentTableName) continue;

      const childSchema = childTableInstance.getSchema();

      for (const [childColName, childColDef] of Object.entries(childSchema.columns)) {
        const fk = childColDef.foreignKey;
        if (fk && fk.parentTable === parentTableName && fk.parentColumn === parentColumnName) {
          
          // Buscar si hay filas hijas que dependan de este valor
          const childRows = childTableInstance.all();
          const dependentRows = childRows.filter(r => r[childColName] === parentVal);

          if (dependentRows.length > 0) {
            const onDeleteAction = fk.onDelete || 'RESTRICT';

            if (onDeleteAction === 'RESTRICT') {
              throw new Error(
                `[Falla de Borrado - RESTRICT]: ` +
                `No se puede eliminar el registro con ID '${parentVal}' de '${parentTableName}' ` +
                `porque tiene registros relacionados en la tabla hija '${childTableName}' (columna '${childColName}').`
              );
            } 
            
            else if (onDeleteAction === 'CASCADE') {
              // Eliminar todas las filas hijas relacionadas de forma segura
              // skipFkCheck se activa para evitar recursiones redundantes ya resueltas
              childTableInstance.delete(r => r[childColName] === parentVal, true);
            } 
            
            else if (onDeleteAction === 'SET_NULL') {
              if (!childColDef.isNullable) {
                throw new Error(
                  `[Falla de Integridad - SET_NULL]: ` +
                  `La clave foránea '${childTableName}.${childColName}' está configurada como SET_NULL ` +
                  `pero la columna está marcada como NOT NULL.`
                );
              }
              // Actualizar el campo relacionado a null
              childTableInstance.update(
                r => r[childColName] === parentVal,
                { [childColName]: null }
              );
            }
          }
        }
      }
    }
  }
}

EOF

echo "📦 Creando kotlite/index.ts..."
cat << 'EOF' > kotlite/index.ts
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

EOF

echo "📦 Creando kotlite/mod.ts..."
cat << 'EOF' > kotlite/mod.ts
/**
 * Kotlite DB - Entry point for Deno, JSR and ESM runtimes.
 * Re-exports the complete API from index.ts
 */

export * from "./index";

EOF

echo "📦 Creando kotlite/jsr.json..."
cat << 'EOF' > kotlite/jsr.json
{
  "name": "@alejandro/kotlite-db",
  "version": "0.1.0",
  "license": "Apache-2.0",
  "exports": "./mod.ts",
  "publish": {
    "exclude": [
      "*.test.ts",
      "*.spec.ts"
    ]
  }
}

EOF

echo "📦 Creando kotlite/README.md..."
cat << 'EOF' > kotlite/README.md
# 📦 Kotlite DB

**Kotlite DB** es un motor de bases de datos local, inmutable, reactivo y tipado, diseñado con la elegancia y expresividad de la sintaxis declarativa de **Kotlin** (inspirado en frameworks como *Exposed* y *Anko*), pero optimizado para el ecosistema moderno de JavaScript y TypeScript.

Es ideal para aplicaciones web (**Next.js**, **React**, **Vite**), ya que es **100% seguro contra Server-Side Rendering (SSR)** al conmutar automáticamente a un motor en memoria cuando se ejecuta en el servidor y sincronizarse de manera persistente con `localStorage` en el navegador.

---

## ✨ Características Principales

*   **Kotlin-Style DSL:** Define esquemas de tablas e inicializa tu base de datos mediante bloques funcionales encadenados y descriptivos.
*   **Seguridad SSR (Next.js Friendly):** No rompe tu compilación en el servidor. Cuenta con un sistema interno con detección inteligente de entornos (`window` y `localStorage` condicionales).
*   **Cifrado Síncrono Ultrarrápido:** Protege datos en almacenamiento local mediante algoritmos simétricos por bloques síncronos sin recurrir a promesas que rompan el renderizado de componentes.
*   **Integridad Referencial Real:** Restricciones de claves foráneas con soporte para acciones relacionales (`CASCADE`, `RESTRICT` y `SET_NULL`) ejecutadas en caliente.
*   **Sincronización y Backups Avanzados:** Exportador/importador JSON de estado atómico con soporte de transacciones y mezcla inteligente de datos (`merge` / Upsert).
*   **Validación de Esquema Estricta:** Comprobación en tiempo real de tipos de datos (`INTEGER`, `REAL`, `TEXT`, `BOOLEAN`, `DATETIME`).
*   **Manejo de Restricciones (Constraints):** Detección nativa de claves primarias únicas (`primaryKey`), restricciones únicas (`unique`), campos no nulos (`notNull`) y autoincrementos automáticos tipo SQLite.
*   **Consultas Fluidas:** Filtra colecciones usando predicados dinámicos con métodos anidados: `.where()`, `.orderBy()`, `.limit()`, `.offset()`, `.execute()`.
*   **Reactividad en Tiempo Real:** Sistema de suscripción incorporado para enlazar automáticamente el estado almacenado con tus vistas de usuario.

---

## 🛠️ Arquitectura Modular

En cumplimiento del patrón de **Desarrollo Modular Ultra**, la librería está dividida en submódulos especializados para facilitar actualizaciones independientes y depuración de errores sin romper la aplicación:

1.  [`Storage.ts`](./Storage.ts): Capa de abstracción persistente (LocalStorage vs InMemory con SSR safety).
2.  [`Schema.ts`](./Schema.ts): Definición semántica de tipos, columnas fluent y soporte relacional.
3.  [`Query.ts`](./Query.ts): Motor perezoso de procesamiento de filtros y criterios de búsqueda.
4.  [`Table.ts`](./Table.ts): Administrador de operaciones atómicas CRUD, autoincrementos y unicidad física.
5.  [`Database.ts`](./Database.ts): Fachada centralizadora, gestor reactivo del almacenamiento y orquestador central.
6.  [`Sync.ts`](./Sync.ts): Motor de sincronización, exportador e importador seguro transaccional.
7.  [`Crypto.ts`](./Crypto.ts): Algoritmo simétrico por bloques síncronos para cifrado de disco local en tiempo de persistencia.
8.  [`Relations.ts`](./Relations.ts): Motor relacional para gobernar e interceptar integridad de claves foráneas.

---

## 🚀 Guía de Uso Rápido

### 1. Inicialización y Declaración de Esquema (Kotlin DSL)

Declara tu base de datos local de manera fluida y declarativa:

```typescript
import { createKotliteDatabase } from './kotlite';

// Creamos la base de datos de forma declarativa como si fuera Kotlin
export const db = createKotliteDatabase("mi_app_db", (builder) => {
  
  // Tabla de Usuarios
  builder.table("users", (t) => {
    t.integer("id").primaryKey(); // Autoincremento automático si no se provee
    t.text("username").unique().notNull();
    t.text("role").default("subscriber");
    t.boolean("active").default(true);
    t.datetime("createdAt").default(() => new Date().toISOString());
  });

  // Tabla de Tareas (Todos)
  builder.table("tasks", (t) => {
    t.integer("id").primaryKey();
    t.integer("userId").notNull(); // Relación conceptual
    t.text("title").notNull();
    t.boolean("completed").default(false);
  });
  
});
```

---

### 2. Operaciones CRUD (Inserción, Consulta y Mutación)

#### Insertar Registros (`insert`)
*Kotlite* aplicará valores por defecto, validará unicidades de claves y autoincrementará los IDs tipo entero:

```typescript
try {
  const nuevoUsuario = db.table("users").insert({
    username: "dev_alejandro",
    role: "administrator"
  });
  console.log("Usuario guardado con éxito:", nuevoUsuario);
  // Resultado: { id: 1, username: "dev_alejandro", role: "administrator", active: true, createdAt: "2026..." }
} catch (error) {
  console.error("Error de restricción:", error.message);
}
```

#### Consultar con Sintaxis Bohemia (`query`)
Filtra, ordena y página fácilmente:

```typescript
const usuariosActivosAdmin = db.table("users")
  .query()
  .where(u => u.active === true && u.role === "administrator")
  .orderBy("id", "DESC")
  .limit(5)
  .execute();

console.log("Administradores:", usuariosActivosAdmin);
```

#### Actualizar Registros (`update`)
Modifica los datos de los registros que cumplan cierta condición de forma segura:

```typescript
// Cambiar a inactivo a los usuarios que se llamen "test"
const totalAfectados = db.table("users").update(
  (u) => u.username === "test",
  { active: false }
);

console.log(`Se actualizaron ${totalAfectados} registros.`);
```

#### Eliminar Registros (`delete`)
```typescript
const eliminados = db.table("users").delete(u => u.active === false);
console.log(`Se eliminaron ${eliminados} registros inactivos.`);
```

---

## ⚛️ Integración en React / Next.js (SSR Safe Hook)

Para consumir los datos dentro de React y hacer que tus componentes se vuelvan a renderizar automáticamente cuando la base de datos se actualiza (desde cualquier otra parte de tu código), define este Hook personalizado de alto rendimiento:

```typescript
import { useState, useEffect } from 'react';
import { db } from './db_config'; // Tu base de datos configurada
import { RowData } from './kotlite';

/**
 * Hook reactivo de Kotlite para consultar y mutar una tabla de forma automática.
 */
export function useKotliteTable(tableName: string) {
  const table = db.table(tableName);
  const [data, setData] = useState<RowData[]>(() => table.all());

  useEffect(() => {
    // Suscribirse a cambios en tiempo real
    const unsubscribe = db.subscribe((updatedTable, updatedRows) => {
      if (updatedTable === tableName) {
        setData(updatedRows);
      }
    });

    // Cargar estado inicial por seguridad
    setData(table.all());

    return () => unsubscribe();
  }, [tableName]);

  return {
    data,
    insert: (entity: RowData) => table.insert(entity),
    update: (pred: (r: RowData) => boolean, fields: Partial<RowData>) => table.update(pred, fields),
    delete: (pred: (r: RowData) => boolean) => table.delete(pred),
    truncate: () => table.truncate(),
    query: () => table.query(),
  };
}
```

### Componente de React de Ejemplo

```tsx
'use client';

import React, { useState } from 'react';
import { useKotliteTable } from './hooks/useKotliteTable';

export default function ListaTareas() {
  const { data: tasks, insert, delete: removeTask } = useKotliteTable("tasks");
  const [nuevoTitulo, setNuevoTitulo] = useState("");

  const agregarTarea = () => {
    if (!nuevoTitulo.trim()) return;
    insert({
      userId: 1,
      title: nuevoTitulo,
      completed: false
    });
    setNuevoTitulo("");
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-zinc-950 text-white rounded-3xl border border-zinc-805">
      <h2 className="text-lg font-mono font-bold mb-4">Tareas de Kotlite</h2>
      
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={nuevoTitulo} 
          onChange={e => setNuevoTitulo(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
          placeholder="¿Qué haremos hoy?"
        />
        <button onClick={agregarTarea} className="bg-indigo-600 px-4 py-2 rounded-xl text-sm font-semibold">
          Añadir
        </button>
      </div>

      <ul className="space-y-2">
        {tasks.map(task => (
          <li key={task.id} className="flex justify-between items-center bg-zinc-900 p-3 rounded-xl border border-zinc-900">
            <span className="text-xs font-mono">{task.title}</span>
            <button 
              onClick={() => removeTask(t => t.id === task.id)}
              className="text-red-400 hover:text-red-300 text-xs font-bold"
            >
              Borrar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **Apache-2.0 (Open-Source)**. ¡Eres libre de usarlo, extenderlo, modificarlo y distribuirlo para propósitos comerciales o privados bajo las condiciones de Apache!

EOF

echo "📦 Creando kotlite/STRUCTURE.md..."
cat << 'EOF' > kotlite/STRUCTURE.md
# 🧩 Estructura de Módulos - Kotlite DB

Kotlite DB está construida bajo los principios de **Desarrollo Modular Ultra**, asegurando que cada archivo tenga una única responsabilidad bien definida. Esto previene acoplamientos rígidos y facilita enormemente la depuración y extensión de la base de datos sin alterar otras capas de abstracción.

A continuación, se detalla el rol exacto de cada archivo que compone esta carpeta:

---

## 🗺️ Mapa de Componentes y Responsabilidades

```
/kotlite
├── Storage.ts     # [Capa de Persistencia] Abstracción segura para SSR
├── Schema.ts      # [Capa de Definición] DSL y constructores de columnas fluent
├── Query.ts       # [Capa de Consulta] Motor de ordenamiento y filtrado perezoso
├── Table.ts       # [Capa de Operaciones] Transacciones CRUD e integridad física
├── Database.ts    # [Orquestador Central] Fachada de acceso reactivo y publicador
├── Sync.ts        # [Integración y Backups] Sincronización inteligente y exportador JSON
├── Crypto.ts      # [Seguridad] Cifrado simétrico síncrono ultra-rápido para LocalStorage
├── Relations.ts   # [Integridad] Restricciones de Claves Foráneas (CASCADE, RESTRICT, SET_NULL)
├── index.ts       # [Barril de Exportación] Entrada segura para TypeScript
├── README.md      # [Manual General] Guía de inicio rápido y hook para React
├── STRUCTURE.md   # [Este Archivo] Mapa de arquitectura detallado
├── SETUP.md       # [Guía de Configuración] Instrucciones paso a paso para Next.js / React
└── LICENSE        # [Licencia Apache 2.0] Términos de uso y distribución de código abierto
```

---

## 🔍 Descripción Detallada de Módulos

### 1. `Storage.ts`
* **Misión:** Aislar el acceso al navegador para garantizar compatibilidad con Server-Side Rendering (SSR).
* **Funcionamiento:** 
  * Expone la interfaz `StorageEngine`.
  * Implementa `LocalStorageEngine` (para uso persistente en navegador) y `InMemoryStorageEngine` (un mapa temporal `Map` para uso en Node.js de servidor).
  * La función `getOptimalStorage()` selecciona dinámicamente el motor correcto evitando que Next.js o Remix fallen en el proceso de pre-renderizado del servidor.

### 2. `Schema.ts`
* **Misión:** Proveer el DSL declarativo para definir tipos de datos y restricciones como si fuera Kotlin Exposed.
* **Funcionamiento:**
  * Define los tipos nativos soportados: `INTEGER`, `TEXT`, `REAL`, `BOOLEAN`, `DATETIME`.
  * La clase `ColumnBuilder` habilita el encadenamiento fluido (`.primaryKey()`, `.unique()`, `.notNull()`, `.default(...)`).
  * La clase `TableSchemaBuilder` expone constructores amigables como `t.integer("id")` o `t.text("name")`.

### 3. `Query.ts`
* **Misión:** Manipular y transformar conjuntos de registros filtrando de forma eficiente.
* **Funcionamiento:**
  * Mantiene inmutabilidad realizando copias locales del conjunto de datos antes de ordenar o recortar.
  * Ofrece métodos encadenables de filtrado como `.where(row => boolean)`, ordenamiento `.orderBy(col, dir)`, paginación `.offset(n)` y límites `.limit(n)`.
  * Retorna datos evaluados bajo demanda con `.execute()`, o atajos como `.firstOrNull()` y `.count()`.

### 4. `Table.ts`
* **Misión:** Validar esquemas y garantizar la integridad referencial y de tipos de cada inserción, edición y borrado.
* **Funcionamiento:**
  * Almacena en memoria el estado en vivo de las filas de una tabla.
  * Valida que no existan duplicidades de llaves primarias o de columnas marcadas como `.unique()`.
  * Ejecuta conversiones al vuelo y comprueba que los tipos insertados coincidan estrictamente con la definición del esquema (`validateType`).

### 5. `Database.ts`
* **Misión:** Actuar como punto de entrada de la librería (`createKotliteDatabase`) y manejar la reactividad en tiempo real.
* **Funcionamiento:**
  * Carga y serializa automáticamente los datos de cada tabla hacia el motor de almacenamiento persistente (`StorageEngine`) en cada mutación.
  * Implementa un patrón Publicador/Suscriptor (`subscribe`) para notificar en milisegundos a todos los componentes web reactivos cuando cualquier dato cambie, permitiendo la actualización automática de la interfaz de usuario.

### 6. `Sync.ts`
* **Misión:** Ofrecer interoperabilidad total de datos mediante serialización y de-serialización JSON resiliente.
* **Funcionamiento:**
  * Define la interfaz `KotliteBackup` que almacena de manera unificada el nombre de la base de datos, marca temporal y registros de todas las tablas registradas.
  * `KotliteSyncManager` expone funciones para exportar el estado completo de la base de datos (con `.exportJson()` u `.exportObject()`).
  * Administra importaciones y sincronizaciones seguras con `.importJson()`, soportando opciones avanzadas como transaccionalidad (rollback total automático de tablas si falla alguna restricción física o de tipo de datos al insertar un registro) y mezcla inteligente de datos (`merge` / Upsert) basada en claves primarias.
  * Integra sincronización fluida con endpoints REST o bases de datos en la nube mediante `.syncFromRemoteUrl()`.

### 7. `Crypto.ts`
* **Misión:** Garantizar confidencialidad y resiliencia en dispositivos compartidos cifrando el almacenamiento local de forma síncrona.
* **Funcionamiento:**
  * Implementa un algoritmo simétrico síncrono por bloques altamente optimizado, lo cual asegura que las lecturas e inserciones sigan ocurriendo de manera inmediata sin requerir promesas asíncronas.
  * Si se proporciona una contraseña (clave de cifrado) al instanciar la base de datos, cifra los registros serializados de cada tabla antes de guardarlos en el LocalStorage y los descifra al restaurar la base de datos. Si no se provee, funciona de manera transparente con texto plano para compatibilidad total.

### 8. `Relations.ts`
* **Misión:** Forzar y gobernar la integridad referencial de claves foráneas entre diferentes tablas.
* **Funcionamiento:**
  * `KotliteRelationsEngine` intercepta las inserciones y actualizaciones en caliente para validar que los valores relacionados realmente existan en las tablas padres, impidiendo inconsistencias de datos.
  * Gestiona las tres principales acciones relacionales al eliminar un registro padre:
    * `CASCADE`: Elimina automáticamente todos los registros dependientes en cascada.
    * `RESTRICT`: Bloquea e impide la eliminación del registro padre si aún tiene elementos hijos relacionados.
    * `SET_NULL`: Establece el campo relacional del hijo como `null` (si es una columna nullable), conservando el registro hijo desvinculado de forma segura.


EOF

echo "📦 Creando kotlite/SETUP.md..."
cat << 'EOF' > kotlite/SETUP.md
# 🚀 Guía de Configuración - Kotlite DB

Sigue estos pasos detallados para integrar, inicializar y utilizar Kotlite DB de forma óptima en tus proyectos de **Next.js**, **React** o **Vite**.

---

## 📋 Pasos para la Configuración Completa

### Paso 1: Importar la librería a tu proyecto
Copia la carpeta entera `kotlite` en la raíz o dentro del directorio de código fuente de tu aplicación (por ejemplo, en `src/kotlite` o simplemente en `/kotlite`).

---

### Paso 2: Crear el archivo de configuración de la Base de Datos
Crea un archivo llamado `db.ts` (o `db_config.ts`) en tu directorio favorito de lógica para declarar e instanciar tu base de datos utilizando el DSL declarativo inspirado en Kotlin.

```typescript
// src/lib/db.ts
import { createKotliteDatabase } from '../kotlite';

export const db = createKotliteDatabase("app_local_database", (builder) => {
  
  // Tabla de Usuarios
  builder.table("users", (t) => {
    t.integer("id").primaryKey(); // ID autoincremental automático
    t.text("username").unique().notNull();
    t.text("email").unique().notNull();
    t.text("role").default("user");
    t.boolean("active").default(true);
    t.datetime("createdAt").default(() => new Date().toISOString());
  });

  // Tabla de Notas de ejemplo
  builder.table("notes", (t) => {
    t.integer("id").primaryKey();
    t.integer("userId").notNull();
    t.text("title").notNull();
    t.text("content").default("");
    t.boolean("starred").default(false);
  });

});
```

---

### Paso 3: Crear el Hook Reactivo para React / Next.js
Para que tus componentes de React se actualicen automáticamente en milisegundos cuando ocurra un cambio (`insert`, `update`, `delete`) en las tablas desde cualquier parte del código, crea un hook reactivo.

Crea un archivo llamado `useKotliteTable.ts`:

```typescript
// src/hooks/useKotliteTable.ts
'use client'; // Requerido en Next.js App Router

import { useState, useEffect } from 'react';
import { db } from '../lib/db'; // Importa tu base de datos configurada
import { RowData } from '../kotlite';

/**
 * Hook reactivo de alto rendimiento para interactuar con tablas de Kotlite DB.
 * Recibe el nombre de la tabla y expone métodos CRUD reactivos en tiempo real.
 */
export function useKotliteTable(tableName: string) {
  const table = db.table(tableName);
  
  // Inicializamos el estado local de React con los datos actuales de la tabla
  const [data, setData] = useState<RowData[]>(() => table.all());

  useEffect(() => {
    // 1. Nos suscribimos al bus de eventos reactivos de la base de datos
    const unsubscribe = db.subscribe((updatedTableName, updatedRows) => {
      // Si la tabla modificada coincide con la de este hook, actualizamos el estado
      if (updatedTableName === tableName) {
        setData(updatedRows);
      }
    });

    // 2. Cargamos el estado inicial por seguridad y sincronización
    setData(table.all());

    // 3. Limpieza de suscripciones para evitar fugas de memoria
    return () => {
      unsubscribe();
    };
  }, [tableName]);

  return {
    /** Listado de registros actualizados en tiempo real */
    data,
    
    /** Inserta un nuevo registro con auto-id y valores por defecto */
    insert: (entity: RowData) => table.insert(entity),
    
    /** Actualiza campos selectivos de los registros que cumplan el predicado */
    update: (pred: (r: RowData) => boolean, fields: Partial<RowData>) => table.update(pred, fields),
    
    /** Elimina registros que coincidan con la lambda de búsqueda */
    delete: (pred: (r: RowData) => boolean) => table.delete(pred),
    
    /** Vacía por completo la tabla */
    truncate: () => table.truncate(),
    
    /** Genera un constructor de consultas (QueryBuilder) para filtros complejos */
    query: () => table.query(),
    
    /** Retorna el esquema semántico de la tabla */
    schema: table.getSchema(),
  };
}
```

---

### Paso 4: Consumir datos en tus componentes visuales
Ahora simplemente importa tu hook en cualquier componente de React e interactúa con los datos con total naturalidad:

```tsx
// src/components/NotasApp.tsx
'use client';

import React, { useState } from 'react';
import { useKotliteTable } from '../hooks/useKotliteTable';

export default function NotasApp() {
  const { data: notes, insert, delete: removeNote } = useKotliteTable("notes");
  const [title, setTitle] = useState("");

  const addNote = () => {
    if (!title.trim()) return;
    
    insert({
      userId: 1, // Usuario asociado simulado
      title: title,
      content: "Contenido de mi nota editable...",
      starred: false
    });
    
    setTitle("");
  };

  return (
    <div className="p-6 bg-zinc-900 text-white rounded-2xl max-w-md mx-auto">
      <h2 className="text-xl font-bold font-mono mb-4">Notas con Kotlite</h2>
      
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={title} 
          onChange={e => setTitle(e.target.value)}
          className="flex-1 bg-zinc-850 border border-zinc-700 px-3 py-2 rounded-xl text-sm"
          placeholder="Escribe el título..."
        />
        <button onClick={addNote} className="bg-indigo-600 px-4 py-2 rounded-xl text-sm font-semibold">
          Guardar
        </button>
      </div>

      <ul className="space-y-2">
        {notes.map(note => (
          <li key={note.id} className="flex justify-between items-center bg-zinc-800 p-3 rounded-xl border border-zinc-750">
            <span className="text-sm">{note.title}</span>
            <button 
              onClick={() => removeNote(n => n.id === note.id)}
              className="text-red-400 hover:text-red-300 text-xs font-mono font-bold"
            >
              [Borrar]
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

### Paso 5: Exportar, Importar y Sincronizar Datos JSON
Para gestionar copias de seguridad de tus tablas o sincronizarlas con APIs de internet de forma segura, utiliza el nuevo `KotliteSyncManager` integrado de forma modular en Kotlite DB.

```typescript
import { db } from '../lib/db';
import { KotliteSyncManager } from '../kotlite';

// 1. Instanciar el gestor asociándolo a tu base de datos
const syncManager = new KotliteSyncManager(db);

// 2. Exportar el estado completo de la base de datos a un String JSON legible
const backupJson = syncManager.exportJson();
console.log("Copia de Seguridad de Kotlite:", backupJson);

// 3. Sincronizar / Importar un backup JSON de forma segura y transaccional
const importResult = syncManager.importJson(backupJson, {
  mode: 'merge',          // 'merge' para Upsert basado en ID, u 'overwrite' para limpiar tablas antes
  transactional: true     // Si algo falla (tipos, constraints), hace un Rollback total y automático
});

if (importResult.success) {
  console.log("Datos sincronizados con éxito:", importResult.importedCount);
} else {
  console.error("Fallo de integridad al importar:", importResult.message, importResult.errors);
}

// 4. Sincronizar en caliente desde una API externa (Endpoint REST JSON)
async function syncDataFromServer() {
  const result = await syncManager.syncFromRemoteUrl("https://api.mi-servidor.com/v1/backups", {
    mode: 'merge',
    transactional: true,
    headers: {
      'Authorization': 'Bearer token-de-acceso'
    }
  });
  
  if (result.success) {
    console.log("¡Tablas locales actualizadas en tiempo real desde el servidor!");
  }
}
```

---

## 🛡️ Preguntas Frecuentes e Integración SSR

1. **¿Por qué Kotlite es seguro contra SSR (Server-Side Rendering)?**
   En entornos como Next.js, las páginas se evalúan primero en el servidor donde `window` y `localStorage` no existen. Kotlite detecta automáticamente esto en su submódulo `Storage.ts` y monta un almacenamiento temporal en memoria `InMemoryStorageEngine` para que el renderizador no falle. Una vez que llega al navegador de cliente, conmuta fluidamente a `LocalStorageEngine` cargando tus datos persistidos de forma transparente.

2. **¿Cómo hacer consultas complejas con filtros y ordenamientos?**
   Utiliza el método `.query()` que retorna un `QueryBuilder`. Este objeto te permite encadenar filtros perezosos inspirados en las colecciones de Kotlin:
   ```typescript
   const misFavoritas = db.table("notes")
     .query()
     .where(n => n.starred === true && n.userId === 1)
     .orderBy("title", "ASC")
     .limit(10)
     .execute();
   ```

3. **¿Cómo configurar el Cifrado Simétrico Síncrono de LocalStorage?**
   Para asegurar la confidencialidad de tus datos locales en dispositivos compartidos, puedes proveer una clave de cifrado secreta como cuarto parámetro en `createKotliteDatabase`. Los datos se encriptarán automáticamente antes de escribirse en el LocalStorage:
   ```typescript
   import { createKotliteDatabase } from './kotlite';

   export const db = createKotliteDatabase(
     "mi_base_de_datos", 
     (db) => {
       db.table("users", (t) => {
         t.integer("id").primaryKey();
         t.text("name").notNull();
       });
     },
     undefined, // Almacenamiento óptimo automático
     "mi-super-clave-secreta-aes-128" // Clave secreta de cifrado
   );
   ```

4. **¿Cómo declarar Claves Foráneas (Foreign Keys) en el DSL?**
   Utiliza el método `.references("tablaPadre", "columnaPadre", accion)` en el constructor de columnas. Soporta las tres acciones relacionales estándar: `'CASCADE'`, `'RESTRICT'` y `'SET_NULL'`:
   ```typescript
   import { createKotliteDatabase } from './kotlite';

   export const db = createKotliteDatabase("empresa", (db) => {
     // 1. Tabla Padre
     db.table("departments", (t) => {
       t.integer("id").primaryKey();
       t.text("name").unique().notNull();
     });

     // 2. Tabla Hija
     db.table("employees", (t) => {
       t.integer("id").primaryKey();
       t.text("name").notNull();
       // Clave Foránea: si se borra el departamento, elimina en cascada los empleados
       t.integer("departmentId")
         .references("departments", "id", "CASCADE")
         .notNull();
     });
   });
   ```

EOF

echo "📦 Creando kotlite/LICENSE..."
cat << 'EOF' > kotlite/LICENSE
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such patent license applies only to those patent claims
      licensable by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if distributed along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

EOF


echo -e "${COLOR_SUCCESS}"
echo "======================================================================"
echo "  ✅ INSTALACIÓN COMPLETADA CON ÉXITO"
echo "======================================================================"
echo -e "${COLOR_RESET}"
echo -e "📂 La librería se ha instalado en: ${COLOR_INFO}./kotlite/${COLOR_RESET}"
echo -e "📑 Archivos creados: ${COLOR_SUCCESS}15/15${COLOR_RESET}"
echo ""
echo -e "💡 ${COLOR_INFO}¿Qué sigue?${COLOR_RESET}"
echo -e " 1. Abre ${COLOR_INFO}kotlite/README.md${COLOR_RESET} o ${COLOR_INFO}kotlite/SETUP.md${COLOR_RESET} para ver guías rápidas."
echo -e " 2. Crea tu archivo de configuración de base de datos (ej: ${COLOR_INFO}db.ts${COLOR_RESET})."
echo -e " 3. Importa el hook reactivo de ejemplo y disfruta del estilo de Kotlin en TS."
echo ""
echo -e "${COLOR_SUCCESS}¡Disfruta desarrollando de forma ultra modular con Kotlite!${COLOR_RESET}"
