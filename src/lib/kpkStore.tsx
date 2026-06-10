import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DEFAULT_ACTION_POINTS, TURN_DURATION_SECONDS, type Screen } from "./kpkData";
import { sfx } from "./sounds";

type User = { nickname: string; faction: string };

type ActionPoints = {
  active: number; activeMax: number;
  attack: number; attackMax: number;
  build: number; buildMax: number;
};

type KpkState = {
  screen: Screen;
  prevScreen: Screen | null;
  user: User | null;
  totalScore: number;
  level1: number; level2: number; level3: number;
  currency: number;
  upgradePoints: number;
  round: number;
  turn: number;
  sessionSeconds: number;
  turnSeconds: number;
  turnRunning: boolean;
  ap: ActionPoints;
  login: (user: User) => void;
  logout: () => void;
  go: (screen: Screen) => void;
  setAP: (key: keyof ActionPoints, val: number) => void;
  toggleTurn: () => void;
  nextPlayer: () => void;
};

const KpkContext = createContext<KpkState | null>(null);

export function KpkProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>("login");
  const [prevScreen, setPrev] = useState<Screen | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState(1);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [turnSeconds, setTurnSeconds] = useState(TURN_DURATION_SECONDS);
  const [turnRunning, setTurnRunning] = useState(false);
  const [ap, setApState] = useState<ActionPoints>({
    active: 0, activeMax: DEFAULT_ACTION_POINTS.active,
    attack: 0, attackMax: DEFAULT_ACTION_POINTS.attack,
    build: 0, buildMax: DEFAULT_ACTION_POINTS.build,
  });
  const warnRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!turnRunning) return;
    const id = setInterval(() => {
      setTurnSeconds((s) => {
        if (s <= 1) { sfx.alarm(); setTurnRunning(false); return 0; }
        if (s === 30 && !warnRef.current) { warnRef.current = true; sfx.notify(); }
        if (s % 60 === 0) sfx.tick();
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [turnRunning]);

  const value = useMemo<KpkState>(() => ({
    screen, prevScreen, user,
    totalScore: 42, level1: 16, level2: 14, level3: 12,
    currency: 5, upgradePoints: 2,
    round, turn, sessionSeconds, turnSeconds, turnRunning, ap,
    login: (u) => { setUser(u); setScreen("main"); sfx.confirm(); },
    logout: () => { setUser(null); setScreen("login"); sfx.back(); },
    go: (s) => { setPrev(screen); setScreen(s); },
    setAP: (key, val) => setApState((p) => ({ ...p, [key]: Math.max(0, val) })),
    toggleTurn: () => { warnRef.current = false; setTurnRunning((r) => !r); },
    nextPlayer: () => { warnRef.current = false; setTurnSeconds(TURN_DURATION_SECONDS); setTurnRunning(false); setTurn((t) => t + 1); sfx.confirm(); },
  }), [screen, prevScreen, user, round, turn, sessionSeconds, turnSeconds, turnRunning, ap]);

  return <KpkContext.Provider value={value}>{children}</KpkContext.Provider>;
}

export function useKpk() {
  const v = useContext(KpkContext);
  if (!v) throw new Error("useKpk must be used inside KpkProvider");
  return v;
}

export function fmtClock(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
export function fmtSession(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
