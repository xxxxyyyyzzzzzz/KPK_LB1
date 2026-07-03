import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ScreenShell, AnimatedItem } from "./ScreenShell";
import { MISSION_CLASS_COLOR, MISSION_CLASSES } from "@/lib/kpkData";
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
    getMission,
    global_replacements_left,
    unlockedClasses,
    updateSlotProgress,
    completeSlot,
    selectClassForSlot,
    generateCandidatesForSlot,
    replaceSlotMissions,
    selectMissionForSlot,
    cancelSlotSelection,
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
                Всього: <span className="text-[color:var(--hud-amber)]">{formatPoints(totalScore)}</span>
              </div>
              <div>
                L1: <span className="text-[color:var(--mission-defense)]">{formatPoints(level1)}</span>
              </div>
              <div>
                L2: <span className="text-[color:var(--mission-loot)]">{formatPoints(level2)}</span>
              </div>
              <div>
                L3: <span className="text-[color:var(--mission-economy)]">{formatPoints(level3)}</span>
              </div>
              <div className="border-l border-[color:var(--hud-amber)]/20 pl-3">
                🔄 <span className="text-[color:var(--hud-amber)]">{global_replacements_left}</span>
              </div>
            </div>
          </div>
        </AnimatedItem>

        {/* Блоки рівнів */}
        {([1, 2, 3] as const).map((tier, tierIdx) => {
          const tierColor =
            tier === 1 ? "var(--mission-defense)" : tier === 2 ? "var(--mission-loot)" : "var(--mission-economy)";
          return (
            <AnimatedItem key={tier} index={tierIdx + 1} className="mb-6">
              <div
                className="overflow-hidden rounded-2xl border border-[color:var(--hud-amber)]/20 border-l-4 bg-[color:var(--surface-3)]/80 shadow-[0_1px_0_0_rgba(245,184,64,0.08)]"
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
                            onSelectClass={(cls) => {
                              selectClassForSlot(s.slot_index, cls);
                              setTimeout(() => generateCandidatesForSlot(s.slot_index), 100);
                            }}
                            onSelectMission={(missionId) => {
                              selectMissionForSlot(s.slot_index, missionId);
                            }}
                            onReplace={() => {
                              // Показати діалог замены (буде в SlotCard)
                            }}
                            onCancel={() => cancelSlotSelection(s.slot_index)}
                            onUpdateProgress={(delta) => updateSlotProgress(s.slot_index, delta)}
                            onComplete={() => completeSlot(s.slot_index)}
                            canReplace={global_replacements_left > 0}
                            replaceSlotMissions={(fullReplace) => replaceSlotMissions(s.slot_index, fullReplace)}
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

type SlotCardProps = {
  slot: any;
  mission: any;
  tier: 1 | 2 | 3;
  unlockedClassesForTier: string[];
  onSelectClass: (cls: string) => void;
  onSelectMission: (missionId: number) => void;
  onReplace: () => void;
  onCancel: () => void;
  onUpdateProgress: (delta: number) => void;
  onComplete: () => void;
  canReplace: boolean;
  replaceSlotMissions: (fullReplace: boolean) => void;
};

function SlotCard({
  slot,
  mission: m,
  tier,
  unlockedClassesForTier,
  onSelectClass,
  onSelectMission,
  onReplace,
  onCancel,
  onUpdateProgress,
  onComplete,
  canReplace,
  replaceSlotMissions,
}: SlotCardProps) {
  const [showClassSelection, setShowClassSelection] = useState(false);
  const [showMissionSelection, setShowMissionSelection] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const { getMission } = useKpk();
  const { allMissions, completedIds, slots: allSlots } = useKpk();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [originOffset, setOriginOffset] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!showClassSelection && !showMissionSelection && !showReplaceDialog) setOriginOffset(null);
  }, [showClassSelection, showMissionSelection, showReplaceDialog]);

  // Якщо слот пустий - показуємо кнопку "Вибрати місію"
  // compute availability of missions by class for this tier
  const taken = new Set<number>([...(completedIds ?? []), ...allSlots.map((s) => s.mission_id ?? -1)]);
  const availableByClass: Record<string, boolean> = {};
  for (const cls of MISSION_CLASSES) {
    const pool = allMissions.filter((mm) => mm.level === tier && mm.cls === cls && !taken.has(mm.id));
    availableByClass[cls] = pool.length > 0;
  }
  const hasAnyAvailable = Object.values(availableByClass).some((v) => v === true);

  if (!m && !slot.selected_class) {
    return (
      <div ref={rootRef} className="hud-panel-corners-4 relative border border-dashed border-[color:var(--hud-amber)]/20 bg-[color:var(--surface-2)]/30 p-3 text-center">
        <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
        <button
          onClick={(e) => {
            const rect = rootRef.current?.getBoundingClientRect();
            if (rect) {
              const offsetX = rect.left + rect.width / 2 - (window.innerWidth / 2);
              const offsetY = rect.top + rect.height / 2 - (window.innerHeight / 2);
              setOriginOffset({ x: offsetX, y: offsetY });
            }
            setShowClassSelection(true);
          }}
          className="hud-btn w-full py-2 text-sm"
          disabled={!hasAnyAvailable}
          title={!hasAnyAvailable ? "Немає доступних місій" : undefined}
        >
          Вибрати місію
        </button>
        {showClassSelection && (
          <ClassSelectionModal
            tier={tier}
            unlockedClasses={unlockedClassesForTier}
            availableByClass={availableByClass}
            originOffset={originOffset}
            onSelect={(cls) => {
              onSelectClass(cls);
              setShowClassSelection(false);
              setTimeout(() => setShowMissionSelection(true), 100);
            }}
            onCancel={() => setShowClassSelection(false)}
          />
        )}
        {showMissionSelection && slot.candidate_missions && (
          <MissionSelectionModal
            candidateMissionIds={slot.candidate_missions}
            originOffset={originOffset}
            onSelect={(missionId) => {
              onSelectMission(missionId);
              setShowMissionSelection(false);
            }}
            onReplace={() => {
              setShowMissionSelection(false);
              setShowReplaceDialog(true);
            }}
            onCancel={() => {
              onCancel();
              setShowMissionSelection(false);
              setShowClassSelection(true);
            }}
          />
        )}
      </div>
    );
  }

  // Якщо слот з активною місією - показуємо карточку
  if (m) {
    const color = MISSION_CLASS_COLOR[m.cls];
    const pct = Math.min(100, (slot.current_progress / m.target) * 100);
    const done = slot.current_progress >= m.target;

    return (
      <>
        <div
          className={`hud-panel-corners-4 relative flex flex-col gap-2 border bg-[color:var(--surface-2)] p-3 transition-all ${
            done ? "mission-active-glow" : "border-[color:var(--hud-amber)]/25"
          }`}
        >
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium leading-tight">{m.name}</span>
            <button
              disabled={!canReplace}
              onClick={() => setShowReplaceDialog(true)}
              title={canReplace ? "Замінити місію" : "Немає замін"}
              className="grid h-6 w-6 shrink-0 place-items-center border border-[color:var(--hud-amber)]/40 text-[color:var(--hud-amber)] hover:bg-[color:var(--hud-amber)]/10 disabled:opacity-30"
            >
              ⟲
            </button>
          </div>
          <div className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)] leading-snug">{m.description}</div>
          <div className="flex items-center justify-between">
            <span className="hud-mono text-[0.65rem] uppercase tracking-widest" style={{ color }}>
              {m.cls}
            </span>
            <span className="hud-mono text-xs tabular-nums">
              {slot.current_progress}/{m.target}
            </span>
          </div>
          <div className="h-1 w-full bg-[color:var(--surface-3)]">
            <div
              className="h-full transition-all"
              style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button className="hud-btn hud-btn-ghost flex-1 !py-1 !text-[0.65rem]" onClick={() => onUpdateProgress(-1)}>
              −
            </button>
            <button className="hud-btn hud-btn-ghost flex-1 !py-1 !text-[0.65rem]" onClick={() => onUpdateProgress(+1)}>
              +
            </button>
            <button className="hud-btn flex-1 !py-1 !text-[0.65rem]" disabled={!done} onClick={onComplete}>
              ✓ Виплатити
            </button>
          </div>
          <div className="border-t border-dashed border-[color:var(--hud-amber)]/20 pt-1 hud-mono text-[0.65rem] text-[color:var(--muted-foreground)]">
            Нагорода: +{formatPoints(m.mainReward)} · +{formatPoints(m.levelReward)} L{m.level} · +{m.currencyReward} ⛁
          </div>
        </div>
        {showReplaceDialog && (
          <ReplaceConfirmDialog
            onFullReplace={() => {
              replaceSlotMissions(true);
              setShowReplaceDialog(false);
              setShowClassSelection(true);
            }}
            onClassReplace={() => {
              replaceSlotMissions(false);
              setShowReplaceDialog(false);
              setShowMissionSelection(true);
            }}
            onCancel={() => setShowReplaceDialog(false)}
          />
        )}
      </>
    );
  }

  // Якщо слот у процесі вибору класу/місії
  return (
    <>
      <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/20 bg-[color:var(--surface-2)]/30 p-3">
        <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
        <div className="text-center hud-mono text-xs text-[color:var(--muted-foreground)]">Вибір у процесі...</div>
      </div>
      {showClassSelection && (
        <ClassSelectionModal
          tier={tier}
          unlockedClasses={unlockedClassesForTier}
          onSelect={(cls) => {
            onSelectClass(cls);
            setShowClassSelection(false);
            setTimeout(() => setShowMissionSelection(true), 100);
          }}
          onCancel={() => {
            onCancel();
            setShowClassSelection(false);
          }}
        />
      )}
      {showMissionSelection && slot.candidate_missions && (
        <MissionSelectionModal
          candidateMissionIds={slot.candidate_missions}
          onSelect={(missionId) => {
            onSelectMission(missionId);
            setShowMissionSelection(false);
          }}
          onReplace={() => {
            setShowMissionSelection(false);
            setShowReplaceDialog(true);
          }}
          onCancel={() => {
            onCancel();
            setShowMissionSelection(false);
            setShowClassSelection(true);
          }}
        />
      )}
      {showReplaceDialog && (
        <ReplaceConfirmDialog
          onFullReplace={() => {
            replaceSlotMissions(true);
            setShowReplaceDialog(false);
            setShowClassSelection(true);
          }}
          onClassReplace={() => {
            replaceSlotMissions(false);
            setShowReplaceDialog(false);
            setShowMissionSelection(true);
          }}
          onCancel={() => setShowReplaceDialog(false)}
        />
      )}
    </>
  );
}

type ClassSelectionModalProps = {
  tier: 1 | 2 | 3;
  unlockedClasses: string[];
  onSelect: (cls: string) => void;
  onCancel: () => void;
  availableByClass?: Record<string, boolean>;
  originOffset?: { x: number; y: number };
};

function ClassSelectionModal({ tier, unlockedClasses, availableByClass, originOffset, onSelect, onCancel }: ClassSelectionModalProps & { availableByClass?: Record<string, boolean>; originOffset?: { x: number; y: number } }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  const initialTransform = originOffset ? `translate(${originOffset.x}px, ${originOffset.y}px) scale(0.76)` : `scale(0.92)`;

  if (typeof document === "undefined" || !document.body) return null;
  try {
    return createPortal(
      <div className="fixed inset-0 z-50 bg-black/70 p-4 sm:p-6" onClick={onCancel}>
      <div
        className="mx-auto flex h-full max-h-[calc(100dvh-3rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-1)] p-6 shadow-[0_0_40px_rgba(0,0,0,0.45)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: mounted ? "translate(0,0) scale(1)" : initialTransform,
          transition: "transform 260ms cubic-bezier(0.2,0.8,0.2,1), opacity 260ms",
          opacity: mounted ? 1 : 0,
          minWidth: "min(640px, 100vw)",
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
  onReplace: () => void;
  onCancel: () => void;
  originOffset?: { x: number; y: number };
};

function MissionSelectionModal({
  candidateMissionIds,
  originOffset,
  onSelect,
}: MissionSelectionModalProps & { originOffset?: { x: number; y: number } }) {
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
                  className="hud-panel flex h-full flex-col justify-between rounded-3xl border border-[color:var(--hud-amber)]/20 bg-[color:var(--surface-2)] p-5 text-left transition hover:-translate-y-0.5"
                >
                  <div>
                    <div className="font-semibold text-lg mb-2">{m.name}</div>
                    <div className="hud-mono text-sm leading-6 text-[color:var(--muted-foreground)] mb-4">{m.description}</div>
                  </div>
                  <div className="flex flex-col gap-2 pt-3 text-[0.85rem] text-[color:var(--foreground)]">
                    <div className="hud-mono">Клас: <span className="font-semibold">{m.cls}</span></div>
                    <div className="hud-mono">Рівень: <span className="font-semibold">{m.level}</span></div>
                    <div className="hud-mono">Нагорода: <span className="font-semibold">+{formatPoints(m.mainReward)} pts</span></div>
                    <div className="hud-mono">Кредити: <span className="font-semibold">+{m.currencyReward} ⛁</span></div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={onReplace} className="hud-btn flex-1 text-sm">
              🔄 Заміна
            </button>
            <button onClick={onCancel} className="hud-btn hud-btn-ghost flex-1 text-sm">
              Назад
            </button>
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
                className="hud-panel flex h-full flex-col justify-between rounded-3xl border border-[color:var(--hud-amber)]/20 bg-[color:var(--surface-2)] p-5 text-left transition hover:-translate-y-0.5"
              >
                <div>
                  <div className="font-semibold text-lg mb-2">{m.name}</div>
                  <div className="hud-mono text-sm leading-6 text-[color:var(--muted-foreground)] mb-4">{m.description}</div>
                </div>
                <div className="flex flex-col gap-2 pt-3 text-[0.85rem] text-[color:var(--foreground)]">
                  <div className="hud-mono">Клас: <span className="font-semibold">{m.cls}</span></div>
                  <div className="hud-mono">Рівень: <span className="font-semibold">{m.level}</span></div>
                  <div className="hud-mono">Нагорода: <span className="font-semibold">+{formatPoints(m.mainReward)} pts</span></div>
                  <div className="hud-mono">Кредити: <span className="font-semibold">+{m.currencyReward} ⛁</span></div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onReplace} className="hud-btn flex-1 text-sm">
            🔄 Заміна
        document.body,
      );
    } catch (err) {
      reportLovableError(err, { modal: 'MissionSelectionModal' });
      console.error(err);
      return null;
    }
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}

type ReplaceConfirmDialogProps = {
  onFullReplace: () => void;
  onClassReplace: () => void;
  onCancel: () => void;
  originOffset?: { x: number; y: number };
};

function ReplaceConfirmDialog({ originOffset, onFullReplace, onClassReplace, onCancel }: ReplaceConfirmDialogProps & { originOffset?: { x: number; y: number } }) {
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
