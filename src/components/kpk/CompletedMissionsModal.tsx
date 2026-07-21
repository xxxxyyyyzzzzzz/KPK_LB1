import { useKpk } from "@/lib/kpkStore";

export default function CompletedMissionsModal({ onClose }: { onClose: () => void }) {
  const { players, playerId, getMission } = useKpk();

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="hud-panel-corners-4 relative w-full max-w-lg max-h-[80vh] overflow-y-auto border border-[color:var(--hud-amber)]/60 bg-[color:var(--surface-2)] p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
        <div className="mb-3 flex items-center justify-between border-b border-[color:var(--hud-amber)]/30 pb-2">
          <div className="hud-title text-base text-[color:var(--hud-amber)]">Виконані місії</div>
          <button onClick={onClose} className="hud-btn hud-btn-ghost min-h-0 !py-1 !px-2 !text-xs">✕</button>
        </div>

        <div className="space-y-4">
          {players.map((p) => (
            <div key={p.id}>
              <div className="hud-mono text-xs text-[color:var(--hud-cyan)] mb-1.5">
                {p.nickname}{p.id === playerId ? " (ви)" : ""} · {p.completed_ids?.length ?? 0}
              </div>
              {(!p.completed_ids || p.completed_ids.length === 0) ? (
                <div className="hud-mono text-[0.7rem] text-[color:var(--muted-foreground)] pl-2">— немає виконаних —</div>
              ) : (
                <ul className="space-y-1 pl-2">
                  {p.completed_ids.map((id) => {
                    const m = getMission(id);
                    return (
                      <li key={id} className="hud-mono text-[0.7rem] text-[color:var(--foreground)] flex justify-between gap-2 border-b border-[color:var(--hud-amber)]/10 pb-1">
                        <span className="truncate">{m ? m.name : `#${id}`}</span>
                        {m && (
                          <span className="shrink-0 text-[color:var(--muted-foreground)]">
                            {m.cls} · {m.level === 1 ? "I" : m.level === 2 ? "II" : "III"}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
