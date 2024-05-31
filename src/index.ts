/**
 * Algo:
 * - generate tile list from geojson geometry
 * - download tiles
 * - thin lidar files
 * - crop bordering tiles
 * - download osm files
 * - reproject and transform osm files to shp files
 * - generate tiles with karttapullautin
 * - generate tiles pyramide for the web
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DOWNLOADS_DIR } from "./constants.ts";
import { preprocessLidarFiles } from "./preprocess.ts";
import { generateTileListFromGeojsonObject } from "./tile-list.ts";

const geojson = readFileSync(join("data", "geojson.geojson")).toString();
const tileList = generateTileListFromGeojsonObject(JSON.parse(geojson));

// const tilesJson = tileListToGeojson(tileList.filter((t) => !t.isBuffer));
// const bufferJson = tileListToGeojson(tileList.filter((t) => t.isBuffer));

// writeFileSync("tiles.geojson", tilesJson);
// writeFileSync("buffer.geojson", bufferJson);

// await download(tileList);

preprocessLidarFiles(DOWNLOADS_DIR, "thined", tileList, 20);

// import { join } from "path";
// import { createTilePyramid } from "./tile-pyramid.js";

// await createTilePyramid({
//     inputDir: join("data", "raw-images"),
//     existingTilesDir: "toto",
//     inputZoom: 11,
//     minZoom: 0,
//     maxZoom: 14,
//     outputDir: "tiles"
// })
