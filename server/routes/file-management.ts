import { Router } from "express";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Determine reports directory based on environment
const getReportsDir = () => {
  // In production/Netlify, use /tmp/reports
  if (process.env.NETLIFY || process.env.NODE_ENV === "production") {
    return "/tmp/reports";
  }
  // In local development, use a local reports directory
  return path.join(__dirname, "../../tmp/reports");
};

// List all reports
router.get("/list", async (req, res) => {
  try {
    const reportsDir = getReportsDir();
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const files = fs.readdirSync(reportsDir);
    const reports = files
      .filter((file) => file.endsWith(".html"))
      .map((file) => {
        const stats = fs.statSync(path.join(reportsDir, file));
        return {
          filename: file,
          created: stats.birthtime,
          size: (stats.size / 1024).toFixed(2) + " KB",
          url: `/reports/${file}`,
        };
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    res.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("File management error:", error);
    res.status(500).json({
      success: false,
      error: `File management error: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
});

// Delete a specific report
router.post("/delete", async (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename || !filename.endsWith(".html")) {
      return res.status(400).json({ success: false, error: "Invalid filename" });
    }

    const reportsDir = getReportsDir();
    const reportPath = path.join(reportsDir, filename);

    if (fs.existsSync(reportPath)) {
      fs.unlinkSync(reportPath);
      console.log(`🗑️ Report deleted: ${filename}`);

      res.json({ success: true, message: "Report deleted successfully" });
    } else {
      res.status(404).json({ success: false, error: "Report not found" });
    }
  } catch (error) {
    console.error("File management error:", error);
    res.status(500).json({
      success: false,
      error: `File management error: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
});

// Delete all reports
router.post("/cleanup", async (req, res) => {
  try {
    const reportsDir = getReportsDir();

    if (fs.existsSync(reportsDir)) {
      const files = fs.readdirSync(reportsDir);
      const htmlFiles = files.filter((file) => file.endsWith(".html"));
      let deletedCount = 0;

      htmlFiles.forEach((file) => {
        try {
          fs.unlinkSync(path.join(reportsDir, file));
          deletedCount++;
          console.log(`🧹 Cleaned up report: ${file}`);
        } catch (err) {
          console.error(`Error deleting ${file}:`, err);
        }
      });

      res.json({
        success: true,
        message: `${deletedCount} reports deleted`,
        deleted: deletedCount,
      });
    } else {
      res.json({
        success: true,
        message: "No reports to clean up",
        deleted: 0,
      });
    }
  } catch (error) {
    console.error("File management error:", error);
    res.status(500).json({
      success: false,
      error: `File management error: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
});

export default router;

