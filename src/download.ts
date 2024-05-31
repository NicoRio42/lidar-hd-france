import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { DOWNLOADS_DIR } from "./constants.ts";
import type { TileItem } from "./models/tile-item.model.ts";
import { getLidarFileNameFromCoords } from "./utils.ts";

export async function download(tiles: TileItem[]) {
  for (const { x, y } of tiles) {
    const url = `https://storage.sbg.cloud.ovh.net/v1/AUTH_63234f509d6048bca3c9fd7928720ca1/ppk-lidar/PJ/LHD_FXX_${String(
      x
    ).padStart(4, "0")}_${String(y).padStart(
      4,
      "0"
    )}_PTS_C_LAMB93_IGN69.copc.laz`;

    if (!existsSync(DOWNLOADS_DIR)) {
      mkdirSync(DOWNLOADS_DIR, { recursive: true });
    }

    const path = join("downloads", getLidarFileNameFromCoords(x, y));

    console.log(`Fetching ${path}`);

    const res = await fetch(url);

    if (!res.ok || res.body === null) {
      throw new Error(`Error fetching tile for x = ${x} and y = ${y}`);
    }

    const body = Readable.fromWeb(res.body);
    await finished(body.pipe(createWriteStream(path)));
  }
}
