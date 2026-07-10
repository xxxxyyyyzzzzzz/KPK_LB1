export type NewsZone = "5x5" | "3x3" | "1x1" | "any" | undefined;

const GRID_SIZE = 25;
const SECTOR_SIZE = 5;

const EXCLUDED_SECTORS = new Set(["1,1", "5,1", "1,5", "5,5"]);

const ZONE_SECTORS: Record<Exclude<NewsZone, undefined>, Array<[number, number]>> = {
  "5x5": [
    [2, 1], [3, 1], [4, 1],
    [5, 2], [5, 3], [5, 4],
    [2, 5], [3, 5], [4, 5],
    [1, 2], [1, 3], [1, 4],
  ],
  "3x3": [
    [2, 2], [3, 2], [4, 2],
    [2, 3], [4, 3],
    [2, 4], [3, 4], [4, 4],
  ],
  "1x1": [[3, 3]],
  any: [
    [2, 1], [3, 1], [4, 1],
    [5, 2], [5, 3], [5, 4],
    [2, 5], [3, 5], [4, 5],
    [1, 2], [1, 3], [1, 4],
    [2, 2], [3, 2], [4, 2],
    [2, 3], [4, 3],
    [2, 4], [3, 4], [4, 4],
    [3, 3],
  ],
};

function toCoordKey(x: number, y: number): string {
  return `${x},${y}`;
}

function toA1(x: number, y: number): string {
  return `${String.fromCharCode(65 + x)}${y + 1}`;
}

function getCoordsForSector(sectorCol: number, sectorRow: number): Array<[number, number]> {
  const startX = (sectorCol - 1) * SECTOR_SIZE;
  const startY = (sectorRow - 1) * SECTOR_SIZE;
  const cells: Array<[number, number]> = [];

  for (let y = 0; y < SECTOR_SIZE; y += 1) {
    for (let x = 0; x < SECTOR_SIZE; x += 1) {
      cells.push([startX + x, startY + y]);
    }
  }

  return cells;
}

function getZoneCoords(zone: NewsZone): Array<[number, number]> {
  if (!zone || zone === "any") {
    const sectors = Array.from({ length: 5 }, (_, colIndex) =>
      Array.from({ length: 5 }, (_, rowIndex) => [colIndex + 1, rowIndex + 1] as [number, number]),
    )
      .flat()
      .filter(([sectorCol, sectorRow]) => !EXCLUDED_SECTORS.has(`${sectorCol},${sectorRow}`));

    return sectors.flatMap(([sectorCol, sectorRow]) => getCoordsForSector(sectorCol, sectorRow));
  }

  return ZONE_SECTORS[zone].flatMap(([sectorCol, sectorRow]) => getCoordsForSector(sectorCol, sectorRow));
}

function removeNearbyCells(
  pool: Array<[number, number]>,
  poolSet: Set<string>,
  x: number,
  y: number,
): void {
  for (let dx = -2; dx <= 2; dx += 1) {
    for (let dy = -2; dy <= 2; dy += 1) {
      const nx = Math.min(GRID_SIZE - 1, Math.max(0, x + dx));
      const ny = Math.min(GRID_SIZE - 1, Math.max(0, y + dy));
      const key = toCoordKey(nx, ny);
      poolSet.delete(key);
      const index = pool.findIndex(([px, py]) => px === nx && py === ny);
      if (index >= 0) {
        pool.splice(index, 1);
      }
    }
  }
}

export function generateEntityCoords(
  quantity: number,
  zone: NewsZone,
  occupiedCoords: Set<string>,
  isMirrored: boolean,
): string[] {
  const pool = getZoneCoords(zone).filter(([x, y]) => !occupiedCoords.has(toCoordKey(x, y)));
  const poolSet = new Set(pool.map(([x, y]) => toCoordKey(x, y)));

  if (pool.length === 0) {
    return [];
  }

  if (isMirrored) {
    const result: Array<[number, number]> = [];
    let attempts = 0;

    while (result.length < quantity && attempts < 1000) {
      attempts += 1;
      const randomIndex = Math.floor(Math.random() * pool.length);
      const p1 = pool[randomIndex];
      if (!p1) break;

      const group: Array<[number, number]> = [
        p1,
        [GRID_SIZE - 1 - p1[0], p1[1]],
        [p1[0], GRID_SIZE - 1 - p1[1]],
        [GRID_SIZE - 1 - p1[0], GRID_SIZE - 1 - p1[1]],
      ];

      const isValidGroup =
        group.every(([x, y]) => poolSet.has(toCoordKey(x, y))) &&
        group.every((point, index) =>
          group.slice(index + 1).every((otherPoint) => {
            const dx = Math.abs(point[0] - otherPoint[0]);
            const dy = Math.abs(point[1] - otherPoint[1]);
            return Math.max(dx, dy) > 2;
          }),
        );

      if (isValidGroup) {
        result.push(...group);
        for (const [x, y] of group) {
          removeNearbyCells(pool, poolSet, x, y);
        }
      }
    }

    return result.slice(0, quantity).map(([x, y]) => toA1(x, y));
  }

  const shuffledPool = [...pool];
  for (let i = shuffledPool.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(Math.random() * (i + 1));
    [shuffledPool[i], shuffledPool[swapIndex]] = [shuffledPool[swapIndex], shuffledPool[i]];
  }

  const result: Array<[number, number]> = [];
  for (const [x, y] of shuffledPool) {
    if (result.length >= quantity) break;
    result.push([x, y]);
    removeNearbyCells(pool, poolSet, x, y);
  }

  return result.map(([x, y]) => toA1(x, y));
}
