/**
 * Stridb Transaction Wrapper
 * Bundles multi-table actions within a single safe transaction with automated rollback.
 */

import { StridbDatabase } from "./Database";
import { StridbDebug } from "./Debug";

export class StridbTransaction {
  constructor(private db: StridbDatabase) {}

  /**
   * Executes a safe batch of mutations in a single IndexedDB write transaction.
   * If any step throws an error, the transaction automatically rolls back.
   */
  public async executeTransaction(
    tableNames: string[],
    callback: (tx: IDBTransaction) => Promise<void>
  ): Promise<boolean> {
    const startTime = performance.now();
    const rawDB = await this.db.connect();

    return new Promise((resolve, reject) => {
      const tx = rawDB.transaction(tableNames, "readwrite");

      tx.oncomplete = () => {
        const duration = performance.now() - startTime;
        StridbDebug.success(`Transacción atómica completada para tablas: [${tableNames.join(", ")}] (${duration.toFixed(1)}ms)`);
        resolve(true);
      };

      tx.onerror = (e) => {
        const error = (e.target as any).error;
        StridbDebug.error(`Fallo de Transacción. Deshaciendo cambios (Rollback)...`, error);
        reject(error);
      };

      tx.onabort = () => {
        StridbDebug.warn(`Transacción abortada de forma segura por el motor o el usuario.`);
        resolve(false);
      };

      // Execute developers custom block inside the transaction
      callback(tx).catch((err) => {
        StridbDebug.error(`Error de ejecución en callback de transacción. Abortando...`, err);
        tx.abort();
        reject(err);
      });
    });
  }
}
