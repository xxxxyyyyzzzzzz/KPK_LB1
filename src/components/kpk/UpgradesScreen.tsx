import { ScreenShell, AnimatedItem } from "./ScreenShell";
import { UPGRADES, UPGRADE_CATEGORIES, UPGRADE_CATEGORY_COLOR, type UpgradeCategory, type UpgradeDef } from "@/lib/kpkData";
import { formatPoints } from "@/lib/utils";
import { useKpk } from "@/lib/kpkStore";

export function UpgradesScreen() {
  const { upgrades, level1, level2, level3 } = useKpk();
  const purchased = upgrades.length;
  return (
    <ScreenShell title="Прокачки">
      <div className="w-full">
        <AnimatedItem index={0} className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="hud-title text-xl text-[color:var(--hud-amber)] border border-[color:var(--hud-amber)]/40 inline-block px-3 py-1">ДЕРЕВО ПРОКАЧОК</h2>
            <div className="mt-2 hud-mono text-xs text-[color:var(--muted-foreground)]">
              Куплено: <span className="text-[color:var(--hud-amber)]">{purchased}</span>
              <span className="mx-2">·</span>L1: <span className="text-[color:var(--mission-defense)]">{formatPoints(level1)}</span>
              <span className="mx-2">·</span>L2: <span className="text-[color:var(--mission-loot)]">{formatPoints(level2)}</span>
              <span className="mx-2">·</span>L3: <span className="text-[color:var(--mission-economy)]">{formatPoints(level3)}</span>
            </div>
          </div>
          <div className="hud-panel-corners-4 relative border border-[color:var(--hud-cyan)]/40 px-4 py-3">
            <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
            <UpgradeCategoryProgress />
          </div>
        </AnimatedItem>

        <div className="space-y-5">
          {UPGRADE_CATEGORIES.map((cat, i) => (
            <div
              key={cat}
              style={{
                opacity: 0,
                animation: `hud-screen-in 0.45s cubic-bezier(0.2,0.8,0.2,1) ${0.1 + i * 0.12}s both`,
              }}
            >
              <Branch cat={cat} />
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}

function Branch({ cat }: { cat: UpgradeCategory }) {
  const tiers = [1, 2, 3] as const;
  const all = Object.values(UPGRADES);
  return (
    <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/25 bg-[color:var(--surface-2)] p-3">
      <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
      <div className="grid grid-cols-[100px_1fr] items-start gap-4 sm:grid-cols-[120px_1fr]">
        <div className="hud-title text-sm text-[color:var(--hud-amber)] border-r border-[color:var(--hud-amber)]/20 pr-3 py-2">{cat.toUpperCase()}</div>
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
    </div>
  );
}

function UpgradeNode({ u }: { u: UpgradeDef }) {
  const { upgrades, canPurchase, purchaseUpgrade } = useKpk();
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
        <span className="absolute -top-2 -right-2 hud-mono text-[0.6rem] bg-[color:var(--hud-green)] text-black px-1.5 py-0.5">✓</span>
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

function UpgradeCategoryProgress() {
  const { upgrades, canPurchase } = useKpk();
  const rowH = 26;
  const topPad = 10;
  const originX = 12;
  const branchX = 34;
  const nodeXs = [66, 158, 250];
  const width = 300;
  const height = topPad * 2 + (UPGRADE_CATEGORIES.length - 1) * rowH;
  const originY = height / 2;
  const forkOffset = 8;
  const forkStartOffset = 16;

  const all = Object.values(UPGRADES);

  const nodeState = (u: UpgradeDef): "purchased" | "available" | "locked" => {
    if (upgrades.includes(u.id)) return "purchased";
    return canPurchase(u.id).ok ? "available" : "locked";
  };

  const nodeFill = (state: "purchased" | "available" | "locked", color: string) =>
    state === "purchased" ? "var(--hud-green)" : state === "available" ? color : "var(--muted-foreground)";

  const nodeTitle = (u: UpgradeDef, state: "purchased" | "available" | "locked") =>
    `${u.name} · T${u.tier} · ${state === "purchased" ? "Куплено" : state === "available" ? "Доступно" : "Заблоковано"}`;

  const rows = UPGRADE_CATEGORIES.map((cat, rowIdx) => {
    const rowY = topPad + rowIdx * rowH;
    const color = UPGRADE_CATEGORY_COLOR[cat];
    const dimColor = `color-mix(in srgb, ${color} 45%, var(--muted-foreground) 55%)`;
    const tierNodes = ([1, 2, 3] as const).map((tier) => all.filter((u) => u.category === cat && u.tier === tier));
    return { cat, rowY, color, dimColor, tierNodes };
  });

  const segmentStyle = (nodes: UpgradeDef[], color: string, dimColor: string) => {
    const states = nodes.map(nodeState);
    const locked = states.length > 0 && states.every((s) => s === "locked");
    const purchased = states.some((s) => s === "purchased");
    return { locked, stroke: locked ? "var(--muted-foreground)" : purchased ? color : dimColor };
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full max-w-[300px] h-auto"
      role="img"
      aria-label="Прогрес прокачок за категоріями"
    >
      {/* Шар 1: усі лінії, для ВСІХ рядків одразу — завжди під вузлами */}
      {rows.map(({ cat, rowY, color, dimColor, tierNodes }) => {
        const seg0 = segmentStyle(tierNodes[0], color, dimColor);
        const seg1 = segmentStyle(tierNodes[1], color, dimColor);
        const seg2 = segmentStyle(tierNodes[2], color, dimColor);
        return (
          <g key={`lines-${cat}`}>
            <line x1={originX} y1={originY} x2={branchX} y2={rowY} stroke={seg0.stroke} strokeWidth={1.5} opacity={0.7} style={{ transition: "stroke 0.6s ease" }} />
            <line x1={branchX} y1={rowY} x2={nodeXs[0]} y2={rowY} stroke={seg0.stroke} strokeWidth={1.5} opacity={0.7} style={{ transition: "stroke 0.6s ease" }} />
            <line
              x1={nodeXs[0]} y1={rowY} x2={nodeXs[1]} y2={rowY}
              stroke={seg1.stroke}
              strokeWidth={1.5}
              strokeDasharray={seg1.locked ? undefined : "4 4"}
              opacity={0.7}
              style={{ transition: "stroke 0.6s ease", animation: seg1.locked ? "none" : "hud-line-flow 1.2s linear infinite" }}
            />
            <line
              x1={nodeXs[1]} y1={rowY} x2={nodeXs[2]} y2={rowY}
              stroke={seg2.stroke}
              strokeWidth={1.5}
              strokeDasharray={seg2.locked ? undefined : "4 4"}
              opacity={0.7}
              style={{ transition: "stroke 0.6s ease", animation: seg2.locked ? "none" : "hud-line-flow 1.2s linear infinite" }}
            />
          </g>
        );
      })}

      {/* Шар 2: усі вузли, для ВСІХ рядків одразу — завжди поверх ліній */}
      {rows.map(({ cat, rowY, color, tierNodes }) =>
        tierNodes.map((nodes, tierIdx) => {
          const nx = nodeXs[tierIdx];
          const tier = tierIdx + 1;

          if (nodes.length >= 2) {
            const forkX = nx - forkStartOffset;
            return (
              <g key={`node-${cat}-${tier}`}>
                {nodes.slice(0, 2).map((u, i) => {
                  const dy = i === 0 ? -forkOffset : forkOffset;
                  const state = nodeState(u);
                  const fill = nodeFill(state, color);
                  return (
                    <g key={u.id}>
                      <line
                        x1={forkX} y1={rowY} x2={nx} y2={rowY + dy}
                        stroke={color}
                        strokeWidth={1.5}
                        style={{ transformOrigin: `${forkX}px ${rowY}px`, animation: "hud-fork-grow 0.5s ease both" }}
                      />
                      <circle
                        cx={nx} cy={rowY + dy} r={6} fill={fill}
                        style={{ transition: "fill 0.6s ease", animation: state === "available" ? "hud-node-pulse 2.4s ease-in-out infinite" : "none" }}
                      >
                        <title>{nodeTitle(u, state)}</title>
                      </circle>
                    </g>
                  );
                })}
              </g>
            );
          }

          const u = nodes[0];
          if (!u) return null;
          const state = nodeState(u);
          const fill = nodeFill(state, color);
          return (
            <g key={`node-${cat}-${tier}`}>
              <circle
                cx={nx} cy={rowY} r={6} fill={fill}
                style={{ transition: "fill 0.6s ease", animation: state === "available" ? "hud-node-pulse 2.4s ease-in-out infinite" : "none" }}
              >
                <title>{nodeTitle(u, state)}</title>
              </circle>
            </g>
          );
        }),
      )}
    </svg>
  );
}
