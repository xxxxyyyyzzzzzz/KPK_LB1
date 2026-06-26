import { FACTIONS } from "@/lib/kpkData";
import { sfx } from "@/lib/sounds";
import { useKpk } from "@/lib/kpkStore";

export default function LobbyPlayersPanel({ onClose }: { onClose: () => void }) {
  const { players, playerId, reorderPlayers } = useKpk();

  function move(idx: number, dir: -1 | 1) {
    const order = players.map((p) => p.id);
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    [order[idx], order[j]] = [order[j], order[idx]];
    sfx.click();
    reorderPlayers(order);
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="hud-panel-corners-4 relative w-full max-w-md border border-[color:var(--hud-amber)]/60 bg-[color:var(--surface-2)] p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
        <div className="mb-3 flex items-center justify-between border-b border-[color:var(--hud-amber)]/30 pb-2">
          <div className="hud-title text-base text-[color:var(--hud-amber)]">Гравці · Порядок ходів</div>
          <button onClick={onClose} className="hud-btn hud-btn-ghost min-h-0 !py-1 !px-2 !text-xs">✕</button>
        </div>

        <ul className="space-y-2">
          {players.map((p, i) => {
            const color = FACTIONS[p.faction] ?? "#fff";
            const isMe = p.id === playerId;
            return (
              <li key={p.id} className={`hud-panel-corners-4 relative flex items-center gap-3 border px-3 py-2.5 ${isMe ? "border-[color:var(--hud-amber)] bg-[color:var(--hud-amber)]/5" : "border-[color:var(--hud-amber)]/25 bg-black/20"}`}>
                <span className="hud-mono w-6 shrink-0 text-center text-[color:var(--hud-amber)]">{i + 1}</span>
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate hud-title text-base text-[color:var(--foreground)]">{p.nickname}{isMe ? " · ви" : ""}</div>
                  <div className="hud-mono text-[0.7rem] text-[color:var(--muted-foreground)]">{p.faction}</div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="hud-btn hud-btn-ghost min-h-0 !py-0.5 !px-2 !text-xs">▲</button>
                  <button onClick={() => move(i, 1)} disabled={i === players.length - 1} className="hud-btn hud-btn-ghost min-h-0 !py-0.5 !px-2 !text-xs">▼</button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
