import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type CurrencyPayoutModalProps = {
  open: boolean;
  amount: number;
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
};

export function CurrencyPayoutModal({ open, amount, onConfirm, onCancel, onClose }: CurrencyPayoutModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  if (!open || typeof document === "undefined" || !document.body) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-6" onClick={onClose}>
      <div
        className="mx-auto flex max-h-[calc(100dvh-3rem)] w-full max-w-xl flex-col overflow-y-auto rounded-3xl border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-1)] p-6 shadow-[0_0_40px_rgba(0,0,0,0.45)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: mounted ? "translate(0,0) scale(1)" : "translateY(8px) scale(0.96)",
          transition: "transform 240ms ease, opacity 240ms ease",
          opacity: mounted ? 1 : 0,
        }}
      >
        <h3 className="hud-title mb-3 text-lg text-[color:var(--hud-amber)]">Виплата валюти</h3>
        <div className="hud-mono mb-3 text-4xl text-[color:var(--hud-cyan)]">+{amount} ⛁</div>
        <p className="hud-mono text-[0.82rem] leading-6 text-[color:var(--foreground)]">
          Підтвердіть отримання валюти з банку перед завершенням ходу.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button onClick={onCancel} className="hud-btn hud-btn-ghost flex-1">Скасувати</button>
          <button onClick={onConfirm} className="hud-btn flex-1">Отримано ✓</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
