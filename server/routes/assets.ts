import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();
const assetsDir = path.resolve(import.meta.dirname, "..", "..", "attached_assets");

function isImage(file: string) {
  return /(\.png|\.jpg|\.jpeg|\.webp|\.svg)$/i.test(file);
}

router.get("/images", async (_req, res) => {
  try {
    const entries = await fs.promises.readdir(assetsDir, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && isImage(e.name))
      .map(async (e) => {
        const full = path.join(assetsDir, e.name);
        const stat = await fs.promises.stat(full);
        const encoded = encodeURIComponent(e.name);
        return {
          name: e.name,
          url: `/assets/${encoded}`,
          size: stat.size,
          mtimeMs: stat.mtimeMs,
          ext: path.extname(e.name).toLowerCase().replace(".", ""),
        };
      });

    const resolved = await Promise.all(files);

    // Sort by size desc as a simple proxy for quality
    resolved.sort((a, b) => b.size - a.size);

    res.json({ files: resolved });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to list images", error: String(err?.message || err) });
  }
});

export default router;
