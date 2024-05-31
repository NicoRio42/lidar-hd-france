import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { makeDirRecursivelyIfNotExist } from "./utils.ts";

interface CreateTilesOptions {
  inputDir: string;
  outputDir: string;
  existingTilesDir: string;
  inputZoom: number;
  minZoom: number;
  maxZoom: number;
}

/**
 * Constants computed to cover the whole metropolitan France
 */
const MIN_X = 343646;
const MAX_X = 1704354;
const MIN_Y = 5619537;
const MAX_Y = 7667537;
const MAX_TILE_SIZE = 500 * Math.pow(2, 12);
const BASE_TILE_IMAGE_PIXEL_SIZE = 2364;
const TILE_IMAGE_PIXEL_SIZE = 256;

export async function createTilePyramid({
  inputDir,
  outputDir,
  existingTilesDir,
  inputZoom,
  minZoom,
  maxZoom,
}: CreateTilesOptions) {
  if (minZoom > inputZoom || maxZoom < inputZoom) {
    throw new Error("Input zoom should be between minZoom and maxZoom");
  }

  createBaseZoomLevel(inputDir, outputDir, inputZoom);

  for (let zoom = inputZoom + 1; zoom <= maxZoom; zoom++) {
    await createLowerZoomLevel(zoom, outputDir, inputZoom);
  }

  for (let zoom = inputZoom; zoom <= maxZoom; zoom++) {
    await resizeZoomLevel(zoom, outputDir);
  }

  for (let zoom = inputZoom - 1; zoom >= minZoom; zoom--) {
    await createUpperZoomLevel(zoom, outputDir);
  }
}

function createBaseZoomLevel(
  inputDir: string,
  outputDir: string,
  inputZoom: number
) {
  console.log(`Creating base zoom level: ${inputZoom}`);

  const dir: string[] = readdirSync(inputDir);

  for (const fileName of dir) {
    const [xLanmbert93, yLanmbert93] = fileName
      .split(".")[0]
      .split("-")
      .map((n) => parseInt(n, 10));
    const [x, y] = lambert93ToTileNum(
      xLanmbert93 * 1000,
      yLanmbert93 * 1000,
      inputZoom
    );

    const xDir = join(outputDir, inputZoom.toString(), x.toString());
    if (!existsSync(xDir)) mkdirSync(xDir, { recursive: true });

    copyFileSync(join(inputDir, fileName), join(xDir, `${y}.png`));
  }
}

async function loopOnZoomLevel(
  zoomDirPath: string,
  callback: (options: {
    x: number;
    y: number;
    tilePath: string;
  }) => void | Promise<void>
) {
  for (const xParentStr of readdirSync(zoomDirPath)) {
    const x = parseInt(xParentStr);

    for (const yParentStr of readdirSync(join(zoomDirPath, xParentStr))) {
      const y = parseInt(yParentStr.split(".")[0]);
      const tilePath = join(zoomDirPath, xParentStr, yParentStr);

      await Promise.resolve(callback({ x, y, tilePath })).catch(console.error);
    }
  }
}

async function createLowerZoomLevel(
  zoomLevel: number,
  outputDir: string,
  inputZoom: number
) {
  console.log(`Creating lower zoom level: ${zoomLevel}`);

  const parentDirPath = join(outputDir, (zoomLevel - 1).toString());
  if (!existsSync(parentDirPath))
    throw new Error(
      `Cannot generate zoom level ${zoomLevel} because parent zoom levent ${
        zoomLevel - 1
      }`
    );

  await loopOnZoomLevel(
    parentDirPath,
    async ({ x: xParent, y: yParent, tilePath: parentTilePath }) => {
      const xTopLeft = 2 * xParent;
      const yTopLeft = 2 * yParent;

      const xDir = join(outputDir, zoomLevel.toString(), xTopLeft.toString());
      if (!existsSync(xDir)) mkdirSync(xDir, { recursive: true });

      const xDirPlus1 = join(
        outputDir,
        zoomLevel.toString(),
        (xTopLeft + 1).toString()
      );
      if (!existsSync(xDirPlus1)) mkdirSync(xDirPlus1, { recursive: true });

      const imageSize = Math.floor(
        BASE_TILE_IMAGE_PIXEL_SIZE / Math.pow(2, zoomLevel - inputZoom)
      );

      await Promise.all([
        // Top left
        sharp(parentTilePath)
          .extract({ width: imageSize, height: imageSize, left: 0, top: 0 })
          .toFile(join(join(xDir, `${yTopLeft}.png`))),

        // Bottom left
        sharp(parentTilePath)
          .extract({
            width: imageSize,
            height: imageSize,
            left: 0,
            top: imageSize,
          })
          .toFile(join(join(xDir, `${yTopLeft + 1}.png`))),

        // Top right
        sharp(parentTilePath)
          .extract({
            width: imageSize,
            height: imageSize,
            left: imageSize,
            top: 0,
          })
          .toFile(join(join(xDirPlus1, `${yTopLeft}.png`))),

        // Bottom right
        sharp(parentTilePath)
          .extract({
            width: imageSize,
            height: imageSize,
            left: imageSize,
            top: imageSize,
          })
          .toFile(join(join(xDirPlus1, `${yTopLeft + 1}.png`))),
      ]).catch(console.error);
    }
  ).catch(console.error);
}

async function resizeZoomLevel(zoomLevel: number, outputDir: string) {
  console.log(`Resizing zoom level: ${zoomLevel}`);
  const zoomDirPath = join(outputDir, zoomLevel.toString());

  await loopOnZoomLevel(zoomDirPath, async ({ tilePath }) => {
    const buffer = await sharp(tilePath)
      .resize({ width: TILE_IMAGE_PIXEL_SIZE, height: TILE_IMAGE_PIXEL_SIZE })
      .toBuffer();
    await sharp(buffer).toFile(tilePath).catch(console.error);
  }).catch(console.error);
}

async function createUpperZoomLevel(zoomLevel: number, outputDir: string) {
  console.log(`Creating upper zoom level: ${zoomLevel}`);
  const childZoomDirPath = join(outputDir, (zoomLevel + 1).toString());

  const tilesToGenerate: Set<string> = new Set();

  await loopOnZoomLevel(childZoomDirPath, async ({ x: childX, y: childY }) => {
    const [x, y] = findParentTile(childX, childY);
    tilesToGenerate.add(`${x}-${y}`);
  }).catch(console.error);

  for (const tile of tilesToGenerate) {
    const [x, y] = tile.split("-").map((n) => parseInt(n, 10));

    const xChildTopLeft = 2 * x;
    const yChildTopLeft = 2 * y;

    const childTopLeftImage = await getTileOrTransparentImage(
      xChildTopLeft,
      yChildTopLeft,
      zoomLevel + 1,
      outputDir
    )
      .resize({
        width: TILE_IMAGE_PIXEL_SIZE / 2,
        height: TILE_IMAGE_PIXEL_SIZE / 2,
        fit: "fill",
      })
      .png()
      .toBuffer();

    const childTopRightImage = await getTileOrTransparentImage(
      xChildTopLeft + 1,
      yChildTopLeft,
      zoomLevel + 1,
      outputDir
    )
      .resize({
        width: TILE_IMAGE_PIXEL_SIZE / 2,
        height: TILE_IMAGE_PIXEL_SIZE / 2,
        fit: "fill",
      })
      .png()
      .toBuffer();

    const childBottomRightImage = await getTileOrTransparentImage(
      xChildTopLeft + 1,
      yChildTopLeft + 1,
      zoomLevel + 1,
      outputDir
    )
      .resize({
        width: TILE_IMAGE_PIXEL_SIZE / 2,
        height: TILE_IMAGE_PIXEL_SIZE / 2,
        fit: "fill",
      })
      .png()
      .toBuffer();

    const childBottomLeftImage = await getTileOrTransparentImage(
      xChildTopLeft,
      yChildTopLeft + 1,
      zoomLevel + 1,
      outputDir
    )
      .resize({
        width: TILE_IMAGE_PIXEL_SIZE / 2,
        height: TILE_IMAGE_PIXEL_SIZE / 2,
        fit: "fill",
      })
      .png()
      .toBuffer();

    const xPath = join(outputDir, zoomLevel.toString(), x.toString());
    makeDirRecursivelyIfNotExist(xPath);

    await createTransparentTile(TILE_IMAGE_PIXEL_SIZE)
      .composite([
        { input: childTopLeftImage, gravity: "northwest" },
        { input: childTopRightImage, gravity: "northeast" },
        { input: childBottomRightImage, gravity: "southeast" },
        { input: childBottomLeftImage, gravity: "southwest" },
      ])
      .png({})
      .toFile(join(xPath, `${y}.png`))
      .catch(console.error);
  }
}

function lambert93ToTileNum(x: number, y: number, zoom: number) {
  const xTile = Math.floor(((x - MIN_X) * Math.pow(2, zoom)) / MAX_TILE_SIZE);
  const yTile = Math.floor(((MAX_Y - y) * Math.pow(2, zoom)) / MAX_TILE_SIZE);
  return [xTile, yTile];
}

function findParentTile(xChild: number, yChild: number) {
  const xParent = Math.floor(xChild / 2);
  const yParent = Math.floor(yChild / 2);

  return [xParent, yParent];
}

function tile2LonLat(x: number, y: number, z: number) {
  const lon = (x / Math.pow(2, z)) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return [lon, lat];
}

function getTileOrTransparentImage(
  x: number,
  y: number,
  zoom: number,
  outputDir: string
) {
  const tilePath = join(outputDir, zoom.toString(), x.toString(), `${y}.png`);
  if (!existsSync(tilePath)) {
    return createTransparentTile(TILE_IMAGE_PIXEL_SIZE);
  }

  return sharp(tilePath);
}

function createTransparentTile(imagePixelSize: number) {
  return sharp({
    create: {
      width: imagePixelSize,
      height: imagePixelSize,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      channels: 4,
    },
  });
}
