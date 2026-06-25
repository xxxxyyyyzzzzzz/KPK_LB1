import { useState } from "react";
import { ScreenShell } from "./ScreenShell";
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
    user, round, turn, sessionSeconds, turnSeconds, turnRunning,
    toggleTurn, nextPlayer,
    isMyTurn, isHost, activePlayerId, sessionPlayers,
  } = useKpk();
  const [openBot, setOpenBot] = useState<string | null>(null);
  const ending = turnSeconds <= 30;
  const canAdvance = isMyTurn || isHost;
  const activePlayer = sessionPlayers.find((p) => p.id === activePlayerId);
  const activeName = activePlayer?.nickname ?? user?.nickname ?? "—";

  return (
    <ScreenShell title="Таймер">
      <div className="mx-auto max-w-2xl space-y-6">

        <div className="text-center hud-mono text-xs text-[color:var(--muted-foreground)]">
          Новина {round} / Хід {turn} з 4
        </div>

        {/* Загальний час сесії */}
        <div className="hud-panel-corners-4 relative flex items-center justify-between border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] px-4 py-3">
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          <span className="hud-label">Загальний час сесії</span>
          <span className="hud-mono text-lg tabular-nums text-[color:var(--hud-cyan)]">{fmtSession(sessionSeconds)}</span>
        </div>

        {/* Таймер ходу */}
        <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] p-6 text-center">
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          <h3 className="hud-title text-base text-[color:var(--muted-foreground)] mb-2">
            Хід гравця / <span className="text-[color:var(--hud-amber-glow)]">{activeName}</span>
            {isMyTurn && (
              <span className="ml-2 hud-mono text-[0.65rem] text-[color:var(--hud-green)]">● ВАШ ХІД</span>
            )}
          </h3>
          <div
            className={`hud-mono text-7xl sm:text-8xl tabular-nums tracking-wider my-4 ${
              ending
                ? "text-[color:var(--hud-red)] hud-pulse-red"
                : "text-[color:var(--hud-amber-glow)]"
            }`}
          >
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

        {/* Хід ботів */}
        <div>
          <div className="hud-label mb-2">// Хід ботів</div>
          <div className="space-y-2">
            {BOTS.map((b) => (
              <div key={b.name} className="border border-[color:var(--hud-amber)]/20 bg-[color:var(--surface-2)]">
                {b.info ? (
                  <>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[color:var(--surface-3)] text-left"
                      onClick={() => { sfx.click(); setOpenBot(openBot === b.name ? null : b.name); }}
                    >
                      <span className={`hud-mono text-[color:var(--hud-amber)] transition-transform inline-block ${openBot === b.name ? "rotate-90" : ""}`}>▸</span>
                      <span className="hud-title text-sm">{b.name}</span>
                    </button>
                    {openBot === b.name && (
                      <div className="px-4 py-3 hud-mono text-xs leading-relaxed text-[color:var(--muted-foreground)] border-t border-[color:var(--hud-amber)]/15 bg-black/30">
                        {b.info}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-2 hud-title text-sm text-[color:var(--muted-foreground)]">{b.name}</div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </ScreenShell>
  );
}
