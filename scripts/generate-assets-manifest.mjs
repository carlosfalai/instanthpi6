import fs from "fs";
import path from "path";

const distPublicDir = path.resolve(process.cwd(), "dist/public");
const distAssetsDir = path.join(distPublicDir, "assets");
const distImagesDir = path.join(distPublicDir, "images");
const distImagesCustomDir = path.join(distPublicDir, "images for the website instanthpi");
const manifestPath = path.join(distAssetsDir, "images.json");

function isImage(file) {
  return /(\.png|\.jpg|\.jpeg|\.webp|\.svg)$/i.test(file);
}

async function listImages(dir, baseUrl) {
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter((e) => e.isFile() && isImage(e.name))
        .map(async (e) => {
          const full = path.join(dir, e.name);
          const stat = await fs.promises.stat(full);
          const encoded = encodeURIComponent(e.name);
          return {
            name: e.name,
            url: `${baseUrl}/${encoded}`,
            size: stat.size,
            mtimeMs: stat.mtimeMs,
            ext: path.extname(e.name).toLowerCase().replace(".", ""),
          };
        })
    );
    return files;
  } catch (err) {
    return [];
  }
}

async function run() {
  try {
    await fs.promises.mkdir(distAssetsDir, { recursive: true });

    const fromAssets = await listImages(distAssetsDir, "/assets");
    const fromImages = await listImages(distImagesDir, "/images");
    const fromImagesCustom = await listImages(
      distImagesCustomDir,
      "/images%20for%20the%20website%20instanthpi"
    );

    const files = [...fromAssets, ...fromImages, ...fromImagesCustom];

    files.sort((a, b) => b.size - a.size);
    const json = JSON.stringify({ files }, null, 2);
    await fs.promises.writeFile(manifestPath, json);
    console.log(`Wrote assets manifest: ${manifestPath} with ${files.length} images`);
  } catch (err) {
    console.warn("Skipping assets manifest generation:", err?.message || err);
  }
}

run();
