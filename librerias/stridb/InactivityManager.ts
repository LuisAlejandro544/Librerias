import { StridbDatabase } from "./Database";
import { StridbDebug } from "./Debug";

export class StridbInactivityManager {
  private static timer: NodeJS.Timeout | null = null;
  private static lastActivityTime: number = Date.now();
  private static timeoutMs: number = 0;
  private static onAutoDestructCallback: (() => void) | null = null;

  /**
   * Configures automatic deletion/destruction of the database after a specified duration of total inactivity (in milliseconds).
   * Set timeout to 0 to disable.
   */
  public static configureAutoDestruct(db: StridbDatabase, timeoutMs: number, onAutoDestruct?: () => void) {
    this.timeoutMs = timeoutMs;
    this.lastActivityTime = Date.now();
    this.onAutoDestructCallback = onAutoDestruct || null;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (timeoutMs <= 0) {
      StridbDebug.info("Autodestrucción por inactividad deshabilitada.");
      return;
    }

    StridbDebug.info(`Autodestrucción por inactividad configurada para ${timeoutMs / 1000} segundos.`);

    // Set up a periodic check every 1 second
    this.timer = setInterval(async () => {
      const inactiveDuration = Date.now() - this.lastActivityTime;
      if (inactiveDuration >= this.timeoutMs) {
        StridbDebug.warn("⚠️ ALERTA: Tiempo de inactividad excedido. Iniciando autodestrucción de base de datos...");
        
        try {
          if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
          }
          
          // Execute deletion
          await db.destroy();
          
          if (this.onAutoDestructCallback) {
            this.onAutoDestructCallback();
          }
        } catch (e: any) {
          StridbDebug.error("Error durante la autodestrucción por inactividad:", e);
        }
      }
    }, 1000);

    // Subscribe to DB notifications to reset the inactivity timer
    db.subscribe(() => {
      this.resetTimer();
    });
  }

  /**
   * Resets the inactivity timer to the current timestamp.
   */
  public static resetTimer() {
    if (this.timeoutMs > 0) {
      this.lastActivityTime = Date.now();
      StridbDebug.info("Cronómetro de inactividad de Stridb restablecido.");
    }
  }

  /**
   * Stop the inactivity checker
   */
  public static stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
