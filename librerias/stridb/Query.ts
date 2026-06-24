/**
 * Stridb Query Engine
 * SQL-like chainable interface for IndexedDB operations with metrics.
 */

import { TableSchema, validateRecord } from "./Schema";
import { StridbDebug } from "./Debug";
import { StridbCrypto } from "./Crypto";

export class StridbQuery<T = any> {
  private selections: string[] = [];
  private predicates: ((row: T) => boolean)[] = [];
  private orderField: keyof T | null = null;
  private orderDir: "ASC" | "DESC" = "ASC";
  private limitCount: number | null = null;

  constructor(
    private schema: TableSchema,
    private dbProvider: () => Promise<IDBDatabase>
  ) {}

  /**
   * Select specific columns (SQL Select). Default selects everything.
   */
  public select(...columns: string[]): StridbQuery<T> {
    this.selections = columns;
    return this;
  }

  /**
   * Fluent filter predicate (SQL Where clause).
   */
  public where(predicate: (row: T) => boolean): StridbQuery<T> {
    this.predicates.push(predicate);
    return this;
  }

  /**
   * Order matching results (SQL Order By).
   */
  public orderBy(field: keyof T, direction: "ASC" | "DESC" = "ASC"): StridbQuery<T> {
    this.orderField = field;
    this.orderDir = direction;
    return this;
  }

  /**
   * Limit max rows fetched (SQL Limit clause).
   */
  public limit(count: number): StridbQuery<T> {
    this.limitCount = count;
    return this;
  }

  /**
   * Execute the query against IndexedDB dynamically.
   */
  public async execute(): Promise<T[]> {
    const startTime = performance.now();
    const db = await this.dbProvider();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.schema.name], "readonly");
      const store = transaction.objectStore(this.schema.name);
      const results: T[] = [];

      const request = store.openCursor();

      request.onsuccess = async (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          const rawRow = cursor.value;
          const row = await StridbCrypto.decryptRecord(this.schema, rawRow);

          // Apply predicates
          let matches = true;
          for (const pred of this.predicates) {
            if (!pred(row)) {
              matches = false;
              break;
            }
          }

          if (matches) {
            // Apply selections if requested
            if (this.selections.length > 0) {
              const selectedRow: any = {};
              for (const col of this.selections) {
                selectedRow[col] = row[col];
              }
              results.push(selectedRow);
            } else {
              results.push(row);
            }
          }

          cursor.continue();
        } else {
          // Finished reading cursor, now apply sorting
          if (this.orderField) {
            results.sort((a, b) => {
              const valA = a[this.orderField!];
              const valB = b[this.orderField!];
              
              if (valA === valB) return 0;
              if (valA === undefined || valA === null) return 1;
              if (valB === undefined || valB === null) return -1;

              if (this.orderDir === "ASC") {
                return valA > valB ? 1 : -1;
              } else {
                return valA < valB ? 1 : -1;
              }
            });
          }

          // Apply Limit
          const finalResult = this.limitCount !== null ? results.slice(0, this.limitCount) : results;
          const duration = performance.now() - startTime;

          // Log to Stridb console debugger
          const sqlEquivalent = `SELECT ${this.selections.length > 0 ? this.selections.join(", ") : "*"} FROM ${this.schema.name}` +
            (this.predicates.length > 0 ? ` WHERE [${this.predicates.length} filters]` : "") +
            (this.orderField ? ` ORDER BY ${String(this.orderField)} ${this.orderDir}` : "") +
            (this.limitCount !== null ? ` LIMIT ${this.limitCount}` : "");
          
          StridbQueryPlanLogger.logQuery(this.schema.name, sqlEquivalent, duration, finalResult.length);

          resolve(finalResult);
        }
      };

      request.onerror = (e) => {
        const error = (e.target as any).error;
        StridbDebug.error(`Fallo de consulta en tabla '${this.schema.name}'`, error);
        reject(error);
      };
    });
  }
}

class StridbQueryPlanLogger {
  public static logQuery(table: string, queryStr: string, durationMs: number, count: number) {
    const plan = `Cursor scan on Table '${table}'. Scanned all active records. Filtered dynamically in memory. Found matches: ${count}`;
    StridbDebug.query(queryStr, durationMs, plan);
  }
}
