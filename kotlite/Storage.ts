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
