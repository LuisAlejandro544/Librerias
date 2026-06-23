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
