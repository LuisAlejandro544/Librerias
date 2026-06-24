/**
 * Stridb Backup & Portability
 * Allows exporting and importing whole IndexedDB data as raw JSON objects.
 */

import { StridbDatabase } from "./Database";
import { StridbDebug } from "./Debug";

export class StridbBackup {
  constructor(private db: StridbDatabase) {}

  /**
   * Exports the entire database stores into a single portable JSON payload.
   */
  public async exportJSON(): Promise<Record<string, any[]>> {
    const startTime = performance.now();
    const rawDB = await this.db.connect();
    const result: Record<string, any[]> = {};

    const tableNames = Array.from(rawDB.objectStoreNames);

    for (const tableName of tableNames) {
      result[tableName] = await new Promise<any[]>((resolve, reject) => {
        const tx = rawDB.transaction([tableName], "readonly");
        const store = tx.objectStore(tableName);
        const req = store.getAll();

        req.onsuccess = (e: any) => resolve(e.target.result);
        req.onerror = (e: any) => reject(e.target.error);
      });
    }

    const duration = performance.now() - startTime;
    StridbDebug.success(`Copia de seguridad (Backup) exportada correctamente (${duration.toFixed(1)}ms)`);
    return result;
  }

  /**
   * Imports raw JSON payload, restoring or overwriting specific tables.
   */
  public async importJSON(data: Record<string, any[]>): Promise<boolean> {
    const startTime = performance.now();
    const rawDB = await this.db.connect();

    for (const [tableName, rows] of Object.entries(data)) {
      if (!rawDB.objectStoreNames.contains(tableName)) {
        StridbDebug.warn(`No se puede importar a la tabla '${tableName}': No existe en el esquema.`);
        continue;
      }

      await new Promise<void>((resolve, reject) => {
        const tx = rawDB.transaction([tableName], "readwrite");
        const store = tx.objectStore(tableName);
        
        // Clear old records first
        store.clear();

        let insertedCount = 0;
        if (rows.length === 0) {
          tx.oncomplete = () => resolve();
          return;
        }

        for (const row of rows) {
          const req = store.add(row);
          req.onsuccess = () => {
            insertedCount++;
          };
        }

        tx.oncomplete = () => {
          StridbDebug.info(`Importados ${insertedCount} registros en la tabla '${tableName}'`);
          resolve();
        };

        tx.onerror = (e: any) => reject(e.target.error);
      });
    }

    const duration = performance.now() - startTime;
    StridbDebug.success(`Copia de seguridad (Backup) restaurada con éxito (${duration.toFixed(1)}ms)`);
    return true;
  }
}
