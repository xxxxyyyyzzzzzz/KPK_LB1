import { useState, useEffect, type ReactNode } from "react";
import { useKpk, fmtClock } from "@/lib/kpkStore";
import { sfx } from "@/lib/sounds";
import { FACTIONS } from "@/lib/kpkData";
import type { Screen } from "@/lib/kpkData";

export function AnimatedItem({ children, index = 0, className = "" }: { children: ReactNode; index?: number; className?: string }) {
  return (
    <div className={className} style={{ opacity: 0, animation: `hud-screen-in 0.45s cubic-bezier(0.2,0.8,0.2,1) ${index * 0.1 + 0.1}s both` }}>
      {children}
    </div>
  );
}

function HeaderTimer() {
  const { go, turnSeconds } = useKpk();
  const [blink, setBlink] = useState(false);
  const ending = turnSeconds <= 30;
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
      className={["hud-mono tabular-nums text-base sm:text-xl px-2 py-1 transition-all select-none shrink-0",
        ending ? "text-[color:var(--hud-red)] hud-pulse-red"
        : blink ? "text-[color:var(--hud-amber-glow)] scale-110 drop-shadow-[0_0_8px_var(--hud-amber-glow)]"
        : "text-[color:var(--hud-amber-glow)] hud-flicker"].join(" ")}
    >{fmtClock(turnSeconds)}</button>
  );
}

function BurgerMenu() {
  const { roomCode, players, playerId, isHost, logout } = useKpk();
  const [open, setOpen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  return (
    <>
      <button onClick={() => { sfx.click(); setOpen(true); }} aria-label="Меню сесії"
        className="shrink-0 flex flex-col gap-[5px] justify-center items-center w-10 h-10 border border-[color:var(--hud-amber)]/40 bg-[color:var(--surface-3)] hover:border-[color:var(--hud-amber)] transition-all">
        <span className="block h-[2px] w-5 bg-[color:var(--hud-amber)]" />
        <span className="block h-[2px] w-5 bg-[color:var(--hud-amber)]" />
        <span className="block h-[2px] w-5 bg-[color:var(--hud-amber)]" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 z-10 flex flex-col w-72 max-w-[85vw] bg-[color:var(--surface-1)] border-r-2 border-[color:var(--hud-amber)]/50"
            style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)", animation: "slide-in-left 0.22s cubic-bezier(0.2,0.8,0.2,1) both" }}>
            <div className="flex flex-col flex-1 p-5 gap-5 overflow-hidden">
              <div className="flex items-center justify-between border-b border-[color:var(--hud-amber)]/30 pb-3">
                <div className="hud-label text-[color:var(--hud-amber)] tracking-widest text-sm">// СЕСІЯ</div>
                <button onClick={() => setOpen(false)} className="hud-mono text-xl leading-none text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] w-8 h-8 flex items-center justify-center">✕</button>
              </div>
              {roomCode && (
                <div style={{ opacity: 0, animation: "hud-screen-in 0.35s cubic-bezier(0.2,0.8,0.2,1) 0.05s both" }}>
                  <div className="hud-label text-[0.6rem] text-[color:var(--hud-cyan)] mb-1">// КОД КІМНАТИ {isHost ? "· HOST" : ""}</div>
                  <div className="hud-title text-3xl tracking-[0.4em] text-[color:var(--hud-cyan)]">{roomCode}</div>
                </div>
              )}
              <div className="flex-1 overflow-y-auto hud-scroll">
                <div className="hud-label text-[0.6rem] mb-2">// ГРАВЦІ</div>
                <div className="flex flex-col gap-2">
                  {players.map((p, i) => (
                    <div key={p.id}
                      style={{ opacity: 0, animation: `hud-screen-in 0.35s cubic-bezier(0.2,0.8,0.2,1) ${0.1 + i * 0.07}s both` }}
                      className={`hud-mono text-[0.75rem] flex items-center gap-2 border px-3 py-2.5 ${p.id === playerId ? "border-[color:var(--hud-amber)] text-[color:var(--hud-amber)] bg-[color:var(--hud-amber)]/5" : "border-[color:var(--hud-amber)]/25 text-[color:var(--muted-foreground)]"}`}>
                      <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: FACTIONS[p.faction] ?? "#fff" }} />
                      {p.nickname}
                      {p.id === playerId && <span className="ml-auto text-[0.6rem] text-[color:var(--hud-green)]">● ВИ</span>}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => { sfx.click(); setOpen(false); setConfirmExit(true); }} className="hud-btn hud-btn-ghost w-full">↶ Вийти з сесії</button>
            </div>
          </div>
        </div>
      )}

      {confirmExit && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={() => setConfirmExit(false)}>
          <div className="hud-panel-corners-4 relative w-full max-w-sm border border-[color:var(--hud-amber)]/60 bg-[color:var(--surface-2)] p-5" onClick={(e) => e.stopPropagation()}>
            <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
            <div className="hud-title text-lg text-[color:var(--hud-amber)]">// ВИХІД?</div>
            <p className="hud-mono mt-2 text-sm text-[color:var(--foreground)]">Ви впевнені? Ваш обліковий запис залишиться в сесії і ви зможете повернутись.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => { sfx.back(); setConfirmExit(false); }} className="hud-btn hud-btn-ghost flex-1">Скасувати</button>
              <button onClick={() => { setConfirmExit(false); logout(); }} className="hud-btn hud-btn-danger flex-1">Вийти</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function HudHeader({ title }: { title: string }) {
  return (
    // Весь блок хедера — фон тягнеться під Dynamic Island через paddingTop
    <div style={{
      flexShrink: 0,
      backgroundColor: "var(--surface-2)",
      borderBottom: "1px solid rgba(245,184,64,0.3)",
      paddingTop: "env(safe-area-inset-top)",
      paddingLeft: "env(safe-area-inset-left)",
      paddingRight: "env(safe-area-inset-right)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", padding: "0.55rem 0.75rem" }}>
        <BurgerMenu />
        <div className="hud-title text-[color:var(--hud-amber)] text-xs sm:text-sm tracking-[0.3em] truncate flex-1 text-center">{title}</div>
        <HeaderTimer />
      </div>
    </div>
  );
}

const NAV_ITEMS: { id: Screen; label: string; icon: string }[] = [
  { id: "missions", label: "Місії",    icon: "▤" },
  { id: "upgrades", label: "Прокачки", icon: "❖" },
  { id: "news",     label: "Новини",   icon: "◈" },
  { id: "score",    label: "Єбали",    icon: "✦" },
];

export function BottomNav() {
  const { screen, go } = useKpk();
  return (
    // Нижнє меню — фон тягнеться під home indicator через paddingBottom
    <div style={{
      flexShrink: 0,
      display: "flex",
      backgroundColor: "var(--surface-2)",
      borderTop: "1px solid rgba(245,184,64,0.3)",
      paddingBottom: "env(safe-area-inset-bottom)",
      paddingLeft: "env(safe-area-inset-left)",
      paddingRight: "env(safe-area-inset-right)",
    }}>
      {NAV_ITEMS.map((item) => {
        const active = screen === item.id;
        return (
          <button key={item.id} onClick={() => { sfx.click(); go(item.id); }} aria-label={item.label}
            style={{ flex: 1, borderTop: active ? "2px solid var(--hud-amber)" : "2px solid transparent", marginTop: "-1px" }}
            className={["flex flex-col items-center justify-center gap-0.5 py-3 min-h-[52px] transition-all",
              active ? "text-[color:var(--hud-amber)] bg-[color:var(--hud-amber)]/5" : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"].join(" ")}>
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="hud-mono text-[0.58rem] tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ScreenShell({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden" }}>
      <HudHeader title={title} />
      {/* Скрол-зона — flex:1 + minHeight:0 щоб не вилазила за межі */}
      <div className="hud-scroll px-3 py-4 sm:px-6 sm:py-6"
        style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}>
        <div style={{ opacity: 0, animation: "hud-screen-in 0.45s cubic-bezier(0.2,0.8,0.2,1) 0.05s both" }}>
          {children}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export function StatChip({ label, value, color }: { label: string; value: ReactNode; color?: string }) {
  return (
    <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-3)]/70 px-3 py-1.5 hud-mono text-xs">
      <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
      <span className="hud-label mr-2 text-[0.6rem]" style={{ color }}>{label}</span>
      <span className="tabular-nums" style={{ color: color ?? "var(--foreground)" }}>{value}</span>
    </div>
  );
}
