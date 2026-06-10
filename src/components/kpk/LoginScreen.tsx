import { useState } from "react";
import { FACTIONS } from "@/lib/kpkData";
import { useKpk } from "@/lib/kpkStore";
import { sfx } from "@/lib/sounds";

export function LoginScreen() {
  const { login } = useKpk();
  const [nickname, setNick] = useState("");
  const [faction, setFaction] = useState("");
  const [err, setErr] = useState("");

  function submit() {
    if (!nickname.trim()) { setErr("◂ Введіть нікнейм"); sfx.deny(); return; }
    if (!faction) { setErr("◂ Оберіть угрупування"); sfx.deny(); return; }
    setErr("");
    login({ nickname: nickname.trim().toUpperCase(), faction });
  }

  return (
    <div className="hud-screen-enter flex h-full w-full items-center justify-center px-4">
      <div className="hud-panel-corners-4 relative w-full max-w-md border border-[color:var(--hud-amber)]/40 bg-[color:var(--surface-2)]/80 p-6 sm:p-8 backdrop-blur-sm">
        <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />

        <div className="mb-6 flex items-center justify-between border-b border-[color:var(--hud-amber)]/30 pb-3">
          <div>
            <div className="hud-label">// СИСТЕМА КПК v1.0</div>
            <div className="hud-title text-2xl text-[color:var(--hud-amber)] hud-flicker">АВТОРИЗАЦІЯ</div>
          </div>
          <div className="hud-mono text-xs text-[color:var(--hud-cyan)] hud-blink">● ONLINE</div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="hud-label mb-1.5 block">Оперативник</label>
            <input
              className="hud-input"
              placeholder="введіть нікнейм..."
              value={nickname}
              onChange={(e) => setNick(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          <div>
            <label className="hud-label mb-1.5 block">Угрупування</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(FACTIONS).map(([name, color]) => (
                <button
                  key={name}
                  onClick={() => { sfx.click(); setFaction(name); }}
                  className={`hud-mono relative border px-3 py-2.5 text-left text-sm transition-all ${
                    faction === name
                      ? "border-[color:var(--hud-amber)] bg-[color:var(--hud-amber)]/10 shadow-[0_0_12px_rgba(245,184,64,0.25)]"
                      : "border-[color:var(--hud-amber)]/25 hover:border-[color:var(--hud-amber)]/60"
                  }`}
                  data-hud-sound="hover"
                >
                  <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                  {name}
                </button>
              ))}
            </div>
          </div>

          <button onClick={submit} className="hud-btn w-full !py-3 text-base">
            ⌬ УВІЙТИ В МЕРЕЖУ
          </button>
          {err && <p className="hud-mono text-center text-sm text-[color:var(--hud-red)]">{err}</p>}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-[color:var(--hud-amber)]/20 pt-3 text-[0.65rem] hud-mono text-[color:var(--muted-foreground)]">
          <span>NET: ZONE-7</span>
          <span>SIG: <span className="text-[color:var(--hud-green)]">▮▮▮▮</span></span>
          <span>2026.06.10</span>
        </div>
      </div>
    </div>
  );
}
