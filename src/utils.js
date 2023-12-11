import { existsSync, mkdirSync } from "fs";

/**
 * @param {number} x 
 * @param {number} y 
 */
export function getLidarFileNameFromCoords(x, y) {
    return `${String(x).padStart(4, "0")}-${String(y).padStart(4, "0")}.laz`;
}

/**
 * @param {string} path 
 */
export function makeDirRecursivelyIfNotExist(path) {
    if (!existsSync(path)) mkdirSync(path, { recursive: true });
}