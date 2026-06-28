/**
 * Animation Manager
 * Centralized management for animations with proper cleanup
 * Prevents:
 * - Duplicate useEffect calls in StrictMode
 * - setInterval stacking without cleanup
 * - requestAnimationFrame memory leaks
 * - Multiple spawn triggers
 */

export class AnimationManager {
  private intervals: Set<ReturnType<typeof setInterval>> = new Set();
  private frameIds: Set<ReturnType<typeof requestAnimationFrame>> = new Set();
  private timeouts: Set<ReturnType<typeof setTimeout>> = new Set();

  /**
   * Create a managed interval with automatic cleanup
   */
  addInterval(callback: () => void, ms: number): ReturnType<typeof setInterval> {
    const id = setInterval(callback, ms);
    this.intervals.add(id);
    return id;
  }

  /**
   * Create a managed RAF with automatic cleanup
   */
  addRaf(callback: FrameRequestCallback): ReturnType<typeof requestAnimationFrame> {
    const id = requestAnimationFrame(callback);
    this.frameIds.add(id);
    return id;
  }

  /**
   * Create a managed timeout with automatic cleanup
   */
  addTimeout(callback: () => void, ms: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(callback, ms);
    this.timeouts.add(id);
    return id;
  }

  /**
   * Remove an interval from tracking
   */
  removeInterval(id: ReturnType<typeof setInterval>) {
    clearInterval(id);
    this.intervals.delete(id);
  }

  /**
   * Remove a RAF from tracking
   */
  removeRaf(id: ReturnType<typeof requestAnimationFrame>) {
    cancelAnimationFrame(id);
    this.frameIds.delete(id);
  }

  /**
   * Remove a timeout from tracking
   */
  removeTimeout(id: ReturnType<typeof setTimeout>) {
    clearTimeout(id);
    this.timeouts.delete(id);
  }

  /**
   * Clean up all tracked animations
   * Call this in useEffect cleanup!
   */
  cleanup() {
    // Clear all intervals
    for (const id of this.intervals) {
      clearInterval(id);
    }
    this.intervals.clear();

    // Cancel all RAFs
    for (const id of this.frameIds) {
      cancelAnimationFrame(id);
    }
    this.frameIds.clear();

    // Clear all timeouts
    for (const id of this.timeouts) {
      clearTimeout(id);
    }
    this.timeouts.clear();
  }

  /**
   * Get status info for debugging
   */
  getStatus() {
    return {
      intervals: this.intervals.size,
      rafs: this.frameIds.size,
      timeouts: this.timeouts.size,
    };
  }
}

/**
 * React hook for using AnimationManager
 * Usage:
 * ```
 * const animManager = useAnimationManager();
 * 
 * useEffect(() => {
 *   const id = animManager.addInterval(() => {
 *     // animation code
 *   }, 16);
 * 
 *   return () => animManager.removeInterval(id);
 * }, [animManager]);
 * ```
 */
export function useAnimationManager() {
  const manager = new AnimationManager();
  
  // Return a cleanup function that React can call
  return {
    manager,
    cleanup: () => manager.cleanup(),
  };
}

// Singleton for global animations (careful with this!)
let globalManager: AnimationManager | null = null;

export function getGlobalAnimationManager(): AnimationManager {
  if (!globalManager) {
    globalManager = new AnimationManager();
  }
  return globalManager;
}

export function cleanupGlobalAnimations() {
  if (globalManager) {
    globalManager.cleanup();
    globalManager = null;
  }
}
