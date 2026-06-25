import { useState, useEffect } from 'react';
import { FloatManager } from './core/FloatManager';
import { FloatLayerState, FloatOptions, FloatInstance } from './core/Types';

export * from './core/Types';
export * from './core/FloatManager';
export * from './mobile';
export * from './pc';
export * from './Debug';
export * from './extensions/TelemetryConsole';
export * from './extensions/PipEngine';

export interface FloatLayerHookValue {
  instances: FloatInstance[];
  allInstances: FloatInstance[];
  focusedId: string | null;
  layoutMode: 'pc' | 'mobile';
  open: (id: string, title: string, content: React.ReactNode | ((instance: FloatInstance) => React.ReactNode), options?: FloatOptions) => void;
  close: (id: string) => void;
  destroy: (id: string) => void;
  focus: (id: string) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  move: (id: string, dx: number, dy: number) => void;
  resize: (id: string, dw: number, dh: number, handle?: 'r' | 'b' | 'se') => void;
  stopDragging: (id: string) => void;
  stopResizing: (id: string) => void;
  getState: () => FloatLayerState;
}

// React Hook for seamless, reactive integration with Next.js/React apps
export function useFloatLayer(): FloatLayerHookValue {
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
