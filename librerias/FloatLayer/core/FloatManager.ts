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
