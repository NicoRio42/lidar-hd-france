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

    /** @type {import("./models/tile-item.model.js").TileItem[]} */
    const tiles = []

    for (let x = Math.floor(minX / 1000 - 1); x <= maxX / 1000 + 1; x++) {
        for (let y = Math.floor(minY / 1000 - 1); y <= maxY / 1000 + 1; y++) {
            if (isTileInsidePolygon([x * 1000, y * 1000], coordinates)) {
                tiles.push({ x, y, isBuffer: false });
            } else if (isBufferTile([x * 1000, y * 1000], coordinates)) {
                tiles.push({ x, y, isBuffer: true, type: getBufferType([x * 1000, y * 1000], coordinates) });
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
    return isTileInsidePolygon([x, y + 1000], polygon)
        || isTileInsidePolygon([x + 1000, y + 1000], polygon)
        || isTileInsidePolygon([x + 1000, y], polygon)
        || isTileInsidePolygon([x + 1000, y - 1000], polygon)
        || isTileInsidePolygon([x, y - 1000], polygon)
        || isTileInsidePolygon([x - 1000, y - 1000], polygon)
        || isTileInsidePolygon([x - 1000, y], polygon)
        || isTileInsidePolygon([x - 1000, y + 1000], polygon)
}

/**
 * @param {[number, number]} tile 
 * @param {[number, number][]} polygon 
 */
function isTileInsidePolygon([x, y], polygon) {
    return isPointInsidePolygon([x, y], polygon)
        || isPointInsidePolygon([x + 1000, y], polygon)
        || isPointInsidePolygon([x, y + 1000], polygon)
        || isPointInsidePolygon([x + 1000, y + 1000], polygon)
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


/**
 * @param {[number, number]} tile 
 * @param {[number, number][]} polygon
 * @returns {import("./models/tile-item.model.js").TileItemBufferType}
 */
function getBufferType([x, y], polygon) {
    const neighbors = getNeighbors([x, y], polygon);
    if (hasSeveralInCorners(neighbors)) return "full";
    const { bottom, bottomLeft, bottomRight, left, right, top, topLeft, topRight } = neighbors;

    if (right && bottomRight && bottom) {
        return 'inCornerTopLeft';
    }
    if (left && bottomLeft && bottom) {
        return 'inCornerTopRight';
    }
    if (left && topLeft && top) {
        return 'inCornerBottomRight';
    }
    if (top && topRight && right) {
        return 'inCornerBottomLeft';
    }

    if (bottom) return 'top';
    if (left) return 'right';
    if (top) return 'bottom';
    if (right) return 'left';

    if (bottomRight) return 'outCornerTopLeft';
    if (bottomLeft) return 'outCornerTopRight';
    if (topLeft) return 'outCornerBottomRight';
    if (topRight) return 'outCornerBottomLeft';

    return 'full';
}

/**
 * @typedef {Object} Neighbors
 * @property {boolean} top
 * @property {boolean} topRight
 * @property {boolean} right
 * @property {boolean} bottomRight
 * @property {boolean} bottom
 * @property {boolean} bottomLeft
 * @property {boolean} left
 * @property {boolean} topLeft
 */

/**
 * @param {Neighbors} neighbors 
 */
function hasSeveralInCorners({ bottom, bottomLeft, bottomRight, left, right, top, topLeft, topRight }) {
    // Not consistet naming
    const topLeftCorner = left && topLeft && top;
    const topRightCorner = top && topRight && right;
    const bottomRightCorner = right && bottomRight && bottom;
    const bottLeftCorner = bottom && bottomLeft && left;

    return [topLeftCorner, topRightCorner, bottomRightCorner, bottLeftCorner].filter(v => v).length > 1;
}

/**
 * @param {[number, number]} tile 
 * @param {[number, number][]} polygon
 */
function getNeighbors([x, y], polygon) {
    return {
        top: isTileInsidePolygon([x, y + 1000], polygon),
        topRight: isTileInsidePolygon([x + 1000, y + 1000], polygon),
        right: isTileInsidePolygon([x + 1000, y], polygon),
        bottomRight: isTileInsidePolygon([x + 1000, y - 1000], polygon),
        bottom: isTileInsidePolygon([x, y - 1000], polygon),
        bottomLeft: isTileInsidePolygon([x - 1000, y - 1000], polygon),
        left: isTileInsidePolygon([x - 1000, y], polygon),
        topLeft: isTileInsidePolygon([x - 1000, y + 1000], polygon),
    }
}

/**
 * @param {import("./models/tile-item.model.js").TileItem[]} tileList 
 */
export function tileListToGeojson(tileList) {
    const features = tileList.map(({ x, y, ...rest }) => {
        return `
        {
            "type": "Feature",
            "properties": ${JSON.stringify(rest)},
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [
                    [
                        [
                            [${x * 1000}, ${y * 1000}],
                            [${(x + 1) * 1000}, ${y * 1000}],
                            [${(x + 1) * 1000}, ${(y + 1) * 1000}],
                            [${x * 1000}, ${(y + 1) * 1000}],
                            [${x * 1000}, ${y * 1000}]
                        ]
                    ]
                ]
            }
        }`
    })

    return `{
        "type": "FeatureCollection",
        "name": "toto",
        "crs": {
            "type": "name",
            "properties": { "name": "urn:ogc:def:crs:EPSG::2154" }
        },
        "features": [
            ${features.join(',')}
        ]
    }
    `
}
