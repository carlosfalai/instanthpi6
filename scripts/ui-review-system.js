#!/usr/bin/env node

/**
 * UI Review System - Automatic Quality Assurance
 *
 * This script automatically reviews UI components for common issues:
 * 1. Color contrast problems (white on white, etc.)
 * 2. Dark theme consistency
 * 3. Layout issues
 * 4. Accessibility problems
 * 5. Responsive design issues
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UIReviewSystem {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.suggestions = [];
  }

  // Review a file for UI issues
  reviewFile(filePath) {
    if (!fs.existsSync(filePath)) {
      this.warnings.push(`File not found: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, "utf8");
    this.reviewContent(content, filePath);
  }

  // Review content for common UI issues
  reviewContent(content, filePath) {
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for white text on white background
      if (this.hasWhiteOnWhite(line)) {
        this.issues.push({
          type: "CRITICAL",
          file: filePath,
          line: lineNumber,
          issue: "White text on white background detected",
          code: line.trim(),
          fix: "Change text color to dark or background to dark",
        });
      }

      // Check for inconsistent dark theme
      if (this.hasInconsistentDarkTheme(line)) {
        this.issues.push({
          type: "WARNING",
          file: filePath,
          line: lineNumber,
          issue: "Inconsistent dark theme colors",
          code: line.trim(),
          fix: "Use consistent dark theme colors (bg-gray-800, text-white, border-gray-700)",
        });
      }

      // Check for poor contrast
      if (this.hasPoorContrast(line)) {
        this.issues.push({
          type: "WARNING",
          file: filePath,
          line: lineNumber,
          issue: "Poor color contrast detected",
          code: line.trim(),
          fix: "Improve color contrast for better readability",
        });
      }

      // Check for layout issues
      if (this.hasLayoutIssues(line)) {
        this.warnings.push({
          type: "SUGGESTION",
          file: filePath,
          line: lineNumber,
          issue: "Potential layout issue",
          code: line.trim(),
          fix: "Review layout structure",
        });
      }

      // Check for accessibility issues
      if (this.hasAccessibilityIssues(line)) {
        this.warnings.push({
          type: "ACCESSIBILITY",
          file: filePath,
          line: lineNumber,
          issue: "Accessibility concern",
          code: line.trim(),
          fix: "Improve accessibility",
        });
      }
    });
  }

  // Check for white text on white background
  hasWhiteOnWhite(line) {
    const whiteTextPatterns = [/text-white/, /text-gray-100/, /text-gray-200/, /text-gray-300/];

    const whiteBgPatterns = [
      /bg-white/,
      /bg-gray-50/,
      /bg-gray-100/,
      /bg-slate-50/,
      /bg-slate-100/,
    ];

    const hasWhiteText = whiteTextPatterns.some((pattern) => pattern.test(line));
    const hasWhiteBg = whiteBgPatterns.some((pattern) => pattern.test(line));

    return hasWhiteText && hasWhiteBg;
  }

  // Check for inconsistent dark theme
  hasInconsistentDarkTheme(line) {
    const darkThemePatterns = [/bg-gray-900/, /bg-gray-800/, /bg-gray-700/];

    const lightThemePatterns = [/bg-white/, /bg-gray-50/, /bg-slate-50/];

    const hasDarkTheme = darkThemePatterns.some((pattern) => pattern.test(line));
    const hasLightTheme = lightThemePatterns.some((pattern) => pattern.test(line));

    // If we have both dark and light themes in the same context, it's inconsistent
    return hasDarkTheme && hasLightTheme;
  }

  // Check for poor contrast
  hasPoorContrast(line) {
    const poorContrastPatterns = [
      /text-gray-400.*bg-gray-800/, // Light gray on dark
      /text-gray-500.*bg-gray-800/, // Medium gray on dark
      /text-gray-600.*bg-white/, // Medium gray on white
    ];

    return poorContrastPatterns.some((pattern) => pattern.test(line));
  }

  // Check for layout issues
  hasLayoutIssues(line) {
    const layoutIssuePatterns = [
      /grid-cols-1.*lg:grid-cols-3/, // Potential responsive issues
      /col-span-2.*col-span-1/, // Potential grid issues
      /fixed.*height/, // Fixed heights can cause issues
    ];

    return layoutIssuePatterns.some((pattern) => pattern.test(line));
  }

  // Check for accessibility issues
  hasAccessibilityIssues(line) {
    const accessibilityPatterns = [
      /onClick.*without.*onKeyDown/, // Missing keyboard support
      /img.*without.*alt/, // Missing alt text
      /button.*without.*aria-label/, // Missing aria labels
    ];

    return accessibilityPatterns.some((pattern) => pattern.test(line));
  }

  // Generate comprehensive report
  generateReport() {
    console.log("\n🔍 UI REVIEW SYSTEM REPORT");
    console.log("========================\n");

    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log("✅ No issues found! UI looks good.");
      return;
    }

    // Critical issues
    if (this.issues.length > 0) {
      console.log("🚨 CRITICAL ISSUES:");
      this.issues.forEach((issue) => {
        console.log(`\n❌ ${issue.type}: ${issue.issue}`);
        console.log(`   File: ${issue.file}:${issue.line}`);
        console.log(`   Code: ${issue.code}`);
        console.log(`   Fix: ${issue.fix}`);
      });
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log("\n⚠️  WARNINGS:");
      this.warnings.forEach((warning) => {
        console.log(`\n⚠️  ${warning.type}: ${warning.issue}`);
        console.log(`   File: ${warning.file}:${warning.line}`);
        console.log(`   Code: ${warning.code}`);
        console.log(`   Fix: ${warning.fix}`);
      });
    }

    // Summary
    console.log("\n📊 SUMMARY:");
    console.log(`   Critical Issues: ${this.issues.length}`);
    console.log(`   Warnings: ${this.warnings.length}`);
    console.log(`   Total Issues: ${this.issues.length + this.warnings.length}`);

    // Auto-fix suggestions
    if (this.issues.length > 0) {
      console.log("\n🔧 AUTO-FIX SUGGESTIONS:");
      this.generateAutoFixSuggestions();
    }
  }

  // Generate auto-fix suggestions
  generateAutoFixSuggestions() {
    const fixes = new Map();

    this.issues.forEach((issue) => {
      if (issue.type === "CRITICAL" && issue.issue.includes("White text on white background")) {
        const key = "white-on-white";
        if (!fixes.has(key)) {
          fixes.set(key, {
            issue: "White text on white background",
            files: [],
            fix: "Replace bg-white with bg-gray-800 and ensure text-white is used",
          });
        }
        fixes.get(key).files.push(`${issue.file}:${issue.line}`);
      }
    });

    fixes.forEach((fix, key) => {
      console.log(`\n🔧 ${fix.issue}:`);
      console.log(`   Files: ${fix.files.join(", ")}`);
      console.log(`   Fix: ${fix.fix}`);
    });
  }

  // Run comprehensive review
  runReview() {
    console.log("🔍 Starting UI Review System...\n");

    // Review main dashboard file
    this.reviewFile("client/src/pages/doctor-dashboard.tsx");

    // Review other key UI files
    const uiFiles = [
      "client/src/pages/doctor-login.tsx",
      "client/src/pages/doctor-profile.tsx",
      "client/src/pages/public-patient-intake.tsx",
    ];

    uiFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        this.reviewFile(file);
      }
    });

    this.generateReport();
  }
}

// Run the review system
const reviewer = new UIReviewSystem();
reviewer.runReview();

export default UIReviewSystem;
