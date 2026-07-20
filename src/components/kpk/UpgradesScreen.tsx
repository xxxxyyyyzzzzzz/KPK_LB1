import { useState } from "react";
import { ScreenShell, AnimatedItem } from "./ScreenShell";
import { UpgradeWheel } from "./UpgradeWheel";
import { UpgradeTableModal } from "./UpgradeTableModal";
import { formatPoints } from "@/lib/utils";
import { useKpk } from "@/lib/kpkStore";

export function UpgradesScreen() {
  const { upgrades, level1, level2, level3 } = useKpk();
  const [showTable, setShowTable] = useState(false);
  const purchased = upgrades.length;
  return (
    <ScreenShell title="Прокачки">
      <div className="w-full">
        <AnimatedItem index={0} className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="hud-title inline-block border border-[color:var(--hud-amber)]/40 px-3 py-1 text-xl text-[color:var(--hud-amber)]">ДЕРЕВО ПРОКАЧОК</h2>
            <div className="mt-2 hud-mono text-xs text-[color:var(--muted-foreground)]">
              Куплено: <span className="text-[color:var(--hud-amber)]">{purchased}</span>
              <span className="mx-2">·</span>I: <span className="text-[color:var(--level-1)]">{formatPoints(level1)}</span>
              <span className="mx-2">·</span>II: <span className="text-[color:var(--level-2)]">{formatPoints(level2)}</span>
              <span className="mx-2">·</span>III: <span className="text-[color:var(--level-3)]">{formatPoints(level3)}</span>
            </div>
          </div>
          <button onClick={() => setShowTable(true)} className="hud-btn hud-btn-ghost min-h-0 !px-3 !py-2 text-[0.7rem]">
            Таблиця прокачок
          </button>
        </AnimatedItem>

        <AnimatedItem index={1}>
          <UpgradeWheel />
        </AnimatedItem>
      </div>
      <UpgradeTableModal open={showTable} onClose={() => setShowTable(false)} />
    </ScreenShell>
  );
}
