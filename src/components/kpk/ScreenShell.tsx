import { useState, useEffect, useRef, type ReactNode } from "react";
import { useKpk, fmtClock, fmtSession } from "@/lib/kpkStore";
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
      className={[
        "hud-mono tabular-nums text-base sm:text-xl px-2 py-1 transition-all select-none shrink-0",
        ending
          ? "text-[color:var(--hud-red)] hud-pulse-red"
          : blink
          ? "text-[color:var(--hud-amber-glow)] scale-110"
          : "text-[color:var(--hud-amber-glow)] hud-flicker",
      ].join(" ")}
    >
      {fmtClock(turnSeconds)}
    </button>
  );
}

export function HudStatus() {
  const { sessionSeconds } = useKpk();
  return (
    <div
      className="pointer-events-none hud-status-strip fixed inset-x-0 top-0 z-50 flex items-center justify-between hud-mono text-[0.65rem] uppercase tracking-[0.35em] text-[color:var(--hud-amber)]/70 bg-[color:var(--surface-2)] border-b border-[color:var(--hud-amber)]/20"
      style={{
        boxSizing: "border-box",
        height: STATUS_BAR_HEIGHT,
        minHeight: STATUS_BAR_HEIGHT,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "0.1rem",
        paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
        paddingRight: "max(0.75rem, env(safe-area-inset-right))",
      }}
    >
      <span>● REC · ZONE-7</span>
      <span className="hud-blink">SIGNAL OK</span>
      <span className="tabular-nums">{fmtSession(sessionSeconds)}</span>
    </div>
  );
}

function BurgerMenu() {
  const { roomCode, players, playerId, isHost, logout } = useKpk();
  const [open, setOpen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  return (
    <>
      <button
        onClick={() => { sfx.click(); setOpen(true); }}
        aria-label="Меню сесії"
        className="shrink-0 flex flex-col gap-[5px] justify-center items-center w-10 h-10 border border-[color:var(--hud-amber)]/40 bg-[color:var(--surface-3)] hover:border-[color:var(--hud-amber)] transition-all"
      >
        <span className="block h-[2px] w-5 bg-[color:var(--hud-amber)]" />
        <span className="block h-[2px] w-5 bg-[color:var(--hud-amber)]" />
        <span className="block h-[2px] w-5 bg-[color:var(--hud-amber)]" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-0 bottom-0 z-10 flex flex-col w-72 max-w-[85vw] bg-[color:var(--surface-1)] border-r-2 border-[color:var(--hud-amber)]/50"
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
              animation: "slide-in-left 0.22s cubic-bezier(0.2,0.8,0.2,1) both",
            }}
          >
            <div className="flex flex-col flex-1 p-5 gap-5 overflow-hidden">
              <div className="flex items-center justify-between border-b border-[color:var(--hud-amber)]/30 pb-3">
                <div className="hud-label text-[color:var(--hud-amber)] tracking-widest text-sm">// СЕСІЯ</div>
                <button
                  onClick={() => setOpen(false)}
                  className="hud-mono text-xl leading-none text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] w-8 h-8 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {roomCode && (
                <div style={{ opacity: 0, animation: "hud-screen-in 0.35s cubic-bezier(0.2,0.8,0.2,1) 0.05s both" }}>
                  <div className="hud-label text-[0.6rem] text-[color:var(--hud-cyan)] mb-1">
                    // КОД КІМНАТИ {isHost ? "· HOST" : ""}
                  </div>
                  <div className="hud-title text-3xl tracking-[0.4em] text-[color:var(--hud-cyan)]">{roomCode}</div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto hud-scroll">
                <div className="hud-label text-[0.6rem] mb-2">// ГРАВЦІ</div>
                <div className="flex flex-col gap-2">
                  {players.map((p, i) => (
                    <div
                      key={p.id}
                      style={{ opacity: 0, animation: `hud-screen-in 0.35s cubic-bezier(0.2,0.8,0.2,1) ${0.1 + i * 0.07}s both` }}
                      className={`hud-mono text-[0.75rem] flex items-center gap-2 border px-3 py-2.5 ${
                        p.id === playerId
                          ? "border-[color:var(--hud-amber)] text-[color:var(--hud-amber)] bg-[color:var(--hud-amber)]/5"
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

              <button
                onClick={() => { sfx.click(); setOpen(false); setConfirmExit(true); }}
                className="hud-btn hud-btn-ghost w-full"
              >
                ↶ Вийти з сесії
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmExit && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={() => setConfirmExit(false)}>
          <div
            className="hud-panel-corners-4 relative w-full max-w-sm border border-[color:var(--hud-amber)]/60 bg-[color:var(--surface-2)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />
            <div className="hud-title text-lg text-[color:var(--hud-amber)]">// ВИХІД?</div>
            <p className="hud-mono mt-2 text-sm text-[color:var(--foreground)]">
              Ви впевнені? Ваш обліковий запис залишиться в сесії і ви зможете повернутись.
            </p>
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

const HEADER_CONTENT_H = 52; // висота контенту хедера в px
const STATUS_BAR_INNER_HEIGHT = "1.5rem";
const STATUS_BAR_HEIGHT = `calc(env(safe-area-inset-top) + ${STATUS_BAR_INNER_HEIGHT})`;
const HEADER_OFFSET = STATUS_BAR_HEIGHT;
const HEADER_TOTAL_HEIGHT = `calc(${HEADER_OFFSET} + 0.5rem + ${HEADER_CONTENT_H}px)`;

export function HudHeader({ title, showStickyTitle }: { title: string; showStickyTitle: boolean }) {
  return (
    <header
      className="fixed inset-x-0 z-40 border-b border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)]"
      style={{
        top: HEADER_OFFSET,
        paddingTop: "0.5rem",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="flex items-center justify-between gap-2 px-3" style={{ minHeight: `${HEADER_CONTENT_H}px` }}>
        <BurgerMenu />
        <div className="flex-1 flex justify-center">
          <div
            className={[
              "hud-title border border-[color:var(--hud-amber)]/40 px-3 py-1 text-[color:var(--hud-amber)] transition-all duration-200",
              showStickyTitle
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1 pointer-events-none",
            ].join(" ")}
          >
            {title}
          </div>
        </div>
        <HeaderTimer />
      </div>
    </header>
  );
}

const NAV_ITEMS: { id: Screen; label: string; icon: string }[] = [
  { id: "missions", label: "Місії", icon: "▤" },
  { id: "upgrades", label: "Прокачки", icon: "❖" },
  { id: "news", label: "Новини", icon: "◈" },
  { id: "score", label: "Єбали", icon: "✦" },
];

export function BottomNav() {
  const { screen, go } = useKpk();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex flex-row flex-nowrap items-stretch justify-between border-t border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] overflow-x-auto"
      style={{
        paddingTop: "0.2rem",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 0.35rem)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = screen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => { sfx.click(); go(item.id); }}
            aria-label={item.label}
            style={{
              flex: "1 1 0%",
              minWidth: "0",
              maxWidth: "25%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2px",
              padding: "8px 0",
              minHeight: "52px",
              borderTop: active ? "2px solid var(--hud-amber)" : "2px solid transparent",
              marginTop: "-1px",
              background: active ? "rgba(245,184,64,0.05)" : "transparent",
              color: active ? "var(--hud-amber)" : "var(--muted-foreground)",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
              boxSizing: "border-box",
            }}
          >
            <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{item.icon}</span>
            <span className="hud-mono" style={{ fontSize: "0.58rem", letterSpacing: "0.08em" }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function ScreenShell({ children, title }: { children: ReactNode; title: string }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const titleSentinelRef = useRef<HTMLDivElement | null>(null);
  const [titleVisible, setTitleVisible] = useState(true);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const sentinel = titleSentinelRef.current;
    if (!scrollEl || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setTitleVisible(entry.isIntersecting);
      },
      {
        root: scrollEl,
        rootMargin: `-${HEADER_TOTAL_HEIGHT} 0px 0px 0px`,
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <HudHeader title={title} showStickyTitle={!titleVisible} />

      <div
        ref={scrollRef}
        className="hud-scroll"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          paddingTop: HEADER_TOTAL_HEIGHT,
          paddingBottom: `calc(env(safe-area-inset-bottom) + 52px)`,
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
          zIndex: 10,
        }}
      >
        <div ref={titleSentinelRef} className="h-px" />
        <div className="px-3 py-4 sm:px-6 sm:py-6" style={{ opacity: 0, animation: "hud-screen-in 0.45s cubic-bezier(0.2,0.8,0.2,1) 0.05s both" }}>
          {children}
        </div>
      </div>

      <BottomNav />
    </>
  );
}

export function StatChip({ label, value, color }: { label: string; value: ReactNode; color?: string }) {
  return (
    <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-3)]/70 px-3 py-1.5 hud-mono text-xs">
      <span className="corner tl" />
      <span className="corner tr" />
      <span className="corner bl" />
      <span className="corner br" />
      <span className="hud-label mr-2 text-[0.6rem]" style={{ color }}>{label}</span>
      <span className="tabular-nums" style={{ color: color ?? "var(--foreground)" }}>{value}</span>
    </div>
  );
}
