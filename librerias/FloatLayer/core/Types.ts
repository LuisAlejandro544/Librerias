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
