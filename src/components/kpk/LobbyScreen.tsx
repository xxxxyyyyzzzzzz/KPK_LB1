import { useMemo, useState } from "react";
import { useKpk } from "@/lib/kpkStore";
import { FACTIONS } from "@/lib/kpkData";
import { sfx } from "@/lib/sounds";

const ORDINALS = ["Ходить першим", "Ходить другим", "Ходить третім", "Ходить четвертим"];

function qrUrl(text: string, size = 360) {
  const params = new URLSearchParams({
    data: text,
    size: `${size}x${size}`,
    bgcolor: "141a22",
    color: "f5b840",
    margin: "2",
    qzone: "2",
    ecc: "M",
    format: "png",
  });
  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

export function LobbyScreen() {
  const { roomCode, players, playerId, isHost, startGame, reorderPlayers, leaveSession } = useKpk();
  const [showQR, setShowQR] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  const joinLink = useMemo(() => {
    if (!roomCode) return "";
    try {
      return `${window.location.origin}/?room=${roomCode}`;
    } catch {
      return roomCode;
    }
  }, [roomCode]);

  if (!roomCode) return null;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(roomCode!);
      setCopied(true);
      sfx.confirm();
      setTimeout(() => setCopied(false), 1500);
    } catch {
      sfx.deny();
    }
  }

  function move(idx: number, dir: -1 | 1) {
    const order = players.map((p) => p.id);
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    [order[idx], order[j]] = [order[j], order[idx]];
    sfx.click();
    reorderPlayers(order);
  }

  async function onStart() {
    if (players.length < 2) {
      sfx.deny();
      return;
    }
    setStarting(true);
    await startGame();
    setStarting(false);
  }

  return (
    <div className="fixed inset-0 overflow-y-auto">
      <div className="min-h-full px-3 py-3 pb-3">
        <div
          className="hud-panel-corners-4 relative w-full border border-[color:var(--hud-amber)]/40 bg-[color:var(--surface-2)]/85 p-4 backdrop-blur-md"
          style={{ opacity: 0, animation: "hud-screen-in 0.45s cubic-bezier(0.2,0.8,0.2,1) 0.1s both" }}
        >
          <span className="corner tl" />
          <span className="corner tr" />
          <span className="corner bl" />
          <span className="corner br" />

          <div className="mb-5 overflow-hidden border-b border-[color:var(--hud-amber)]/30 py-[12px]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="hud-label">// ЛОБІ СЕСІЇ</div>
                <div className="hud-title text-2xl sm:text-3xl text-[color:var(--hud-amber)] hud-flicker">ОЧІКУВАННЯ ГРАВЦІВ</div>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-start">
                {isHost && (
                  <button onClick={() => setShowPlayers(true)} className="hud-btn hud-btn-ghost min-h-10 !py-1 !px-3">
                    Гравці
                  </button>
                )}
                <div className="hud-mono text-[0.65rem] sm:text-xs text-[color:var(--hud-cyan)] hud-blink">● WAITING</div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div className="hud-panel-corners-4 relative border border-[color:var(--hud-cyan)]/40 bg-black/30 p-4">
                <span className="corner tl" />
                <span className="corner tr" />
                <span className="corner bl" />
                <span className="corner br" />
                <div className="hud-title text-center text-4xl sm:text-5xl tracking-[0.4em] text-[color:var(--hud-cyan)] tabular-nums">
                  {roomCode}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button onClick={copyCode} className="hud-btn min-h-12 w-full" aria-label="Скопіювати код сесії">
                  {copied ? "✓ СКОПІЙОВАНО" : "⧉ СКОПІЮВАТИ КОД"}
                </button>
                <button
                  onClick={() => {
                    sfx.click();
                    setShowQR(true);
                  }}
                  className="hud-btn min-h-12 w-full"
                  aria-label="Показати QR-код"
                >
                  ▦ QR-КОД
                </button>
              </div>
              <p className="hud-mono text-center text-[0.7rem] text-[color:var(--muted-foreground)]">
                Передайте код або QR-код іншим гравцям
              </p>
            </div>
          </div>

          {/* Players */}
          <div className="mb-5">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="hud-label">Гравці у сесії · {players.length}/4</div>
              <div className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)]">
                {isHost ? "Перетягуйте порядок ходів" : "Чекайте на хоста"}
              </div>
            </div>
            <ul className="space-y-1.5" aria-label="Список гравців у лобі">
              {players.map((p, i) => {
                const color = FACTIONS[p.faction] ?? "#fff";
                const isMe = p.id === playerId;
                const isHostPlayer = i === 0;
                return (
                  <li
                    key={p.id}
                    style={{
                      opacity: 0,
                      animation: `hud-screen-in 0.35s cubic-bezier(0.2,0.8,0.2,1) ${i * 0.08}s both`,
                    }}
                    className={`hud-panel-corners-4 relative flex items-center gap-2 border px-2 py-1.5 ${
                      isMe ? "border-[color:var(--hud-amber)] bg-[color:var(--hud-amber)]/5" : "border-[color:var(--hud-amber)]/25 bg-black/20"
                    }`}
                  >
                    <span className="corner tl" />
                    <span className="corner tr" />
                    <span className="corner bl" />
                    <span className="corner br" />
                    <span className="hud-mono w-4 shrink-0 text-center text-[0.65rem] text-[color:var(--hud-amber)]">{i + 1}</span>
                    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="truncate hud-title text-xs text-[color:var(--foreground)]">
                          {p.nickname}{isMe ? " · ви" : ""}
                        </span>
                        {isHostPlayer && (
                          <span className="hud-mono shrink-0 rounded border border-[color:var(--hud-cyan)]/50 px-1 py-0 text-[0.5rem] text-[color:var(--hud-cyan)]">HOST</span>
                        )}
                      </div>
                      <div className="hud-mono text-[0.58rem] leading-3 text-[color:var(--muted-foreground)]">
                        {p.faction}
                        <span className="ml-1.5 text-[color:var(--hud-amber)]/60">{ORDINALS[i] ?? `Ходить ${i + 1}-м`}</span>
                      </div>
                    </div>
                    {isHost && players.length > 1 && (
                      <div className="flex shrink-0 flex-row gap-0.5">
                        <button
                          onClick={() => move(i, -1)}
                          disabled={i === 0}
                          className="hud-btn hud-btn-ghost min-h-0 !h-6 !w-7 !p-0 !text-[0.6rem] disabled:opacity-20"
                          aria-label={`Підняти ${p.nickname}`}
                        >▲</button>
                        <button
                          onClick={() => move(i, 1)}
                          disabled={i === players.length - 1}
                          className="hud-btn hud-btn-ghost min-h-0 !h-6 !w-7 !p-0 !text-[0.6rem] disabled:opacity-20"
                          aria-label={`Опустити ${p.nickname}`}
                        >▼</button>
                      </div>
                    )}
                  </li>
                );
              })}
              {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, i) => (
                <li
                  key={`empty-${i}`}
                  className="hud-mono flex items-center gap-2.5 border border-dashed border-[color:var(--hud-amber)]/15 px-2.5 py-2 text-[0.7rem] text-[color:var(--muted-foreground)]/60"
                >
                  <span className="w-5 text-center">{players.length + i + 1}</span>
                  <span className="opacity-60">очікування підключення...</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Start / leave */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button onClick={leaveSession} className="hud-btn hud-btn-ghost min-h-11" aria-label="Покинути лобі">
              ↶ Покинути лобі
            </button>
            {isHost ? (
              <button
                onClick={onStart}
                disabled={players.length < 2 || starting}
                className="hud-btn hud-btn-lg flex-1 sm:flex-none sm:px-8"
                aria-label="Розпочати гру"
              >
                {starting ? "..." : players.length < 2 ? "⏳ ПОТРІБНО ≥2 ГРАВЦІВ" : "▶ РОЗПОЧАТИ ГРУ"}
              </button>
            ) : (
              <span className="hud-mono text-center text-xs text-[color:var(--hud-cyan)] sm:text-right">
                ◌ Очікуємо, поки хост розпочне сесію...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>

      {showQR && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="QR-код для приєднання"
          onClick={() => setShowQR(false)}
        >
          <div
            className="hud-panel-corners-4 relative w-full max-w-sm border border-[color:var(--hud-amber)]/60 bg-[color:var(--surface-2)] p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />
            <div className="mb-3 flex items-center justify-between border-b border-[color:var(--hud-amber)]/30 pb-2">
              <div className="hud-title text-base text-[color:var(--hud-amber)]">// QR · {roomCode}</div>
              <button
                onClick={() => {
                  sfx.back();
                  setShowQR(false);
                }}
                className="hud-btn hud-btn-ghost min-h-0 !py-1 !px-2 !text-xs"
                aria-label="Закрити QR-код"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center justify-center rounded border border-[color:var(--hud-amber)]/30 bg-black/50 p-3">
              <img
                src={qrUrl(joinLink, 360)}
                alt={`QR-код для приєднання до сесії ${roomCode}`}
                width={300}
                height={300}
                className="block h-auto w-full max-w-[300px]"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <p className="hud-mono mt-3 break-all text-center text-[0.7rem] text-[color:var(--muted-foreground)]">
              {joinLink}
            </p>
          </div>
        </div>
      )}

      {showPlayers && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Гравці"
          onClick={() => setShowPlayers(false)}
        >
          <div
            className="hud-panel-corners-4 relative w-full max-w-md border border-[color:var(--hud-amber)]/60 bg-[color:var(--surface-2)] p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />
            <div className="mb-3 flex items-center justify-between border-b border-[color:var(--hud-amber)]/30 pb-2">
              <div className="hud-title text-base text-[color:var(--hud-amber)]">Гравці · Порядок ходів</div>
              <button onClick={() => setShowPlayers(false)} className="hud-btn hud-btn-ghost min-h-0 !py-1 !px-2 !text-xs">
                ✕
              </button>
            </div>
            <ul className="space-y-1.5">
              {players.map((p, i) => {
                const color = FACTIONS[p.faction] ?? "#fff";
                const isMe = p.id === playerId;
                const isHostPlayer = i === 0;
                return (
                  <li
                    key={p.id}
                    className={`hud-panel-corners-4 relative flex items-center gap-2.5 border px-2.5 py-2 ${
                      isMe ? "border-[color:var(--hud-amber)] bg-[color:var(--hud-amber)]/5" : "border-[color:var(--hud-amber)]/25 bg-black/20"
                    }`}
                  >
                    <span className="hud-mono w-5 shrink-0 text-center text-[0.7rem] text-[color:var(--hud-amber)]">{i + 1}</span>
                    <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate hud-title text-sm text-[color:var(--foreground)]">
                        {p.nickname}
                        {isMe ? " · ви" : ""}
                      </div>
                      <div className="hud-mono text-[0.62rem] leading-4 text-[color:var(--muted-foreground)]">
                        {p.faction}
                        <span className="ml-2 hud-mono text-[0.6rem] text-[color:var(--hud-amber)]/70">
                          {ORDINALS[i] ?? `Ходить ${i + 1}-м`}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-0.5">
                      <button onClick={() => move(i, -1)} disabled={i === 0} className="hud-btn hud-btn-ghost min-h-0 !py-0.5 !px-1.5 !text-[0.6rem]">
                        ▲
                      </button>
                      <button onClick={() => move(i, 1)} disabled={i === players.length - 1} className="hud-btn hud-btn-ghost min-h-0 !py-0.5 !px-1.5 !text-[0.6rem]">
                        ▼
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
