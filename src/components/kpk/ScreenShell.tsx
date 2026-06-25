import { useState, useEffect, type ReactNode } from "react";
import { useKpk, fmtClock } from "@/lib/kpkStore";
import { sfx } from "@/lib/sounds";
import { FACTIONS } from "@/lib/kpkData";
import type { Screen } from "@/lib/kpkData";

/* ─── Таймер у хедері з анімацією ─── */
function HeaderTimer() {
  const { go, turnSeconds } = useKpk();
  const [blink, setBlink] = useState(false);
  const ending = turnSeconds <= 30;

  /* Кожну хвилину (коли секунди = 0) — підморгнути раз */
  useEffect(() => {
    if (turnSeconds > 0 && turnSeconds % 60 === 0) {
      setBlink(true);
      const t = setTimeout(() => setBlink(false), 600);
      return () => clearTimeout(t);
    }
  }, [turnSeconds]);

  return (
    <button
      onClick={() => { sfx.click(); go("timer"); }}
      aria-label="Перейти до таймера"
      className={[
        "hud-mono tabular-nums text-base sm:text-xl px-2 py-1 rounded transition-all select-none",
        ending
          ? "text-[color:var(--hud-red)] animate-[hud-pulse-red_0.6s_ease-in-out_infinite]"
          : blink
          ? "text-[color:var(--hud-amber-glow)] scale-110 drop-shadow-[0_0_8px_var(--hud-amber-glow)]"
          : "text-[color:var(--hud-amber-glow)] hud-flicker",
      ].join(" ")}
    >
      {fmtClock(turnSeconds)}
    </button>
  );
}

/* ─── Бургер-меню зліва ─── */
function BurgerMenu() {
  const { roomCode, players, playerId, isHost, logout } = useKpk();
  const [open, setOpen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  return (
    <>
      {/* Кнопка-бургер */}
      <button
        onClick={() => { sfx.click(); setOpen(true); }}
        aria-label="Меню сесії"
        className="hud-btn hud-btn-ghost !py-1.5 !px-2 flex flex-col gap-[4px] justify-center items-center w-9 h-9"
      >
        <span className={`block h-[2px] w-5 bg-[color:var(--hud-amber)] transition-all ${open ? "rotate-45 translate-y-[6px]" : ""}`} />
        <span className={`block h-[2px] w-5 bg-[color:var(--hud-amber)] transition-all ${open ? "opacity-0" : ""}`} />
        <span className={`block h-[2px] w-5 bg-[color:var(--hud-amber)] transition-all ${open ? "-rotate-45 -translate-y-[6px]" : ""}`} />
      </button>

      {/* Drawer */}
      {open && (
        <div
          className="fixed inset-0 z-[90] flex"
          onClick={() => setOpen(false)}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative z-10 flex flex-col w-72 max-w-[85vw] h-full bg-[color:var(--surface-2)] border-r border-[color:var(--hud-amber)]/40 p-5 gap-5 animate-[slide-in-left_0.22s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="flex items-center justify-between border-b border-[color:var(--hud-amber)]/30 pb-3">
              <div className="hud-title text-[color:var(--hud-amber)] tracking-widest text-sm">// СЕСІЯ</div>
              <button
                onClick={() => setOpen(false)}
                className="hud-mono text-lg text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                aria-label="Закрити меню"
              >✕</button>
            </div>

            {/* Код кімнати */}
            {roomCode && (
              <div>
                <div className="hud-label text-[0.6rem] text-[color:var(--hud-cyan)] mb-1">
                  // КОД КІМНАТИ {isHost ? "· HOST" : ""}
                </div>
                <div className="hud-title text-3xl tracking-[0.4em] text-[color:var(--hud-cyan)]">
                  {roomCode}
                </div>
              </div>
            )}

            {/* Список гравців */}
            <div className="flex-1">
              <div className="hud-label text-[0.6rem] mb-2">// ГРАВЦІ</div>
              <div className="flex flex-col gap-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className={`hud-mono text-[0.75rem] flex items-center gap-2 border px-3 py-2 ${
                      p.id === playerId
                        ? "border-[color:var(--hud-amber)] text-[color:var(--hud-amber)]"
                        : "border-[color:var(--hud-amber)]/25 text-[color:var(--muted-foreground)]"
                    }`}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0"
                      style={{ background: FACTIONS[p.faction] ?? "#fff" }}
                    />
                    {p.nickname}
                    {p.id === playerId && (
                      <span className="ml-auto text-[0.6rem] text-[color:var(--hud-green)]">● ВИ</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Кнопка виходу */}
            <button
              onClick={() => { sfx.click(); setOpen(false); setConfirmExit(true); }}
              className="hud-btn hud-btn-ghost w-full"
              aria-label="Вийти з сесії"
            >↶ Вийти з сесії</button>
          </div>
        </div>
      )}

      {/* Підтвердження виходу */}
      {confirmExit && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-confirm-title"
          onClick={() => setConfirmExit(false)}
        >
          <div
            className="hud-panel-corners-4 relative w-full max-w-sm border border-[color:var(--hud-amber)]/60 bg-[color:var(--surface-2)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
            <div id="exit-confirm-title" className="hud-title text-lg text-[color:var(--hud-amber)]">// ВИХІД?</div>
            <p className="hud-mono mt-2 text-sm text-[color:var(--foreground)]">
              Ви впевнені? Ваш обліковий запис залишиться в сесії і ви зможете повернутись.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => { sfx.back(); setConfirmExit(false); }}
                className="hud-btn hud-btn-ghost flex-1"
              >Скасувати</button>
              <button
                onClick={() => { setConfirmExit(false); logout(); }}
                className="hud-btn hud-btn-danger flex-1"
              >Вийти</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Хедер (єдиний для всього застосунку) ─── */
export function HudHeader({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between border-b border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)]/80 px-3 py-2 sm:px-5 sm:py-3 backdrop-blur-sm shrink-0">
      <BurgerMenu />
      <div className="hud-title text-[color:var(--hud-amber)] text-xs sm:text-sm tracking-[0.3em] truncate px-2">
        {title}
      </div>
      <HeaderTimer />
    </header>
  );
}

/* ─── Нижня навігація ─── */
const NAV_ITEMS: { id: Screen; label: string; icon: string }[] = [
  { id: "missions",  label: "Місії",    icon: "▤" },
  { id: "upgrades",  label: "Прокачки", icon: "❖" },
  { id: "news",      label: "Новини",   icon: "◈" },
  { id: "score",     label: "Єбали",    icon: "✦" },
];

export function BottomNav() {
  const { currentScreen, go } = useKpk();
  return (
    <nav className="flex shrink-0 border-t border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)]/90 backdrop-blur-sm safe-pb">
      {NAV_ITEMS.map((item) => {
        const active = currentScreen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => { sfx.click(); go(item.id); }}
            aria-label={item.label}
            className={[
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 transition-all",
              active
                ? "text-[color:var(--hud-amber)] border-t-2 border-[color:var(--hud-amber)] -mt-px"
                : "text-[color:var(--muted-foreground)] border-t-2 border-transparent -mt-px hover:text-[color:var(--foreground)]",
            ].join(" ")}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="hud-mono text-[0.6rem] tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ─── ScreenShell — обгортка для всіх екранів ─── */
export function ScreenShell({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="hud-screen-enter flex h-full w-full flex-col">
      <HudHeader title={title} />
      <div className="hud-scroll flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

export function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: ReactNode;
  color?: string;
}) {
  return (
    <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-3)]/70 px-3 py-1.5 hud-mono text-xs">
      <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
      <span className="hud-label mr-2 text-[0.6rem]" style={{ color }}>{label}</span>
      <span className="tabular-nums" style={{ color: color ?? "var(--foreground)" }}>{value}</span>
    </div>
  );
}
