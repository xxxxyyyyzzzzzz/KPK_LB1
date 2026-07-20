import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ScreenShell, AnimatedItem } from "./ScreenShell";
import { MISSION_CLASS_COLOR, MISSION_CLASSES, LEVEL_COLOR } from "@/lib/kpkData";
import { useKpk } from "@/lib/kpkStore";
import { formatPoints } from "@/lib/utils";
import { sfx } from "@/lib/sounds";
import { reportLovableError } from "@/lib/lovable-error-reporting";

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
  } = useKpk();

  return (
    <ScreenShell title="Місії">
      <div className="mx-auto max-w-5xl">
        {/* Header з лічильниками */}
        <AnimatedItem index={0} className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="hud-title text-xl text-[color:var(--hud-amber)] border border-[color:var(--hud-amber)]/40 px-3 py-1">
              МІСІЇ
            </h2>
          </div>
          <div className="flex items-center gap-4 hud-mono text-xs">
            <div className="text-[color:var(--muted-foreground)]">
              /<span className="text-[color:var(--hud-amber-glow)]">{user?.nickname}</span>
            </div>
            <div className="flex gap-3">
              <div>
                Бали: <span className="text-[color:var(--hud-amber)]">{formatPoints(totalScore)}</span>
              </div>
              <div>
                I: <span className="text-[color:var(--level-1)]">{formatPoints(level1)}</span>
              </div>
              <div>
                II: <span className="text-[color:var(--level-2)]">{formatPoints(level2)}</span>
              </div>
              <div>
                III: <span className="text-[color:var(--level-3)]">{formatPoints(level3)}</span>
              </div>
              <div className="border-l border-[color:var(--hud-amber)]/20 pl-3">
                🔄 <span className="text-[color:var(--hud-amber)]">{global_replacements_left}</span>
              </div>
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem index={1} className="mb-5">
          <div className="hud-panel-corners-4 relative inline-block border border-[color:var(--hud-cyan)]/40 bg-[color:var(--surface-2)] px-4 py-3">
            <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
            <MissionClassProgress
              unlockedClasses={unlockedClasses}
              slots={slots}
              completedIds={completedIds}
              getMission={getMission}
            />
          </div>
        </AnimatedItem>

        {/* Блоки рівнів */}
        {([1, 2, 3] as const).map((tier, tierIdx) => {
          const tierColor =
            tier === 1 ? "var(--mission-defense)" : tier === 2 ? "var(--mission-loot)" : "var(--mission-economy)";
          return (
            <AnimatedItem key={tier} index={tierIdx + 1} className="mb-6">
              <div
                className="overflow-hidden border border-[color:var(--hud-amber)]/20 border-l-4 bg-[color:var(--surface-3)]/80 shadow-[0_1px_0_0_rgba(245,184,64,0.08)]"
                style={{ borderLeftColor: tierColor }}
              >
                <div className="border-b border-[color:var(--hud-amber)]/15 bg-[color:var(--surface-2)]/70 px-4 py-3">
                  <span className="hud-label text-[color:var(--hud-amber)]">
                    Рівень {tier === 1 ? "I" : tier === 2 ? "II" : "III"}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 p-4">
                  {slots
                    .filter((s) => (s.slot_index % 3) + 1 === tier)
                    .map((s, cardIdx) => {
                      const m = getMission(s.mission_id);
                      return (
                        <div
                          key={s.slot_index}
                          style={{
                            opacity: 0,
                            animation: `hud-screen-in 0.4s cubic-bezier(0.2,0.8,0.2,1) ${(tierIdx * 0.15) + (cardIdx * 0.1) + 0.2}s both`,
                          }}
                        >
                          <SlotCard
                            slot={s}
                            mission={m}
                            tier={tier}
                            unlockedClassesForTier={unlockedClasses[String(tier) as "1" | "2" | "3"] ?? []}
                            onStartBrowseClass={() => startBrowseClass(s.slot_index)}
                            onSelectBrowseClass={(cls) => selectBrowseClass(s.slot_index, cls)}
                            onStartBrowseSameClass={() => startBrowseSameClass(s.slot_index)}
                            onStartReplaceConfirm={() => startReplaceConfirm(s.slot_index)}
                            onBackToClassBrowse={() => backToClassBrowse(s.slot_index)}
                            onCancelBrowse={() => cancelBrowse(s.slot_index)}
                            onConfirmMissionSelection={(missionId) => confirmMissionSelection(s.slot_index, missionId)}
                            onUpdateProgress={(delta) => updateSlotProgress(s.slot_index, delta)}
                            onComplete={() => completeSlot(s.slot_index)}
                            canReplace={global_replacements_left > 0}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            </AnimatedItem>
          );
        })}
      </div>
    </ScreenShell>
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
  const rowH = 28;
  const topPad = 12;
  const originX = 12;
  const branchX = 34;
  const nodeXs = [66, 158, 250];
  const width = 300;
  const height = topPad * 2 + (MISSION_CLASSES.length - 1) * rowH;
  const originY = height / 2;
  const forkOffset = 9;
  const forkStartOffset = 16;

  const rows = MISSION_CLASSES.map((cls, rowIdx) => {
    const rowY = topPad + rowIdx * rowH;
    const color = MISSION_CLASS_COLOR[cls];
    const dimColor = `color-mix(in srgb, ${color} 45%, var(--muted-foreground) 55%)`;
    const states = ([1, 2, 3] as const).map((tier) =>
      getClassTierState(cls, tier, unlockedClasses, slots, completedIds, getMission),
    );
    return { cls, rowY, color, dimColor, states };
  });

  const stateColor = (st: { locked: boolean; activeCount: number }, color: string, dimColor: string) =>
    st.locked ? "var(--muted-foreground)" : st.activeCount > 0 ? color : dimColor;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full max-w-[300px] h-auto"
      role="img"
      aria-label="Прогрес доступних місій за класами"
    >
      {/* Шар 1: усі лінії, для ВСІХ рядків одразу — завжди під вузлами */}
      {rows.map(({ cls, rowY, color, dimColor, states }) => (
        <g key={`lines-${cls}`}>
          <line x1={originX} y1={originY} x2={branchX} y2={rowY} stroke={stateColor(states[0], color, dimColor)} strokeWidth={1.5} opacity={0.7} style={{ transition: "stroke 0.6s ease" }} />
          <line x1={branchX} y1={rowY} x2={nodeXs[0]} y2={rowY} stroke={stateColor(states[0], color, dimColor)} strokeWidth={1.5} opacity={0.7} style={{ transition: "stroke 0.6s ease" }} />
          <line
            x1={nodeXs[0]} y1={rowY} x2={nodeXs[1]} y2={rowY}
            stroke={stateColor(states[1], color, dimColor)}
            strokeWidth={1.5}
            strokeDasharray={states[1].locked ? undefined : "4 4"}
            opacity={0.7}
            style={{
              transition: "stroke 0.6s ease",
              animation: states[1].locked ? "none" : "hud-line-flow 1.2s linear infinite",
            }}
          />
          <line
            x1={nodeXs[1]} y1={rowY} x2={nodeXs[2]} y2={rowY}
            stroke={stateColor(states[2], color, dimColor)}
            strokeWidth={1.5}
            strokeDasharray={states[2].locked ? undefined : "4 4"}
            opacity={0.7}
            style={{
              transition: "stroke 0.6s ease",
              animation: states[2].locked ? "none" : "hud-line-flow 1.2s linear infinite",
            }}
          />
        </g>
      ))}

      {/* Шар 2: усі вузли, для ВСІХ рядків одразу — завжди поверх ліній */}
      {rows.map(({ cls, rowY, color, dimColor, states }) =>
        nodeXs.map((nx, tierIdx) => {
          const tier = (tierIdx + 1) as 1 | 2 | 3;
          const st = states[tierIdx];
          const fill = st.locked ? "var(--muted-foreground)" : st.activeCount > 0 ? color : dimColor;
          const isActive = !st.locked && st.activeCount > 0;
          const label = `${cls} · Рівень ${tier === 1 ? "I" : tier === 2 ? "II" : "III"}`;

          if (st.activeCount === 2) {
            const forkX = nx - forkStartOffset;
            return (
              <g key={`node-${cls}-${tier}`}>
                <line
                  x1={forkX} y1={rowY} x2={nx} y2={rowY - forkOffset}
                  stroke={color}
                  strokeWidth={1.5}
                  style={{ transformOrigin: `${forkX}px ${rowY}px`, animation: "hud-fork-grow 0.5s ease both" }}
                />
                <line
                  x1={forkX} y1={rowY} x2={nx} y2={rowY + forkOffset}
                  stroke={color}
                  strokeWidth={1.5}
                  style={{ transformOrigin: `${forkX}px ${rowY}px`, animation: "hud-fork-grow 0.5s ease both" }}
                />
                <circle cx={nx} cy={rowY - forkOffset} r={6} fill={color} style={{ animation: "hud-node-pulse 2.4s ease-in-out infinite", color: fill }}>
                  <title>{label} (1/2)</title>
                </circle>
                <circle cx={nx} cy={rowY + forkOffset} r={6} fill={color} style={{ animation: "hud-node-pulse 2.4s ease-in-out infinite", color: fill }}>
                  <title>{label} (2/2)</title>
                </circle>
              </g>
            );
          }

          return (
            <g key={`node-${cls}-${tier}`} style={{ color: fill }}>
              <circle
                cx={nx}
                cy={rowY}
                r={6}
                fill={fill}
                style={{
                  transition: "fill 0.6s ease",
                  animation: isActive ? "hud-node-pulse 2.4s ease-in-out infinite" : "none",
                }}
              >
                <title>{label}</title>
              </circle>
            </g>
          );
        }),
      )}
    </svg>
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
        <div className="hud-panel-corners-4 relative border border-dashed border-[color:var(--hud-amber)]/20 bg-[color:var(--surface-2)]/30 p-3 text-center">
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          <button
            onClick={() => { captureOrigin(); onStartBrowseClass(); }}
            className="hud-btn w-full py-2 text-sm"
            disabled={!hasAnyAvailable}
            title={!hasAnyAvailable ? "Немає доступних місій" : undefined}
          >Вибрати місію</button>
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
  originOffset?: { x: number; y: number } | null;
};

function ClassSelectionModal({ tier, unlockedClasses, availableByClass, originOffset, onSelect, onCancel }: ClassSelectionModalProps & { availableByClass?: Record<string, boolean>; originOffset?: { x: number; y: number } | null }) {
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
                className="w-full hud-btn py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title={!isUnlocked ? `Розблокується після виконання місії рівня ${tier - 1}` : (!hasAvailable ? "Немає доступних місій" : undefined)}
              >
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
              </button>
            );
          })}
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
              return (
                <button
                  key={mid}
                  onClick={() => { onSelect(mid); sfx.confirm(); }}
                  className="hud-panel flex h-full flex-col justify-between border border-l-4 border-[color:var(--hud-amber)]/20 bg-[color:var(--surface-2)] p-5 text-left transition hover:-translate-y-0.5"
                  style={{ borderLeftColor: LEVEL_COLOR[m.level as 1 | 2 | 3] }}
                >
                  <div>
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
