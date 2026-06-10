import { useState } from "react";
import { ScreenShell } from "./ScreenShell";
import { MOCK_NEWS } from "@/lib/kpkData";
import { sfx } from "@/lib/sounds";

export function NewsScreen() {
  const [round, setRound] = useState(1);
  const [idx, setIdx] = useState(0);
  return (
    <ScreenShell title="Новини">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="hud-title text-xl text-[color:var(--hud-amber)] border border-[color:var(--hud-amber)]/40 px-3 py-1">НОВИНИ ЗОНИ</h2>
          <span className="hud-mono text-sm text-[color:var(--hud-cyan)]">Раунд {round}</span>
        </div>

        <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] p-5 space-y-3 min-h-[200px]">
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          {MOCK_NEWS.slice(0, idx + 1).map((n, i) => (
            <div key={i} className="hud-screen-enter border-l-2 border-[color:var(--hud-amber)] bg-[color:var(--surface-3)]/50 p-3 hud-mono text-sm">
              <div className="hud-label mb-1 text-[0.6rem]">// СИГНАЛ #{i + 1}</div>
              {n}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="hud-btn flex-1 min-w-[200px]"
            onClick={() => {
              sfx.notify();
              if (idx < MOCK_NEWS.length - 1) setIdx(idx + 1);
              else { setRound(round + 1); setIdx(0); }
            }}
          >▸ Наступна новина</button>
          <button className="hud-btn hud-btn-danger" onClick={() => { sfx.deny(); setIdx(0); setRound(1); }}>⟲ Скинути</button>
        </div>
      </div>
    </ScreenShell>
  );
}
