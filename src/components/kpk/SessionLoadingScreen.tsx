import { useEffect, useState } from "react";
import { useKpk } from "@/lib/kpkStore";
import { sfx } from "@/lib/sounds";

const BOOT_LINES = [
  "// ІНІЦІАЛІЗАЦІЯ ТАКТИЧНОГО ТЕРМІНАЛУ...",
  "// ПІДКЛЮЧЕННЯ ДО ЗОНИ-7...",
  "// ЗАВАНТАЖЕННЯ ДАНИХ ГРАВЦІВ...",
  "// СКАНУВАННЯ ЗАГРОЗ...",
  "// ГЕНЕРАЦІЯ НОВИН ЗОНИ...",
  "// СЕСІЯ АКТИВОВАНА",
];

const BOOT_DURATION_MS = 2800; // загальний час анімації
const LINE_INTERVAL_MS = BOOT_DURATION_MS / BOOT_LINES.length;

export function SessionLoadingScreen() {
  const { go } = useKpk();
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    sfx.notify();

    // Послідовно показуємо рядки завантаження
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i + 1);
          if (i > 0) sfx.tick?.();
        }, LINE_INTERVAL_MS * i),
      );
    });

    // Після завершення — плавний перехід
    timers.push(
      setTimeout(() => {
        setDone(true);
      }, BOOT_DURATION_MS + 200),
    );

    timers.push(
      setTimeout(() => {
        go("news");
      }, BOOT_DURATION_MS + 800),
    );

    return () => timers.forEach(clearTimeout);
  }, [go]);

  return (
    <div
      className={`
        fixed inset-0 z-[300] flex flex-col items-center justify-center
        bg-[color:var(--surface-1)]
        transition-opacity duration-500
        ${done ? "opacity-0" : "opacity-100"}
      `}
      aria-live="polite"
      aria-label="Завантаження сесії"
    >
      {/* Сканбар поверх */}
      <div className="hud-scanbar pointer-events-none" />

      {/* Центральний блок */}
      <div className="w-full max-w-md px-6">
        {/* Логотип / заголовок */}
        <div className="mb-8 text-center">
          <div className="hud-label mb-1 text-[0.6rem] text-[color:var(--hud-cyan)] tracking-[0.3em]">
            // ТАКТИЧНИЙ ТЕРМІНАЛ
          </div>
          <div
            className="hud-title text-3xl text-[color:var(--hud-amber)] hud-flicker"
            style={{ letterSpacing: "0.15em" }}
          >
            СЕСІЯ СТАРТ
          </div>
        </div>

        {/* Прогрес-бар */}
        <div className="mb-6 h-1 w-full overflow-hidden bg-[color:var(--surface-3)] border border-[color:var(--hud-amber)]/20">
          <div
            className="h-full bg-[color:var(--hud-amber)] transition-all"
            style={{
              width: `${(visibleLines / BOOT_LINES.length) * 100}%`,
              transition: `width ${LINE_INTERVAL_MS}ms linear`,
              boxShadow: "0 0 8px var(--hud-amber)",
            }}
          />
        </div>

        {/* Boot-рядки */}
        <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] p-4 min-h-[160px]">
          <span className="corner tl" />
          <span className="corner tr" />
          <span className="corner bl" />
          <span className="corner br" />

          <div className="space-y-1.5">
            {BOOT_LINES.map((line, i) => (
              <div
                key={i}
                className="hud-mono text-xs"
                style={{
                  opacity: i < visibleLines ? 1 : 0,
                  transform: i < visibleLines ? "translateX(0)" : "translateX(-8px)",
                  transition: "opacity 0.25s ease, transform 0.25s ease",
                  color:
                    i === BOOT_LINES.length - 1
                      ? "var(--hud-green)"
                      : i < visibleLines - 1
                        ? "var(--muted-foreground)"
                        : "var(--hud-amber-glow)",
                }}
              >
                {i === visibleLines - 1 && i < BOOT_LINES.length - 1 ? (
                  <>
                    {line}
                    <span className="hud-blink ml-1">▋</span>
                  </>
                ) : (
                  <>
                    {line}
                    {i === BOOT_LINES.length - 1 && i < visibleLines && (
                      <span className="ml-2">✓</span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Нижній підпис */}
        <div className="mt-4 text-center hud-mono text-[0.6rem] text-[color:var(--muted-foreground)] tracking-widest">
          ПІДКЛЮЧЕННЯ ДО ЗОНИ · ЗВ'ЯЗОК ВСТАНОВЛЕНО
        </div>
      </div>
    </div>
  );
}
