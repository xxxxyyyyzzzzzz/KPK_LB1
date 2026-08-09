import { useMemo, useState, useEffect } from "react";
import { ScreenShell, AnimatedItem } from "./ScreenShell";
import { useKpk, fmtClock, useTimerTick } from "@/lib/kpkStore";
import { TURN_DURATION_SECONDS } from "@/lib/kpkData";
import { useSession } from "@/hooks/useSession";
import { sfx } from "@/lib/sounds";

type HomeEventEntry = {
  id: string;
  ts: number;
  nickname: string;
  type: string;
  payload?: {
    reason?: string;
    reward?: number;
    currency?: number;
    mission_id?: number;
  };
};

const MISSION_CLASS_COLORS: Record<string, string> = {
  Атака: "#E66969",
  Захист: "#66ADFF",
  Лут: "#F9FF9E",
  Економіка: "#A9FFAF",
  Розвиток: "#A9FFAF",
};

export function HomeScreen() {
  const {
    roomCode,
    playerId,
    slots,
    getMission,
    go,
    toggleTurn,
    requestTurnTransfer,
    acceptTurnTransfer,
    turnRunning,
    isMyTurn,
    activePlayerId,
    players,
    pendingTurnTransferFrom,
    pendingTurnTransferTo,
    sessionPlayers,
  } = useKpk();
  const { turnSeconds } = useTimerTick();
  const session = useSession(roomCode);

  const currentRank = useMemo(() => {
    const index = sessionPlayers.findIndex((player) => player.id === playerId);
    return index >= 0 ? index + 1 : null;
  }, [playerId, sessionPlayers]);

  const turnUrgent = turnSeconds <= Math.round(TURN_DURATION_SECONDS * 0.2);
  const elapsedPercent = Math.min(
    100,
    Math.max(0, ((TURN_DURATION_SECONDS - turnSeconds) / TURN_DURATION_SECONDS) * 100),
  );

  const activeMissionSlots = useMemo(() => slots.filter((slot) => slot.mission_id != null), [slots]);
  const emptySlotCount = useMemo(() => slots.filter((slot) => slot.mission_id == null).length, [slots]);

  const nearbyThreats = useMemo(() => {
    if (!currentRank || sessionPlayers.length === 0) return [];
    const rows: Array<{ id: string; nickname: string; rank: number; potentialPoints: number }> = [];

    if (currentRank > 1) {
      const above = sessionPlayers[currentRank - 2];
      if (above) {
        rows.push({
          id: above.id,
          nickname: above.nickname,
          rank: currentRank - 1,
          potentialPoints: calculatePotentialPoints(above.id, session, getMission),
        });
      }
    }

    if (currentRank < sessionPlayers.length) {
      const below = sessionPlayers[currentRank];
      if (below) {
        rows.push({
          id: below.id,
          nickname: below.nickname,
          rank: currentRank + 1,
          potentialPoints: calculatePotentialPoints(below.id, session, getMission),
        });
      }
    }

    return rows;
  }, [currentRank, sessionPlayers, session, getMission]);

  const recentEvents = useMemo(() => {
    return Object.entries(session?.events ?? {})
      .map(([id, entry]) => ({ id, ...(entry as Omit<HomeEventEntry, "id">) }) as HomeEventEntry)
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 2)
      .map((entry) => {
        const minutes = Math.max(1, Math.floor((Date.now() - entry.ts) / 60000));
        const mission = entry.type === "mission_complete" ? getMission(entry.payload?.mission_id ?? null) : null;
        const missionLabel = mission?.cls ? mission.cls : "місію";
        const rewardText = (entry.payload?.reward ?? 0) > 0 ? ` · +${entry.payload?.reward ?? 0} балів` : "";
        return {
          id: entry.id ?? `${entry.ts}-${entry.nickname}`,
          text: `${minutes}хв · ${entry.nickname} виконав місію ${missionLabel}${rewardText}`,
        };
      });
  }, [getMission, session?.events]);

  const rankLabel = currentRank ? `#${currentRank} з ${sessionPlayers.length}` : `#— з ${sessionPlayers.length}`;
  const pendingTransferToMe = pendingTurnTransferTo === playerId;
  const pendingTransferFromMe = pendingTurnTransferFrom === playerId;
  const currentTurnIndex = players.findIndex((p) => p.id === activePlayerId);
  const nextTransferTargetId = currentTurnIndex >= 0 ? players[(currentTurnIndex + 1) % players.length]?.id ?? null : null;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmSeconds, setConfirmSeconds] = useState(4);

  useEffect(() => {
    if (!confirmOpen || confirmSeconds <= 0) return;
    const timer = window.setTimeout(() => setConfirmSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [confirmOpen, confirmSeconds]);

  const openConfirm = () => {
    sfx.click();
    setConfirmSeconds(4);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    sfx.back();
    setConfirmOpen(false);
  };

  const confirmAcceptTransfer = () => {
    sfx.confirm();
    acceptTurnTransfer();
    setConfirmOpen(false);
  };

  return (
    <ScreenShell title="КПК">
      <div className="w-full space-y-4 px-3 pb-4">
        <AnimatedItem index={0}>
          <div className="rounded-[8px] border px-4 py-3" style={{ background: "rgba(255,255,255,.04)", borderColor: "rgba(255,255,255,.08)" }}>
            <div className="hud-label text-[0.65rem] text-[color:var(--hud-amber)]">// РЕЙТИНГ</div>
            <div className="mt-1 flex items-end justify-between gap-3">
              <div>
                <div className="hud-title text-lg text-[color:var(--hud-amber)]">Поточний ранг</div>
                <div className="hud-mono text-[1.05rem] text-[color:var(--hud-amber-glow)]">{rankLabel}</div>
              </div>
              <div className="text-right">
                <div className="hud-mono text-[0.72rem] text-[color:var(--muted-foreground)]">Лідерська дошка</div>
                <div className="hud-title text-sm text-[color:var(--foreground)]">{sessionPlayers[0]?.nickname ?? "—"}</div>
              </div>
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem index={1}>
          <div className="rounded-[8px] border px-4 py-4 text-center" style={{ background: "rgba(255,255,255,.04)", borderColor: "rgba(255,255,255,.08)" }}>
            <div className="hud-label text-[0.65rem] text-[color:var(--hud-amber)]">// ТАЙМЕР ХОДУ</div>
            <div className="mt-3 hud-mono text-5xl sm:text-6xl tracking-[0.16em]" style={{ color: turnUrgent ? "#E66969" : "#f5b840", fontFamily: "'JetBrains Mono', monospace" }}>
              {fmtClock(turnSeconds)}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[color:var(--surface-3)]">
              <div className="h-full rounded-full transition-all" style={{ width: `${elapsedPercent}%`, background: turnUrgent ? "#E66969" : "#f5b840" }} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={() => { sfx.click(); toggleTurn(); }} className="hud-btn min-w-[140px]" disabled={!isMyTurn} aria-label={turnRunning ? "Пауза таймера" : "Старт таймера"}>
                {turnRunning ? "❚❚ Пауза" : "▸ Старт"}
              </button>
              {pendingTransferToMe ? (
                <button type="button" onClick={openConfirm} className="hud-btn hud-btn-ghost min-w-[180px]" aria-label="Прийняти передачу ходу">
                  ✓ Прийняти передачу
                </button>
              ) : (
                <button type="button" onClick={() => { if (nextTransferTargetId) { sfx.click(); requestTurnTransfer(nextTransferTargetId); } }} className="hud-btn hud-btn-ghost min-w-[180px]" disabled={!isMyTurn || !nextTransferTargetId || pendingTransferFromMe} aria-label="Передати хід наступному гравцю">
                  ↦ Передати хід
                </button>
              )}
              {pendingTransferFromMe && (
                <span className="hud-mono text-[0.72rem] text-[color:var(--hud-amber)]">Чекаємо на підтвердження</span>
              )}
              {turnUrgent && (
                <span className="hud-mono text-[0.72rem] text-[color:#E66969]">⚠ УВАГА · час майже вичерпано</span>
              )}
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem index={2}>
          <button type="button" onClick={() => { sfx.click(); go("missions"); }} className="w-full rounded-[8px] border px-4 py-3 text-left" style={{ background: "rgba(255,255,255,.04)", borderColor: "rgba(255,255,255,.08)" }}>
            <div className="flex items-center justify-between gap-3">
              <div className="hud-label text-[0.65rem] text-[color:var(--hud-amber)]">// МІСІЇ</div>
              {emptySlotCount > 0 && (
                <span className="hud-mono text-[0.75rem] text-[color:#E66969]">· {emptySlotCount} вільний</span>
              )}
            </div>
            <div className="mt-3 space-y-2">
              {activeMissionSlots.length > 0 ? (
                activeMissionSlots.map((slot) => {
                  const mission = getMission(slot.mission_id);
                  const color = mission?.cls ? MISSION_CLASS_COLORS[mission.cls] ?? "#f5b840" : "#f5b840";
                  return (
                    <div key={slot.slot_index} className="flex items-center justify-between gap-3 rounded border border-white/10 bg-black/10 px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        <span className="hud-mono text-[0.8rem] text-[color:var(--foreground)]">{mission?.name ?? "—"}</span>
                      </div>
                      <span className="hud-mono shrink-0 text-[0.76rem] text-[color:var(--hud-amber-glow)]">{slot.current_progress ?? 0}/{mission?.target ?? 0}</span>
                    </div>
                  );
                })
              ) : (
                <div className="hud-mono text-[0.76rem] text-[color:var(--muted-foreground)]">Немає активних місій</div>
              )}
            </div>
          </button>
        </AnimatedItem>

        <AnimatedItem index={3}>
          <div className="rounded-[8px] border px-4 py-3" style={{ background: "rgba(255,255,255,.04)", borderColor: "rgba(255,255,255,.08)" }}>
            <div className="hud-label text-[0.65rem] text-[color:var(--hud-amber)]">// НАБЛИЖЕННЯ</div>
            <div className="mt-3 space-y-2">
              {nearbyThreats.length > 0 ? (
                nearbyThreats.map((player) => (
                  <div key={player.id} className="flex items-center justify-between rounded border border-white/10 bg-black/10 px-3 py-2">
                    <div>
                      <div className="hud-mono text-[0.72rem] text-[color:var(--muted-foreground)]">#{player.rank}</div>
                      <div className="hud-title text-sm text-[color:var(--foreground)]">{player.nickname}</div>
                    </div>
                    <div className="hud-mono text-[0.8rem] text-[color:var(--hud-amber-glow)]">+{player.potentialPoints} балів</div>
                  </div>
                ))
              ) : (
                <div className="hud-mono text-[0.76rem] text-[color:var(--muted-foreground)]">Поки що немає сусідів у рейтингу</div>
              )}
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem index={4}>
          <div className="rounded-[8px] border px-4 py-3" style={{ background: "rgba(255,255,255,.04)", borderColor: "rgba(255,255,255,.08)" }}>
            <div className="hud-label text-[0.65rem] text-[color:var(--hud-amber)]">// ПОДІЇ</div>
            <div className="mt-3 space-y-2">
              {recentEvents.length > 0 ? (
                recentEvents.map((event) => (
                  <div key={event.id} className="hud-mono text-[0.78rem] leading-6 text-[color:var(--muted-foreground)]">
                    {event.text}
                  </div>
                ))
              ) : (
                <div className="hud-mono text-[0.76rem] text-[color:var(--muted-foreground)]">Події відсутні</div>
              )}
            </div>
          </div>
        </AnimatedItem>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[20px] border border-white/10 bg-slate-950/95 p-6 shadow-2xl">
            <div className="space-y-3 text-center text-white">
              <div className="text-lg font-semibold">Підтвердження прийняття ходу</div>
              <div className="text-sm text-[color:var(--muted-foreground)]">
                При настанні вашого ходу ви не зможете брати прокачки та нові місії.
                Ви приймаєте хід?
              </div>
              <div className="mx-auto mt-2 h-16 w-16 rounded-full bg-[rgba(255,184,64,.12)] text-center text-3xl font-semibold text-[color:var(--hud-amber)]">
                {confirmSeconds}s
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={confirmAcceptTransfer} className="hud-btn flex-1" disabled={confirmSeconds > 0}>
                Підтвердити
              </button>
              <button type="button" onClick={closeConfirm} className="hud-btn hud-btn-ghost flex-1">
                Відмінити
              </button>
              <button type="button" onClick={() => { sfx.click(); closeConfirm(); go("missions"); }} className="hud-btn hud-btn-ghost flex-1">
                Місії
              </button>
            </div>
          </div>
        </div>
      )}
    </ScreenShell>
  );
}

function calculatePotentialPoints(
  targetPlayerId: string,
  session: ReturnType<typeof useSession> | null,
  getMission: (id: number | null) => { mainReward?: number; name?: string; target?: number; cls?: string } | null,
) {
  const playerState = session?.players?.[targetPlayerId];
  if (!playerState) return 0;
  const completedIds = new Set(playerState.completed_ids ?? []);
  return (playerState.slots ?? []).reduce((sum, slot) => {
    if (slot.mission_id == null || completedIds.has(slot.mission_id)) return sum;
    const mission = getMission(slot.mission_id);
    return sum + (mission?.mainReward ?? 0);
  }, 0);
}
