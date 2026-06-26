import { useEffect, useMemo, useRef, useState } from "react";
import factionsJson from "@/data/factions.json";
import { useKpk } from "@/lib/kpkStore";
import { useSession, readSession } from "@/hooks/useSession";
import { sfx } from "@/lib/sounds";

const FACTIONS: Record<string, string> = factionsJson as Record<string, string>;

type Mode = "menu" | "create" | "join_code" | "join_player";

const ORDINALS = ["Ходить першим", "Ходить другим", "Ходить третім", "Ходить четвертим"];

function humanError(reason?: string): string {
  if (!reason) return "Невідома помилка. Спробуйте ще раз.";
  const r = reason.toLowerCase();
  if (r.includes("не знайдено")) return "Сесію не знайдено. Перевірте код.";
  if (r.includes("4 символ")) return "Невірний код — потрібно рівно 4 символи.";
  if (r.includes("заповнен")) return "У цій сесії вже немає вільних місць (4/4).";
  if (r.includes("угрупуван")) return "Це угрупування вже зайняте у сесії.";
  if (r.includes("нікнейм")) return "Введіть позивний оперативника.";
  if (r.includes("оберіть")) return "Оберіть угрупування зі списку.";
  if (r.includes("гравця не знайдено")) return "Цей акаунт уже відсутній у сесії.";
  if (r.includes("network") || r.includes("offline") || r.includes("зв'яз")) return "Немає зв'язку з сервером.";
  return reason;
}

export function LoginScreen() {
  const { createGame, joinGame, rejoinAs, reorderPlayers } = useKpk();
  const [mode, setMode] = useState<Mode>("menu");
  const [code, setCode] = useState("");
  const [connectedCode, setConnectedCode] = useState<string | null>(null);
  const [nickname, setNick] = useState("");
  const [faction, setFaction] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);

  // Live snapshot of the session once code is verified (re-renders on Firebase onValue)
  const peeked = useSession(connectedCode);

  const takenFactions = useMemo(
    () => peeked ? Object.values(peeked.players ?? {}).map((p) => p.faction) : [],
    [peeked],
  );

  const existingPlayers = useMemo(() => {
    if (!peeked) return [];
    const order = peeked.player_order?.length ? peeked.player_order : Object.keys(peeked.players ?? {});
    return order
      .filter((id) => !!peeked.players?.[id])
      .map((id) => ({ id, nickname: peeked.players[id].nickname, faction: peeked.players[id].faction }));
  }, [peeked]);

  // Keep localOrder in sync with live order when not actively dragging
  const draggingRef = useRef(false);
  useEffect(() => {
    if (draggingRef.current) return;
    setLocalOrder(existingPlayers.map((p) => p.id));
  }, [existingPlayers]);

  async function connect() {
    const c = code.trim().toUpperCase();
    if (c.length !== 4) { setErr(humanError("4 символи")); sfx.deny(); return; }
    setErr(""); setBusy(true);
    try {
      const s = await readSession(c);
      if (!s) { setErr(humanError("Сесію не знайдено")); sfx.deny(); setBusy(false); return; }
      setConnectedCode(c);
      setMode("join_player");
      sfx.confirm();
    } catch {
      setErr("Немає зв'язку з сервером."); sfx.deny();
    } finally {
      setBusy(false);
    }
  }

  async function submitCreate() {
    if (!nickname.trim()) { setErr(humanError("Введіть нікнейм")); sfx.deny(); return; }
    if (!faction) { setErr(humanError("Оберіть угрупування")); sfx.deny(); return; }
    setErr(""); setBusy(true);
    const r = await createGame({ nickname: nickname.trim().toUpperCase(), faction });
    setBusy(false);
    if (!r.ok) setErr(humanError(r.reason));
  }

  async function submitJoinNew() {
    if (!connectedCode) return;
    if (!nickname.trim()) { setErr(humanError("Введіть нікнейм")); sfx.deny(); return; }
    if (!faction) { setErr(humanError("Оберіть угрупування")); sfx.deny(); return; }
    if (takenFactions.includes(faction)) { setErr(humanError("Угрупування зайняте")); sfx.deny(); return; }
    setErr(""); setBusy(true);
    const r = await joinGame(connectedCode, { nickname: nickname.trim().toUpperCase(), faction });
    setBusy(false);
    if (!r.ok) setErr(humanError(r.reason));
  }

  async function pickExisting(pid: string) {
    if (!connectedCode) return;
    sfx.click(); setErr(""); setBusy(true);
    const r = await rejoinAs(connectedCode, pid);
    setBusy(false);
    if (!r.ok) setErr(humanError(r.reason));
  }

  // ── Drag-and-drop reorder (HTML5 DnD with up/down fallback) ──
  const dragFromRef = useRef<number | null>(null);

  function commitOrder(next: string[]) {
    setLocalOrder(next);
    reorderPlayers(next); // host validates; safe no-op for non-hosts
  }

  function onDragStart(idx: number) {
    draggingRef.current = true;
    dragFromRef.current = idx;
  }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  function onDrop(idx: number) {
    const from = dragFromRef.current;
    dragFromRef.current = null;
    draggingRef.current = false;
    if (from == null || from === idx || !localOrder) return;
    const next = [...localOrder];
    const [moved] = next.splice(from, 1);
    next.splice(idx, 0, moved);
    sfx.click();
    commitOrder(next);
  }
  function nudge(i: number, dir: -1 | 1) {
    if (!localOrder) return;
    const j = i + dir;
    if (j < 0 || j >= localOrder.length) return;
    const next = [...localOrder];
    [next[i], next[j]] = [next[j], next[i]];
    sfx.click();
    commitOrder(next);
  }

  function goBack() {
    sfx.back();
    setErr("");
    setNick("");
    setFaction("");
    if (mode === "join_player") {
      setConnectedCode(null);
      setMode("join_code");
    } else if (mode === "create" || mode === "join_code") {
      setMode("menu");
    } else {
      setMode("menu");
    }
  }

  const title =
    mode === "menu" ? "ТАКТИЧНА СЕСІЯ" :
    mode === "create" ? "СТВОРИТИ СЕСІЮ" :
    mode === "join_code" ? "КОД СЕСІЇ" : "ВХІД У СЕСІЮ";

  const subtitle =
    mode === "menu" ? "Створіть нову сесію або приєднайтесь за кодом" :
    mode === "create" ? "Заповніть профіль оперативника" :
    mode === "join_code" ? "Введіть 4-символьний код тактичної сесії" :
    `Сесія ${connectedCode} · оберіть акаунт або створіть нового оперативника`;

  const topMode = mode === "create" || mode === "join_code" || mode === "join_player";

  return (
    <div className="hud-screen-enter safe-pb safe-px flex h-full w-full justify-center items-center" style={{ paddingTop: topMode ? '12px' : undefined, overflowY: 'auto', minHeight: 0 }}>
      <div className="hud-scroll min-h-0 w-full max-w-md sm:max-w-[560px] lg:max-w-[620px] max-h-[calc(100vh-5.5rem)] overflow-y-auto py-4 sm:py-6" style={{ minHeight: 0 }}>
        <div
          className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/40 bg-[color:var(--surface-2)]/85 p-5 sm:p-8 backdrop-blur-md"
          role="dialog"
          aria-labelledby="login-title"
        >
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />

          <div className="mb-6 flex items-start justify-between gap-3 border-b border-[color:var(--hud-amber)]/30 pb-3">
            <div className="min-w-0">
              <div className="hud-label">// СИСТЕМА КПК v1.0</div>
              <div id="login-title" className="hud-title text-2xl sm:text-3xl text-[color:var(--hud-amber)] hud-flicker">
                {title}
              </div>
              <p className="hud-mono mt-1 text-[0.72rem] sm:text-xs text-[color:var(--muted-foreground)]">
                {subtitle}
              </p>
            </div>
            <div className="hud-mono shrink-0 text-[0.65rem] sm:text-xs text-[color:var(--hud-cyan)] hud-blink">● ONLINE</div>
          </div>

          {/* === MENU === */}
          {mode === "menu" && (
            <div className="space-y-3">
              <button
                onClick={() => { sfx.click(); setMode("create"); setErr(""); }}
                className="hud-btn hud-btn-lg w-full text-base"
                aria-label="Створити нову тактичну сесію"
              >⊕ СТВОРИТИ ГРУ</button>
              <button
                onClick={() => { sfx.click(); setMode("join_code"); setErr(""); }}
                className="hud-btn hud-btn-lg w-full text-base"
                style={{
                  color: "var(--hud-cyan)",
                  borderColor: "rgba(108,240,255,0.55)",
                  background: "linear-gradient(180deg, rgba(108,240,255,0.10), rgba(108,240,255,0.02))",
                }}
                aria-label="Приєднатися до існуючої сесії"
              >⇆ ПРИЄДНАТИСЯ ДО ГРИ</button>
              <button
                onClick={async () => {
                  sfx.click();
                  setErr(""); setBusy(true);
                  // Тестова сесія: випадкові ім'я та угрупування з вільних
                  const factionsList = Object.keys(FACTIONS);
                  const testNick = "TEST_" + Math.random().toString(36).slice(2, 6).toUpperCase();
                  const testFaction = factionsList[Math.floor(Math.random() * factionsList.length)];
                  const r = await createGame({ nickname: testNick, faction: testFaction }, { isTest: true });
                  setBusy(false);
                  if (!r.ok) setErr(humanError(r.reason));
                }}
                disabled={busy}
                className="hud-btn hud-btn-ghost w-full text-sm"
                aria-label="Створити тестову гру (не зберігається в історії)"
                title="Окрема сесія з прапором isTest — не показуватиметься в історії"
              >🧪 ТЕСТОВА ГРА</button>
              <p className="hud-mono pt-2 text-center text-[0.7rem] text-[color:var(--muted-foreground)]">
                До 4 гравців · унікальне угрупування для кожного
              </p>
            </div>
          )}

          {/* === JOIN STEP 1: CODE === */}
          {mode === "join_code" && (
            <div className="space-y-4">
              <div>
                <label htmlFor="room-code" className="hud-label mb-1.5 block">Код сесії</label>
                <input
                  id="room-code"
                  name="room-code"
                  autoComplete="off"
                  inputMode="text"
                  aria-label="Код сесії (4 символи)"
                  className="hud-input text-center text-lg uppercase tracking-[0.5em]"
                  placeholder="ABCD"
                  value={code}
                  maxLength={4}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && connect()}
                />
                <p className="hud-mono mt-2 text-center text-[0.7rem] text-[color:var(--muted-foreground)]">
                  4 символи · отримайте код від хоста сесії
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={goBack} className="hud-btn hud-btn-ghost min-h-11 px-4" aria-label="Назад">↶ Назад</button>
                <button
                  onClick={connect}
                  disabled={busy || code.trim().length !== 4}
                  className="hud-btn hud-btn-lg flex-1"
                  aria-label="Підключитися до сесії"
                >{busy ? "..." : "⌬ ПІДКЛЮЧИТИСЯ"}</button>
              </div>
              {err && (
                <p role="alert" className="hud-mono rounded border border-[color:var(--hud-red)]/40 bg-[color:var(--hud-red)]/10 px-3 py-2 text-center text-sm text-[color:var(--hud-red)]">◂ {err}</p>
              )}
            </div>
          )}

          {/* === JOIN STEP 2: PICK PLAYER OR JOIN NEW === */}
          {mode === "join_player" && (
            <div className="space-y-5">
              {/* Existing kicked/disconnected accounts */}
              <section>
                <div className="hud-label mb-1.5">Акаунти у сесії · {existingPlayers.length}/4</div>
                {existingPlayers.length === 0 ? (
                  <p className="hud-mono rounded border border-[color:var(--hud-amber)]/20 bg-black/20 px-3 py-2 text-[0.75rem] text-[color:var(--muted-foreground)]">
                    Поки немає створених гравців.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {existingPlayers.map((p) => {
                      const color = FACTIONS[p.faction] ?? "#fff";
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => pickExisting(p.id)}
                            disabled={busy}
                            className="hud-panel-corners-4 hud-mono relative flex w-full items-center gap-3 border border-[color:var(--hud-cyan)]/40 bg-black/30 px-3 py-3 text-left transition-all hover:border-[color:var(--hud-cyan)] hover:bg-[color:var(--hud-cyan)]/5 active:translate-y-px"
                            aria-label={`Увійти як ${p.nickname}`}
                          >
                            <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
                            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                            <div className="min-w-0 flex-1">
                              <div className="truncate hud-title text-base text-[color:var(--foreground)]">{p.nickname}</div>
                              <div className="text-[0.7rem] text-[color:var(--muted-foreground)]">{p.faction}</div>
                            </div>
                            <span className="hud-mono text-[0.65rem] text-[color:var(--hud-cyan)]">↩ УВІЙТИ</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-[color:var(--hud-amber)]/20" />
                <span className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)]">АБО</span>
                <span className="h-px flex-1 bg-[color:var(--hud-amber)]/20" />
              </div>

              {/* New player */}
              <section className="space-y-3">
                <div className="hud-label">Новий оперативник</div>
                <input
                  id="nickname"
                  name="nickname"
                  autoComplete="off"
                  aria-label="Позивний оперативника"
                  className="hud-input"
                  placeholder="введіть позивний..."
                  value={nickname}
                  onChange={(e) => setNick(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitJoinNew()}
                />
                <div>
                  <div className="hud-label mb-1.5">Угрупування</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(FACTIONS).map(([name, color]) => {
                      const isTaken = takenFactions.includes(name);
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
                <button
                  onClick={submitJoinNew}
                  disabled={busy || !nickname.trim() || !faction}
                  className="hud-btn hud-btn-lg w-full"
                  aria-label="Увійти як новий гравець"
                >{busy ? "..." : "⊕ УВІЙТИ ЯК НОВИЙ ГРАВЕЦЬ"}</button>
              </section>

              {/* Turn-order drag block (only meaningful with ≥2 players) - hidden for join flow */}
              {(localOrder?.length ?? 0) >= 2 && mode !== "join_player" && (
                <section>
                  <div className="hud-label mb-1.5">Порядок ходів · перетягніть гравців</div>
                  <ul className="space-y-2" aria-label="Слоти порядку ходів">
                    {localOrder!.map((pid, i) => {
                      const p = peeked?.players?.[pid];
                      if (!p) return null;
                      const color = FACTIONS[p.faction] ?? "#fff";
                      return (
                        <li
                          key={pid}
                          draggable
                          onDragStart={() => onDragStart(i)}
                          onDragOver={onDragOver}
                          onDrop={() => onDrop(i)}
                          className="hud-panel-corners-4 relative flex cursor-grab items-center gap-3 border border-[color:var(--hud-amber)]/30 bg-black/25 px-3 py-2.5 active:cursor-grabbing"
                        >
                          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
                          <span className="hud-mono w-6 shrink-0 text-center text-[color:var(--hud-amber)]">{i + 1}</span>
                          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate hud-title text-sm text-[color:var(--foreground)]">{p.nickname}</div>
                            <div className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)]">
                              {p.faction} · <span className="text-[color:var(--hud-amber)]/70">{ORDINALS[i] ?? `Ходить ${i + 1}-м`}</span>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col gap-1">
                            <button
                              onClick={() => nudge(i, -1)}
                              disabled={i === 0}
                              className="hud-btn hud-btn-ghost min-h-0 !py-0.5 !px-2 !text-xs"
                              aria-label={`Підняти ${p.nickname}`}
                            >▲</button>
                            <button
                              onClick={() => nudge(i, 1)}
                              disabled={i === (localOrder!.length - 1)}
                              className="hud-btn hud-btn-ghost min-h-0 !py-0.5 !px-2 !text-xs"
                              aria-label={`Опустити ${p.nickname}`}
                            >▼</button>
                          </div>
                          <span className="hud-mono shrink-0 text-[0.6rem] text-[color:var(--hud-cyan)]/60">⋮⋮</span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="hud-mono mt-2 text-center text-[0.65rem] text-[color:var(--muted-foreground)]">
                    Зміни підтверджуються хостом сесії
                  </p>
                </section>
              )}

              <button onClick={goBack} className="hud-btn hud-btn-ghost min-h-11 w-full" aria-label="Назад до коду сесії">
                ↶ Назад до коду
              </button>

              {err && (
                <p role="alert" className="hud-mono rounded border border-[color:var(--hud-red)]/40 bg-[color:var(--hud-red)]/10 px-3 py-2 text-center text-sm text-[color:var(--hud-red)]">◂ {err}</p>
              )}
            </div>
          )}

          {/* === CREATE === */}
          {mode === "create" && (
            <div className="space-y-4">
              <div>
                <label htmlFor="nickname-create" className="hud-label mb-1.5 block">Позивний оперативника</label>
                <input
                  id="nickname-create"
                  name="nickname"
                  autoComplete="off"
                  aria-label="Позивний оперативника"
                  className="hud-input"
                  placeholder="введіть позивний..."
                  value={nickname}
                  onChange={(e) => setNick(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitCreate()}
                />
              </div>
              <div>
                <div className="hud-label mb-1.5">Угрупування</div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(FACTIONS).map(([name, color]) => {
                    const selected = faction === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        aria-pressed={selected}
                        aria-label={`Угрупування ${name}`}
                        onClick={() => { sfx.click(); setFaction(name); }}
                        className={`hud-mono relative min-h-11 border px-3 py-2.5 text-left text-sm transition-all ${
                          selected
                            ? "border-[color:var(--hud-amber)] bg-[color:var(--hud-amber)]/10 shadow-[0_0_12px_rgba(245,184,64,0.25)]"
                            : "border-[color:var(--hud-amber)]/25 hover:border-[color:var(--hud-amber)]/60 active:translate-y-px"
                        }`}
                        data-hud-sound="hover"
                      >
                        <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={goBack} className="hud-btn hud-btn-ghost min-h-11 px-4" aria-label="Назад">↶ Назад</button>
                <button
                  onClick={submitCreate}
                  disabled={busy}
                  className="hud-btn hud-btn-lg flex-1"
                  aria-label="Створити сесію"
                >{busy ? "..." : "⊕ СТВОРИТИ"}</button>
              </div>
              {err && (
                <p role="alert" className="hud-mono rounded border border-[color:var(--hud-red)]/40 bg-[color:var(--hud-red)]/10 px-3 py-2 text-center text-sm text-[color:var(--hud-red)]">◂ {err}</p>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-[color:var(--hud-amber)]/20 pt-3 text-[0.65rem] hud-mono text-[color:var(--muted-foreground)]">
            <span>NET: ZONE-7</span>
            <span>SIG: <span className="text-[color:var(--hud-green)]">▮▮▮▮</span></span>
            <span>2026.06.15</span>
          </div>
        </div>
      </div>
    </div>
  );
}
