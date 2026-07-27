// Generates build-assets/icon.ico + icon.png (Electron app icon), the web
// favicon.ico, and the PWA/manifest PNG icons — all from the single
// canonical square source at public/brand/icon-mark.png. Re-run this
// (`npm run electron:icon`) any time that source asset is replaced.
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "public/brand/icon-mark.png");

/** Wraps a list of already-encoded same-format PNG buffers into a multi-resolution .ico container. */
function buildIco(entries) {
  const dirHeader = Buffer.alloc(6);
  dirHeader.writeUInt16LE(0, 0); // reserved
  dirHeader.writeUInt16LE(1, 2); // type: icon
  dirHeader.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const dirEntries = [];
  for (const { size, data } of entries) {
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
    dirEntries.push(entry);
  }

  return Buffer.concat([dirHeader, ...dirEntries, ...entries.map((e) => e.data)]);
}

async function renderPng(size) {
  return sharp(SOURCE).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
}

async function writeIco(outPath, sizes) {
  const entries = await Promise.all(
    sizes.map(async (size) => ({ size, data: await renderPng(size) }))
  );
  fs.writeFileSync(outPath, buildIco(entries));
  console.log(`Wrote ${outPath} (${sizes.join(", ")}px)`);
}

async function writePng(outPath, size) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, await renderPng(size));
  console.log(`Wrote ${outPath} (${size}px)`);
}

async function main() {
  const buildAssetsDir = path.join(ROOT, "build-assets");
  fs.mkdirSync(buildAssetsDir, { recursive: true });

  await writeIco(path.join(buildAssetsDir, "icon.ico"), [16, 24, 32, 48, 64, 128, 256]);
  await writePng(path.join(buildAssetsDir, "icon.png"), 512);

  await writeIco(path.join(ROOT, "src/app/favicon.ico"), [16, 32, 48]);

  await writePng(path.join(ROOT, "public/icons/icon-192.png"), 192);
  await writePng(path.join(ROOT, "public/icons/icon-512.png"), 512);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
