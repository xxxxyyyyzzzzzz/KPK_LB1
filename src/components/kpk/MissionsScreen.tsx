import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ScreenShell, AnimatedItem } from "./ScreenShell";
import { MISSION_CLASS_COLOR, MISSION_CLASSES, LEVEL_COLOR, CLASS_DESCRIPTIONS } from "@/lib/kpkData";
import { useKpk, fmtClock } from "@/lib/kpkStore";
import { formatPoints } from "@/lib/utils";
import { sfx } from "@/lib/sounds";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { CurrencyPayoutModal } from "./CurrencyPayoutModal";

export function MissionsScreen() {
  const {
    user,
    totalScore,
    level1,
    level2,
    level3,
    slots,
    completedIds,
    getMission,
    global_replacements_left,
    unlockedClasses,
    updateSlotProgress,
    completeSlot,
    startReplaceConfirm,
    startBrowseClass,
    selectBrowseClass,
    startBrowseSameClass,
    backToClassBrowse,
    cancelBrowse,
    confirmMissionSelection,
    turnSeconds,
    turnRunning,
    toggleTurn,
    isMyTurn,
  } = useKpk();
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [lastCompletedReward, setLastCompletedReward] = useState(0);
  const [activeTier, setActiveTier] = useState<1 | 2 | 3>(1);
  const autoFocusedRef = useRef(false);
  useEffect(() => {
    if (autoFocusedRef.current || slots.length === 0) return;
    autoFocusedRef.current = true;
    const emptyByTier: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
    slots.forEach((s) => {
      const t = ((s.slot_index % 3) + 1) as 1 | 2 | 3;
      if (s.mission_id == null) emptyByTier[t] += 1;
    });
    const firstEmpty = ([1, 2, 3] as const).find((t) => emptyByTier[t] > 0);
    if (firstEmpty) setActiveTier(firstEmpty);
  }, [slots]);

  const handleCompleteSlot = async (slotIndex: number, reward: number) => {
    const result = await completeSlot(slotIndex);
    if (result?.ok) {
      setLastCompletedReward(reward);
      setPayoutOpen(true);
    }
  };

  return (
    <ScreenShell title="Місії">
      <div className="mx-auto max-w-5xl">
        <AnimatedItem index={0} className="mb-4">
          <h2 className="hud-title text-xl text-[color:var(--hud-amber)] border border-[color:var(--hud-amber)]/40 px-3 py-1 inline-block">
            МІСІЇ
          </h2>
        </AnimatedItem>

        <AnimatedItem index={1} className="mb-5">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="hud-mono" style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--muted-foreground)", textTransform: "uppercase" }}>
              Місії → бали → рейтинг → перемога
            </span>
            <div className="hud-mono" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "var(--hud-amber)", letterSpacing: "0.12em" }}>
              <span style={{ fontSize: "1rem" }}>🔄</span>
              <span>{global_replacements_left}</span>
              <span style={{ fontSize: "0.55rem", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                замін
              </span>
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem index={2} className="mb-5">
          <div className="hud-panel-corners-4 relative block w-full overflow-hidden border border-[color:var(--hud-amber)]/30" style={{ padding: 0, marginBottom: 16 }}>
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />
            <MissionClassProgress
              unlockedClasses={unlockedClasses}
              slots={slots}
              completedIds={completedIds}
              getMission={getMission}
            />
          </div>
        </AnimatedItem>

        {/* Вкладки рівнів */}
        <MissionTierTabs slots={slots} activeTier={activeTier} onSelectTier={setActiveTier} unlockedClasses={unlockedClasses} />

        {/* Блок обраного рівня */}
        <AnimatedItem index={3} className="mb-6">
          <div
            className="overflow-hidden border border-[color:var(--hud-amber)]/20 border-l-4 bg-[color:var(--surface-3)]/80 shadow-[0_1px_0_0_rgba(245,184,64,0.08)]"
            style={{
              borderLeftColor:
                activeTier === 1 ? "var(--mission-defense)" : activeTier === 2 ? "var(--mission-loot)" : "var(--mission-economy)",
            }}
          >
            <div className="border-b border-[color:var(--hud-amber)]/15 bg-[color:var(--surface-2)]/70 px-4 py-3">
              <span className="hud-label text-[color:var(--hud-amber)]">
                Рівень {activeTier === 1 ? "I" : activeTier === 2 ? "II" : "III"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 p-4">
              {slots
                .filter((s) => (s.slot_index % 3) + 1 === activeTier)
                .map((s, cardIdx) => {
                  const m = getMission(s.mission_id);
                  return (
                    <div
                      key={s.slot_index}
                      style={{ opacity: 0, animation: `hud-screen-in 0.4s cubic-bezier(0.2,0.8,0.2,1) ${cardIdx * 0.1 + 0.2}s both` }}
                    >
                      <SlotCard
                        slot={s}
                        mission={m}
                        tier={activeTier}
                        unlockedClassesForTier={unlockedClasses[String(activeTier) as "1" | "2" | "3"] ?? []}
                        onStartBrowseClass={() => startBrowseClass(s.slot_index)}
                        onSelectBrowseClass={(cls) => selectBrowseClass(s.slot_index, cls)}
                        onStartBrowseSameClass={() => startBrowseSameClass(s.slot_index)}
                        onStartReplaceConfirm={() => startReplaceConfirm(s.slot_index)}
                        onBackToClassBrowse={() => backToClassBrowse(s.slot_index)}
                        onCancelBrowse={() => cancelBrowse(s.slot_index)}
                        onConfirmMissionSelection={(missionId) => confirmMissionSelection(s.slot_index, missionId)}
                        onUpdateProgress={(delta) => updateSlotProgress(s.slot_index, delta)}
                        onComplete={() => handleCompleteSlot(s.slot_index, m?.currencyReward ?? 0)}
                        canReplace={global_replacements_left > 0}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        </AnimatedItem>
      </div>
      <CurrencyPayoutModal
        open={payoutOpen}
        amount={lastCompletedReward}
        onConfirm={() => setPayoutOpen(false)}
        onCancel={() => setPayoutOpen(false)}
        onClose={() => setPayoutOpen(false)}
      />
    </ScreenShell>
  );
}

function MissionTierTabs({
  slots,
  activeTier,
  onSelectTier,
  unlockedClasses,
}: {
  slots: import("@/lib/sessionSchema").PlayerSlot[];
  activeTier: 1 | 2 | 3;
  onSelectTier: (tier: 1 | 2 | 3) => void;
  unlockedClasses: { "1": string[]; "2": string[]; "3": string[] };
}) {
  const counts: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
  slots.forEach((s) => {
    const t = ((s.slot_index % 3) + 1) as 1 | 2 | 3;
    if (s.mission_id == null) counts[t] += 1;
  });
  const labels: Record<1 | 2 | 3, string> = { 1: "I", 2: "II", 3: "III" };
  return (
    <div className="mb-4 flex gap-2">
      {([1, 2, 3] as const).map((tier) => {
        const isActive = tier === activeTier;
        const isTierUnlocked = (unlockedClasses[String(tier) as "1" | "2" | "3"]?.length ?? 0) > 0;
        return (
          <button
            key={tier}
            type="button"
            onClick={() => { onSelectTier(tier); sfx.click(); }}
            className={`hud-btn flex-1 !py-2 !text-sm ${isActive ? "" : "hud-btn-ghost"}`}
            style={{
              position: "relative",
              minHeight: 60,
              display: "block",
              padding: "10px 0 0",
              textAlign: "center",
            }}
          >
            <span style={{ display: "inline-block", marginBottom: 10, lineHeight: 1.2 }}>
              Рівень {labels[tier]}
            </span>
            {isTierUnlocked && counts[tier] > 0 && (
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  textAlign: "center",
                  fontSize: "0.55rem",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  background: "rgba(230,105,105,0.2)",
                  borderTop: "1px solid rgba(230,105,105,0.4)",
                  borderLeft: "1px solid rgba(230,105,105,0.4)",
                  borderRight: "1px solid rgba(230,105,105,0.4)",
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  boxSizing: "border-box",
                  color: "#E66969",
                  padding: "2px 10px",
                  whiteSpace: "nowrap",
                }}
              >
                {counts[tier]} вільн.
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function getClassTierState(
  cls: (typeof MISSION_CLASSES)[number],
  tier: 1 | 2 | 3,
  unlockedClasses: { "1": string[]; "2": string[]; "3": string[] },
  slots: import("@/lib/sessionSchema").PlayerSlot[],
  completedIds: number[],
  getMission: (id: number | null) => { cls: string } | null,
): { locked: boolean; activeCount: number } {
  const unlockedForTier = unlockedClasses[String(tier) as "1" | "2" | "3"] ?? [];
  if (!unlockedForTier.includes(cls)) return { locked: true, activeCount: 0 };
  const activeCount = slots.filter((s) => {
    if ((s.slot_index % 3) + 1 !== tier) return false;
    if (s.mission_id == null || completedIds.includes(s.mission_id)) return false;
    return getMission(s.mission_id)?.cls === cls;
  }).length;
  return { locked: false, activeCount };
}

function tierPositions(
  nx: number,
  rowY: number,
  count: 1 | 2,
  forkOffset: number,
  staggerX: number,
): { x: number; y: number }[] {
  if (count === 2) {
    return [
      { x: nx, y: rowY - forkOffset },
      { x: nx + staggerX, y: rowY + forkOffset },
    ];
  }
  return [{ x: nx, y: rowY }];
}

function connectPairs<T>(src: T[], tgt: T[]): [T, T][] {
  if (src.length === 1 && tgt.length === 1) return [[src[0], tgt[0]]];
  if (src.length === 1) return tgt.map((t) => [src[0], t] as [T, T]);
  if (tgt.length === 1) return src.map((s) => [s, tgt[0]] as [T, T]);
  return src.map((s, i) => [s, tgt[i]] as [T, T]);
}

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
}

function MissionClassProgress({
  unlockedClasses,
  slots,
  completedIds,
  getMission,
}: {
  unlockedClasses: { "1": string[]; "2": string[]; "3": string[] };
  slots: import("@/lib/sessionSchema").PlayerSlot[];
  completedIds: number[];
  getMission: (id: number | null) => { cls: string } | null;
}) {
  const { user } = useKpk();
  const nickname = user?.nickname ?? "—";
  const rowH = 30;
  const topPad = 22;
  const originX = 14;
  const nodeXs = [70, 165, 260];
  const staggerX = 16;
  const forkOffset = 11;
  const NODE_R = 7;
  const LOCK_R = 6;
  const width = 290;
  const height = topPad * 2 + (MISSION_CLASSES.length - 1) * rowH;
  const originY = height / 2;

  const rows = MISSION_CLASSES.map((cls, rowIdx) => {
    const rowY = topPad + rowIdx * rowH;
    const color = MISSION_CLASS_COLOR[cls];
    const states = ([1, 2, 3] as const).map((tier) =>
      getClassTierState(cls, tier, unlockedClasses, slots, completedIds, getMission),
    );
    const stopCounts = states.map((st) => (!st.locked && st.activeCount >= 2 ? 2 : 1)) as (1 | 2)[];
    const stopPositions = [
      [{ x: originX, y: originY }],
      ...stopCounts.map((count, i) => tierPositions(nodeXs[i], rowY, count, forkOffset, staggerX)),
    ];
    return { cls, rowY, color, states, stopPositions };
  });

  return (
    <div
      style={{
        background: "#0d0f13",
        border: "none",
        borderRadius: 4,
        padding: 0,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Share Tech Mono', 'Courier New', monospace",
        display: "inline-block",
      }}
    >
      <style>{`
        @keyframes kpkCrtScroll {
          from { background-position: 0 0; }
          to { background-position: 0 90px; }
        }

        @keyframes kpkCrtFlick {
          0%, 89%, 91%, 95%, 97%, 100% { opacity: 1; }
          90% { opacity: .92; }
          96% { opacity: .96; }
        }
      `}</style>

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10,
          background:
            "repeating-linear-gradient(0deg, rgba(245,184,64,0) 0px, rgba(245,184,64,0) 2px, rgba(245,184,64,0.06) 2px, rgba(245,184,64,0.06) 3px)",
          animation: "kpkCrtScroll 10s linear infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 9,
          animation: "kpkCrtFlick 7s ease-in-out infinite",
        }}
      />

      <div style={{ position: "relative", zIndex: 11, padding: "10px 12px" }}>
        <div style={{ fontSize: 10, color: "#4a4020", letterSpacing: ".06em", marginBottom: 9 }}>
          <span style={{ color: "#4a4020" }}>root@kpk:~$ </span>
          <span style={{ color: "#f5b840" }}>статус_місій</span>
          <span style={{ color: "#a07830" }}> --гравець {nickname}</span>
        </div>

        {(["Атака", "Захист", "Розвиток"] as const).map((cls, rowIdx) => {
          const rowColor = cls === "Атака" ? "#c45555" : cls === "Захист" ? "#4a7aaa" : "#4a8a4e";
          const activeColor = cls === "Атака" ? "#E66969" : cls === "Захист" ? "#66ADFF" : "#A9FFAF";
          const states = ([1, 2, 3] as const).map((tier) =>
            getClassTierState(cls, tier, unlockedClasses, slots, completedIds, getMission),
          );

          return (
            <div
              key={cls}
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                marginBottom: rowIdx === 2 ? 0 : 7,
              }}
            >
              <div
                style={{
                  width: 62,
                  fontSize: 11,
                  letterSpacing: ".06em",
                  color: rowColor,
                  textTransform: "uppercase",
                }}
              >
                {cls}
              </div>

              {states.map((st, tierIdx) => {
                const activeCount = Math.min(2, st.activeCount);
                const symbols = st.locked
                  ? ["-", "-"]
                  : [activeCount >= 1 ? "■" : "▢", activeCount >= 2 ? "■" : "▢"];

                return (
                  <div key={tierIdx} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                    <span style={{ color: "#2a2e38", fontSize: 11 }}>[</span>
                    <span style={{ display: "inline-flex", gap: 2 }}>
                      {symbols.map((symbol, symbolIdx) => (
                        <span
                          key={symbolIdx}
                          style={{
                            fontSize: 11,
                            color: st.locked
                              ? "#1e2028"
                              : symbol === "■"
                              ? activeColor
                              : activeColor,
                            opacity: st.locked || symbol === "■" ? 1 : 0.7,
                            textShadow:
                              st.locked || symbol === "■"
                                ? undefined
                                : `${activeColor} 0 0 6px`,
                          }}
                        >
                          {symbol}
                        </span>
                      ))}
                    </span>
                    <span style={{ color: "#2a2e38", fontSize: 11 }}>]</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type SlotCardProps = {
  slot: import("@/lib/sessionSchema").PlayerSlot;
  mission: ReturnType<typeof import("@/lib/kpkStore").useKpk> extends never ? never : any;
  tier: 1 | 2 | 3;
  unlockedClassesForTier: string[];
  onStartBrowseClass: () => void;
  onSelectBrowseClass: (cls: string) => void;
  onStartBrowseSameClass: () => void;
  onStartReplaceConfirm: () => void;
  onBackToClassBrowse: () => void;
  onCancelBrowse: () => void;
  onConfirmMissionSelection: (missionId: number) => void;
  onUpdateProgress: (delta: number) => void;
  onComplete: () => void;
  canReplace: boolean;
};

function SlotCard({
  slot,
  mission: m,
  tier,
  unlockedClassesForTier,
  onStartBrowseClass,
  onSelectBrowseClass,
  onStartBrowseSameClass,
  onStartReplaceConfirm,
  onBackToClassBrowse,
  onCancelBrowse,
  onConfirmMissionSelection,
  onUpdateProgress,
  onComplete,
  canReplace,
}: SlotCardProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [originOffset, setOriginOffset] = useState<{ x: number; y: number } | null>(null);
  const { allMissions, completedIds, slots: allSlots } = useKpk();

  useEffect(() => {
    if (!slot.browse_stage) setOriginOffset(null);
  }, [slot.browse_stage]);

  const captureOrigin = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      setOriginOffset({
        x: rect.left + rect.width / 2 - window.innerWidth / 2,
        y: rect.top + rect.height / 2 - window.innerHeight / 2,
      });
    }
  };

  const taken = new Set<number>([...(completedIds ?? []), ...allSlots.map((s) => s.mission_id ?? -1)]);
  const availableByClass: Record<string, boolean> = {};
  for (const cls of MISSION_CLASSES) {
    const pool = allMissions.filter((mm) => mm.level === tier && mm.cls === cls && !taken.has(mm.id));
    availableByClass[cls] = pool.length > 0;
  }
  const hasAnyAvailable = Object.values(availableByClass).some((v) => v === true);
  const availablePool = allMissions.filter(
    (mm) => mm.level === tier && !taken.has(mm.id) && unlockedClassesForTier.includes(mm.cls),
  );
  const rewardRange = availablePool.length > 0
    ? { min: Math.min(...availablePool.map((mm) => mm.mainReward)), max: Math.max(...availablePool.map((mm) => mm.mainReward)) }
    : null;
  const candidateIds = slot.browse_class ? slot.candidates_by_class?.[slot.browse_class] ?? null : null;

  return (
    <div ref={rootRef} className="relative">
      {m ? (() => {
        const color = MISSION_CLASS_COLOR[m.cls as keyof typeof MISSION_CLASS_COLOR];
        const pct = Math.min(100, (slot.current_progress / m.target) * 100);
        const done = slot.current_progress >= m.target;
        return (
          <div
            className={`hud-panel-corners-4 relative flex flex-col gap-2 border border-l-4 bg-[color:var(--surface-2)] p-3 transition-all ${
              done ? "mission-active-glow" : "border-[color:var(--hud-amber)]/25"
            }`}
            style={{ borderLeftColor: LEVEL_COLOR[m.level as 1 | 2 | 3] }}
          >
            <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-3)] px-2 py-0.5 hud-mono text-[0.62rem] uppercase tracking-[0.2em]" style={{ color }}>
                    {m.cls}
                  </span>
                  <span className="hud-mono text-[0.6rem] uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                    L{m.level}
                  </span>
                </div>
                <span className="text-sm font-medium leading-tight">{m.name}</span>
              </div>
              <button
                disabled={!canReplace}
                onClick={() => { captureOrigin(); onStartReplaceConfirm(); }}
                title={canReplace ? "Замінити місію" : "Немає замін"}
                className="grid h-6 w-6 shrink-0 place-items-center border border-[color:var(--hud-amber)]/40 text-[color:var(--hud-amber)] hover:bg-[color:var(--hud-amber)]/10 disabled:opacity-30"
              >⟲</button>
            </div>
            <div className="hud-mono text-[0.65rem] leading-snug text-[color:var(--muted-foreground)]">{m.description}</div>
            <div className="flex items-center justify-between gap-2">
              <span className="hud-mono text-[0.6rem] uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">Прогрес</span>
              <span className="hud-mono text-xs tabular-nums text-[color:var(--foreground)]">{slot.current_progress}/{m.target}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--surface-3)]">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
            </div>
            <div className="flex gap-2 pt-1">
              <button className="hud-btn hud-btn-ghost flex-1 !py-1 !text-[0.65rem]" onClick={() => onUpdateProgress(-1)}>−</button>
              <button className="hud-btn hud-btn-ghost flex-1 !py-1 !text-[0.65rem]" onClick={() => onUpdateProgress(+1)}>+</button>
            </div>
            <button className={`hud-btn w-full !py-1 !text-[0.65rem] ${done ? "bg-[color:var(--hud-green)]/15 text-[color:var(--hud-green)]" : ""}`} disabled={!done} onClick={onComplete}>✓ Виплатити</button>
            <div className="border-t border-dashed border-[color:var(--hud-amber)]/20 pt-1 hud-mono text-[0.65rem] text-[color:var(--muted-foreground)]">
              Нагорода: +{formatPoints(m.mainReward)} · +{formatPoints(m.levelReward)} · +{m.currencyReward} ⛁
            </div>
          </div>
        );
      })() : (
        <div
          className="hud-panel-corners-4 relative border border-dashed border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)]/30 p-3 text-center"
          style={hasAnyAvailable ? { animation: "hud-pulse 2.4s ease-in-out infinite" } : undefined}
        >
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          <div className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)] mb-2">
            {rewardRange ? `+${formatPoints(rewardRange.min)}–${formatPoints(rewardRange.max)} балів` : "+4–27 балів"}
          </div>
          <button
            onClick={() => { captureOrigin(); onStartBrowseClass(); }}
            className="w-full py-2 text-sm"
            style={{
              background: "transparent",
              border: "1px dashed rgba(245,184,64,0.35)",
              color: "var(--hud-amber)",
            }}
            disabled={!hasAnyAvailable}
            title={!hasAnyAvailable ? "Немає доступних місій" : undefined}
          >Вільний слот · Вибрати місію</button>
        </div>
      )}

      {slot.browse_stage === "confirm" && (
        <ReplaceConfirmDialog
          originOffset={originOffset}
          onFullReplace={() => onStartBrowseClass()}
          onClassReplace={() => onStartBrowseSameClass()}
          onCancel={() => onCancelBrowse()}
        />
      )}
      {slot.browse_stage === "class" && (
        <ClassSelectionModal
          tier={tier}
          unlockedClasses={unlockedClassesForTier}
          availableByClass={availableByClass}
          randomAvailable={hasAnyAvailable}
          originOffset={originOffset}
          onSelect={(cls) => onSelectBrowseClass(cls)}
          onCancel={() => onCancelBrowse()}
        />
      )}
      {slot.browse_stage === "mission" && candidateIds && (
        <MissionSelectionModal
          candidateMissionIds={candidateIds}
          originOffset={originOffset}
          onSelect={(missionId) => onConfirmMissionSelection(missionId)}
          onCancel={() => onBackToClassBrowse()}
        />
      )}
    </div>
  );
}

type ClassSelectionModalProps = {
  tier: 1 | 2 | 3;
  unlockedClasses: string[];
  onSelect: (cls: string) => void;
  onCancel: () => void;
  availableByClass?: Record<string, boolean>;
  randomAvailable?: boolean;
  originOffset?: { x: number; y: number } | null;
};

function ClassSelectionModal({ tier, unlockedClasses, availableByClass, randomAvailable, originOffset, onSelect, onCancel }: ClassSelectionModalProps & { availableByClass?: Record<string, boolean>; originOffset?: { x: number; y: number } | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  const initialTransform = originOffset ? `translate(${originOffset.x}px, ${originOffset.y}px) scale(0.76)` : `scale(0.92)`;

  if (typeof document === "undefined" || !document.body) return null;
  try {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-6" onClick={onCancel}>
      <div
        className="mx-auto flex max-h-[calc(100dvh-3rem)] w-full max-w-xl flex-col overflow-y-auto border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-1)] p-6 shadow-[0_0_40px_rgba(0,0,0,0.45)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: mounted ? "translate(0,0) scale(1)" : initialTransform,
          transition: "transform 260ms cubic-bezier(0.2,0.8,0.2,1), opacity 260ms",
          opacity: mounted ? 1 : 0,
        }}
      >
        <h3 className="hud-title text-lg text-[color:var(--hud-amber)] mb-4">Вибрати клас (Рівень {tier})</h3>
        <div className="space-y-2">
          {MISSION_CLASSES.map((cls) => {
            const isUnlocked = unlockedClasses.includes(cls);
            const hasAvailable = availableByClass ? !!availableByClass[cls] : true;
            const disabled = !isUnlocked || !hasAvailable;
            return (
              <button
                key={cls}
                onClick={() => !disabled && (onSelect(cls), sfx.confirm())}
                disabled={disabled}
                className="w-full hud-btn py-2 text-sm flex flex-col items-start gap-1 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                title={!isUnlocked ? `Розблокується після виконання місії рівня ${tier - 1}` : (!hasAvailable ? "Немає доступних місій" : undefined)}
              >
                <span>
                  <span style={{ color: MISSION_CLASS_COLOR[cls as keyof typeof MISSION_CLASS_COLOR] }}>
                    {cls}
                  </span>
                  {!isUnlocked && (
                    <span className="hud-mono text-[0.65rem] ml-2 text-[color:var(--muted-foreground)]">
                      (розблокується)
                    </span>
                  )}
                  {isUnlocked && !hasAvailable && (
                    <span className="hud-mono text-[0.65rem] ml-2 text-[color:var(--muted-foreground)]">(немає місій)</span>
                  )}
                </span>
                <span className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)]">
                  {CLASS_DESCRIPTIONS[cls]}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => !!randomAvailable && (onSelect("Рандом"), sfx.confirm())}
            disabled={!randomAvailable}
            className="w-full hud-btn py-2 text-sm flex flex-col items-start gap-1 text-left border-t border-[color:var(--hud-amber)]/15 mt-1 pt-3 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!randomAvailable ? "Немає доступних місій" : undefined}
          >
            <span className="text-[color:var(--hud-amber)]">🎲 Рандом</span>
            <span className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)]">
              {CLASS_DESCRIPTIONS["Рандом"]}
            </span>
          </button>
        </div>
        <button onClick={onCancel} className="w-full hud-btn hud-btn-ghost mt-4">
          Скасувати
        </button>
      </div>
    </div>,
      document.body,
    );
  } catch (err) {
    reportLovableError(err, { modal: 'ClassSelectionModal' });
    console.error(err);
    return null;
  }
}

type MissionSelectionModalProps = {
  candidateMissionIds: number[];
  onSelect: (missionId: number) => void;
  onCancel: () => void;
  originOffset?: { x: number; y: number } | null;
};

function MissionSelectionModal({
  candidateMissionIds,
  originOffset,
  onSelect,
  onCancel,
}: MissionSelectionModalProps & { originOffset?: { x: number; y: number } | null }) {
  const { getMission } = useKpk();
  const recommendedId = candidateMissionIds.reduce<{ id: number | null; ratio: number }>(
    (best, mid) => {
      const m = getMission(mid);
      if (!m || !m.target) return best;
      const ratio = m.mainReward / m.target;
      return ratio > best.ratio ? { id: mid, ratio } : best;
    },
    { id: null, ratio: -Infinity },
  ).id;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  const initialTransform = originOffset ? `translate(${originOffset.x}px, ${originOffset.y}px) scale(0.78)` : `scale(0.96)`;

  if (typeof document === "undefined" || !document.body) return null;
  try {
    return createPortal(
      <div className="fixed inset-0 z-50 bg-black/80 p-4 sm:p-6" onClick={onCancel}>
        <div
          className="mx-auto flex h-full max-h-[calc(100dvh-3rem)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-1)] p-5 shadow-[0_0_40px_rgba(0,0,0,0.55)] sm:p-7"
          onClick={(e) => e.stopPropagation()}
          style={{
            transform: mounted ? "translate(0,0) scale(1)" : initialTransform,
            transition: "transform 260ms cubic-bezier(0.2,0.8,0.2,1), opacity 260ms",
            opacity: mounted ? 1 : 0,
            maxHeight: "90vh",
          }}
        >
          <h3 className="hud-title text-lg text-[color:var(--hud-amber)] mb-4">Вибрати місію</h3>
          <div className="grid grid-cols-1 gap-4 overflow-y-auto py-2 sm:grid-cols-2">
            {candidateMissionIds.map((mid) => {
              const m = getMission(mid);
              if (!m) return null;
              const isRecommended = mid === recommendedId;
              return (
                <button
                  key={mid}
                  onClick={() => { onSelect(mid); sfx.confirm(); }}
                  className={`hud-panel flex h-full flex-col justify-between border border-l-4 bg-[color:var(--surface-2)] p-5 text-left transition hover:-translate-y-0.5 ${isRecommended ? "border-[color:var(--hud-amber)]" : "border-[color:var(--hud-amber)]/20"}`}
                  style={{ borderLeftColor: LEVEL_COLOR[m.level as 1 | 2 | 3] }}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {isRecommended && (
                        <span className="hud-mono text-[0.6rem] uppercase tracking-[0.2em] text-[color:var(--hud-amber)] border border-[color:var(--hud-amber)]/50 px-2 py-0.5">
                          ★ Рекомендовано
                        </span>
                      )}
                      <span className="hud-mono text-[0.6rem] uppercase tracking-[0.2em]" style={{ color: MISSION_CLASS_COLOR[m.cls as keyof typeof MISSION_CLASS_COLOR] }}>
                        {m.cls}
                      </span>
                    </div>
                    <div className="font-semibold text-lg mb-2">{m.name}</div>
                    <div className="hud-mono text-sm leading-6 text-[color:var(--muted-foreground)] mb-4">{m.description}</div>
                  </div>
                  <div className="flex flex-col gap-2 pt-3 text-[0.85rem] text-[color:var(--foreground)]">
                    <div className="hud-mono">Бали: <span className="font-semibold">+{formatPoints(m.mainReward)}</span></div>
                    <div className="hud-mono">
                      {m.level === 1 ? "I" : m.level === 2 ? "II" : "III"}: <span className="font-semibold">+{formatPoints(m.levelReward)}</span>
                    </div>
                    <div className="hud-mono">Кредити: <span className="font-semibold">+{m.currencyReward} ⛁</span></div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={onCancel} className="hud-btn hud-btn-ghost flex-1 text-sm">Назад</button>
          </div>
        </div>
      </div>,
      document.body,
    );
  } catch (err) {
    reportLovableError(err, { modal: 'MissionSelectionModal' });
    console.error(err);
    return null;
  }
}

type ReplaceConfirmDialogProps = {
  onFullReplace: () => void;
  onClassReplace: () => void;
  onCancel: () => void;
  originOffset?: { x: number; y: number } | null;
};

function ReplaceConfirmDialog({ originOffset, onFullReplace, onClassReplace, onCancel }: ReplaceConfirmDialogProps & { originOffset?: { x: number; y: number } | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  const initialTransform = originOffset ? `translate(${originOffset.x}px, ${originOffset.y}px) scale(0.78)` : `scale(0.96)`;
  if (typeof document === "undefined" || !document.body) return null;
  try {
    return createPortal(
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="bg-[color:var(--surface-1)] border border-[color:var(--hud-amber)]/30 rounded-lg p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ transform: mounted ? "translate(0,0) scale(1)" : initialTransform, transition: "transform 240ms cubic-bezier(0.2,0.8,0.2,1), opacity 240ms", opacity: mounted ? 1 : 0 }}
      >
        <h3 className="hud-title text-lg text-[color:var(--hud-amber)] mb-2">Замінити місію?</h3>
        <p className="text-sm text-[color:var(--muted-foreground)] mb-4">
          Це витратить одну заміну з вашого лічильника.
        </p>
        <div className="space-y-2">
          <button onClick={onFullReplace} className="w-full hud-btn py-2 text-sm">
            Повна заміна (до вибору класу)
          </button>
          <button onClick={onClassReplace} className="w-full hud-btn py-2 text-sm">
            Заміна вибраного класу
          </button>
          <button onClick={onCancel} className="w-full hud-btn hud-btn-ghost py-2 text-sm">
            Відміна
          </button>
        </div>
      </div>
    </div>,
      document.body,
    );
  } catch (err) {
    reportLovableError(err, { modal: 'ReplaceConfirmDialog' });
    console.error(err);
    return null;
  }
}
