import { useState } from "react";
import { ScreenShell, AnimatedItem } from "./ScreenShell";
import { useKpk } from "@/lib/kpkStore";
import { TURNS_PER_NEWS_ROUND } from "@/lib/kpkData";
import { sfx } from "@/lib/sounds";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

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

export function NewsScreen() {
  const { round, news } = useKpk();
  const { turn, sessionPlayers } = useKpk();
  const [botMenuOpen, setBotMenuOpen] = useState(false);
  const playersCount = Math.max(1, sessionPlayers?.length ?? 1);
  const totalTurns = playersCount * TURNS_PER_NEWS_ROUND;
  const isBotsTurn = (turn % TURNS_PER_NEWS_ROUND) === 0;

  return (
    <ScreenShell title="Новини">
      <div className="w-full">
        <AnimatedItem index={0} className="mb-4 flex items-center justify-between">
          <h2 className="hud-title text-xl text-[color:var(--hud-amber)] border border-[color:var(--hud-amber)]/40 px-3 py-1">
            НОВИНИ ЗОНИ
          </h2>
          <span className="hud-mono text-sm text-[color:var(--hud-cyan)]">Раунд {round}</span>
        </AnimatedItem>

        <AnimatedItem index={1} className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] p-5 space-y-3 min-h-[200px]">
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
                : <span className="ml-2">×{n.count}{n.coords && n.coords.length > 0 ? ` · ${n.coords.join(", ")}` : ""}</span>
              }
            </div>
          ))}
        </AnimatedItem>

        {/* Розгортуване меню з інформацією про ботів */}
        <AnimatedItem index={2} className="mt-6">
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

        <AnimatedItem index={3} className="mt-4">
          <p className="hud-mono text-center text-xs text-[color:var(--muted-foreground)]">
            // Ознайомтесь з новинами зони перед початком ходів
          </p>
        </AnimatedItem>
      </div>
    </ScreenShell>
  );
}
