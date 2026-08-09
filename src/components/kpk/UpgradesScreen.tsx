import { useState } from "react";
import { ScreenShell, AnimatedItem } from "./ScreenShell";
import { UpgradeTableModal } from "./UpgradeTableModal";
import { formatPoints } from "@/lib/utils";
import { useKpk } from "@/lib/kpkStore";
import { UPGRADE_CATEGORIES, UPGRADE_CATEGORY_COLOR, UPGRADES, type UpgradeCategory, type UpgradeDef } from "@/lib/kpkData";

function UpgradeNode({ u }: { u: UpgradeDef }) {
  const { upgrades, canPurchase, purchaseUpgrade, cancelUpgrade } = useKpk();
  const isPurchased = upgrades.includes(u.id);
  const check = isPurchased ? { ok: false, reason: "Куплено" } : canPurchase(u.id);
  const state: "purchased" | "available" | "locked" =
    isPurchased ? "purchased" : check.ok ? "available" : "locked";
  const styles =
    state === "purchased" ? "border-[color:var(--hud-green)] bg-[color:var(--hud-green)]/10 text-[color:var(--foreground)]" :
    state === "available" ? "border-[color:var(--hud-amber)] bg-[color:var(--hud-amber)]/5 text-[color:var(--foreground)] cursor-pointer hover:shadow-[0_0_12px_rgba(245,184,64,0.4)] hover:-translate-y-0.5" :
    "border-[color:var(--muted-foreground)]/30 bg-black/20 text-[color:var(--muted-foreground)]";
  return (
    <div
      className={`relative w-[180px] border p-2 transition-all ${styles}`}
      title={state === "locked" ? check.reason : state === "purchased" ? "Куплено" : "Купити"}
      onClick={() => { if (state === "available") purchaseUpgrade(u.id); }}
    >
      {state === "purchased" && (
        <>
          <span className="absolute -top-2 -right-2 hud-mono text-[0.6rem] bg-[color:var(--hud-green)] text-black px-1.5 py-0.5">✓</span>
          <button
            onClick={(e) => { e.stopPropagation(); cancelUpgrade(u.id); }}
            title="Анулювати (без повернення балів)"
            className="absolute -top-2 -left-2 hud-mono text-[0.6rem] bg-[color:var(--hud-red)] text-black w-4 h-4 grid place-items-center leading-none"
          >✕</button>
        </>
      )}
      <p className="text-[0.75rem] leading-tight mb-2">{u.name}</p>
      <div className="flex justify-between items-end">
        <span className="hud-mono text-[0.6rem] text-[color:var(--hud-amber)]">T{u.tier}</span>
        <span className={`hud-mono text-[0.65rem] ${state === "purchased" ? "line-through opacity-60" : ""}`}>◆ {u.cost}</span>
      </div>
      {state === "locked" && check.reason && (
        <div className="mt-1 hud-mono text-[0.55rem] text-[color:var(--hud-red)]/80 leading-tight">{check.reason}</div>
      )}
    </div>
  );
}

function UpgradeBranches() {
  return (
    <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/25 bg-[color:var(--surface-2)] p-3">
      <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
      <div className="divide-y divide-[color:var(--hud-amber)]/10">
        {UPGRADE_CATEGORIES.map((cat) => (
          <BranchRow key={cat} cat={cat} />
        ))}
      </div>
    </div>
  );
}

function BranchRow({ cat }: { cat: UpgradeCategory }) {
  const tiers = [1, 2, 3] as const;
  const all = Object.values(UPGRADES);
  const color = UPGRADE_CATEGORY_COLOR[cat];
  return (
    <div className="grid grid-cols-[100px_1fr] items-start gap-4 sm:grid-cols-[120px_1fr] py-3 first:pt-0 last:pb-0">
      <div
        className="hud-title text-sm border-r pr-3 py-2"
        style={{ color, borderColor: `color-mix(in srgb, ${color} 30%, transparent)` }}
      >
        {cat.toUpperCase()}
      </div>
      <div className="flex items-stretch gap-3 overflow-x-auto hud-scroll pb-2">
        {tiers.map((tier, i) => {
          const nodes = all.filter((u) => u.category === cat && u.tier === tier);
          return (
            <div key={tier} className="flex items-center gap-3">
              <div className="flex flex-col gap-2">
                {nodes.map((n) => <UpgradeNode key={n.id} u={n} />)}
              </div>
              {i < tiers.length - 1 && <div className="h-px w-6 shrink-0 bg-[color:var(--hud-amber)]/40" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UpgradeTracker() {
  const { upgrades, canPurchase, user } = useKpk();

  const getState = (id: string): "purchased" | "available" | "locked" => {
    const purchased = upgrades.includes(id);
    if (purchased) return "purchased";
    return canPurchase(id).ok ? "available" : "locked";
  };

  const symbol = (state: "purchased" | "available" | "locked", color: string) => {
    if (state === "purchased") {
      return <span style={{ color, fontSize: 12 }}>■</span>;
    }
    if (state === "available") {
      return <span style={{ color, fontSize: 12, opacity: 0.7, textShadow: `0 0 6px ${color}` }}>▢</span>;
    }
    return <span style={{ color: "#252525", fontSize: 12 }}>-</span>;
  };

  const categories = [
    { label: "Захист", key: "zakhyst", color: "#66ADFF", labelColor: "#5090d0" },
    { label: "Атака", key: "ataka", color: "#E66969", labelColor: "#e06060" },
    { label: "Лут", key: "lut", color: "#F9FF9E", labelColor: "#c8c870" },
    { label: "Економіка", key: "ekonomika", color: "#A9FFAF", labelColor: "#50a050" },
  ];

  return (
    <div
      style={{
        background: "#000",
        border: "1px solid rgba(245,184,64,0.2)",
        borderRadius: 4,
        padding: "12px 14px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Share Tech Mono','Courier New',monospace",
        marginBottom: 16,
      }}
    >
      <style>{`
        @keyframes kpkUpgScroll {
          from { background-position: 0 0; }
          to { background-position: 0 90px; }
        }
        @keyframes kpkUpgFlick {
          0%,89%,91%,95%,97%,100% { opacity:1; }
          90% { opacity:.92; }
          96% { opacity:.96; }
        }
      `}</style>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10,
          background: "repeating-linear-gradient(0deg, rgba(245,184,64,0) 0px, rgba(245,184,64,0) 2px, rgba(245,184,64,0.06) 2px, rgba(245,184,64,0.06) 3px)",
          animation: "kpkUpgScroll 10s linear infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 9,
          animation: "kpkUpgFlick 7s ease-in-out infinite",
        }}
      />
      <div style={{ position: "relative", zIndex: 11 }}>
        <div style={{ fontSize: 10, color: "#4a4020", letterSpacing: ".06em", marginBottom: 9 }}>
          <span style={{ color: "#4a4020" }}>root@kpk:~$ </span>
          <span style={{ color: "#f5b840" }}>статус_прокачок</span>
          <span style={{ color: "#a07830" }}> --гравець {user?.nickname ?? "—"}</span>
        </div>

        {categories.map(({ label, key, color, labelColor }, index) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: index === categories.length ? 0 : 5 }}>
            <div style={{ width: 76, fontSize: 11, letterSpacing: ".06em", flexShrink: 0, color: labelColor, textTransform: "uppercase" }}>
              {label}
            </div>
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              {([1, 2, 3] as const).map((tier) => (
                <div key={tier} style={{ display: "flex", gap: 1 }}>
                  <span style={{ color: "#2a2e38", fontSize: 11 }}>[</span>
                  {[1, 2].map((n) => symbol(getState(`${key}_${tier}_${n}`), color))}
                  <span style={{ color: "#2a2e38", fontSize: 11 }}>] </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <hr style={{ border: "none", borderTop: "1px solid #1e2a1e", margin: "8px 0" }} />
        <div style={{ fontSize: 8, letterSpacing: ".15em", textTransform: "uppercase", color: "#1e3a2a", marginBottom: 6 }}>
          // командування
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
          <div style={{ width: 76, fontSize: 11, letterSpacing: ".06em", flexShrink: 0, color: "#5ababa", textTransform: "uppercase" }}>
            КОМ.
          </div>
          <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
            {[1, 2].map((n) => (
              <span key={`cmd-1-${n}`} style={{ color: "#2a2e38", fontSize: 11 }}>[{symbol(getState(`komanduvannya_1_${n}`), "#5ababa")} ]</span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
          <div style={{ width: 76, fontSize: 11, letterSpacing: ".06em", flexShrink: 0 }} />
          <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
            {[1, 2, 3].map((n) => (
              <span key={`cmd-2-${n}`} style={{ color: "#2a2e38", fontSize: 11 }}>[{symbol(getState(`komanduvannya_2_${n}`), "#5ababa")} ]</span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 0 }}>
          <div style={{ width: 76, fontSize: 11, letterSpacing: ".06em", flexShrink: 0 }} />
          <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
            {[1, 2].map((n) => (
              <span key={`cmd-3-${n}`} style={{ color: "#2a2e38", fontSize: 11 }}>[{symbol(getState(`komanduvannya_3_${n}`), "#5ababa")} ]</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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

        <AnimatedItem index={1} className="mt-2">
          <UpgradeTracker />
          <UpgradeBranches />
        </AnimatedItem>
      </div>
      <UpgradeTableModal open={showTable} onClose={() => setShowTable(false)} />
    </ScreenShell>
  );
}
