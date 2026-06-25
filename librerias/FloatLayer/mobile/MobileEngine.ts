/**
 * FloatLayer Mobile Interaction Engine
 * Implements optimizations for touchscreen overlays, bubble snaps (like Messenger Chat Heads),
 * swipe-to-collapse gestures, and viewport safety metrics.
 */

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
