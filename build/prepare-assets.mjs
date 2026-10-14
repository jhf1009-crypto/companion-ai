// Run once when updating the source images; generated assets are committed.
// node build/prepare-assets.mjs [path-to-sharp]
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const sharp = require(process.argv[2] || "sharp");
const logo = "public/images/image.png";
await sharp(logo).resize({ width: 320, withoutEnlargement: true }).webp({ lossless: true }).toFile("public/images/logo.webp");
await sharp("public/images/hero-photo.png").webp({ quality: 85, effort: 6 }).toFile("public/images/hero-photo.webp");
for (const [size, path] of [[32, "public/favicon-32.png"], [180, "public/apple-touch-icon.png"]]) {
  await sharp(logo).resize(size, size, { fit: "contain", background: "#0b0b0b" }).png().toFile(path);
}
const svg = (await readFile("public/images/og-image.svg", "utf8")).replace("EXCLUSIVA", "DO ENZO");
await sharp(Buffer.from(svg)).png().toFile("public/images/og-image.png");
console.log("Generated PNG icons, 1200x630 OG image, and optimized WebP assets.");
