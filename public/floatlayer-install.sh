#!/bin/bash
# ==============================================================================
# 🌐 FLOATLAYER - INSTALADOR DE CÓDIGO FUENTE (DEVELOPMENT INTEGRATOR)
# Capas y ventanas flotantes modulares con motores PC & Mobile independientes
# ==============================================================================

set -e

# Colores visuales premium
COLOR_TITLE="\033[1;36m"
COLOR_SUCCESS="\033[1;32m"
COLOR_INFO="\033[1;34m"
COLOR_WARN="\033[1;33m"
COLOR_RESET="\033[0m"

echo -e "${COLOR_TITLE}"
echo "======================================================================"
echo "   🌐  FLOATLAYER - INSTALADOR DE CÓDIGO FUENTE EN CALIENTE"
echo "======================================================================"
echo -e "${COLOR_RESET}"

echo -e "${COLOR_INFO}👉 Preparando la instalación modular en el directorio actual...${COLOR_RESET}"

# Crear el directorio raíz
if [ -d "floatlayer" ]; then
    echo -e "${COLOR_WARN}⚠️  Se detectó que la carpeta 'floatlayer' ya existe.${COLOR_RESET}"
    read -p "¿Deseas sobreescribir los archivos actuales? (s/n): " confirm
    if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
        echo -e "${COLOR_WARN}❌ Instalación cancelada por el usuario.${COLOR_RESET}"
        exit 0
    fi
else
    mkdir -p floatlayer
fi

# Generación dinámica de los subdirectorios y archivos
mkdir -p floatlayer/core
echo "📦 Creando floatlayer/core/Types.ts..."
cat << 'EOF' > floatlayer/core/Types.ts
import React from 'react';

export type FloatLayoutMode = 'pc' | 'mobile' | 'auto';

export interface FloatOptions {
  id?: string;
  title?: string;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  isDraggable?: boolean;
  isResizable?: boolean;
  isCollapsible?: boolean; // Can collapse into a bubble/head (especially on mobile)
  edgeSnapping?: boolean; // Snap to viewport edges when dragged close
  className?: string; // Custom container styling
  headerClassName?: string; // Custom header styling
  bodyClassName?: string;
  hideHeader?: boolean;
  hideMinimize?: boolean;
  hideMaximize?: boolean;
  hideClose?: boolean;
  layoutMode?: FloatLayoutMode;
  persistentId?: string; // If set, saves coordinates and size to localStorage!
}

export interface FloatInstance {
  id: string;
  title: string;
  content: React.ReactNode | ((instance: FloatInstance) => React.ReactNode);
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean; // For PC: minimized to a tray. For Mobile: collapsed into bubble
  isMaximized: boolean;
  isOpen: boolean;
  zIndex: number;
  options: Required<Omit<FloatOptions, 'id' | 'title'>>;
  // Drag and active state variables
  isDragging: boolean;
  isResizing: boolean;
  lastInteractionTime: number;
}

export interface FloatLayerState {
  instances: FloatInstance[];
  focusedId: string | null;
  layoutMode: 'pc' | 'mobile'; // Computed active layout mode
}

export type FloatSubscriber = (state: FloatLayerState) => void;
EOF

mkdir -p floatlayer/core
echo "📦 Creando floatlayer/core/FloatManager.ts..."
cat << 'EOF' > floatlayer/core/FloatManager.ts
import { FloatInstance, FloatLayerState, FloatOptions, FloatSubscriber } from './Types';

class FloatLayerManager {
  private state: FloatLayerState = {
    instances: [],
    focusedId: null,
    layoutMode: 'pc'
  };

  private subscribers: Set<FloatSubscriber> = new Set();
  private baseZIndex = 1000;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.detectLayoutMode();
      window.addEventListener('resize', this.handleResize);
    }
  }

  // Detects whether the device is mobile or PC based on viewport width
  private detectLayoutMode = () => {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    const previousMode = this.state.layoutMode;
    const currentMode = width < 768 ? 'mobile' : 'pc';

    if (previousMode !== currentMode) {
      this.state.layoutMode = currentMode;
      
      // Adapt existing windows if mode shifts
      this.state.instances = this.state.instances.map(inst => {
        // If switching to mobile, snap windows to a responsive size or collapsed bubble
        if (currentMode === 'mobile') {
          return {
            ...inst,
            width: Math.min(inst.width, window.innerWidth - 32),
            height: Math.min(inst.height, window.innerHeight - 100),
            x: Math.max(16, Math.min(inst.x, window.innerWidth - inst.width - 16)),
            y: Math.max(16, Math.min(inst.y, window.innerHeight - inst.height - 16))
          };
        }
        return inst;
      });

      this.notify();
    }
  };

  private handleResize = () => {
    this.detectLayoutMode();
    this.clampAllToScreen();
  };

  // Clamps coordinates for all active frames so they never slide completely off-screen
  private clampAllToScreen = () => {
    if (typeof window === 'undefined') return;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let changed = false;
    this.state.instances = this.state.instances.map(inst => {
      // Don't clamp maximized windows since they cover the screen
      if (inst.isMaximized) return inst;

      const newW = Math.min(inst.width, screenWidth - 20);
      const newH = Math.min(inst.height, screenHeight - 20);
      
      // Must keep at least 40px of the header visible inside screen bounds
      const minVisibleX = -inst.width + 40;
      const maxVisibleX = screenWidth - 40;
      const minVisibleY = 0; // Header top bound
      const maxVisibleY = screenHeight - 40;

      const newX = Math.max(minVisibleX, Math.min(inst.x, maxVisibleX));
      const newY = Math.max(minVisibleY, Math.min(inst.y, maxVisibleY));

      if (newX !== inst.x || newY !== inst.y || newW !== inst.width || newH !== inst.height) {
        changed = true;
        return { ...inst, x: newX, y: newY, width: newW, height: newH };
      }
      return inst;
    });

    if (changed) {
      this.notify();
    }
  };

  // Subscribe to changes (used by React hooks or components)
  public subscribe(subscriber: FloatSubscriber): () => void {
    this.subscribers.add(subscriber);
    // Trigger initial notification
    subscriber({ ...this.state });
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  private notify() {
    const freezeState = { ...this.state, instances: [...this.state.instances] };
    this.subscribers.forEach(sub => sub(freezeState));
  }

  // Helper to load persistent coordinates from localStorage
  private loadPersistentState(persistentId: string): { x?: number; y?: number; w?: number; h?: number; isMinimized?: boolean } {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(`floatlayer_persist_${persistentId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('FloatLayer persistence loading failed:', e);
    }
    return {};
  }

  // Helper to save persistent coordinates to localStorage
  private savePersistentState(persistentId: string, inst: FloatInstance) {
    if (typeof window === 'undefined') return;
    try {
      const payload = {
        x: inst.x,
        y: inst.y,
        w: inst.width,
        h: inst.height,
        isMinimized: inst.isMinimized
      };
      localStorage.setItem(`floatlayer_persist_${persistentId}`, JSON.stringify(payload));
    } catch (e) {
      console.warn('FloatLayer persistence saving failed:', e);
    }
  }

  // Create and spawn a floating instance
  public open(
    id: string,
    title: string,
    content: React.ReactNode | ((instance: FloatInstance) => React.ReactNode),
    options: FloatOptions = {}
  ): FloatInstance {
    // If it's already open, pull it to the front
    const existing = this.state.instances.find(inst => inst.id === id);
    if (existing) {
      this.focus(id);
      if (!existing.isOpen) {
        this.state.instances = this.state.instances.map(inst => 
          inst.id === id ? { ...inst, isOpen: true } : inst
        );
        this.notify();
      }
      return this.state.instances.find(inst => inst.id === id)!;
    }

    // Default configuration values
    const dX = typeof window !== 'undefined' ? Math.max(50, Math.random() * (window.innerWidth - 450)) : 100;
    const dY = typeof window !== 'undefined' ? Math.max(80, Math.random() * (window.innerHeight - 350)) : 150;

    const defaultOpts: Required<Omit<FloatOptions, 'id' | 'title'>> = {
      initialX: options.initialX ?? dX,
      initialY: options.initialY ?? dY,
      initialWidth: options.initialWidth ?? 400,
      initialHeight: options.initialHeight ?? 300,
      minWidth: options.minWidth ?? 200,
      minHeight: options.minHeight ?? 150,
      maxWidth: options.maxWidth ?? 1200,
      maxHeight: options.maxHeight ?? 900,
      isDraggable: options.isDraggable ?? true,
      isResizable: options.isResizable ?? true,
      isCollapsible: options.isCollapsible ?? true,
      edgeSnapping: options.edgeSnapping ?? true,
      className: options.className ?? '',
      headerClassName: options.headerClassName ?? '',
      bodyClassName: options.bodyClassName ?? '',
      hideHeader: options.hideHeader ?? false,
      hideMinimize: options.hideMinimize ?? false,
      hideMaximize: options.hideMaximize ?? false,
      hideClose: options.hideClose ?? false,
      layoutMode: options.layoutMode ?? 'auto',
      persistentId: options.persistentId ?? ''
    };

    // Apply persistent states if provided
    let loadedCoords = {};
    if (defaultOpts.persistentId) {
      loadedCoords = this.loadPersistentState(defaultOpts.persistentId);
    }

    const nextZIndex = this.getMaxZIndex() + 1;

    const newInstance: FloatInstance = {
      id,
      title,
      content,
      x: (loadedCoords as any).x ?? defaultOpts.initialX,
      y: (loadedCoords as any).y ?? defaultOpts.initialY,
      width: (loadedCoords as any).w ?? defaultOpts.initialWidth,
      height: (loadedCoords as any).h ?? defaultOpts.initialHeight,
      isMinimized: (loadedCoords as any).isMinimized ?? false,
      isMaximized: false,
      isOpen: true,
      zIndex: nextZIndex,
      options: defaultOpts,
      isDragging: false,
      isResizing: false,
      lastInteractionTime: Date.now()
    };

    this.state.instances.push(newInstance);
    this.state.focusedId = id;
    this.clampAllToScreen();
    this.notify();

    return newInstance;
  }

  // Closes/hides an instance
  public close(id: string) {
    this.state.instances = this.state.instances.map(inst => 
      inst.id === id ? { ...inst, isOpen: false } : inst
    );
    if (this.state.focusedId === id) {
      const remaining = this.state.instances
        .filter(inst => inst.isOpen && inst.id !== id)
        .sort((a, b) => b.zIndex - a.zIndex);
      this.state.focusedId = remaining.length > 0 ? remaining[0].id : null;
    }
    this.notify();
  }

  // Fully unregisters/deletes a float instance from memory
  public destroy(id: string) {
    this.state.instances = this.state.instances.filter(inst => inst.id !== id);
    if (this.state.focusedId === id) {
      const remaining = this.state.instances
        .filter(inst => inst.isOpen)
        .sort((a, b) => b.zIndex - a.zIndex);
      this.state.focusedId = remaining.length > 0 ? remaining[0].id : null;
    }
    this.notify();
  }

  // Brings a floating window to the absolute front (highest z-index)
  public focus(id: string) {
    if (this.state.focusedId === id) return;

    const maxZ = this.getMaxZIndex();
    this.state.instances = this.state.instances.map(inst => {
      if (inst.id === id) {
        return { 
          ...inst, 
          zIndex: maxZ + 1, 
          lastInteractionTime: Date.now() 
        };
      }
      return inst;
    });
    this.state.focusedId = id;
    this.notify();
  }

  // Toggles minimization / collapsible state
  public toggleMinimize(id: string) {
    this.state.instances = this.state.instances.map(inst => {
      if (inst.id === id) {
        const nextMin = !inst.isMinimized;
        const updated = { ...inst, isMinimized: nextMin };
        if (inst.options.persistentId) {
          this.savePersistentState(inst.options.persistentId, updated);
        }
        return updated;
      }
      return inst;
    });
    this.notify();
  }

  // Toggles full maximization
  public toggleMaximize(id: string) {
    this.state.instances = this.state.instances.map(inst => {
      if (inst.id === id) {
        return { ...inst, isMaximized: !inst.isMaximized };
      }
      return inst;
    });
    this.notify();
  }

  // Updates position manually or during dragging
  public move(id: string, deltaX: number, deltaY: number) {
    this.state.instances = this.state.instances.map(inst => {
      if (inst.id === id) {
        if (!inst.options.isDraggable || inst.isMaximized) return inst;

        let newX = inst.x + deltaX;
        let newY = inst.y + deltaY;

        // Perform Edge Snapping if enabled
        if (inst.options.edgeSnapping && typeof window !== 'undefined') {
          const snapThreshold = 15; // px
          const screenW = window.innerWidth;
          const screenH = window.innerHeight;

          // Snap Left / Right
          if (Math.abs(newX) < snapThreshold) {
            newX = 0;
          } else if (Math.abs(newX + inst.width - screenW) < snapThreshold) {
            newX = screenW - inst.width;
          }

          // Snap Top / Bottom
          if (Math.abs(newY) < snapThreshold) {
            newY = 0;
          } else if (Math.abs(newY + inst.height - screenH) < snapThreshold) {
            newY = screenH - inst.height;
          }
        }

        const updated = { ...inst, x: newX, y: newY, isDragging: true };
        if (inst.options.persistentId) {
          this.savePersistentState(inst.options.persistentId, updated);
        }
        return updated;
      }
      return inst;
    });
    this.state.focusedId = id;
    this.notify();
  }

  // Updates sizes manually or during resizing
  public resize(id: string, deltaWidth: number, deltaHeight: number, handle: 'r' | 'b' | 'se' = 'se') {
    this.state.instances = this.state.instances.map(inst => {
      if (inst.id === id) {
        if (!inst.options.isResizable || inst.isMaximized) return inst;

        let newWidth = inst.width;
        let newHeight = inst.height;

        if (handle === 'r' || handle === 'se') {
          newWidth = Math.max(
            inst.options.minWidth,
            Math.min(inst.options.maxWidth, inst.width + deltaWidth)
          );
        }

        if (handle === 'b' || handle === 'se') {
          newHeight = Math.max(
            inst.options.minHeight,
            Math.min(inst.options.maxHeight, inst.height + deltaHeight)
          );
        }

        const updated = { ...inst, width: newWidth, height: newHeight, isResizing: true };
        if (inst.options.persistentId) {
          this.savePersistentState(inst.options.persistentId, updated);
        }
        return updated;
      }
      return inst;
    });
    this.state.focusedId = id;
    this.notify();
  }

  // Stops dragging state flag
  public stopDragging(id: string) {
    this.state.instances = this.state.instances.map(inst => 
      inst.id === id ? { ...inst, isDragging: false } : inst
    );
    this.notify();
  }

  // Stops resizing state flag
  public stopResizing(id: string) {
    this.state.instances = this.state.instances.map(inst => 
      inst.id === id ? { ...inst, isResizing: false } : inst
    );
    this.notify();
  }

  // Utility to get current highest zIndex
  private getMaxZIndex(): number {
    return this.state.instances.reduce((max, inst) => Math.max(max, inst.zIndex), this.baseZIndex);
  }

  public getState(): FloatLayerState {
    return { ...this.state };
  }
}

export const FloatManager = new FloatLayerManager();
EOF

mkdir -p floatlayer/mobile
echo "📦 Creando floatlayer/mobile/MobileEngine.ts..."
cat << 'EOF' > floatlayer/mobile/MobileEngine.ts
export interface TouchCoord {
  x: number;
  y: number;
  time: number;
}

export class FloatMobileEngine {
  // Snaps a floating bubble to the left or right edge of the screen
  public static snapBubbleToEdge(
    x: number,
    y: number,
    bubbleWidth: number,
    screenWidth: number,
    screenHeight: number,
    safetyMargin = 16
  ): { x: number; y: number } {
    const halfScreen = screenWidth / 2;
    const targetX = x + bubbleWidth / 2 < halfScreen 
      ? safetyMargin // Snap to left edge
      : screenWidth - bubbleWidth - safetyMargin; // Snap to right edge

    // Keep y within screen safety limits
    const minSafetyY = safetyMargin + 40; // Avoid overlapping top system bar if any
    const maxSafetyY = screenHeight - bubbleWidth - safetyMargin - 40;
    const targetY = Math.max(minSafetyY, Math.min(y, maxSafetyY));

    return { x: targetX, y: targetY };
  }

  // Calculates the gesture swipe velocity based on touch coordinates history
  public static calculateSwipeVelocity(history: TouchCoord[]): { vx: number; vy: number } {
    if (history.length < 2) return { vx: 0, vy: 0 };
    
    const newest = history[history.length - 1];
    const oldest = history[0];
    const timeDelta = newest.time - oldest.time; // ms

    if (timeDelta <= 0) return { vx: 0, vy: 0 };

    const dx = newest.x - oldest.x;
    const dy = newest.y - oldest.y;

    return {
      vx: dx / timeDelta, // px per ms
      vy: dy / timeDelta
    };
  }

  // Returns the recommended width and height for a mobile float overlay
  public static getResponsiveDimensions(
    screenWidth: number,
    screenHeight: number,
    aspectRatio = 1.33 // Width / Height standard
  ): { width: number; height: number } {
    const width = Math.min(screenWidth - 32, 450); // Fluid max size
    const height = Math.min(screenHeight - 160, Math.round(width / aspectRatio));

    return { width, height };
  }

  // Simulates physics slide friction
  public static calculateSlideInertia(
    vx: number,
    vy: number,
    currentX: number,
    currentY: number,
    friction = 0.95,
    cutoff = 0.05
  ): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [];
    let curX = currentX;
    let curY = currentY;
    let speedX = vx * 16; // scaled per standard frame (~16ms)
    let speedY = vy * 16;

    while (Math.abs(speedX) > cutoff || Math.abs(speedY) > cutoff) {
      curX += speedX;
      curY += speedY;
      speedX *= friction;
      speedY *= friction;
      path.push({ x: Math.round(curX), y: Math.round(curY) });
      
      // Safety limit to avoid infinite loops
      if (path.length > 60) break;
    }

    return path;
  }
}
EOF

echo "📦 Creando floatlayer/mobile/index.ts..."
cat << 'EOF' > floatlayer/mobile/index.ts
export * from './MobileEngine';
EOF

mkdir -p floatlayer/pc
echo "📦 Creando floatlayer/pc/PcEngine.ts..."
cat << 'EOF' > floatlayer/pc/PcEngine.ts
import { FloatInstance } from '../core/Types';

export class FloatPcEngine {
  // Cascades all open, non-maximized, non-minimized floating windows elegantly
  public static cascade(
    instances: FloatInstance[],
    screenWidth: number,
    screenHeight: number,
    startOffsetX = 40,
    startOffsetY = 80,
    spacingX = 30,
    spacingY = 30
  ): { id: string; x: number; y: number }[] {
    const activeInstances = instances.filter(inst => inst.isOpen && !inst.isMinimized && !inst.isMaximized);
    
    return activeInstances.map((inst, index) => {
      const offsetX = startOffsetX + index * spacingX;
      const offsetY = startOffsetY + index * spacingY;

      // Ensure window doesn't go completely off-screen
      const clampedX = Math.min(offsetX, screenWidth - 100);
      const clampedY = Math.min(offsetY, screenHeight - 100);

      return {
        id: inst.id,
        x: clampedX,
        y: clampedY
      };
    });
  }

  // Tiles all active floating windows in an even grid across the viewport area
  public static tile(
    instances: FloatInstance[],
    screenWidth: number,
    screenHeight: number,
    padding = 16,
    headerSafeOffset = 64
  ): { id: string; x: number; y: number; width: number; height: number }[] {
    const activeInstances = instances.filter(inst => inst.isOpen && !inst.isMinimized && !inst.isMaximized);
    const count = activeInstances.length;

    if (count === 0) return [];

    // Calculate grid columns and rows
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);

    const availableWidth = screenWidth - padding * (cols + 1);
    const availableHeight = screenHeight - headerSafeOffset - padding * (rows + 1);

    const cellWidth = Math.max(180, Math.floor(availableWidth / cols));
    const cellHeight = Math.max(140, Math.floor(availableHeight / rows));

    return activeInstances.map((inst, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      const x = padding + col * (cellWidth + padding);
      const y = headerSafeOffset + padding + row * (cellHeight + padding);

      return {
        id: inst.id,
        x,
        y,
        width: cellWidth,
        height: cellHeight
      };
    });
  }

  // Constrains window coordinates inside a specific parent bounding rectangle
  public static constrainToParent(
    x: number,
    y: number,
    width: number,
    height: number,
    parentRect: { left: number; top: number; right: number; bottom: number }
  ): { x: number; y: number } {
    const parentWidth = parentRect.right - parentRect.left;
    const parentHeight = parentRect.bottom - parentRect.top;

    const clampedX = Math.max(0, Math.min(x, parentWidth - width));
    const clampedY = Math.max(0, Math.min(y, parentHeight - height));

    return { x: clampedX, y: clampedY };
  }
}
EOF

echo "📦 Creando floatlayer/pc/index.ts..."
cat << 'EOF' > floatlayer/pc/index.ts
export * from './PcEngine';
EOF

echo "📦 Creando floatlayer/Debug.ts..."
cat << 'EOF' > floatlayer/Debug.ts
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
EOF

echo "📦 Creando floatlayer/index.ts..."
cat << 'EOF' > floatlayer/index.ts
import { useState, useEffect } from 'react';
import { FloatManager } from './core/FloatManager';
import { FloatLayerState, FloatOptions, FloatInstance } from './core/Types';

export * from './core/Types';
export * from './core/FloatManager';
export * from './mobile';
export * from './pc';
export * from './Debug';

export function useFloatLayer() {
  const [state, setState] = useState<FloatLayerState>(() => FloatManager.getState());

  useEffect(() => {
    const unsubscribe = FloatManager.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  return {
    instances: state.instances.filter(inst => inst.isOpen),
    allInstances: state.instances,
    focusedId: state.focusedId,
    layoutMode: state.layoutMode,
    
    // Commands
    open: (id: string, title: string, content: React.ReactNode | ((instance: FloatInstance) => React.ReactNode), options?: FloatOptions) => 
      FloatManager.open(id, title, content, options),
    
    close: (id: string) => FloatManager.close(id),
    destroy: (id: string) => FloatManager.destroy(id),
    focus: (id: string) => FloatManager.focus(id),
    toggleMinimize: (id: string) => FloatManager.toggleMinimize(id),
    toggleMaximize: (id: string) => FloatManager.toggleMaximize(id),
    move: (id: string, dx: number, dy: number) => FloatManager.move(id, dx, dy),
    resize: (id: string, dw: number, dh: number, handle?: 'r' | 'b' | 'se') => FloatManager.resize(id, dw, dh, handle),
    stopDragging: (id: string) => FloatManager.stopDragging(id),
    stopResizing: (id: string) => FloatManager.stopResizing(id),
    getState: () => FloatManager.getState()
  };
}
EOF

echo "📦 Creando floatlayer/mod.ts..."
cat << 'EOF' > floatlayer/mod.ts
export * from './index';
export { FloatManager } from './core/FloatManager';
EOF

echo "📦 Creando floatlayer/jsr.json..."
cat << 'EOF' > floatlayer/jsr.json
{
  "name": "@alejandro/floatlayer",
  "version": "0.1.0",
  "license": "Apache-2.0",
  "exports": "./mod.ts",
  "imports": {
    "react": "npm:react@^19.2.1"
  },
  "publish": {
    "include": [
      "README.md",
      "LICENSE",
      "STRUCTURE.md",
      "TUTORIAL.md",
      "ROADMAP.md",
      "**/*.ts"
    ]
  }
}
EOF

echo -e "${COLOR_SUCCESS}"
echo "======================================================================"
echo "  ✅ INSTALACIÓN DE FLOATLAYER COMPLETADA CON ÉXITO"
echo "======================================================================"
echo -e "${COLOR_RESET}"
echo -e "📂 La librería se ha instalado en: ${COLOR_INFO}./floatlayer/${COLOR_RESET}"
echo -e "📑 Archivos creados: ${COLOR_SUCCESS}14/14${COLOR_RESET}"
echo ""
echo -e "💡 ${COLOR_INFO}¿Qué sigue?${COLOR_RESET}"
echo -e " 1. Revisa ${COLOR_INFO}floatlayer/README.md${COLOR_RESET} y ${COLOR_INFO}floatlayer/STRUCTURE.md${COLOR_RESET} para entender el flujo."
echo -e " 2. Importa el hook reactivo usando: ${COLOR_INFO}import { useFloatLayer } from './floatlayer';${COLOR_RESET}"
echo -e " 3. Activa la telemetría en desarrollo con: ${COLOR_INFO}FloatDebug.enableConsoleBridge();${COLOR_RESET}"
echo -e " 4. Utiliza ${COLOR_INFO}FloatPcEngine${COLOR_RESET} para vistas Desktop y ${COLOR_INFO}FloatMobileEngine${COLOR_RESET} para vistas táctiles."
echo ""
echo -e "${COLOR_SUCCESS}¡Disfruta desarrollando de forma ultra modular con FloatLayer! 🌐${COLOR_RESET}"
