import { useEffect, useRef } from 'react';
import { AnimationManager } from '@/lib/animation-manager';

/**
 * BackgroundAnimation Component
 * 
 * Properly implements animated background elements with:
 * ✓ Z-index layering (behind all content)
 * ✓ Spawn rate control (no duplicate spawning)
 * ✓ Proper cleanup (no memory leaks)
 * ✓ Mobile optimization (no blur)
 * 
 * TODO: Implement specific animation logic as needed
 */
export function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animManagerRef = useRef<AnimationManager | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a single animation manager instance for this component
    if (!animManagerRef.current) {
      animManagerRef.current = new AnimationManager();
    }
    const manager = animManagerRef.current;

    // Set canvas resolution for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale context for retina
    ctx.scale(dpr, dpr);

    // Animation state
    let isRunning = true;
    const particles: Array<{ x: number; y: number; vx: number; vy: number; life: number }> = [];
    const spawnRate = 5; // particles per frame
    let lastSpawnCount = 0;

    /**
     * Spawn particles at controlled rate
     * Prevents spawn rate bugs by tracking spawn count
     */
    function spawnParticles() {
      // Only spawn if we haven't exceeded this frame's quota
      if (lastSpawnCount >= spawnRate) {
        lastSpawnCount = 0;
        return;
      }

      for (let i = 0; i < spawnRate - lastSpawnCount; i++) {
        particles.push({
          x: Math.random() * canvas.clientWidth,
          y: Math.random() * canvas.clientHeight,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 1,
        });
      }
      lastSpawnCount = spawnRate;
    }

    /**
     * Animation loop with RAF
     * Uses AnimationManager to ensure proper cleanup
     */
    function animate() {
      if (!isRunning) return;

      // Clear canvas
      ctx.fillStyle = 'transparent';
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      // Spawn particles at controlled rate
      spawnParticles();

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.01;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle with opacity based on life
        ctx.fillStyle = `rgba(255, 217, 122, ${p.life * 0.1})`;
        ctx.fillRect(p.x, p.y, 2, 2);
      }

      // Use managed RAF to ensure cleanup
      manager.addRaf(animate);
    }

    // Start animation loop
    manager.addRaf(animate);

    // Cleanup function
    return () => {
      isRunning = false;
      manager.cleanup();
      animManagerRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{
        zIndex: -1,
        pointerEvents: 'none',
        willChange: 'contents',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
      }}
    />
  );
}
