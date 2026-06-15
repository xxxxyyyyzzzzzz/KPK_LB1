import { useEffect, useRef, useState } from "react";
import factionsJson from "@/data/factions.json";
import { useKpk } from "@/lib/kpkStore";
import { sfx } from "@/lib/sounds";

const FACTIONS: Record<string, string> = factionsJson as Record<string, string>;

type Mode = "menu" | "create" | "join";

function humanError(reason?: string): string {
  if (!reason) return "Невідома помилка. Спробуйте ще раз.";
  const r = reason.toLowerCase();
  if (r.includes("не знайдено")) return "Сесію не знайдено. Перевірте код.";
  if (r.includes("4 символ")) return "Невірний код — потрібно рівно 4 символи.";
  if (r.includes("заповнен")) return "У цій сесії вже немає вільних місць (4/4).";
  if (r.includes("угрупуван")) return "Це угрупування вже зайняте у сесії.";
  if (r.includes("нікнейм")) return "Введіть позивний оперативника.";
  if (r.includes("оберіть")) return "Оберіть угрупування зі списку.";
  if (r.includes("network") || r.includes("offline") || r.includes("зв'яз")) return "Немає зв'язку з сервером.";
  return reason;
}

export function LoginScreen() {
  const { createGame, joinGame, takenFactions } = useKpk();
  const [mode, setMode] = useState<Mode>("menu");
  const [code, setCode] = useState("");
  const [nickname, setNick] = useState("");
  const [faction, setFaction] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [taken, setTaken] = useState<string[]>([]);

  const takenFactionsRef = useRef(takenFactions);
  useEffect(() => { takenFactionsRef.current = takenFactions; }, [takenFactions]);

  useEffect(() => {
    if (mode !== "join") { setTaken((p) => p.length === 0 ? p : []); return; }
    const c = code.trim().toUpperCase();
    if (c.length !== 4) { setTaken((p) => p.length === 0 ? p : []); return; }
    let cancelled = false;
    takenFactionsRef.current(c).then((t) => { if (!cancelled) setTaken(t); });
    return () => { cancelled = true; };
  }, [mode, code]);

  async function submit() {
    if (!nickname.trim()) { setErr(humanError("Введіть нікнейм")); sfx.deny(); return; }
    if (!faction) { setErr(humanError("Оберіть угрупування")); sfx.deny(); return; }
    if (mode === "join") {
      const c = code.trim().toUpperCase();
      if (c.length !== 4) { setErr(humanError("Код — 4 символи")); sfx.deny(); return; }
      if (taken.includes(faction)) { setErr(humanError("Угрупування зайняте")); sfx.deny(); return; }
    }
    setErr(""); setBusy(true);
    const u = { nickname: nickname.trim().toUpperCase(), faction };
    const r = mode === "create" ? await createGame(u) : await joinGame(code, u);
    setBusy(false);
    if (!r.ok) setErr(humanError(r.reason));
  }

  return (
    <div className="hud-screen-enter safe-pt safe-pb flex h-full w-full items-center justify-center px-4 sm:px-6">
      <div
        className="hud-panel-corners-4 relative w-full max-w-md sm:max-w-[560px] lg:max-w-[620px] border border-[color:var(--hud-amber)]/40 bg-[color:var(--surface-2)]/85 p-5 sm:p-8 backdrop-blur-md"
        role="dialog"
        aria-labelledby="login-title"
      >
        <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />

        <div className="mb-6 flex items-start justify-between gap-3 border-b border-[color:var(--hud-amber)]/30 pb-3">
          <div className="min-w-0">
            <div className="hud-label">// СИСТЕМА КПК v1.0</div>
            <div
              id="login-title"
              className="hud-title text-2xl sm:text-3xl text-[color:var(--hud-amber)] hud-flicker"
            >
              {mode === "menu" ? "ТАКТИЧНА СЕСІЯ" : mode === "create" ? "СТВОРИТИ СЕСІЮ" : "ПРИЄДНАТИСЯ"}
            </div>
            <p className="hud-mono mt-1 text-[0.72rem] sm:text-xs text-[color:var(--muted-foreground)]">
              {mode === "menu"
                ? "Створіть нову сесію або приєднайтесь за кодом"
                : mode === "create"
                  ? "Заповніть профіль оперативника"
                  : "Введіть код сесії та оберіть угрупування"}
            </p>
          </div>
          <div className="hud-mono shrink-0 text-[0.65rem] sm:text-xs text-[color:var(--hud-cyan)] hud-blink">● ONLINE</div>
        </div>

        {mode === "menu" && (
          <div className="space-y-3">
            <button
              onClick={() => { sfx.click(); setMode("create"); setErr(""); }}
              className="hud-btn hud-btn-lg w-full text-base"
              aria-label="Створити нову тактичну сесію"
            >
              ⊕ СТВОРИТИ ГРУ
            </button>
            <button
              onClick={() => { sfx.click(); setMode("join"); setErr(""); }}
              className="hud-btn hud-btn-lg w-full text-base"
              style={{
                color: "var(--hud-cyan)",
                borderColor: "rgba(108,240,255,0.55)",
                background: "linear-gradient(180deg, rgba(108,240,255,0.10), rgba(108,240,255,0.02))",
              }}
              aria-label="Приєднатися до існуючої сесії"
            >
              ⇆ ПРИЄДНАТИСЯ ДО ГРИ
            </button>
            <p className="hud-mono pt-2 text-center text-[0.7rem] text-[color:var(--muted-foreground)]">
              До 4 гравців · унікальне угрупування для кожного
            </p>
          </div>
        )}

        {mode !== "menu" && (
          <div className="space-y-4">
            {mode === "join" && (
              <div>
                <label htmlFor="room-code" className="hud-label mb-1.5 block">Код сесії</label>
                <input
                  id="room-code"
                  name="room-code"
                  autoComplete="off"
                  inputMode="text"
                  aria-label="Код сесії (4 символи)"
                  className="hud-input text-center text-lg uppercase tracking-[0.5em]"
                  placeholder="Код сесії"
                  value={code}
                  maxLength={4}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
              </div>
            )}
            <div>
              <label htmlFor="nickname" className="hud-label mb-1.5 block">Позивний оперативника</label>
              <input
                id="nickname"
                name="nickname"
                autoComplete="off"
                aria-label="Позивний оперативника"
                className="hud-input"
                placeholder="введіть позивний..."
                value={nickname}
                onChange={(e) => setNick(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>

            <div>
              <div className="hud-label mb-1.5">Угрупування</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(FACTIONS).map(([name, color]) => {
                  const isTaken = taken.includes(name);
                  const selected = faction === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      disabled={isTaken}
                      aria-pressed={selected}
                      aria-label={`Угрупування ${name}${isTaken ? " — зайняте" : ""}`}
                      onClick={() => { if (isTaken) return; sfx.click(); setFaction(name); }}
                      className={`hud-mono relative min-h-11 border px-3 py-2.5 text-left text-sm transition-all ${
                        isTaken
                          ? "border-[color:var(--muted-foreground)]/20 bg-black/30 opacity-40 cursor-not-allowed line-through"
                          : selected
                            ? "border-[color:var(--hud-amber)] bg-[color:var(--hud-amber)]/10 shadow-[0_0_12px_rgba(245,184,64,0.25)]"
                            : "border-[color:var(--hud-amber)]/25 hover:border-[color:var(--hud-amber)]/60 active:translate-y-px"
                      }`}
                      data-hud-sound="hover"
                    >
                      <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                      {name}{isTaken ? " · зайнято" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { sfx.back(); setMode("menu"); setErr(""); }}
                className="hud-btn hud-btn-ghost min-h-11 px-4"
                aria-label="Повернутись назад"
              >↶ Назад</button>
              <button
                onClick={submit}
                disabled={busy}
                className="hud-btn hud-btn-lg flex-1"
                aria-label={mode === "create" ? "Створити сесію" : "Підключитися до сесії"}
              >
                {busy ? "..." : mode === "create" ? "⊕ СТВОРИТИ" : "⌬ ПІДКЛЮЧИТИСЯ"}
              </button>
            </div>

            {err && (
              <p
                role="alert"
                className="hud-mono rounded border border-[color:var(--hud-red)]/40 bg-[color:var(--hud-red)]/10 px-3 py-2 text-center text-sm text-[color:var(--hud-red)]"
              >◂ {err}</p>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-[color:var(--hud-amber)]/20 pt-3 text-[0.65rem] hud-mono text-[color:var(--muted-foreground)]">
          <span>NET: ZONE-7</span>
          <span>SIG: <span className="text-[color:var(--hud-green)]">▮▮▮▮</span></span>
          <span>2026.06.10</span>
        </div>
      </div>
    </div>
  );
}
