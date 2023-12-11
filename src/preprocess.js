import { join } from "path";
import { getLidarFileNameFromCoords, makeDirRecursivelyIfNotExist } from "./utils.js";
import { execFile, execFileSync } from "child_process";

/**
 * @param {string} inputDir 
 * @param {string} outputDir 
 * @param {import("./models/tile-item.model.js").TileItem[]} tileList 
 * @param {number} thinningFactor 
 */
export async function preprocessLidarFiles(inputDir, outputDir, tileList, thinningFactor) {
    makeDirRecursivelyIfNotExist(outputDir);

    execFileSync("las2las64", [
        '-i',
        join(inputDir, '*.laz'),
        '-odir',
        outputDir,
        '-keep_every_nth',
        thinningFactor.toString(),
        '-olaz'
    ])

    // for (const {x, y} of tileList) {

    //     join(inputDir, getLidarFileNameFromCoords(x, y))
    // }
}