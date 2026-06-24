import { StridbCrypto } from "./Crypto";
import { StridbDebug } from "./Debug";

export interface LLMKeyRecord {
  provider: string;
  name: string;
  encryptedValue: string;
}

export class StridbLLMKeyVault {
  private static STORAGE_KEY = "stridb_vault_keys";

  /**
   * Obtiene la lista de metadatos de las claves registradas en la bóveda
   */
  public static getAllRecords(): { provider: string; name: string }[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const records: LLMKeyRecord[] = JSON.parse(raw);
      return records.map(r => ({ provider: r.provider, name: r.name }));
    } catch (e) {
      StridbDebug.error("Error al obtener registros de la bóveda de claves", e);
      return [];
    }
  }

  /**
   * Cifra y guarda una clave de API de LLM en la bóveda segura
   */
  public static async saveKey(provider: string, name: string, keyValue: string, masterKey: string | null): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (!masterKey) {
      StridbDebug.error("No se puede guardar en la bóveda sin establecer la Clave Maestra.");
      return false;
    }
    try {
      // Cifrar la API Key utilizando StridbCrypto
      const encryptedValue = await StridbCrypto.encrypt(keyValue, masterKey);
      
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const records: LLMKeyRecord[] = raw ? JSON.parse(raw) : [];
      
      // Eliminar duplicado si ya existe
      const filtered = records.filter(r => !(r.provider === provider && r.name === name));
      
      filtered.push({
        provider,
        name,
        encryptedValue
      });
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      StridbDebug.info(`Clave de API para ${provider} (${name}) guardada de forma cifrada en la bóveda.`);
      return true;
    } catch (e) {
      StridbDebug.error("Error al guardar la clave de API en la bóveda", e);
      return false;
    }
  }

  /**
   * Recupera y descifra una clave de API de la bóveda segura
   */
  public static async retrieveKey(provider: string, name: string, masterKey: string | null): Promise<string | null> {
    if (typeof window === "undefined") return null;
    if (!masterKey) {
      StridbDebug.error("No se puede recuperar de la bóveda sin establecer la Clave Maestra.");
      return null;
    }
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const records: LLMKeyRecord[] = JSON.parse(raw);
      const record = records.find(r => r.provider === provider && r.name === name);
      if (!record) return null;
      
      const decrypted = await StridbCrypto.decrypt(record.encryptedValue, masterKey);
      return decrypted;
    } catch (e) {
      StridbDebug.error(`Error al descifrar clave de API para ${provider} (${name})`, e);
      return null;
    }
  }

  /**
   * Elimina una clave de API registrada en la bóveda
   */
  public static deleteKey(provider: string, name: string): boolean {
    if (typeof window === "undefined") return false;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return false;
      const records: LLMKeyRecord[] = JSON.parse(raw);
      const filtered = records.filter(r => !(r.provider === provider && r.name === name));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      StridbDebug.info(`Clave de API para ${provider} (${name}) eliminada de la bóveda.`);
      return true;
    } catch (e) {
      StridbDebug.error("Error al eliminar clave de API de la bóveda", e);
      return false;
    }
  }
}
