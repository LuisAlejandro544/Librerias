/**
 * FloatLayer Developer Debugger & Telemetry Integrator
 * Herramientas profesionales de depuración, interceptor de consolas, 
 * métricas de latencia de arrastre y telemetría de ventanas activas.
 */

import { FloatInstance } from './core/Types';
import { FloatManager } from './core/FloatManager';

export interface PerformanceMetric {
  instanceId: string;
  action: 'drag' | 'resize' | 'focus' | 'render';
  latencyMs: number;
  timestamp: number;
}

export interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  category: string;
}

class FloatLayerDebugHub {
  private metricsLog: PerformanceMetric[] = [];
  private debugSubscribers: Set<(logs: DebugLog[]) => void> = new Set();
  private logs: DebugLog[] = [];
  private maxLogs = 100;
  private isConsoleIntercepted = false;
  private originalConsole: Record<string, any> = {};

  constructor() {
    this.log('Debugger unificado de FloatLayer inicializado.', 'success', 'System');
  }

  // Registra un evento en la telemetría del desarrollador
  public log(message: string, level: DebugLog['level'] = 'info', category = 'General') {
    const timestamp = new Date().toLocaleTimeString();
    const newLog: DebugLog = { timestamp, level, message, category };
    
    this.logs = [newLog, ...this.logs].slice(0, this.maxLogs);
    this.notifySubscribers();
  }

  // Suscribirse a logs de depuración (útil para paneles de control)
  public subscribe(callback: (logs: DebugLog[]) => void): () => void {
    this.debugSubscribers.add(callback);
    callback([...this.logs]);
    return () => {
      this.debugSubscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    const logsCopy = [...this.logs];
    this.debugSubscribers.forEach(sub => sub(logsCopy));
  }

  // Intercepta de forma segura el objeto console global del navegador
  public enableConsoleBridge() {
    if (this.isConsoleIntercepted || typeof window === 'undefined') return;

    const levels: ('log' | 'warn' | 'error' | 'info')[] = ['log', 'warn', 'error', 'info'];
    
    levels.forEach(level => {
      this.originalConsole[level] = (console as any)[level];
      (console as any)[level] = (...args: any[]) => {
        // Llamar primero al original para no romper la consola nativa de devtools
        this.originalConsole[level](...args);

        const textMessage = args.map(arg => {
          if (typeof arg === 'object') {
            try { return JSON.stringify(arg); } catch (e) { return '[Object]'; }
          }
          return String(arg);
        }).join(' ');

        let mappedLevel: DebugLog['level'] = 'info';
        if (level === 'warn') mappedLevel = 'warn';
        if (level === 'error') mappedLevel = 'error';

        this.log(textMessage, mappedLevel, 'ConsoleBridge');
      };
    });

    this.isConsoleIntercepted = true;
    this.log('Consola global enlazada exitosamente a FloatLayer Debug.', 'success', 'Bridge');
  }

  // Deshace la interceptación de consola global
  public disableConsoleBridge() {
    if (!this.isConsoleIntercepted || typeof window === 'undefined') return;

    Object.keys(this.originalConsole).forEach(level => {
      (console as any)[level] = this.originalConsole[level];
    });

    this.isConsoleIntercepted = false;
    this.log('Puente de consola desconectado de forma segura.', 'warn', 'Bridge');
  }

  // Analiza el rendimiento y latencia del arrastre / redimensionamiento
  public recordMetrics(instanceId: string, action: PerformanceMetric['action'], startTime: number) {
    const latencyMs = performance.now() - startTime;
    const metric: PerformanceMetric = {
      instanceId,
      action,
      latencyMs,
      timestamp: Date.now()
    };

    this.metricsLog.push(metric);
    if (this.metricsLog.length > 200) {
      this.metricsLog.shift();
    }

    if (latencyMs > 16.67) { // Mayor que 1 frame (60fps)
      this.log(`FPS drop detectado en ventana '${instanceId}' durante '${action}': ${latencyMs.toFixed(2)}ms`, 'warn', 'Performance');
    }
  }

  // Recupera el listado completo de métricas
  public getMetrics(): PerformanceMetric[] {
    return [...this.metricsLog];
  }

  // Obtiene un reporte del uso actual de memoria de ventanas
  public generateDiagnosticsReport(): {
    totalWindows: number;
    openWindows: number;
    zIndexMap: Record<string, number>;
    averageLatencyMs: number;
    persistentStorageSize: number;
  } {
    const allInst = FloatManager.getState().instances;
    const zIndexes: Record<string, number> = {};
    allInst.forEach(inst => {
      zIndexes[inst.id] = inst.zIndex;
    });

    const activeMetrics = this.metricsLog.filter(m => m.action === 'drag' || m.action === 'resize');
    const avgLatency = activeMetrics.length > 0 
      ? activeMetrics.reduce((sum, m) => sum + m.latencyMs, 0) / activeMetrics.length 
      : 0;

    let storageBytes = 0;
    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('floatlayer_persist_')) {
            storageBytes += (localStorage.getItem(key) || '').length * 2; // UTF-16 bytes approx
          }
        }
      } catch (e) {}
    }

    return {
      totalWindows: allInst.length,
      openWindows: allInst.filter(inst => inst.isOpen).length,
      zIndexMap: zIndexes,
      averageLatencyMs: Number(avgLatency.toFixed(2)),
      persistentStorageSize: storageBytes
    };
  }
}

export const FloatDebug = new FloatLayerDebugHub();
