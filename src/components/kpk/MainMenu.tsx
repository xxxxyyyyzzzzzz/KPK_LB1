import { useKpk, fmtSession } from "@/lib/kpkStore";
import { FACTIONS } from "@/lib/kpkData";
import { HudHeader, BottomNav, AnimatedItem } from "./ScreenShell";

export function MainMenu() {
  const { user, sessionSeconds, totalScore, level1, level2, level3, round, turn } = useKpk();
  const factionColor = user ? FACTIONS[user.faction] : "#fff";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <HudHeader title="КПК" />

      <div
        className="hud-scroll min-h-0 flex-1 overflow-y-auto px-[12px] py-6 sm:px-[12px] sm:py-8"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 2.2rem + 52px)" }}
      >
        <div className="w-full space-y-6">

          {/* Оперативник */}
          <AnimatedItem index={0} className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center border border-[color:var(--hud-amber)]/50 hud-mono text-[color:var(--hud-amber)] text-sm">
              КПК
            </div>
            <div className="min-w-0 flex-1">
              <div className="hud-label text-[0.6rem]">Оперативник</div>
              <div className="truncate hud-title text-lg text-[color:var(--hud-amber-glow)]">{user?.nickname}</div>
              <div className="hud-mono text-xs mt-0.5" style={{ color: factionColor }}>▮ {user?.faction}</div>
            </div>
            <div className="text-right hud-mono text-xs shrink-0">
              <div className="text-[color:var(--muted-foreground)]">SESSION</div>
              <div className="text-[color:var(--hud-cyan)] tabular-nums">{fmtSession(sessionSeconds)}</div>
              <div className="text-[color:var(--muted-foreground)] mt-1">RND {round}.{turn}</div>
            </div>
          </AnimatedItem>

          {/* KPI */}
          <AnimatedItem index={1}>
            <div className="hud-label mb-3">// Статистика</div>
            <div className="grid grid-cols-2 gap-3">
              <Kpi label="Загальні бали" value={totalScore} accent="var(--hud-amber)" />
              <Kpi label="Рівень I"       value={level1}     accent="var(--mission-defense)" />
              <Kpi label="Рівень II"      value={level2}     accent="var(--mission-loot)" />
              <Kpi label="Рівень III"     value={level3}     accent="var(--mission-economy)" />
            </div>
          </AnimatedItem>

          <AnimatedItem index={2}>
            <p className="hud-mono text-[0.65rem] text-center text-[color:var(--muted-foreground)]">
              // Використовуйте нижнє меню для навігації
            </p>
          </AnimatedItem>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/25 bg-[color:var(--surface-2)] px-3 py-3">
      <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
      <div className="hud-label text-[0.6rem]" style={{ color: accent }}>{label}</div>
      <div className="hud-title mt-1 text-2xl tabular-nums" style={{ color: accent }}>{value}</div>
    </div>
  );
}
