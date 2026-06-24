import { StridbDebug } from "./Debug";

export class StridbStoragePersistence {
  /**
   * Requests persistent storage permission from the browser.
   * If granted, the browser promises not to evict the database under storage pressure.
   */
  public static async requestPersistence(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.storage || !navigator.storage.persist) {
      StridbDebug.warn("Storage Persistence API no disponible en este entorno.");
      return false;
    }

    try {
      const isPersisted = await navigator.storage.persist();
      if (isPersisted) {
        StridbDebug.success("Persistencia de almacenamiento otorgada de forma segura por el navegador.");
      } else {
        StridbDebug.warn("El navegador rechazó la persistencia automática de almacenamiento (posiblemente debido a políticas de usuario).");
      }
      return isPersisted;
    } catch (e: any) {
      StridbDebug.error("Error al solicitar persistencia de almacenamiento:", e);
      return false;
    }
  }

  /**
   * Checks whether persistent storage has already been granted.
   */
  public static async isPersisted(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.storage || !navigator.storage.persisted) {
      return false;
    }
    try {
      return await navigator.storage.persisted();
    } catch {
      return false;
    }
  }

  /**
   * Estimates current storage usage and quota availability.
   */
  public static async estimateStorage(): Promise<{ used: number; quota: number; percent: number } | null> {
    if (typeof navigator === "undefined" || !navigator.storage || !navigator.storage.estimate) {
      return null;
    }
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 1;
      const percent = (used / quota) * 100;
      return { used, quota, percent };
    } catch {
      return null;
    }
  }
}
