import { useState } from "react";
import { ScreenShell, AnimatedItem } from "./ScreenShell";
import { useKpk, fmtClock, fmtSession } from "@/lib/kpkStore";
import { sfx } from "@/lib/sounds";

const BOTS = [
  { name: "Мутанти", info: "Сова сидить. Лисиця їсть предмети. Ведмідь — до найближчої будівлі. Темна гонча — до пораненого. Лісовик/Болотник — на солдатів у траві. Криси — стадом до будівель. Демон руйнує будівлі. Псевдогігант атакує техніку. Король павуків — у центр." },
  { name: "Зомбі", info: null },
  { name: "Воля", info: "Збирає предмети, об'єднується з угрупуванням, разом ідуть на Обов'язок. Атакує — інші підтримують." },
  { name: "Обов'язок", info: "Збирає предмети, об'єднується з угрупуванням, разом ідуть на Волю." },
  { name: "Нанокс", info: "Збирає шматки мутантів. Йдуть до Псі-випромінювача. Троє в одному секторі починають будувати випромінювач." },
  { name: "Транспорт Нанокс", info: "Йде до найближчого Нанокса. Без нього — за 2 раунди спавнить бійця." },
];

export function TimerScreen() {
  const {
    user, round, turn, sessionSeconds, sessionStartedAt, sessionTimerRunning,
    turnSeconds, turnRunning,
    toggleTurn, toggleSessionTimer, nextPlayer,
    isMyTurn, isHost, activePlayerId, sessionPlayers,
  } = useKpk();
  const [openBot, setOpenBot] = useState<string | null>(null);
  const ending = turnSeconds <= 30;
  const canAdvance = isMyTurn || isHost;
  const activePlayer = sessionPlayers.find((p) => p.id === activePlayerId);
  const activeName = activePlayer?.nickname ?? user?.nickname ?? "—";

  const playersCount = Math.max(1, sessionPlayers?.length ?? 1);
  const totalTurns = playersCount * 4;
  const isBotsTurn = (turn % 4) === 0;

  return (
    <ScreenShell title="Таймер">
      <div className="mx-auto max-w-2xl space-y-5">

        <AnimatedItem index={0}>
          <div className="text-center hud-mono text-xs text-[color:var(--muted-foreground)]">
            Новина {round} / Хід {turn} з {totalTurns}
          </div>
        </AnimatedItem>

        {/* Загальний час сесії */}
        <AnimatedItem index={1}>
          <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] px-4 py-3">
            <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="hud-label">Загальний час сесії</div>
                <div className="hud-mono text-lg tabular-nums text-[color:var(--hud-cyan)] mt-1">{fmtSession(sessionSeconds)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { sfx.click(); toggleSessionTimer(); }}
                  aria-label={sessionTimerRunning ? "Пауза загального часу" : "Продовжити загальний час"}
                  className="hud-btn hud-btn-ghost px-3 py-2 min-w-[110px]"
                >
                  {sessionTimerRunning ? "❚❚ Пауза" : "▸ Пуск"}
                </button>
              </div>
            </div>
            {sessionStartedAt && (
              <div className="hud-mono text-[0.7rem] text-[color:var(--muted-foreground)] mt-3">
                Початок сесії: {new Date(sessionStartedAt).toLocaleString("uk-UA", {
                  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit"
                })}
              </div>
            )}
          </div>
        </AnimatedItem>

        {/* Таймер ходу */}
        <AnimatedItem index={2}>
          <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] p-6 text-center">
            <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
            <h3 className="hud-title text-base text-[color:var(--muted-foreground)] mb-2">
              {isBotsTurn ? (
                <span className="text-[color:var(--hud-amber-glow)]">Хід Ботів</span>
              ) : (
                <>Хід гравця / <span className="text-[color:var(--hud-amber-glow)]">{activeName}</span>
                  {isMyTurn && (
                    <span className="ml-2 hud-mono text-[0.65rem] text-[color:var(--hud-green)]">● ВАШ ХІД</span>
                  )}
                </>
              )}
            </h3>
            <div className={`hud-mono text-7xl sm:text-8xl tabular-nums tracking-wider my-4 ${ending ? "text-[color:var(--hud-red)] hud-pulse-red" : "text-[color:var(--hud-amber-glow)]"}`}>
              {fmtClock(turnSeconds)}
            </div>
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                className="hud-btn min-w-[140px]"
                disabled={!isMyTurn}
                title={isMyTurn ? "" : "Лише активний гравець може керувати таймером"}
                aria-label={turnRunning ? "Пауза" : "Старт"}
                onClick={() => { sfx.click(); toggleTurn(); }}
              >
                {turnRunning ? "❚❚ Пауза" : "▸ Старт"}
              </button>
              {canAdvance && (
                <button
                  className="hud-btn hud-btn-ghost min-w-[180px]"
                  onClick={nextPlayer}
                  aria-label="Передати хід наступному гравцю"
                >
                  ↦ Наступний гравець{isHost && !isMyTurn ? " (хост)" : ""}
                </button>
              )}
            </div>
            {!canAdvance && (
              <p className="hud-mono mt-3 text-[0.7rem] text-[color:var(--muted-foreground)]">
                Очікуйте на свій хід або на дію хоста.
              </p>
            )}
          </div>
        </AnimatedItem>

        {/* Хід ботів */}
        {/* Bot info moved to NewsScreen overlay */}

      </div>
    </ScreenShell>
  );
}
