/**
 * FloatLayer PC Interaction Engine
 * Implements mouse-driven window configurations, grid/cascade layout calculations,
 * and z-index ordering strategies for advanced PC desktop multi-windowing inside web pages.
 */

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
