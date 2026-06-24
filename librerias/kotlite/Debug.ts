/**
 * Kotlite DB - Advanced Debugging Suite
 * Módulo de diagnóstico en tiempo real con diseño visual inspirado en consolas Kotlin.
 * Proporciona advertencias de rendimiento, validaciones de integridad y logs interactivos.
 */

export interface LogStyles {
  primary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

const STYLES: LogStyles = {
  primary: "color: #a855f7; font-weight: bold; background: #1e1b4b; padding: 2px 5px; border-radius: 4px;",
  success: "color: #10b981; font-weight: bold; background: #064e3b; padding: 2px 5px; border-radius: 4px;",
  warning: "color: #f59e0b; font-weight: bold; background: #451a03; padding: 2px 5px; border-radius: 4px;",
  error: "color: #ef4444; font-weight: bold; background: #7f1d1d; padding: 2px 5px; border-radius: 4px;",
  info: "color: #3b82f6; font-weight: bold; background: #172554; padding: 2px 5px; border-radius: 4px;"
};

export class KotliteDebugger {
  public static enabled = true;
  private static queryCounter = 0;

  private static log(prefix: string, message: string, style: string, extra?: any) {
    if (!this.enabled || typeof window === 'undefined') return;
    
    if (extra !== undefined) {
      console.log(`%c[Kotlite DB v1.0] ${prefix} %c${message}`, style, "color: #e4e4e7;", extra);
    } else {
      console.log(`%c[Kotlite DB v1.0] ${prefix} %c${message}`, style, "color: #e4e4e7;");
    }
  }

  /**
   * Registra una transacción exitosa (Insert, Update, Delete)
   */
  public static logTransaction(
    type: 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE',
    tableName: string,
    affectedCount: number,
    payload?: any
  ) {
    const icon = type === 'INSERT' ? '📥' : type === 'UPDATE' ? '🔄' : type === 'DELETE' ? '🗑️' : '🚨';
    const msg = `${icon} Transacción ${type} completada en tabla '${tableName}'. Registros afectados: ${affectedCount}.`;
    this.log("TX", msg, STYLES.success, payload);
  }

  /**
   * Log de consultas con métricas de duración para detectar cuellos de botella
   */
  public static logQuery(tableName: string, queryDescription: string, durationMs: number, resultCount: number) {
    this.queryCounter++;
    const performanceTag = durationMs > 50 ? "⚠️ LENTO" : "⚡ OK";
    const msg = `🔍 Consulta #${this.queryCounter} en '${tableName}' [${performanceTag} - ${durationMs.toFixed(1)}ms]. Retornó: ${resultCount} f.`;
    this.log("QUERY", `${msg} | Filtro: ${queryDescription}`, STYLES.primary);

    // Advertir de consultas potencialmente ineficientes
    if (resultCount > 500 && durationMs > 30) {
      this.logPerformanceWarning(
        tableName,
        `La consulta #${this.queryCounter} retornó ${resultCount} registros en ${durationMs.toFixed(1)}ms. Considera limitar las búsquedas usando limit() u optimizar filtros.`
      );
    }
  }

  /**
   * Log de error o excepción capturada de forma controlada
   */
  public static logError(errorType: string, message: string, suggestion?: string) {
    const errorMsg = `❌ [${errorType}] ${message}`;
    this.log("ERROR", errorMsg, STYLES.error);
    if (suggestion) {
      console.warn(`%c💡 Sugerencia de depuración: %c${suggestion}`, "color: #3b82f6; font-weight: bold;", "color: #a1a1aa;");
    }
  }

  /**
   * Reporta la violación de una restricción (Clave primaria, nulos, unicidad)
   */
  public static logConstraintViolation(tableName: string, columnName: string, constraintType: string, value: any) {
    const msg = `⚠️ Violación de restricción [${constraintType}] en tabla '${tableName}', columna '${columnName}'. Valor conflictivo: '${value}'`;
    this.log("CONSTRAINT", msg, STYLES.warning);
    
    let advice = "";
    if (constraintType === "NOT_NULL") {
      advice = `La columna '${columnName}' está declarada como No-Nula. Asegúrate de enviar un valor válido en tu insert o define un defaultValue en el esquema.`;
    } else if (constraintType === "UNIQUE" || constraintType === "PRIMARY_KEY") {
      advice = `El valor '${value}' ya existe en la columna con restricción de unicidad de la tabla '${tableName}'. Cambia el valor a uno único o usa un entero autoincremental.`;
    }
    
    if (advice) {
      console.warn(`%c💡 Sugerencia de Corrección: %c${advice}`, "color: #f59e0b; font-weight: bold;", "color: #a1a1aa;");
    }
  }

  /**
   * Advertencia de rendimiento
   */
  public static logPerformanceWarning(tableName: string, warningMessage: string) {
    const msg = `📈 [Optimización] Tabla '${tableName}': ${warningMessage}`;
    this.log("PERF", msg, STYLES.warning);
  }

  /**
   * Imprime un volcado visual de una tabla completa para depuración directa en consola
   */
  public static inspectTable(tableName: string, schema: any, rows: any[]) {
    if (!this.enabled || typeof window === 'undefined') return;

    console.group(`%c📦 Inspección de Tabla: ${tableName} (Total: ${rows.length} registros)`, STYLES.info);
    console.log("Esquema Físico:", schema);
    if (rows.length > 0) {
      console.table(rows);
    } else {
      console.log("%cTabla vacía actualmente.", "color: #71717a; font-style: italic;");
    }
    console.groupEnd();
  }
}
