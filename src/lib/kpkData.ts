// Constants mirrored from app.py — names/values must match the Flask backend
// so the UI can be wired to it later without renames.

export const FACTIONS: Record<string, string> = {
  Скаєри: "#66ADFF",
  Авантюристи: "#A0A0A0",
  Військові: "#FF8282",
  Цикади: "#A9FFAF",
  Глодекс: "#F9FF9E",
  Розсвіт: "#7EF2FF",
};

export const MISSION_CLASSES = ["Атака", "Захист", "Лут", "Економіка"] as const;
export type MissionClass = (typeof MISSION_CLASSES)[number];

export const DEFAULT_ACTION_POINTS = {
  active: 7,
  attack: 5,
  build: 4,
};

export const TURN_DURATION_SECONDS = 420;
export const TOTAL_NEWS_ROUNDS = 4;
export const TURNS_PER_NEWS_ROUND = 4;

export type Screen =
  | "login"
  | "main"
  | "missions"
  | "score"
  | "news"
  | "upgrades"
  | "timer";

export const MISSION_CLASS_COLOR: Record<MissionClass, string> = {
  Атака: "var(--mission-attack)",
  Захист: "var(--mission-defense)",
  Лут: "var(--mission-loot)",
  Економіка: "var(--mission-economy)",
};

export type Mission = {
  id: number;
  name: string;
  cls: MissionClass;
  tier: 1 | 2 | 3;
  target: number;
  progress: number;
  active: boolean;
  reward: { points: number; currency?: number };
};

export const MOCK_MISSIONS_BY_TIER: Record<1 | 2 | 3, Mission[]> = {
  1: [
    { id: 11, name: "Побудувати Окоп ×3", cls: "Захист", tier: 1, target: 3, progress: 1, active: true, reward: { points: 6 } },
    { id: 12, name: "Купити Предмет магазину ×4", cls: "Економіка", tier: 1, target: 4, progress: 2, active: false, reward: { points: 8, currency: 2 } },
  ],
  2: [
    { id: 21, name: "Вбити NPC ×2", cls: "Атака", tier: 2, target: 2, progress: 0, active: false, reward: { points: 12 } },
    { id: 22, name: "Захопити сектори ×4", cls: "Захист", tier: 2, target: 4, progress: 1, active: false, reward: { points: 10 } },
  ],
  3: [
    { id: 31, name: "Перехопити Точку", cls: "Атака", tier: 3, target: 1, progress: 0, active: false, reward: { points: 30 } },
    { id: 32, name: "Налагодити стосунки з NPC ×2", cls: "Економіка", tier: 3, target: 2, progress: 1, active: false, reward: { points: 24 } },
  ],
};

export const MOCK_NEWS = [
  "Аномалія «Жарівка» поглинула східний сектор. Радіофон стрибнув до 4 рентген.",
  "Військові оголосили караван на північ. Конвой стартує наступним ходом.",
  "Цикади перехопили сигнал — координати схрону опубліковано у відкритому ефірі.",
];

export const MOCK_TOP_PLYRS = [
  { nickname: "STRELOK", faction: "Військові", total: 84, l1: 30, l2: 26, l3: 28 },
  { nickname: "ВЕДМІДЬ", faction: "Скаєри", total: 71, l1: 24, l2: 22, l3: 25 },
  { nickname: "СОВА", faction: "Цикади", total: 65, l1: 21, l2: 20, l3: 24 },
  { nickname: "БАТЯ", faction: "Глодекс", total: 53, l1: 18, l2: 16, l3: 19 },
];

export const MOCK_HISTORY = [
  { nickname: "STRELOK", reason: "Виконано: Вбити NPC", reward: 12 },
  { nickname: "ВЕДМІДЬ", reason: "Виконано: Побудувати Турель", reward: 10 },
  { nickname: "СОВА", reason: "Виконано: Захопити сектори", reward: 6 },
];

export const UPGRADE_CATEGORIES = ["Захист", "Атака", "Економіка", "Лут"] as const;
export type UpgradeCategory = (typeof UPGRADE_CATEGORIES)[number];

export type Upgrade = {
  id: string;
  name: string;
  category: UpgradeCategory;
  tier: 1 | 2 | 3;
  cost: number;
  state: "locked" | "available" | "purchased";
};

export const MOCK_UPGRADES: Upgrade[] = [
  { id: "z11", name: "-1 крок, -1 дальність атаки на підконтрольних секторах", category: "Захист", tier: 1, cost: 1, state: "purchased" },
  { id: "z12", name: "+1 шкода на підконтрольних секторах", category: "Захист", tier: 1, cost: 1, state: "available" },
  { id: "z21", name: "Будівництво турелей на підконтрольних секторах", category: "Захист", tier: 2, cost: 1, state: "locked" },
  { id: "z22", name: "+2 броні всьому (техніка лише угрупування)", category: "Захист", tier: 2, cost: 1, state: "locked" },
  { id: "a11", name: "+1 шкода всім стрільцям", category: "Атака", tier: 1, cost: 1, state: "available" },
  { id: "a12", name: "+1 дальність гранатам", category: "Атака", tier: 1, cost: 1, state: "available" },
  { id: "a21", name: "Подвійний постріл артилерією", category: "Атака", tier: 2, cost: 1, state: "locked" },
  { id: "a22", name: "Овервотч всім стрільцям", category: "Атака", tier: 2, cost: 1, state: "locked" },
  { id: "e11", name: "+1 валюта за хід", category: "Економіка", tier: 1, cost: 1, state: "purchased" },
  { id: "e12", name: "−1 ціна на ринку", category: "Економіка", tier: 1, cost: 1, state: "available" },
  { id: "e21", name: "Подвійний ринок", category: "Економіка", tier: 2, cost: 1, state: "locked" },
  { id: "e22", name: "Найманці −1 валюта", category: "Економіка", tier: 2, cost: 1, state: "locked" },
  { id: "l11", name: "+1 предмет на сектор", category: "Лут", tier: 1, cost: 1, state: "available" },
  { id: "l12", name: "Подвійний лут від мутантів", category: "Лут", tier: 1, cost: 1, state: "available" },
  { id: "l21", name: "Спецзнахідка від NPC", category: "Лут", tier: 2, cost: 1, state: "locked" },
  { id: "l22", name: "Розкривати схрони", category: "Лут", tier: 2, cost: 1, state: "locked" },
];
