import { useEffect, useRef } from 'react';
import { attachHdrTouchGlow } from '@/lib/utils';

/**
 * Hook to attach HDR glow touch feedback to a button element
 * Usage: const ref = useHdrGlow(); <button ref={ref}>Click me</button>
 */
export function useHdrGlow() {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = ref.current;
    if (!button) return;

    const cleanup = attachHdrTouchGlow(button);
    return cleanup;
  }, []);

  return ref;
}
