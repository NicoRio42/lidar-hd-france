import type { GeojsonObject } from "./models/geojson.model.ts";
import type { TileItem, TileItemBufferType } from "./models/tile-item.model.ts";

export function generateTileListFromGeojsonObject(
  geojsonObject: GeojsonObject
) {
  const coordinates = geojsonObject.features[0].geometry.coordinates[0][0];

  let [minX, minY] = coordinates[0];
  let [maxX, maxY] = coordinates[0];

  for (const [x, y] of coordinates) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  const tiles: TileItem[] = [];

  for (let x = Math.floor(minX / 1000 - 1); x <= maxX / 1000 + 1; x++) {
    for (let y = Math.floor(minY / 1000 - 1); y <= maxY / 1000 + 1; y++) {
      if (isTileInsidePolygon([x * 1000, y * 1000], coordinates)) {
        tiles.push({ x, y, isBuffer: false });
      } else if (isBufferTile([x * 1000, y * 1000], coordinates)) {
        tiles.push({
          x,
          y,
          isBuffer: true,
          type: getBufferType([x * 1000, y * 1000], coordinates),
        });
      }
    }
  }

  return tiles;
}

function isBufferTile([x, y]: [number, number], polygon: [number, number][]) {
  return (
    isTileInsidePolygon([x, y + 1000], polygon) ||
    isTileInsidePolygon([x + 1000, y + 1000], polygon) ||
    isTileInsidePolygon([x + 1000, y], polygon) ||
    isTileInsidePolygon([x + 1000, y - 1000], polygon) ||
    isTileInsidePolygon([x, y - 1000], polygon) ||
    isTileInsidePolygon([x - 1000, y - 1000], polygon) ||
    isTileInsidePolygon([x - 1000, y], polygon) ||
    isTileInsidePolygon([x - 1000, y + 1000], polygon)
  );
}

function isTileInsidePolygon(
  [x, y]: [number, number],
  polygon: [number, number][]
) {
  return (
    isPointInsidePolygon([x, y], polygon) ||
    isPointInsidePolygon([x + 1000, y], polygon) ||
    isPointInsidePolygon([x, y + 1000], polygon) ||
    isPointInsidePolygon([x + 1000, y + 1000], polygon)
  );
}

function isPointInsidePolygon(
  [x, y]: [number, number],
  polygon: [number, number][]
) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function getBufferType(
  [x, y]: [number, number],
  polygon: [number, number][]
): TileItemBufferType {
  const neighbors = getNeighbors([x, y], polygon);
  if (hasSeveralInCorners(neighbors)) return "full";
  const {
    bottom,
    bottomLeft,
    bottomRight,
    left,
    right,
    top,
    topLeft,
    topRight,
  } = neighbors;

  if (right && bottomRight && bottom) {
    return "inCornerTopLeft";
  }
  if (left && bottomLeft && bottom) {
    return "inCornerTopRight";
  }
  if (left && topLeft && top) {
    return "inCornerBottomRight";
  }
  if (top && topRight && right) {
    return "inCornerBottomLeft";
  }

  if (bottom) return "top";
  if (left) return "right";
  if (top) return "bottom";
  if (right) return "left";

  if (bottomRight) return "outCornerTopLeft";
  if (bottomLeft) return "outCornerTopRight";
  if (topLeft) return "outCornerBottomRight";
  if (topRight) return "outCornerBottomLeft";

  return "full";
}

type Neighbors = {
  top: boolean;
  topRight: boolean;
  right: boolean;
  bottomRight: boolean;
  bottom: boolean;
  bottomLeft: boolean;
  left: boolean;
  topLeft: boolean;
};

function hasSeveralInCorners({
  bottom,
  bottomLeft,
  bottomRight,
  left,
  right,
  top,
  topLeft,
  topRight,
}: Neighbors) {
  // Not consistet naming
  const topLeftCorner = left && topLeft && top;
  const topRightCorner = top && topRight && right;
  const bottomRightCorner = right && bottomRight && bottom;
  const bottLeftCorner = bottom && bottomLeft && left;

  return (
    [topLeftCorner, topRightCorner, bottomRightCorner, bottLeftCorner].filter(
      (v) => v
    ).length > 1
  );
}

function getNeighbors([x, y]: [number, number], polygon: [number, number][]) {
  return {
    top: isTileInsidePolygon([x, y + 1000], polygon),
    topRight: isTileInsidePolygon([x + 1000, y + 1000], polygon),
    right: isTileInsidePolygon([x + 1000, y], polygon),
    bottomRight: isTileInsidePolygon([x + 1000, y - 1000], polygon),
    bottom: isTileInsidePolygon([x, y - 1000], polygon),
    bottomLeft: isTileInsidePolygon([x - 1000, y - 1000], polygon),
    left: isTileInsidePolygon([x - 1000, y], polygon),
    topLeft: isTileInsidePolygon([x - 1000, y + 1000], polygon),
  };
}

export function tileListToGeojson(tileList: TileItem[]) {
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
        }`;
  });

  return `{
        "type": "FeatureCollection",
        "name": "toto",
        "crs": {
            "type": "name",
            "properties": { "name": "urn:ogc:def:crs:EPSG::2154" }
        },
        "features": [
            ${features.join(",")}
        ]
    }
    `;
}
