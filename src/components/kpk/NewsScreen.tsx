import { useMemo, useState } from "react";
import { ScreenShell, AnimatedItem } from "./ScreenShell";
import { useKpk } from "@/lib/kpkStore";
import { sfx } from "@/lib/sounds";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { generateNews, type NewsEntry } from "@/lib/kpkData";

const BOTS = [
  {
    name: "Мутанти",
    info: "• Сова — сидить на місці та чекає, тримається в повітрі, бачить усе в межах видимості безперешкодно.\n• Лисиця — з'їдає всі предмети, що лежать у секторі; якщо в сусідньому секторі є предмети, йде туди, з'їдає один предмет за раунд (може їсти предмети зі складу).\n• Ведмідь — іде до найближчої будівлі.\n• Темна гонча — якщо в секторі є поранений боєць, йде до нього; якщо поранений є в сусідньому секторі, йде туди.\n• Лісовик — іде на солдатів, які стоять на траві.\n• Криса — збивається у зграю з іншими крисами та атакує будівлі, щоб їх прогризти; оточуючи, охороняють короля крис; відчувають одне одного та будівлі в секторі й сусідніх.\n• Болотник — іде на солдатів, які стоять на траві в секторі.\n• Собака — якщо в секторі або сусідньому є зомбі, йде до нього та супроводжує його; якщо собака прив'язана до зомбі — атакує ворога, а зомбі йде за нею.\n• Демон — руйнує будівлі в секторі або йде для цього в сусідній.\n• Химера — прямує в центральний сектор.\n• Псевдогігант — іде атакувати техніку у своєму або сусідньому секторі.\n• Король павуків — прямує в центральний сектор.",
  },
  {
    name: "Зомбі",
    info: "Атакують усіх, кого бачать на шляху. Якщо в сусідньому секторі є собака, яка помітила ворога чи вже веде бій, вони йдуть туди.",
  },
  {
    name: "Воля",
    info: "Збирає предмети, об'єднується з угрупуванням, разом ідуть на Обов'язок.",
  },
  {
    name: "Обов'язок",
    info: "Збирає предмети, об'єднується з угрупуванням, разом ідуть на Волю.",
  },
  {
    name: "Нанокс",
    info: "Збирає шматки мутантів. Йдуть до Псі-випромінювача. Троє в одному секторі починають будувати випромінювач.",
  },
  {
    name: "Транспорт Нанокс",
    info: "Йде до найближчого Нанокса. Без нього — за 2 раунди спавнить бійця.",
  },
];

const GRID_SIZE = 25;
const ENTITY_COLORS: Record<string, string> = {
  "Мутанти 1": "var(--hud-red)",
  "Мутанти 2": "var(--hud-orange)",
  "Мутанти 3": "var(--hud-crimson)",
  Нанокс: "var(--hud-cyan)",
  Воля: "var(--hud-green)",
  "Обов'язок": "var(--hud-blue)",
  "Псі-випромінювач": "var(--hud-violet)",
  Аномалії: "var(--hud-amber)",
  "Транспорт нанокс": "var(--hud-teal)",
};

export function NewsScreen() {
  const { newsIndex, roundInNews, turnInRound, news, players, cheatGenerateNews, isTestSession } = useKpk();
  const [botMenuOpen, setBotMenuOpen] = useState(false);
  const [previewNews, setPreviewNews] = useState<NewsEntry[] | null>(null);
  const [previewRound, setPreviewRound] = useState<1 | 2 | 3 | 4 | null>(null);
  const playersCount = Math.max(1, players.length || 1);
  const isBotsTurn = turnInRound === playersCount + 1;
  const displayNews = previewNews ?? news;

  const spawnMapCells = useMemo(() => {
    const map = new Map<string, { entity: string; color: string }>();
    for (const entry of displayNews) {
      if (entry.note || !entry.coords?.length) continue;
      for (const coord of entry.coords) {
        const key = coord.toUpperCase();
        if (!map.has(key)) {
          map.set(key, { entity: entry.entity, color: ENTITY_COLORS[entry.entity] ?? "var(--hud-amber)" });
        }
      }
    }
    return map;
  }, [displayNews]);

  return (
    <ScreenShell title="Новини">
      <div className="w-full">
        <AnimatedItem index={0} className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <h2 className="hud-title text-xl text-[color:var(--hud-amber)] border border-[color:var(--hud-amber)]/40 px-3 py-1">
            НОВИНИ ЗОНИ
          </h2>
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="hud-mono text-sm text-[color:var(--hud-cyan)]">
              Новина {newsIndex} з 4 · Раунд {roundInNews} з 4
            </span>
            <span className="hud-label text-[0.62rem] text-[color:var(--muted-foreground)]">
              Раундів до наступної новини: {4 - roundInNews + 1}
            </span>
            <span className="hud-label text-[0.62rem] text-[color:var(--muted-foreground)]">
              Ходів до кінця раунду: {playersCount + 1 - turnInRound}
            </span>
          </div>
        </AnimatedItem>

        {isTestSession && (
          <AnimatedItem index={1} className="mb-4">
            <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] p-4">
              <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
              <div className="hud-label text-[0.6rem] text-[color:var(--hud-red)]">// ТЕСТОВІ КНОПКИ</div>
              {previewRound != null && (
                <div className="mt-2 hud-mono text-[0.65rem] text-[color:var(--hud-cyan)]">
                  Прев'ю за правилами новини {previewRound}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => { sfx.click(); setPreviewRound(null); setPreviewNews(null); cheatGenerateNews(); }}
                  className="hud-btn hud-btn-ghost"
                >
                  ⟳ Нова новина (тест)
                </button>
                {[1, 2, 3, 4].map((round) => (
                  <button
                    key={round}
                    onClick={() => {
                      sfx.click();
                      const nextRound = round as 1 | 2 | 3 | 4;
                      setPreviewRound(nextRound);
                      setPreviewNews(generateNews(nextRound));
                    }}
                    className="hud-btn hud-btn-ghost"
                  >
                    Новина {round}
                  </button>
                ))}
              </div>
            </div>
          </AnimatedItem>
        )}

        <AnimatedItem index={2} className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] p-5 space-y-3 min-h-[200px]">
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          {displayNews.length === 0 && (
            <div className="hud-mono text-xs text-[color:var(--muted-foreground)]">// Тиша в ефірі...</div>
          )}
          {displayNews.map((n, i) => (
            <div
              key={`${n.entity}-${i}`}
              className="border-l-2 border-[color:var(--hud-amber)] bg-[color:var(--surface-3)]/50 p-3 hud-mono text-sm"
              style={{
                opacity: 0,
                animation: `hud-screen-in 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 0.12 + 0.15}s both`,
              }}
            >
              <div className="hud-label mb-1 text-[0.6rem]">// СИГНАЛ #{i + 1}</div>
              <div className="flex flex-wrap items-start gap-2">
                <span className="text-[color:var(--hud-amber-glow)]">{n.entity}</span>
                {n.note
                  ? <span className="text-[color:var(--muted-foreground)]">— {n.note}</span>
                  : <span className="text-[color:var(--muted-foreground)]">×{n.count}</span>
                }
              </div>
              {!n.note && n.coords && n.coords.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer list-none text-[color:var(--hud-cyan)]">
                    {n.entity} (×{n.count})
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {n.coords.map((coord) => (
                      <span key={`${n.entity}-${coord}`} className="rounded border border-[color:var(--hud-cyan)]/25 bg-[color:var(--surface-1)] px-2 py-1 text-[0.65rem] text-[color:var(--hud-cyan)]">
                        {coord}
                      </span>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
          {isTestSession && (
            <div className="mt-4 border border-[color:var(--hud-amber)]/20 bg-[color:var(--surface-1)]/60 p-3">
              <div className="hud-label mb-2 text-[0.6rem] text-[color:var(--hud-amber)]">// КАРТА СПАВНУ</div>
              <div className="overflow-x-auto">
                <div
                  className="grid gap-[1px] border border-[color:var(--hud-amber)]/30 bg-[color:var(--hud-amber)]/15 p-[1px]"
                  style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(16px, 18px))` }}
                >
                  {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, idx) => {
                    const row = Math.floor(idx / GRID_SIZE);
                    const col = idx % GRID_SIZE;
                    const coord = `${String.fromCharCode(65 + col)}${row + 1}`;
                    const assignment = spawnMapCells.get(coord.toUpperCase());
                    return (
                      <div
                        key={coord}
                        className="h-[16px] w-[16px] border border-[color:var(--hud-amber)]/10 sm:h-[18px] sm:w-[18px]"
                        style={{
                          backgroundColor: assignment ? assignment.color : "rgba(255,255,255,0.03)",
                          boxShadow: assignment ? `inset 0 0 0 1px ${assignment.color}` : undefined,
                        }}
                        title={assignment ? `${coord}: ${assignment.entity}` : coord}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(ENTITY_COLORS).map(([entity, color]) => (
                  <div key={entity} className="flex items-center gap-2 rounded border border-[color:var(--hud-amber)]/20 bg-[color:var(--surface-3)]/40 px-2 py-1">
                    <span className="h-2.5 w-2.5 border border-[color:var(--hud-amber)]/30" style={{ backgroundColor: color }} />
                    <span className="hud-mono text-[0.62rem] text-[color:var(--muted-foreground)]">{entity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AnimatedItem>

        {/* Розгортуване меню з інформацією про ботів */}
        <AnimatedItem index={3} className="mt-6">
          <Collapsible open={botMenuOpen} onOpenChange={setBotMenuOpen}>
          <CollapsibleTrigger asChild>
            <button
              onClick={() => { sfx.click(); setBotMenuOpen(!botMenuOpen); }}
              className="hud-btn w-full flex items-center justify-between px-4 py-3"
              style={{
                borderColor: isBotsTurn ? 'var(--hud-amber)' : 'var(--hud-amber)',
                opacity: isBotsTurn ? 1 : 0.7,
              }}
            >
              <span className="hud-label text-[color:var(--hud-amber)]">
                {isBotsTurn ? '▼ ПОВЕДІНКА БОТІВ' : '▶ ПОВЕДІНКА БОТІВ'}
              </span>
              {isBotsTurn && <span className="text-[color:var(--hud-amber-glow)] text-sm">● АКТИВНО</span>}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/40 bg-[color:var(--surface-2)] p-5 space-y-3">
              <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
              <p className="hud-mono text-xs text-[color:var(--muted-foreground)] mb-3">
                // Черговість ходів ботів вказана нижче, також це вказано в правилах.
              </p>
              <div className="space-y-3">
                {BOTS.map((bot, idx) => (
                  <div
                    key={bot.name}
                    className="border border-[color:var(--hud-amber)]/25 bg-[color:var(--surface-3)]/50 p-3"
                    style={{
                      opacity: 0,
                      animation: `hud-screen-in 0.35s cubic-bezier(0.2,0.8,0.2,1) ${idx * 0.05}s both`,
                    }}
                  >
                    <div className="hud-label text-[color:var(--hud-amber)] text-sm mb-1">{bot.name}</div>
                    <div className="hud-mono text-[0.8rem] text-[color:var(--muted-foreground)] whitespace-pre-wrap leading-relaxed">
                      {bot.info ?? "(Немає додаткової інформації)"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
          </Collapsible>
        </AnimatedItem>

        <AnimatedItem index={4} className="mt-4">
          <p className="hud-mono text-center text-xs text-[color:var(--muted-foreground)]">
            // Ознайомтесь з новинами зони перед початком ходів
          </p>
        </AnimatedItem>
      </div>
    </ScreenShell>
  );
}
