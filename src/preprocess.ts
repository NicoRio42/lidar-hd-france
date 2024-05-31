import { join } from "node:path";
import {
  getLidarFileNameFromCoords,
  makeDirRecursivelyIfNotExist,
} from "./utils.ts";
import { execFile, execFileSync } from "node:child_process";
import type { TileItem } from "./models/tile-item.model.ts";

export function preprocessLidarFiles(
  inputDir: string,
  outputDir: string,
  tileList: TileItem[],
  thinningFactor: number
) {
  makeDirRecursivelyIfNotExist(outputDir);

  execFileSync(join("bin", "las2las64"), [
    "-i",
    join(inputDir, "*.laz"),
    "-odir",
    outputDir,
    "-keep_every_nth",
    thinningFactor.toString(),
    "-olaz",
  ]);

  // for (const {x, y} of tileList) {

  //     join(inputDir, getLidarFileNameFromCoords(x, y))
  // }
}

// ./bin/las2las64 -i ./downloads/*.laz -odir ./thin -keep_every_nth 20
