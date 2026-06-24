/**
 * Stridb Debug System
 * Beautiful styled terminal and console logging for IndexedDB transactions and queries.
 */

export class StridbDebug {
  private static enabled = true;
  private static prefix = "%c[Stridb ⚡ System]";
  private static styles = {
    info: "color: #818cf8; font-weight: bold; background-color: #1e1b4b; padding: 2px 6px; border-radius: 4px;",
    success: "color: #34d399; font-weight: bold; background-color: #064e3b; padding: 2px 6px; border-radius: 4px;",
    warn: "color: #fbbf24; font-weight: bold; background-color: #78350f; padding: 2px 6px; border-radius: 4px;",
    error: "color: #f87171; font-weight: bold; background-color: #7f1d1d; padding: 2px 6px; border-radius: 4px;",
    query: "color: #c084fc; font-weight: bold; background-color: #3b0764; padding: 2px 6px; border-radius: 4px;",
    time: "color: #a1a1aa; font-family: monospace;"
  };

  private static onLogCallback: ((message: string, type: 'info' | 'success' | 'warn' | 'error' | 'query') => void) | null = null;

  public static setOnLog(callback: (message: string, type: 'info' | 'success' | 'warn' | 'error' | 'query') => void) {
    this.onLogCallback = callback;
  }

  public static disable() {
    this.enabled = false;
  }

  public static enable() {
    this.enabled = true;
  }

  private static triggerCallback(msg: string, type: 'info' | 'success' | 'warn' | 'error' | 'query') {
    if (this.onLogCallback) {
      this.onLogCallback(msg, type);
    }
  }

  public static info(msg: string, details?: any) {
    if (!this.enabled) return;
    console.log(`${this.prefix} %cINFO%c ${msg}`, this.styles.info, "color: #e2e8f0; font-weight: bold;", "", details || "");
    this.triggerCallback(msg, 'info');
  }

  public static success(msg: string, details?: any) {
    if (!this.enabled) return;
    console.log(`${this.prefix} %cSUCCESS%c ${msg}`, this.styles.success, "color: #4ade80; font-weight: bold;", "", details || "");
    this.triggerCallback(msg, 'success');
  }

  public static query(queryStr: string, durationMs: number, plan?: string) {
    if (!this.enabled) return;
    console.groupCollapsed(`${this.prefix} %cQUERY%c ${queryStr.substring(0, 50)}... (%c${durationMs.toFixed(1)}ms%c)`, 
      this.styles.query, "color: #c084fc;", this.styles.time, "color: inherit;");
    console.log("%cQuery Execution Plan:", "color: #a1a1aa; font-weight: bold;", plan || "Full scan / Indexed cursor");
    console.log("%cSQL Chaining Equivalent:", "color: #a1a1aa; font-style: italic;", queryStr);
    console.groupEnd();
    this.triggerCallback(`${queryStr} (${durationMs.toFixed(1)}ms)`, 'query');
  }

  public static warn(msg: string, details?: any) {
    if (!this.enabled) return;
    console.warn(`${this.prefix} %cWARN%c ${msg}`, this.styles.warn, "color: #fbbf24; font-weight: bold;", "", details || "");
    this.triggerCallback(msg, 'warn');
  }

  public static error(msg: string, error?: any) {
    if (!this.enabled) return;
    console.error(`${this.prefix} %cERROR%c ${msg}`, this.styles.error, "color: #f87171; font-weight: bold;", "", error || "");
    this.triggerCallback(msg, 'error');
  }
}
