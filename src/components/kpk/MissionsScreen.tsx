import { ScreenShell } from "./ScreenShell";
import { MOCK_MISSIONS_BY_TIER, MISSION_CLASS_COLOR, type Mission } from "@/lib/kpkData";
import { useKpk } from "@/lib/kpkStore";
import { sfx } from "@/lib/sounds";

export function MissionsScreen() {
  const { user, totalScore } = useKpk();
  return (
    <ScreenShell title="Місії">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="hud-title text-xl text-[color:var(--hud-amber)] border border-[color:var(--hud-amber)]/40 px-3 py-1">МІСІЇ</h2>
            <button className="hud-btn hud-btn-ghost !py-1.5 !text-xs">Гілки місій</button>
            <button className="hud-btn hud-btn-ghost !py-1.5 !text-xs">Місії гравців</button>
          </div>
          <div className="hud-mono text-xs text-[color:var(--muted-foreground)]">
            /<span className="text-[color:var(--hud-amber-glow)]">{user?.nickname}</span> · Бали: <span className="text-[color:var(--hud-amber)]">{totalScore}</span>
          </div>
        </div>

        {([1, 2, 3] as const).map((tier) => (
          <div key={tier} className="mb-6">
            <div className="mb-2 flex items-center gap-3 border-b border-[color:var(--hud-amber)]/20 pb-1">
              <span className="hud-label text-[color:var(--hud-amber)]">Рівень {tier === 1 ? "I" : tier === 2 ? "II" : "III"}</span>
              <span className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)]">[заміни: 1]</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {MOCK_MISSIONS_BY_TIER[tier].map((m) => <MissionCard key={m.id} m={m} />)}
            </div>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

function MissionCard({ m }: { m: Mission }) {
  const color = MISSION_CLASS_COLOR[m.cls];
  const pct = Math.min(100, (m.progress / m.target) * 100);
  return (
    <div className={`hud-panel-corners-4 relative flex flex-col gap-2 border bg-[color:var(--surface-2)] p-3 transition-all ${m.active ? "mission-active-glow" : "border-[color:var(--hud-amber)]/25"}`}>
      <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-tight">{m.name}</span>
        <button onClick={() => sfx.click()} className="grid h-6 w-6 shrink-0 place-items-center border border-[color:var(--hud-amber)]/40 text-[color:var(--hud-amber)] hover:bg-[color:var(--hud-amber)]/10">
          {m.active ? "●" : "○"}
        </button>
      </div>
      <div className="flex items-center justify-between">
        <span className="hud-mono text-[0.65rem] uppercase tracking-widest" style={{ color }}>{m.cls}</span>
        <span className="hud-mono text-xs tabular-nums">{m.progress}/{m.target}</span>
      </div>
      <div className="h-1 w-full bg-[color:var(--surface-3)]">
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
      <div className="flex gap-2 pt-1">
        <button className="hud-btn hud-btn-ghost flex-1 !py-1 !text-[0.65rem]" onClick={() => sfx.click()}>−</button>
        <button className="hud-btn hud-btn-ghost flex-1 !py-1 !text-[0.65rem]" onClick={() => sfx.click()}>+</button>
        <button className="hud-btn flex-1 !py-1 !text-[0.65rem]" onClick={() => sfx.confirm()}>✓ Виплатити</button>
      </div>
      <div className="border-t border-dashed border-[color:var(--hud-amber)]/20 pt-1 hud-mono text-[0.65rem] text-[color:var(--muted-foreground)]">
        Нагорода: +{m.reward.points} балів{m.reward.currency ? ` · +${m.reward.currency} ⛁` : ""}
      </div>
    </div>
  );
}
