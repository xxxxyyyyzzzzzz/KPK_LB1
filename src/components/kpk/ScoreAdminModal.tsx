import { useState } from "react";
import { useKpk } from "@/lib/kpkStore";
import { sfx } from "@/lib/sounds";

type ScoreField = "score" | "level1_score" | "level2_score" | "level3_score" | "currency";

const FIELDS: { key: ScoreField; label: string }[] = [
  { key: "score", label: "Бали" },
  { key: "level1_score", label: "I" },
  { key: "level2_score", label: "II" },
  { key: "level3_score", label: "III" },
  { key: "currency", label: "Валюта" },
];

export default function ScoreAdminModal({ onClose }: { onClose: () => void }) {
  const { players, playerId, debugAdjustScore } = useKpk();
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  function getAmount(playerKey: string, field: ScoreField) {
    return amounts[`${playerKey}:${field}`] ?? 1;
  }
  function setAmount(playerKey: string, field: ScoreField, v: number) {
    setAmounts((prev) => ({ ...prev, [`${playerKey}:${field}`]: Math.max(0, v) }));
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="hud-panel-corners-4 relative w-full max-w-lg max-h-[80vh] overflow-y-auto border border-[color:var(--hud-amber)]/60 bg-[color:var(--surface-2)] p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
        <div className="mb-3 flex items-center justify-between border-b border-[color:var(--hud-amber)]/30 pb-2">
          <div className="hud-title text-base text-[color:var(--hud-amber)]">Керування балами</div>
          <button onClick={onClose} className="hud-btn hud-btn-ghost min-h-0 !py-1 !px-2 !text-xs">✕</button>
        </div>

        <div className="space-y-4">
          {players.map((p) => (
            <div key={p.id} className="border border-[color:var(--hud-amber)]/20 bg-black/20 p-3">
              <div className="hud-mono text-xs text-[color:var(--hud-cyan)] mb-2">
                {p.nickname}{p.id === playerId ? " (ви)" : ""}
              </div>
              <div className="space-y-2">
                {FIELDS.map((f) => (
                  <div key={f.key} className="flex items-center gap-2">
                    <span className="hud-mono w-14 shrink-0 text-[0.65rem] text-[color:var(--muted-foreground)]">{f.label}</span>
                    <button
                      onClick={() => { sfx.click(); debugAdjustScore(p.id, f.key, -getAmount(p.id, f.key)); }}
                      className="hud-btn hud-btn-ghost min-h-0 !h-7 !w-7 !p-0 !text-xs"
                      aria-label={`Відняти ${f.label} у ${p.nickname}`}
                    >−</button>
                    <input
                      type="number"
                      min={0}
                      value={getAmount(p.id, f.key)}
                      onChange={(e) => setAmount(p.id, f.key, parseInt(e.target.value, 10) || 0)}
                      className="hud-input h-7 w-16 !px-1.5 !py-0 text-center text-[0.7rem]"
                      aria-label={`Кількість для ${f.label}`}
                    />
                    <button
                      onClick={() => { sfx.click(); debugAdjustScore(p.id, f.key, getAmount(p.id, f.key)); }}
                      className="hud-btn hud-btn-ghost min-h-0 !h-7 !w-7 !p-0 !text-xs"
                      aria-label={`Додати ${f.label} у ${p.nickname}`}
                    >+</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
