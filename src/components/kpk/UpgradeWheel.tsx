import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UPGRADE_CATEGORIES, UPGRADE_CATEGORY_COLOR, UPGRADES, type UpgradeCategory, type UpgradeDef } from "@/lib/kpkData";
import { useKpk } from "@/lib/kpkStore";

const TIER_RADIUSES = { 1: 122, 2: 188, 3: 254 } as const;
const TIER_LIMITS = { 1: 3, 2: 2, 3: 1 } as const;

type NodeState = "purchased" | "available" | "locked";

function getNodeState(upgrades: string[], canPurchase: (id: string) => { ok: boolean; reason?: string }, u: UpgradeDef): { state: NodeState; reason?: string } {
  if (upgrades.includes(u.id)) return { state: "purchased" };
  const check = canPurchase(u.id);
  return { state: check.ok ? "available" : "locked", reason: check.reason };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function UpgradeWheel() {
  const { user, upgrades, canPurchase, purchaseUpgrade } = useKpk();
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragBase, setDragBase] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (event: MouseEvent) => {
      if (!dragStart) return;
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      setPanOffset({ x: dragBase.x + dx * 0.18, y: dragBase.y + dy * 0.18 });
    };
    const handleUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragBase, dragStart, isDragging]);

  const tierCounts = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0 } as Record<1 | 2 | 3, number>;
    for (const id of upgrades) {
      const tier = UPGRADES[id]?.tier;
      if (tier) counts[tier] += 1;
    }
    return counts;
  }, [upgrades]);

  const branchData = useMemo(() => {
    const nodesByBranch: Array<{ category: UpgradeCategory; color: string; nodes: UpgradeDef[]; branchAngle: number }> = [];
    UPGRADE_CATEGORIES.forEach((cat, index) => {
      const branchAngle = -90 + index * (360 / UPGRADE_CATEGORIES.length);
      const categoryNodes = Object.values(UPGRADES).filter((u) => u.category === cat);
      nodesByBranch.push({ category: cat, color: UPGRADE_CATEGORY_COLOR[cat], nodes: categoryNodes, branchAngle });
    });
    return nodesByBranch;
  }, []);

  const renderNodes = (category: UpgradeCategory, color: string, nodes: UpgradeDef[], branchAngle: number) => {
    const tierGroups = [1, 2, 3] as const;
    return tierGroups.flatMap((tier) => {
      const tierNodes = nodes.filter((u) => u.tier === tier);
      if (!tierNodes.length) return [];
      const positions = tierNodes.length === 1
        ? [{ x: 0, y: 0, labelOffsetX: 0, labelOffsetY: 0 }]
        : tierNodes.length === 2
          ? [{ x: -22, y: -10, labelOffsetX: -18, labelOffsetY: -10 }, { x: 22, y: 10, labelOffsetX: 18, labelOffsetY: 10 }]
          : [{ x: -30, y: -6, labelOffsetX: -24, labelOffsetY: -10 }, { x: 0, y: 12, labelOffsetX: 0, labelOffsetY: 16 }, { x: 30, y: -6, labelOffsetX: 24, labelOffsetY: -10 }];

      const previousTierNodes = nodes.filter((u) => u.tier === (tier === 1 ? 0 : tier - 1));
      const purchasedPrev = previousTierNodes.filter((u) => upgrades.includes(u.id));
      const anchorNode = purchasedPrev[0];
      const anchorUsed = purchasedPrev.length === 1 && anchorNode;

      return tierNodes.map((u, idx) => {
        const pos = positions[idx] ?? positions[positions.length - 1];
        const angleRad = (branchAngle * Math.PI) / 180;
        const rotatedOffsetX = pos.x * Math.cos(angleRad) - pos.y * Math.sin(angleRad);
        const rotatedOffsetY = pos.x * Math.sin(angleRad) + pos.y * Math.cos(angleRad);
        const radius = TIER_RADIUSES[tier];
        const baseX = Math.cos(angleRad) * radius + rotatedOffsetX;
        const baseY = Math.sin(angleRad) * radius + rotatedOffsetY;

        let offsetX = 0;
        let offsetY = 0;
        if (anchorUsed && tier > 1 && tierNodes.length > 0) {
          const anchorTier = anchorNode.tier;
          const anchorRadius = TIER_RADIUSES[anchorTier];
          const anchorX = Math.cos(angleRad) * anchorRadius;
          const anchorY = Math.sin(angleRad) * anchorRadius;
          const towardX = anchorX - baseX;
          const towardY = anchorY - baseY;
          const mag = Math.hypot(towardX, towardY) || 1;
          const push = clamp(24 / mag, 0, 0.24);
          offsetX = towardX * push;
          offsetY = towardY * push;
        }

        const nodeState = getNodeState(upgrades, canPurchase, u);
        const state = nodeState.state;
        const size = state === "available" ? 16 : 15;
        const isSelected = activeNodeId === u.id;
        const fill = state === "purchased" ? color : state === "available" ? "rgba(7, 10, 14, 0.72)" : "rgba(7, 10, 14, 0.72)";
        const stroke = state === "available" ? "var(--hud-amber)" : state === "purchased" ? color : color;
        const dash = state === "available" ? "5 4" : undefined;
        const icon = state === "purchased" ? "✓" : state === "available" ? "●" : "🔒";
        return (
          <motion.g
            key={u.id}
            layoutId={u.id}
            initial={false}
            animate={{
              x: baseX + offsetX + panOffset.x,
              y: baseY + offsetY + panOffset.y,
              scale: isSelected ? 1.18 : 1,
            }}
            transition={{ type: "spring", stiffness: 140, damping: 18, mass: 0.9 }}
            onClick={() => {
              if (state === "available") {
                purchaseUpgrade(u.id);
              }
              setActiveNodeId((prev) => prev === u.id ? null : u.id);
            }}
            className="cursor-pointer"
          >
            <motion.circle
              cx={0}
              cy={0}
              r={size + 5}
              fill="transparent"
              stroke={state === "available" ? "rgba(245, 184, 64, 0.35)" : "transparent"}
              strokeWidth={state === "available" ? 1.5 : 0}
              strokeDasharray={state === "available" ? "7 7" : undefined}
              animate={{ rotate: state === "available" ? 360 : 0 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "center" }}
            />
            <motion.circle
              cx={0}
              cy={0}
              r={size}
              fill={fill}
              stroke={stroke}
              strokeWidth={state === "locked" ? 1.5 : state === "available" ? 2 : 2}
              strokeDasharray={dash}
              animate={state === "available" ? { scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] } : { scale: 1, opacity: 1 }}
              transition={state === "available" ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
            />
            <circle cx={0} cy={0} r={size - 4} fill={state === "purchased" ? color : "transparent"} />
            <text x={0} y={0} textAnchor="middle" dominantBaseline="central" className="fill-[color:var(--foreground)] text-[0.62rem] font-semibold">
              {icon}
            </text>
            <text x={pos.labelOffsetX} y={pos.labelOffsetY} textAnchor="middle" className="fill-[color:var(--foreground)] text-[0.54rem] opacity-80" style={{ fontFamily: "var(--font-mono)" }}>
              {u.cost}
            </text>
          </motion.g>
        );
      });
    });
  };

  const hubLabel = user?.faction || "Угрупування";
  const activeNode = activeNodeId ? Object.values(UPGRADES).find((u) => u.id === activeNodeId) ?? null : null;
  const activeNodeState = activeNode ? getNodeState(upgrades, canPurchase, activeNode) : null;

  return (
    <div className="hud-panel-corners-4 hud-grid-bg relative overflow-hidden border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] p-4 sm:p-5">
      <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,184,64,0.08),transparent_70%)] hud-wheel-breathing" />
      <div className="relative z-10 flex flex-col gap-4">
        <div className="w-full">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="hud-label text-[0.6rem]">Глобальний ліміт ярусів</div>
            <div className="hud-mono text-[0.7rem] text-[color:var(--muted-foreground)]">
              I: <span className="text-[color:var(--hud-green)]">{tierCounts[1]}/{TIER_LIMITS[1]}</span>
              <span className="mx-2">·</span>
              II: <span className="text-[color:var(--hud-amber)]">{tierCounts[2]}/{TIER_LIMITS[2]}</span>
              <span className="mx-2">·</span>
              III: <span className="text-[color:var(--hud-cyan)]">{tierCounts[3]}/{TIER_LIMITS[3]}</span>
            </div>
          </div>
          <div
            className="relative mx-auto flex aspect-square max-w-[500px] items-center justify-center overflow-hidden rounded-full border border-[color:var(--hud-amber)]/20 bg-black/20"
            onPointerDown={(event) => {
              setIsDragging(true);
              setDragStart({ x: event.clientX, y: event.clientY });
              setDragBase(panOffset);
            }}
          >
            <svg viewBox="-320 -320 640 640" className="h-full w-full touch-none" role="img" aria-label="Радіальне дерево прокачок">
              <g>
                <circle cx={0} cy={0} r={92} fill="rgba(255,255,255,0.03)" stroke="rgba(245,184,64,0.25)" strokeDasharray="5 5" />
                <circle cx={0} cy={0} r={158} fill="transparent" stroke="rgba(245,184,64,0.15)" strokeDasharray="4 6" />
                <circle cx={0} cy={0} r={224} fill="transparent" stroke="rgba(245,184,64,0.12)" strokeDasharray="4 6" />
                {branchData.map((branch) => {
                  const angleRad = (branch.branchAngle * Math.PI) / 180;
                  const x = Math.cos(angleRad) * 280;
                  const y = Math.sin(angleRad) * 280;
                  return <line key={branch.category} x1={0} y1={0} x2={x} y2={y} stroke={branch.color} strokeWidth={1.2} strokeDasharray="8 6" opacity={0.75} />;
                })}
                <text x={0} y={-6} textAnchor="middle" className="fill-[color:var(--foreground)] text-[0.6rem] uppercase" style={{ fontFamily: "var(--font-display)" }}>
                  {hubLabel}
                </text>
                <circle cx={0} cy={0} r={36} fill="rgba(245,184,64,0.16)" stroke="rgba(245,184,64,0.55)" strokeWidth={1.5} />
                <circle cx={0} cy={0} r={28} fill="rgba(255,255,255,0.05)" stroke="rgba(245,184,64,0.35)" strokeWidth={1.5} />
                <text x={0} y={2} textAnchor="middle" className="fill-[color:var(--hud-amber)] text-[0.7rem]" style={{ fontFamily: "var(--font-display)" }}>
                  ★
                </text>
              </g>
              <g>
                {branchData.map((branch) => {
                  const groupNodes = renderNodes(branch.category, branch.color, branch.nodes, branch.branchAngle);
                  return <g key={branch.category}>{groupNodes}</g>;
                })}
              </g>
            </svg>
          </div>
        </div>

        <motion.div
          layoutId={activeNode ? activeNode.id : "hub"}
          initial={false}
          animate={{ scale: activeNode ? 1 : 1, opacity: 1 }}
          className="hud-panel-corners-4 w-full border border-[color:var(--hud-amber)]/25 bg-[color:var(--surface-3)]/85 p-4 shadow-[0_0_20px_rgba(0,0,0,0.25)]"
        >
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          <div className="mb-3 flex items-center justify-between">
            <div className="hud-label text-[0.6rem]">Опис</div>
            {activeNode ? (
              <button onClick={() => setActiveNodeId(null)} className="hud-btn hud-btn-ghost min-h-0 !px-2 !py-1 text-[0.6rem]">Закрити</button>
            ) : null}
          </div>
          {activeNode ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: UPGRADE_CATEGORY_COLOR[activeNode.category] }} />
                <div className="hud-title text-sm">{activeNode.name}</div>
              </div>
              <div className="hud-mono text-[0.72rem] text-[color:var(--muted-foreground)]">
                {activeNodeState?.state === "locked" ? activeNodeState.reason : `Вартість: ${activeNode.cost} · Ярус ${activeNode.tier}`}
              </div>
              <div className="rounded border border-[color:var(--hud-amber)]/20 bg-black/20 px-3 py-2 text-[0.78rem] text-[color:var(--foreground)]">
                {activeNodeState?.state === "locked"
                  ? activeNodeState.reason
                  : `Наразі: ${activeNodeState?.state === "purchased" ? "куплено" : activeNodeState?.state === "available" ? "доступно" : "блоковано"}`}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="hud-title text-lg text-[color:var(--hud-amber)]">{hubLabel}</div>
              <div className="hud-mono text-[0.72rem] text-[color:var(--muted-foreground)]">
                Центральний вузол дерева. Оберіть прокачку, щоб переглянути деталі й активувати її.
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
