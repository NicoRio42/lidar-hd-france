/**
 * @param {import("./models/geojson.model.js").GeojsonObject} geojsonObject 
 */
export function generateTileListFromGeojsonObject(geojsonObject) {
    const coordinates = geojsonObject.features[0].geometry.coordinates[0][0]

    let [minX, minY] = coordinates[0]
    let [maxX, maxY] = coordinates[0]

    for (const [x, y] of coordinates) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    }

    /** @type {[number, number][]} */
    const tiles = []

    for (let x = Math.floor(minX / 1000 - 1); x <= maxX / 1000 + 1; x++) {
        for (let y = Math.floor(minY / 1000 - 1); y <= maxY / 1000 + 1; y++) {
            if (isTileInsidePolygon([x, y], coordinates) || isBufferTile([x, y], coordinates)) {
                tiles.push([x, y]);
            }
        }
    }

    return tiles;
}


/**
 * @param {[number, number]} tile 
 * @param {[number, number][]} polygon 
 */
function isBufferTile([x, y], polygon) {
    return isTileInsidePolygon([x, y + 1], polygon)
        || isTileInsidePolygon([x + 1, y + 1], polygon)
        || isTileInsidePolygon([x + 1, y], polygon)
        || isTileInsidePolygon([x + 1, y - 1], polygon)
        || isTileInsidePolygon([x, y - 1], polygon)
        || isTileInsidePolygon([x - 1, y - 1], polygon)
        || isTileInsidePolygon([x - 1, y], polygon)
        || isTileInsidePolygon([x - 1, y + 1], polygon)
}

/**
 * @param {[number, number]} tile 
 * @param {[number, number][]} polygon 
 */
function isTileInsidePolygon([x, y], polygon) {
    return isPointInsidePolygon([x, y], polygon)
        || isPointInsidePolygon([x + 1, y], polygon)
        || isPointInsidePolygon([x, y + 1], polygon)
        || isPointInsidePolygon([x + 1, y + 1], polygon)
}

/**
 * @param {[number, number]} point 
 * @param {[number, number][]} polygon 
 * @returns 
 */
function isPointInsidePolygon([x, y], polygon) {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];

        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }

    return inside;
};