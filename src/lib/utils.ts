import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Add HDR glow touch support to buttons
 * On touchstart: add hdr-active class for dramatic glow
 * On touchend: keep glow visible for 300ms then fade
 * Mimics iPhone haptic feedback feel
 */
export function attachHdrTouchGlow(button: HTMLElement) {
  if (!button) return;

  let touchTimer: ReturnType<typeof setTimeout> | null = null;

  button.addEventListener('touchstart', () => {
    if (touchTimer) clearTimeout(touchTimer);
    button.classList.add('hdr-active');
  });

  button.addEventListener('touchend', () => {
    touchTimer = setTimeout(() => {
      button.classList.remove('hdr-active');
      touchTimer = null;
    }, 300);
  });

  // Cleanup function for unmounting
  return () => {
    if (touchTimer) clearTimeout(touchTimer);
  };
}
