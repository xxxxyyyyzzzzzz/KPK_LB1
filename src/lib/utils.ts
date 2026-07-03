import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Форматування балів: округлення максимум до однієї цифри після коми */
export function formatPoints(value: number): string {
  if (typeof value !== "number") return "0";
  const rounded = Math.round(value * 10) / 10;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
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
