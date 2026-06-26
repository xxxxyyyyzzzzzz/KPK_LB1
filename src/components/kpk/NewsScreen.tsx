import { ScreenShell } from "./ScreenShell";
import { useKpk } from "@/lib/kpkStore";
import { TURNS_PER_NEWS_ROUND } from "@/lib/kpkData";
import { sfx } from "@/lib/sounds";

const BOTS = [
  { name: "Мутанти", info: "Сова сидить. Лисиця їсть предмети. Ведмідь — до найближчої будівлі. Темна гонча — до пораненого. Лісовик/Болотник — на солдатів у траві. Криси — стадом до будівель. Демон руйнує будівлі. Псевдогігант атакує техніку. Король павуків — у центр." },
  { name: "Зомбі", info: null },
  { name: "Воля", info: "Збирає предмети, об'єднується з угрупуванням, разом ідуть на Обов'язок. Атакує — інші підтримують." },
  { name: "Обов'язок", info: "Збирає предмети, об'єднується з угрупуванням, разом ідуть на Волю." },
  { name: "Нанокс", info: "Збирає шматки мутантів. Йдуть до Псі-випромінювача. Троє в одному секторі починають будувати випромінювач." },
  { name: "Транспорт Нанокс", info: "Йде до найближчого Нанокса. Без нього — за 2 раунди спавнить бійця." },
];

export function NewsScreen() {
  const { round, news } = useKpk();
  const { turn, sessionPlayers } = useKpk();
  const playersCount = Math.max(1, sessionPlayers?.length ?? 1);
  const totalTurns = playersCount * TURNS_PER_NEWS_ROUND;
  const isBotsTurn = (turn % TURNS_PER_NEWS_ROUND) === 0;

  return (
    <ScreenShell title="Новини">
      <div className="mx-auto max-w-3xl hud-screen-enter">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="hud-title text-xl text-[color:var(--hud-amber)] border border-[color:var(--hud-amber)]/40 px-3 py-1">
            НОВИНИ ЗОНИ
          </h2>
          <span className="hud-mono text-sm text-[color:var(--hud-cyan)]">Раунд {round}</span>
        </div>

        <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] p-5 space-y-3 min-h-[200px]">
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          {news.length === 0 && (
            <div className="hud-mono text-xs text-[color:var(--muted-foreground)]">// Тиша в ефірі...</div>
          )}
          {news.map((n, i) => (
            <div
              key={i}
              className="border-l-2 border-[color:var(--hud-amber)] bg-[color:var(--surface-3)]/50 p-3 hud-mono text-sm"
              style={{
                opacity: 0,
                animation: `hud-screen-in 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 0.12 + 0.15}s both`,
              }}
            >
              <div className="hud-label mb-1 text-[0.6rem]">// СИГНАЛ #{i + 1}</div>
              <span className="text-[color:var(--hud-amber-glow)]">{n.entity}</span>
              {n.note
                ? <span className="ml-2">— {n.note}</span>
                : <span className="ml-2">×{n.count}{n.zone && n.zone !== "any" ? ` · ${n.zone}` : ""}</span>
              }
            </div>
          ))}
        </div>

          {/* Bot overlay — appears over news screen when bots turn */}
          {isBotsTurn && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center px-4" style={{ pointerEvents: 'none' }}>
              <div
                className="hud-panel-corners-4 relative w-full max-w-4xl border border-[color:var(--hud-amber)]/70 bg-[color:var(--surface-2)] p-8 shadow-[0_0_60px_rgba(245,184,64,0.35)]"
                style={{ pointerEvents: 'auto', animation: 'hud-screen-in 0.35s cubic-bezier(0.2,0.8,0.2,1) both' }}
              >
                <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
                <div className="hud-title text-2xl text-[color:var(--hud-amber)] mb-2">Хід Ботів</div>
                <div className="hud-mono text-sm text-[color:var(--muted-foreground)] mb-4">Інформація про дії ботів — підвищена читабельність.</div>
                <div className="space-y-3 text-[0.95rem] hud-mono">
                  {BOTS.map((b) => (
                    <div key={b.name} className="border border-[color:var(--hud-amber)]/20 bg-[color:var(--surface-3)]/60 p-4">
                      <div className="hud-title text-lg text-[color:var(--hud-amber)] mb-1">{b.name}</div>
                      <div className="text-[color:var(--muted-foreground)] text-sm">{b.info ?? "(Немає додаткової інформації)"}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-right">
                  <button onClick={() => { sfx.click(); }} className="hud-btn hud-btn-ghost">Закрити</button>
                </div>
              </div>
            </div>
          )}

        <p className="mt-4 hud-mono text-center text-xs text-[color:var(--muted-foreground)]">
          // Ознайомтесь з новинами зони перед початком ходів
        </p>
      </div>
    </ScreenShell>
  );
}
