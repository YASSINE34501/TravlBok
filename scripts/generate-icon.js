// Generates build-assets/icon.ico (multi-resolution) and icon.png for the
// Electron app. No icon/logo asset existed anywhere in the repo, and no
// image-processing dependency (sharp, canvas, etc.) is installed, so this
// draws a simple flat "TB" monogram badge directly as raw RGBA pixels and
// encodes it to PNG (via zlib, built into Node) and ICO by hand. Replace
// build-assets/icon.ico with real branding whenever one is designed —
// this is a functional placeholder, not final art.
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const OUT_DIR = path.join(__dirname, "..", "build-assets");
const BG = [0x0f, 0x4c, 0x81, 0xff]; // brand blue
const FG = [0xff, 0xff, 0xff, 0xff]; // white monogram

// 5x7 bitmap glyphs (1 = foreground pixel), for "T" and "B".
const GLYPH_T = [
  "11111",
  "00100",
  "00100",
  "00100",
  "00100",
  "00100",
  "00100",
];
const GLYPH_B = [
  "11110",
  "10001",
  "10001",
  "11110",
  "10001",
  "10001",
  "11110",
];

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function drawGlyph(pixels, size, glyph, cellSize, offsetXCells, offsetYCells) {
  for (let gy = 0; gy < glyph.length; gy++) {
    for (let gx = 0; gx < glyph[gy].length; gx++) {
      if (glyph[gy][gx] !== "1") continue;
      const px0 = (offsetXCells + gx) * cellSize;
      const py0 = (offsetYCells + gy) * cellSize;
      for (let dy = 0; dy < cellSize; dy++) {
        for (let dx = 0; dx < cellSize; dx++) {
          const px = px0 + dx;
          const py = py0 + dy;
          if (px < 0 || py < 0 || px >= size || py >= size) continue;
          const idx = (py * size + px) * 4;
          pixels[idx] = FG[0];
          pixels[idx + 1] = FG[1];
          pixels[idx + 2] = FG[2];
          pixels[idx + 3] = FG[3];
        }
      }
    }
  }
}

function roundedMask(x, y, size, radius) {
  const cornerMinX = radius;
  const cornerMaxX = size - radius;
  const cornerMinY = radius;
  const cornerMaxY = size - radius;
  const inCornerX = x < cornerMinX || x >= cornerMaxX;
  const inCornerY = y < cornerMinY || y >= cornerMaxY;
  if (!inCornerX || !inCornerY) return true;
  const cx = x < cornerMinX ? cornerMinX : cornerMaxX;
  const cy = y < cornerMinY ? cornerMinY : cornerMaxY;
  const dx = x - cx + 0.5;
  const dy = y - cy + 0.5;
  return dx * dx + dy * dy <= radius * radius;
}

function renderIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const radius = Math.round(size * 0.18);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      if (roundedMask(x, y, size, radius)) {
        pixels[idx] = BG[0];
        pixels[idx + 1] = BG[1];
        pixels[idx + 2] = BG[2];
        pixels[idx + 3] = BG[3];
      } else {
        pixels[idx + 3] = 0; // transparent outside the rounded badge
      }
    }
  }

  // Only draw the monogram at sizes where a 12-cell-wide glyph pair stays
  // legible; smaller taskbar sizes just show the plain badge color.
  if (size >= 32) {
    const cellSize = Math.max(1, Math.floor(size / 16));
    const totalWidth = cellSize * 11; // "T" (5) + gap (1) + "B" (5)
    const totalHeight = cellSize * 7;
    const offsetXCells = Math.floor((size - totalWidth) / 2 / cellSize);
    const offsetYCells = Math.floor((size - totalHeight) / 2 / cellSize);
    drawGlyph(pixels, size, GLYPH_T, cellSize, offsetXCells, offsetYCells);
    drawGlyph(pixels, size, GLYPH_B, cellSize, offsetXCells + 6, offsetYCells);
  }

  return pixels;
}

function encodePNG(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawWithFilter = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    rawWithFilter[rowStart] = 0; // filter type: none
    pixels.copy(rawWithFilter, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idatData = zlib.deflateSync(rawWithFilter, { level: 9 });

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idatData),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function buildIco(sizes) {
  const images = sizes.map((size) => encodePNG(size, renderIcon(size)));
  const dirHeader = Buffer.alloc(6);
  dirHeader.writeUInt16LE(0, 0); // reserved
  dirHeader.writeUInt16LE(1, 2); // type: icon
  dirHeader.writeUInt16LE(sizes.length, 4);

  let offset = 6 + sizes.length * 16;
  const entries = [];
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const data = images[i];
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size; // 0 means 256
    entry[1] = size >= 256 ? 0 : size;
    entry[2] = 0; // color palette
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(entry);
  }

  return Buffer.concat([dirHeader, ...entries, ...images]);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const icoSizes = [16, 24, 32, 48, 64, 128, 256];
fs.writeFileSync(path.join(OUT_DIR, "icon.ico"), buildIco(icoSizes));

const pngBuffer = encodePNG(512, renderIcon(512));
fs.writeFileSync(path.join(OUT_DIR, "icon.png"), pngBuffer);

console.log(`Wrote ${path.join(OUT_DIR, "icon.ico")} (${icoSizes.join(", ")}px) and icon.png (512px).`);
