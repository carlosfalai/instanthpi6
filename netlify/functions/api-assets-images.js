const fs = require("fs");
const path = require("path");

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    // Define possible image directories
    const possibleDirs = [
      path.join(process.cwd(), "attached_assets"),
      path.join(process.cwd(), "client", "public", "images"),
      path.join(process.cwd(), "client", "public", "images for the website instanthpi"),
      path.join(process.cwd(), "dist", "public", "assets"),
      path.join(process.cwd(), "dist", "public", "images"),
      path.join(process.cwd(), "dist", "public", "images for the website instanthpi"),
    ];

    function isImage(file) {
      return /(\.png|\.jpg|\.jpeg|\.webp|\.svg)$/i.test(file);
    }

    async function listImages(dir, baseUrl) {
      try {
        if (!fs.existsSync(dir)) return [];

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
        console.warn(`Failed to read directory ${dir}:`, err.message);
        return [];
      }
    }

    // Try to find images in all possible directories
    let allFiles = [];

    for (const dir of possibleDirs) {
      if (fs.existsSync(dir)) {
        console.log(`Scanning directory: ${dir}`);
        const baseUrl = dir.includes("attached_assets")
          ? "/assets"
          : dir.includes("images for the website instanthpi")
            ? "/images%20for%20the%20website%20instanthpi"
            : dir.includes("images")
              ? "/images"
              : "/assets";

        const files = await listImages(dir, baseUrl);
        allFiles = [...allFiles, ...files];
      }
    }

    // If no images found, provide fallback images
    if (allFiles.length === 0) {
      console.log("No images found, using fallback images");
      allFiles = [
        {
          name: "instanthpi-hero.jpg",
          url: "/instanthpi-hero.jpg",
          size: 0,
          mtimeMs: Date.now(),
          ext: "jpg",
        },
        {
          name: "instanthpi-beach.jpg",
          url: "/instanthpi-beach.jpg",
          size: 0,
          mtimeMs: Date.now(),
          ext: "jpg",
        },
      ];
    }

    // Sort by size desc as a simple proxy for quality
    allFiles.sort((a, b) => b.size - a.size);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ files: allFiles }),
    };
  } catch (error) {
    console.error("Error in api-assets-images:", error);

    // Return fallback images on error
    const fallbackFiles = [
      {
        name: "instanthpi-hero.jpg",
        url: "/instanthpi-hero.jpg",
        size: 0,
        mtimeMs: Date.now(),
        ext: "jpg",
      },
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ files: fallbackFiles }),
    };
  }
};
