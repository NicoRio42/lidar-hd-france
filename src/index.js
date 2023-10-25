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

import { join } from "path";
import { createTilePyramid } from "./tile-pyramid.js";

createTilePyramid({
    inputDir: join("data", "raw-images"),
    existingTilesDir: "toto",
    inputZoom: 11,
    minZoom: 0,
    maxZoom: 14,
    outputDir: "tiles"
})