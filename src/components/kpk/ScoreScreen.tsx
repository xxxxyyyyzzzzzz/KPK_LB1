import { ScreenShell, AnimatedItem } from "./ScreenShell";
import { FACTIONS } from "@/lib/kpkData";
import { useKpk } from "@/lib/kpkStore";

export function ScoreScreen() {
  const { sessionPlayers, currency, history, playerId } = useKpk();

  return (
    <ScreenShell title="ЄБали">
      <div className="mx-auto max-w-4xl space-y-6">
        <AnimatedItem index={0} className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="hud-title text-2xl text-[color:var(--hud-amber)] border border-[color:var(--hud-amber)]/40 inline-block px-3 py-1">ЄБАЛИ</h2>
          <div className="hud-mono text-xs text-[color:var(--muted-foreground)]">
            Валюта: <span className="text-[color:var(--hud-amber)]">{currency}</span> ⛁
          </div>
        </AnimatedItem>

        <AnimatedItem index={1}>
          <section>
            <h3 className="hud-label mb-2">// Оперативники сесії · {sessionPlayers.length}</h3>
            <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] p-3">
              <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
              {sessionPlayers.length === 0 && (
                <div className="hud-mono text-xs text-[color:var(--muted-foreground)]">// Немає даних про гравців.</div>
              )}
              <div className="divide-y divide-[color:var(--hud-amber)]/15">
                {sessionPlayers.map((p, i) => {
                  const fc = FACTIONS[p.faction] ?? "#fff";
                  const isMe = p.id === playerId;
                  return (
                    <div
                      key={p.id}
                      style={{
                        opacity: 0,
                        animation: `hud-screen-in 0.4s cubic-bezier(0.2,0.8,0.2,1) ${0.2 + i * 0.1}s both`,
                      }}
                      className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3 ${isMe ? "bg-[color:var(--hud-amber)]/5 px-2 -mx-2" : ""}`}
                    >
                      <span className="hud-mono w-7 text-[color:var(--hud-amber)] text-sm tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="hud-title text-base truncate text-[color:var(--hud-green)]">
                            {p.nickname}{isMe ? " · ви" : ""}
                          </span>
                          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: fc, boxShadow: `0 0 6px ${fc}` }} />
                          <span className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)] truncate">{p.faction}</span>
                        </div>
                        <div className="hud-mono mt-0.5 text-[0.62rem] text-[color:var(--muted-foreground)]/70 tabular-nums tracking-wide">
                          I {p.level1} · II {p.level2} · III {p.level3} · ⛁ {p.currency}
                        </div>
                      </div>
                      <span className="hud-title text-3xl sm:text-4xl tabular-nums text-[color:var(--hud-amber-glow)]">
                        {p.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </AnimatedItem>

        <AnimatedItem index={2}>
          <section>
            <h3 className="hud-label mb-2">// Історія балів</h3>
            <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] p-3">
              <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
              {history.length === 0 && (
                <div className="hud-mono text-xs text-[color:var(--muted-foreground)]">// Поки що пусто. Виконуй місії.</div>
              )}
              {history.map((h, i) => (
                <div
                  key={i}
                  style={{
                    opacity: 0,
                    animation: `hud-screen-in 0.35s cubic-bezier(0.2,0.8,0.2,1) ${0.3 + i * 0.07}s both`,
                  }}
                  className="flex items-center justify-between border-b border-[color:var(--hud-amber)]/10 py-2 last:border-0"
                >
                  <div className="min-w-0">
                    <div className="hud-mono text-xs text-[color:var(--foreground)] truncate">{h.nickname}</div>
                    <div className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)] truncate">{h.reason}</div>
                  </div>
                  <span className="hud-mono text-sm tabular-nums text-[color:var(--hud-green)]">+{h.reward}</span>
                </div>
              ))}
            </div>
          </section>
        </AnimatedItem>
      </div>
    </ScreenShell>
  );
}
