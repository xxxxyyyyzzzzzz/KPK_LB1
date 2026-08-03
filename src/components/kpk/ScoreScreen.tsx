import { ScreenShell, AnimatedItem } from "./ScreenShell";
import { FACTIONS, UPGRADES, MISSION_CLASS_COLOR, UPGRADE_CATEGORY_COLOR } from "@/lib/kpkData";
import { formatPoints } from "@/lib/utils";
import { useKpk } from "@/lib/kpkStore";
import { useState } from "react";

export function ScoreScreen() {
  const { sessionPlayers, history, playerId, getMission } = useKpk();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <ScreenShell title="ЄБали">
      <div className="w-full space-y-6">
        <AnimatedItem index={0} className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="hud-title text-2xl text-[color:var(--hud-amber)] border border-[color:var(--hud-amber)]/40 inline-block px-3 py-1">ЄБАЛИ</h2>
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
                          I {formatPoints(p.level1)} · II {formatPoints(p.level2)} · III {formatPoints(p.level3)}
                        </div>
                      </div>
                      <span className="hud-title text-3xl sm:text-4xl tabular-nums text-[color:var(--hud-amber-glow)]">
                        {formatPoints(p.score)}
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
              {history.map((h, i) => {
                const expandable = h.type === "mission_complete" || h.type === "upgrade";
                const expanded = expandedIndex === i;
                const mission = h.type === "mission_complete" ? getMission(h.missionId ?? null) : null;
                const upgrade = h.type === "upgrade" && h.upgradeId ? UPGRADES[h.upgradeId] : undefined;
                return (
                  <div key={i} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!expandable) return;
                        setExpandedIndex((current) => (current === i ? null : i));
                      }}
                      style={{
                        opacity: 0,
                        animation: `hud-screen-in 0.35s cubic-bezier(0.2,0.8,0.2,1) ${0.3 + i * 0.07}s both`,
                      }}
                      className={`w-full text-left flex items-center justify-between border-b border-[color:var(--hud-amber)]/10 py-2 last:border-0 ${expandable ? "cursor-pointer hover:bg-[color:var(--hud-amber)]/5" : "cursor-default"}`}
                    >
                      <div className="min-w-0">
                        <div className="hud-mono text-xs text-[color:var(--foreground)] truncate">{h.nickname}</div>
                        <div className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)] truncate">{h.reason}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="hud-mono text-sm tabular-nums text-[color:var(--hud-green)]">+{formatPoints(h.reward as number)}</span>
                        {h.currency > 0 && (
                          <span className="hud-mono text-sm tabular-nums text-[color:var(--hud-cyan)]">+{h.currency} ⛁</span>
                        )}
                        {expandable && (
                          <span className="hud-mono text-xs text-[color:var(--muted-foreground)]">{expanded ? "▾" : "▸"}</span>
                        )}
                      </div>
                    </button>
                    {expanded && (
                      <div className="hud-panel-corners-4 border-t border-dashed border-[color:var(--hud-amber)]/20 bg-[color:var(--surface-1)] p-3 text-[0.75rem] hud-mono animate-[hud-screen-in_0.25s_ease-out]">
                        {h.type === "mission_complete" && mission ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)]">Клас:</span>
                              <span className="hud-mono text-[0.75rem] px-2 py-0.5 rounded-full" style={{ background: MISSION_CLASS_COLOR[mission.cls], color: mission.cls === "Розвиток" ? "#000" : "#fff" }}>{mission.cls}</span>
                            </div>
                            <div>Рівень {mission.level === 1 ? "I" : mission.level === 2 ? "II" : "III"}</div>
                            <div>Опис: {mission.description}</div>
                            <div>Виконано: {mission.target}/{mission.target}</div>
                            <div>Нагороди: +{mission.mainReward} балів · +{mission.levelReward} рівню · +{mission.currencyReward} ⛁</div>
                          </div>
                        ) : h.type === "upgrade" && upgrade ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)]">Категорія:</span>
                              <span className="hud-mono text-[0.75rem] px-2 py-0.5 rounded-full" style={{ background: UPGRADE_CATEGORY_COLOR[upgrade.category], color: "#000" }}>{upgrade.category}</span>
                            </div>
                            <div>Ярус {upgrade.tier}</div>
                            <div>Ефект: {upgrade.name}</div>
                            <div>Вартість: {upgrade.cost} ⛁</div>
                          </div>
                        ) : (
                          <div className="hud-mono text-[0.75rem] text-[color:var(--muted-foreground)]">Немає додаткових даних.</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </AnimatedItem>
      </div>
    </ScreenShell>
  );
}
