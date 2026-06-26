import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KpkProvider, useKpk } from "@/lib/kpkStore";
import { installGlobalSfx, sfx } from "@/lib/sounds";
import { LoginScreen } from "@/components/kpk/LoginScreen";
import { LobbyScreen } from "@/components/kpk/LobbyScreen";
import { MainMenu } from "@/components/kpk/MainMenu";
import { MissionsScreen } from "@/components/kpk/MissionsScreen";
import { ScoreScreen } from "@/components/kpk/ScoreScreen";
import { NewsScreen } from "@/components/kpk/NewsScreen";
import { UpgradesScreen } from "@/components/kpk/UpgradesScreen";
import { TimerScreen } from "@/components/kpk/TimerScreen";
import { HudStatus } from "@/components/kpk/ScreenShell";
import { SessionLoadingScreen } from "@/components/kpk/SessionLoadingScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "КПК — Тактичний термінал" },
      { name: "description", content: "Тактичний HUD для настільної ігрової сесії: місії, прокачки, новини зони, таймер ходу." },
      { property: "og:title", content: "КПК — Тактичний термінал" },
      { property: "og:description", content: "Тактичний HUD для настільної ігрової сесії." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700&family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" },
    ],
  }),
  component: () => (
    <KpkProvider>
      <KpkApp />
    </KpkProvider>
  ),
});

function KpkApp() {
  const { screen, awaitingNewsAck, ackNews } = useKpk();
  const [muted, setMuted] = useState(false);

  useEffect(() => { installGlobalSfx(); }, []);

  const showEndNewsModal = awaitingNewsAck && screen !== "news";

  return (
    <div className="hud-grid-bg hud-scanlines hud-vignette relative overflow-hidden" style={{ width: "100dvw", height: "100dvh" }}>
      <div className="hud-scanbar" />
      <HudStatus />

      <button
        onClick={() => { const m = !muted; setMuted(m); sfx.setMuted(m); if (!m) sfx.click(); }}
        className="hud-btn hud-btn-ghost pointer-events-auto absolute right-3 z-50 !py-1.5 !px-3 !text-[0.65rem]"
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        aria-label={muted ? "Увімкнути звук" : "Вимкнути звук"}
      >
        {muted ? "🔇" : "🔊"}
      </button>

      {/* Екрани — flex-1 + min-h-0 щоб не вилазили за межі */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0 overflow-hidden">
        {screen === "login"           && <LoginScreen />}
        {screen === "lobby"           && <LobbyScreen />}
        {screen === "main"            && <MainMenu />}
        {screen === "missions"        && <MissionsScreen />}
        {screen === "score"           && <ScoreScreen />}
        {screen === "news"            && <NewsScreen />}
        {screen === "upgrades"        && <UpgradesScreen />}
        {screen === "timer"           && <TimerScreen />}
        {screen === "session-loading" && <SessionLoadingScreen />}
      </div>

      {showEndNewsModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 px-4 backdrop-blur-md"
          role="dialog" aria-modal="true" aria-labelledby="end-news-title"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.preventDefault()}
        >
          <div className="hud-panel-corners-4 relative w-full max-w-md border border-[color:var(--hud-amber)]/70 bg-[color:var(--surface-2)] p-6 text-center shadow-[0_0_40px_rgba(245,184,64,0.35)]">
            <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
            <div className="hud-label mb-1 text-[0.65rem]">// ФІНАЛ СЕСІЇ</div>
            <div id="end-news-title" className="hud-title text-2xl text-[color:var(--hud-amber)] hud-flicker">
              КІНЕЦЬ ПЕРШИХ НОВИН
            </div>
            <p className="hud-mono mt-3 text-sm text-[color:var(--foreground)]">
              Усі 4 раунди новин відіграно. Хід мутантів завершено.
              Перейдіть до фінального брифінгу зони.
            </p>
            <button
              onClick={() => { sfx.notify(); ackNews(); }}
              className="hud-btn hud-btn-lg mt-5 w-full"
              autoFocus
            >▸ ПЕРЕГЛЯНУТИ НОВИНИ</button>
            <p className="hud-mono mt-3 text-[0.65rem] text-[color:var(--muted-foreground)]">
              Інші дії заблоковано до перегляду.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
