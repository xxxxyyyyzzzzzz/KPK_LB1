// Канонічна схема даних сесії згідно kpk_integration_spec.md (Section 1).
// Зберігається під /sessions/{roomCode} у Firebase Realtime DB.
import {
  DEFAULT_ACTION_POINTS,
  TURN_DURATION_SECONDS,
  generateAllMissions,
  type Mission,
  type NewsEntry,
} from "./kpkData";

export type PlayerSlot = {
  slot_index: number;
  mission_id: number | null;
  current_progress: number;
  browse_stage: "confirm" | "class" | "mission" | null;  // яке вікно вибору зараз відкрите
  browse_class: string | null;  // клас, який зараз переглядається (не обов'язково клас активної місії)
  candidates_by_class: Record<string, number[]> | null;  // кеш: клас → 4 id місій, заморожено до виконання
};

export type PlayerState = {
  nickname: string;
  faction: string;
  joined_at: number;
  // Бали / валюта
  score: number;
  level1_score: number;
  level2_score: number;
  level3_score: number;
  currency: number;
  currency_earned_this_turn: number;
  // Дії
  action_points: {
    active: number; active_max: number;
    attack: number; attack_max: number;
    build: number; build_max: number;
  };
  global_replacements_left: number;  // 0-2, обнуляється на 2 на початку ходу гравця
  unlocked_classes: { "1": string[]; "2": string[]; "3": string[] };  // Розблоковані класи по рівнях
  // Прокачки
  upgrades: Record<string, true>;
  komanduvannya_changed_round: number | null;
  // Слоти місій (індекс 0..5; рівень = (idx % 3) + 1)
  slots: Array<PlayerSlot>;
  completed_ids: number[];
};

export type EventEntry = {
  ts: number;
  player_id: string;
  nickname: string;
  type: "mission_complete" | "upgrade" | "turn_end" | "news_round";
  payload: Record<string, unknown>;
};

export type SessionState = {
  code: string;
  status: "waiting" | "active" | "finished";
  host_id: string;
  created_at: number;
  is_test?: boolean;
  use_legacy_news_spawn?: boolean;
  newsIndex: 1 | 2 | 3 | 4;
  roundInNews: 1 | 2 | 3 | 4;
  turnInRound: number; // 1..(playersCount + 1)
  turn_end_at: number | null; // timestamp (мс), коли хід закінчиться, якщо зараз йде відлік; null — на паузі
  turn_remaining_seconds: number; // "заморожений" залишок секунд на момент останньої паузи/старту ходу
  // backward compatibility for legacy sessions
  round?: 1 | 2 | 3 | 4;
  turn?: number;
  turn_running: boolean;
  active_player_id: string | null;
  player_order: string[];
  players: Record<string, PlayerState>;
  news: NewsEntry[];
  session_started_at: number | null;
  session_paused_at: number | null;
  session_pause_accumulated: number;
  /** Bumped on every news generation; clients use to auto-navigate to NewsScreen. */
  news_signal_ts: number;
  /** Set true after the last mutant turn of round 4: blocks UI until user opens news. */
  awaiting_news_ack: boolean;
  events: Record<string, EventEntry>;
};

export function initialPlayerSlots(): PlayerSlot[] {
  return Array.from({ length: 6 }).map((_, i) => ({
    slot_index: i,
    mission_id: null,
    current_progress: 0,
    browse_stage: null,
    browse_class: null,
    candidates_by_class: null,
  }));
}

export function makePlayer(nickname: string, faction: string): PlayerState {
  const ap = DEFAULT_ACTION_POINTS;
  const MISSION_CLASSES = ["Атака", "Захист", "Розвиток"];
  return {
    nickname,
    faction,
    joined_at: Date.now(),
    score: 0,
    level1_score: 0,
    level2_score: 0,
    level3_score: 0,
    currency: 0,
    currency_earned_this_turn: 0,
    action_points: {
      active: ap.active, active_max: ap.active,
      attack: ap.attack, attack_max: ap.attack,
      build: ap.build, build_max: ap.build,
    },
    global_replacements_left: 2,
    unlocked_classes: {
      "1": MISSION_CLASSES,  // Рівень 1: усі класи доступні з самого початку
      "2": [],  // Рівень 2: розблокуються після виконання місії рівня 1
      "3": [],  // Рівень 3: розблокуються після виконання місії рівня 2
    },
    upgrades: {},
    komanduvannya_changed_round: null,
    slots: initialPlayerSlots(),
    completed_ids: [],
  };
}

export function makeSession(code: string, hostId: string, opts?: { isTest?: boolean }): SessionState {
  return {
    code,
    status: "waiting",
    host_id: hostId,
    created_at: Date.now(),
    is_test: !!opts?.isTest,
    use_legacy_news_spawn: false,
    newsIndex: 1,
    roundInNews: 1,
    turnInRound: 1,
    turn_end_at: null,
    turn_remaining_seconds: TURN_DURATION_SECONDS,
    turn_running: false,
    active_player_id: null,
    player_order: [],
    players: {},
    news: [],
    session_started_at: Date.now(),
    session_paused_at: null,
    session_pause_accumulated: 0,
    news_signal_ts: 0,
    awaiting_news_ack: false,
    events: {},
  };
}