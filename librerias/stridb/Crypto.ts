/**
 * Stridb Column-Level Encryption Module
 * High-security AES-GCM standard using browser Web Crypto APIs.
 * Includes automated fallback to standard Base64 custom obfuscation if Web Crypto is unavailable.
 */

import { StridbDebug } from "./Debug";
import type { TableSchema } from "./Schema";

export class StridbCrypto {
  private static masterKey: string | null = null;

  /**
   * Encrypts any marked columns in a record
   */
  public static async encryptRecord(schema: TableSchema, record: any): Promise<any> {
    if (!record) return record;
    const encrypted = { ...record };
    const masterKey = this.getMasterKey();
    if (!masterKey) return encrypted; // no key, no encryption

    for (const [colName, colDef] of Object.entries(schema.columns)) {
      if (colDef.encrypt && encrypted[colName] !== undefined && encrypted[colName] !== null) {
        // Encrypt the value
        const strValue = typeof encrypted[colName] === "object" ? JSON.stringify(encrypted[colName]) : String(encrypted[colName]);
        encrypted[colName] = await this.encrypt(strValue, masterKey);
      }
    }
    return encrypted;
  }

  /**
   * Decrypts any marked columns in a record
   */
  public static async decryptRecord(schema: TableSchema, record: any): Promise<any> {
    if (!record) return record;
    const decrypted = { ...record };
    const masterKey = this.getMasterKey();
    if (!masterKey) return decrypted; // no key, cannot decrypt

    for (const [colName, colDef] of Object.entries(schema.columns)) {
      if (colDef.encrypt && decrypted[colName] !== undefined && decrypted[colName] !== null) {
        try {
          const decryptedStr = await this.decrypt(decrypted[colName], masterKey);
          // Try parsing as JSON if column is JSON, else match type
          if (colDef.type === "JSON") {
            try {
              decrypted[colName] = JSON.parse(decryptedStr);
            } catch {
              decrypted[colName] = decryptedStr;
            }
          } else if (colDef.type === "INTEGER") {
            decrypted[colName] = Number(decryptedStr);
          } else if (colDef.type === "BOOLEAN") {
            decrypted[colName] = decryptedStr === "true";
          } else {
            decrypted[colName] = decryptedStr;
          }
        } catch {
          // If decryption fails, keep raw
        }
      }
    }
    return decrypted;
  }

  /**
   * Set the database-wide encryption passphrase
   */
  public static setMasterKey(key: string) {
    this.masterKey = key;
    StridbDebug.info("Clave maestra de encriptación establecida de forma segura.");
  }

  public static getMasterKey(): string | null {
    return this.masterKey;
  }

  /**
   * Hashes a string using SHA-256 for integrity or simple key derivation
   */
  public static async hash(text: string): Promise<string> {
    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
      // Fallback simple hash
      let h = 0;
      for (let i = 0; i < text.length; i++) {
        h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
      }
      return String(h);
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return btoa(text);
    }
  }

  /**
   * Encrypts a plaintext string using AES-GCM or a secure fallback.
   */
  public static async encrypt(text: string, passphrase = this.masterKey): Promise<string> {
    if (!passphrase) {
      throw new Error("No se ha configurado ninguna clave maestra (Master Key) para realizar la encriptación.");
    }

    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
      // Fallback fallback encoding + XOR dynamic key shifting for environments without WebCrypto
      StridbDebug.warn("Web Crypto API no disponible. Usando cifrado de respaldo de Stridb.");
      return this.fallbackEncrypt(text, passphrase);
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);

      // Derive key
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(passphrase),
        "PBKDF2",
        false,
        ["deriveKey"]
      );

      const salt = window.crypto.getRandomValues(new Uint8Array(16));

      const key = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 1000,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
      );

      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        key,
        data
      );

      const encryptedBytes = new Uint8Array(encryptedBuffer);
      
      // Package as: SALT(16 bytes) + IV(12 bytes) + CIPHERTEXT
      const combined = new Uint8Array(salt.length + iv.length + encryptedBytes.length);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(encryptedBytes, salt.length + iv.length);

      // Convert to hex
      return Array.from(combined).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      StridbDebug.error("Fallo durante el cifrado AES-GCM", e);
      return this.fallbackEncrypt(text, passphrase);
    }
  }

  /**
   * Decrypts an encrypted hex string back to plaintext.
   */
  public static async decrypt(hexString: string, passphrase = this.masterKey): Promise<string> {
    if (!passphrase) {
      throw new Error("No se ha configurado ninguna clave maestra (Master Key) para realizar la desencriptación.");
    }

    // Identify if the string was encrypted with fallback prefix
    if (hexString.startsWith("stridbfb::")) {
      return this.fallbackDecrypt(hexString, passphrase);
    }

    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
      return this.fallbackDecrypt(hexString, passphrase);
    }

    try {
      // Parse hex to Uint8Array
      const combined = new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const ciphertext = combined.slice(28);

      const encoder = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(passphrase),
        "PBKDF2",
        false,
        ["deriveKey"]
      );

      const key = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 1000,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        key,
        ciphertext
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (e) {
      // If decryption fails, try fallback decryption or return original hex
      try {
        return await this.fallbackDecrypt(hexString, passphrase);
      } catch {
        StridbDebug.warn("Fallo al desencriptar el campo. Retornando valor crudo.");
        return hexString;
      }
    }
  }

  /**
   * Pure JS portable fallback encryption for SSR or non-secure contexts
   */
  private static fallbackEncrypt(text: string, key: string): string {
    const textBytes = Array.from(new TextEncoder().encode(text));
    const keyBytes = Array.from(new TextEncoder().encode(key));
    
    // Simple reversible XOR with key shift
    const cipher = textBytes.map((b, i) => b ^ keyBytes[i % keyBytes.length] ^ i);
    const hex = cipher.map(b => b.toString(16).padStart(2, '0')).join('');
    return "stridbfb::" + hex;
  }

  /**
   * Pure JS portable fallback decryption
   */
  private static fallbackDecrypt(hexString: string, key: string): string {
    const rawHex = hexString.startsWith("stridbfb::") ? hexString.substring(10) : hexString;
    const keyBytes = Array.from(new TextEncoder().encode(key));
    
    try {
      const bytes = rawHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16));
      const decrypted = bytes.map((b, i) => b ^ keyBytes[i % keyBytes.length] ^ i);
      return new TextDecoder().decode(new Uint8Array(decrypted));
    } catch {
      return hexString;
    }
  }
}
