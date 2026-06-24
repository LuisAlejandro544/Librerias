/**
 * Kotlite DB - Storage Engine Abstraction
 * Permite alternar de forma transparente entre LocalStorage física,
 * un motor InMemory (evitando crasheos de SSR en Next.js), y un motor híbrido con IndexedDB
 * utilizando el patrón Write-Through Cache para asegurar compatibilidad síncrona instantánea.
 */

export interface StorageEngine {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  init?(): Promise<void>;
  isReady?(): boolean;
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

/**
 * LocalStorage con aislamiento estricto y validación de namespace.
 * Todas las llaves se almacenan bajo prefijos controlados para evitar contaminación.
 */
export class LocalStorageEngine implements StorageEngine {
  private prefix = "kotlite_secure_v1:";

  private getFullKey(key: string): string {
    if (key.startsWith(this.prefix)) return key;
    return `${this.prefix}${key}`;
  }

  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(this.getFullKey(key));
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.getFullKey(key), value);
    } catch (e) {
      console.error("[Kotlite Storage] Error: No se pudo escribir en localStorage de forma segura.", e);
    }
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.getFullKey(key));
    } catch {}
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      // Limpiar solo los registros con nuestro prefijo estricto para no tocar otro storage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.prefix)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
  }
}

/**
 * IndexedDB con Write-Through Cache.
 * Carga todo el almacén de datos de IndexedDB a memoria de forma asíncrona al inicio (método init)
 * para permitir lecturas síncronas instantáneas en caliente (getItem).
 * Las escrituras se guardan síncronamente en memoria y se propagan asíncronamente a IndexedDB.
 */
export class IndexedDBStorageEngine implements StorageEngine {
  private dbName = "KotliteSecureDatabase";
  private storeName = "key_value_store";
  private db: IDBDatabase | null = null;
  private cache = new Map<string, string>();
  private initialized = false;

  async init(): Promise<void> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        
        // Cargar todo a memoria de forma preventiva
        const transaction = this.db.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const cursorRequest = store.openCursor();

        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (cursor) {
            this.cache.set(cursor.key as string, cursor.value as string);
            cursor.continue();
          } else {
            this.initialized = true;
            resolve();
          }
        };

        cursorRequest.onerror = () => {
          reject(new Error("No se pudo recorrer la base de datos de IndexedDB Kotlite"));
        };
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  isReady(): boolean {
    return this.initialized;
  }

  getItem(key: string): string | null {
    // Lectura síncrona del caché en caliente (Write-Through)
    return this.cache.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    // 1. Escritura síncrona en caché
    this.cache.set(key, value);

    // 2. Escritura asíncrona en IndexedDB de forma persistente
    if (this.db) {
      try {
        const transaction = this.db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        store.put(value, key);
      } catch (e) {
        console.error("[Kotlite IndexedDB] Falló la persistencia en caliente de la llave:", key, e);
      }
    }
  }

  removeItem(key: string): void {
    // 1. Quitar de caché
    this.cache.delete(key);

    // 2. Borrar de IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        store.delete(key);
      } catch (e) {
        console.error("[Kotlite IndexedDB] Falló el borrado de la llave:", key, e);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    if (this.db) {
      try {
        const transaction = this.db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        store.clear();
      } catch (e) {
        console.error("[Kotlite IndexedDB] Error vaciando base de datos", e);
      }
    }
  }
}

/**
 * Retorna el motor de almacenamiento óptimo basado en capacidades de la plataforma
 */
export function getOptimalStorage(preferIndexedDB: boolean = false): StorageEngine {
  if (typeof window !== 'undefined') {
    if (preferIndexedDB && typeof indexedDB !== 'undefined') {
      return new IndexedDBStorageEngine();
    }
    if (typeof localStorage !== 'undefined') {
      return new LocalStorageEngine();
    }
  }
  return new InMemoryStorageEngine();
}
