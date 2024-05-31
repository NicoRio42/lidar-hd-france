import { existsSync, mkdirSync } from "node:fs";

export function getLidarFileNameFromCoords(x: number, y: number) {
  return `${String(x).padStart(4, "0")}-${String(y).padStart(4, "0")}.laz`;
}

export function makeDirRecursivelyIfNotExist(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}
