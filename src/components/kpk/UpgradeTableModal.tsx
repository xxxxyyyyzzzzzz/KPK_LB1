import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { UPGRADE_CATEGORIES, UPGRADE_CATEGORY_COLOR, UPGRADES } from "@/lib/kpkData";

export function UpgradeTableModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  if (!open || typeof document === "undefined" || !document.body) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/80 p-4 sm:p-6" onClick={onClose}>
      <div
        className="mx-auto flex h-full max-h-[calc(100dvh-3rem)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-1)] p-5 shadow-[0_0_40px_rgba(0,0,0,0.55)] sm:p-7"
        onClick={(e) => e.stopPropagation()}
        style={{ transform: mounted ? "translate(0,0) scale(1)" : "translateY(12px) scale(0.98)", transition: "transform 240ms ease" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="hud-title text-lg text-[color:var(--hud-amber)]">Таблиця прокачок</h3>
          <button onClick={onClose} className="hud-btn hud-btn-ghost min-h-0 !px-3 !py-1.5 text-[0.7rem]">Закрити</button>
        </div>
        <div className="overflow-auto rounded border border-[color:var(--hud-amber)]/20 bg-[color:var(--surface-2)] p-2">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-[color:var(--hud-amber)]">Ярус</th>
                {UPGRADE_CATEGORIES.map((cat) => (
                  <th key={cat} className="px-3 py-2" style={{ color: UPGRADE_CATEGORY_COLOR[cat] }}>
                    {cat}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((tier) => (
                <tr key={tier} className="border-t border-[color:var(--hud-amber)]/10">
                  <td className="px-3 py-2 text-[color:var(--hud-amber)]">{tier === 1 ? "I" : tier === 2 ? "II" : "III"}</td>
                  {UPGRADE_CATEGORIES.map((cat) => {
                    const nodes = Object.values(UPGRADES).filter((u) => u.category === cat && u.tier === tier);
                    return (
                      <td key={`${cat}-${tier}`} className="px-3 py-2 align-top">
                        <div className="space-y-2">
                          {nodes.map((u) => (
                            <div key={u.id} className="hud-mono text-[0.72rem] text-[color:var(--foreground)]/90">{u.name}</div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>,
    document.body,
  );
}
