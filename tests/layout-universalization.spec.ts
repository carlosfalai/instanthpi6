import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';

/**
 * LAYOUT UNIVERSALIZATION TEST SUITE
 *
 * Purpose: Audit and enforce consistent design system across doctor and patient portals
 *
 * What this does:
 * 1. Takes visual screenshots of all pages
 * 2. Extracts color palettes from each page
 * 3. Audits layout patterns (sidebar, header, navigation)
 * 4. Measures spacing, typography, and component consistency
 * 5. Generates a comprehensive report with recommendations
 */

const SCREENSHOT_DIR = 'screenshots/layout-audit';
const REPORT_DIR = 'test-results/layout-reports';

// Define the intended design system (Linear/GitHub style from all_our_conversations.md)
const DESIGN_SYSTEM = {
  colors: {
    primaryBg: '#0d0d0d',
    secondaryBg: '#1a1a1a',
    hoverBg: '#222222',
    borders: ['#2a2a2a', '#333333'],
    textPrimary: '#e6e6e6',
    textSecondary: '#999999',
    textTertiary: '#666666',
  },
  typography: {
    headingFont: 'font-medium',
    bodySize: 'text-sm',
    labelSize: 'text-xs',
  },
  components: {
    buttons: 'bg-[#1a1a1a] border-[#333] hover:bg-[#222]',
    cards: 'bg-[#1a1a1a] border-[#2a2a2a]',
    inputs: 'bg-[#1a1a1a] border-[#333] text-[#e6e6e6]',
  },
};

const PATIENT_THEME = {
  backgrounds: ['#ffffff', '#f8fafc', '#f1f5f9', '#e6e0f2', '#eef2ff', '#f4f4ff'],
};

const DOCTOR_THEME_BACKGROUNDS = [
  DESIGN_SYSTEM.colors.primaryBg,
  DESIGN_SYSTEM.colors.secondaryBg,
  DESIGN_SYSTEM.colors.hoverBg,
  ...DESIGN_SYSTEM.colors.borders,
];

type RGB = { r: number; g: number; b: number };

// Pages to audit (aligned with routes registered in client/src/App.tsx)
const PAGES_TO_AUDIT = [
  { path: '/', name: 'landing', category: 'public' as const },
  { path: '/login', name: 'multi-login', category: 'public' as const },
  { path: '/patient-intake', name: 'patient-intake', category: 'patient' as const },
  { path: '/patient-login', name: 'patient-login', category: 'patient' as const },
  { path: '/patient-dashboard', name: 'patient-dashboard', category: 'patient' as const },
  { path: '/doctor-login', name: 'doctor-login', category: 'doctor' as const },
  { path: '/doctor-dashboard', name: 'doctor-dashboard', category: 'doctor' as const },
  { path: '/doctor-profile', name: 'doctor-profile', category: 'doctor' as const },
  { path: '/patients', name: 'patients-page', category: 'doctor' as const },
  { path: '/documents', name: 'documents-page', category: 'doctor' as const },
  { path: '/messages', name: 'messages-page', category: 'doctor' as const },
  { path: '/ai-billing', name: 'ai-billing', category: 'doctor' as const },
  { path: '/knowledge-base', name: 'knowledge-base', category: 'doctor' as const },
  { path: '/association', name: 'association', category: 'doctor' as const },
  { path: '/tier-35', name: 'tier-35', category: 'doctor' as const },
];

interface LayoutAudit {
  pageName: string;
  category: string;
  colors: {
    backgrounds: string[];
    texts: string[];
    borders: string[];
  };
  layout: {
    hasHeader: boolean;
    hasSidebar: boolean;
    hasFooter: boolean;
    navigationPattern: 'top' | 'side' | 'mixed' | 'none';
  };
  typography: {
    headings: { tag: string; size: string; weight: string }[];
    bodyText: string[];
  };
  spacing: {
    containerPadding: string[];
    cardGaps: string[];
  };
  palette: {
    expectedTheme: 'dark' | 'patient';
    mismatchRatio: number;
    mismatchedSamples: string[];
  };
  inconsistencies: string[];
}

function hexToRgb(hex: string): RGB | null {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length !== 6) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((value) => Number.isNaN(value))) {
    return null;
  }
  return { r, g, b };
}

function parseColorString(color: string): RGB | null {
  if (!color) return null;
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }

  const matches = color.match(/\d+\.?\d*/g);
  if (!matches || matches.length < 3) return null;
  const [r, g, b] = matches.slice(0, 3).map((value) => Number(value));
  if ([r, g, b].some((value) => Number.isNaN(value))) {
    return null;
  }
  return { r, g, b };
}

function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) + Math.pow(a.g - b.g, 2) + Math.pow(a.b - b.b, 2),
  );
}

function analyzePalette(backgrounds: string[], category: string) {
  const expectedTheme = category === 'patient' ? 'patient' : 'dark';
  const paletteHex = expectedTheme === 'dark' ? DOCTOR_THEME_BACKGROUNDS : PATIENT_THEME.backgrounds;
  const palette = paletteHex
    .map((hex) => parseColorString(hex))
    .filter((value): value is RGB => Boolean(value));

  const samples = backgrounds
    .map((color) => ({ raw: color, rgb: parseColorString(color) }))
    .filter(
      (entry): entry is { raw: string; rgb: RGB } => Boolean(entry.rgb),
    );

  if (!samples.length || !palette.length) {
    return {
      expectedTheme,
      mismatchRatio: 0,
      mismatchedSamples: [],
      warnings: [] as string[],
    };
  }

  const tolerance = expectedTheme === 'dark' ? 28 : 40;
  const mismatched = samples.filter(
    (sample) => !palette.some((color) => colorDistance(sample.rgb, color) <= tolerance),
  );
  const mismatchRatio = mismatched.length / samples.length;
  const mismatchedSamples = Array.from(new Set(mismatched.map((item) => item.raw)));

  const threshold = expectedTheme === 'dark' ? 0.4 : 0.6;
  const warnings: string[] = [];

  if (mismatchRatio > threshold) {
    const exampleSwatches = mismatchedSamples.slice(0, 4).join(', ');
    warnings.push(
      `⚠️ Palette drift: ${Math.round(
        mismatchRatio * 100,
      )}% of sampled backgrounds fall outside the ${expectedTheme === 'dark' ? 'Linear-inspired dark' : 'patient light'} theme (examples: ${exampleSwatches})`,
    );
  }

  return {
    expectedTheme,
    mismatchRatio,
    mismatchedSamples,
    warnings,
  };
}

// Helper: Extract colors from a page
async function extractColors(page: Page): Promise<{ backgrounds: string[]; texts: string[]; borders: string[] }> {
  return await page.evaluate(() => {
    const colors = {
      backgrounds: new Set<string>(),
      texts: new Set<string>(),
      borders: new Set<string>(),
    };

    const elements = document.querySelectorAll('*');
    elements.forEach((el) => {
      const computed = window.getComputedStyle(el);
      
      // Extract background colors
      const bg = computed.backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        colors.backgrounds.add(bg);
      }

      // Extract text colors
      const textColor = computed.color;
      if (textColor) {
        colors.texts.add(textColor);
      }

      // Extract border colors
      const borderColor = computed.borderColor;
      if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') {
        colors.borders.add(borderColor);
      }
    });

    return {
      backgrounds: Array.from(colors.backgrounds).slice(0, 20),
      texts: Array.from(colors.texts).slice(0, 15),
      borders: Array.from(colors.borders).slice(0, 10),
    };
  });
}

// Helper: Detect layout pattern
async function detectLayoutPattern(page: Page) {
  return await page.evaluate(() => {
    const hasHeader = !!document.querySelector('header');
    const hasSidebar = !!document.querySelector('aside, [role="complementary"], .sidebar, [class*="sidebar"]');
    const hasFooter = !!document.querySelector('footer');
    
    let navigationPattern: 'top' | 'side' | 'mixed' | 'none' = 'none';
    const nav = document.querySelector('nav');
    const sideNav = document.querySelector('aside nav, [class*="sidebar"] nav');
    
    if (nav && sideNav) {
      navigationPattern = 'mixed';
    } else if (sideNav) {
      navigationPattern = 'side';
    } else if (nav) {
      navigationPattern = 'top';
    }

    return {
      hasHeader,
      hasSidebar,
      hasFooter,
      navigationPattern,
    };
  });
}

// Helper: Extract typography info
async function extractTypography(page: Page) {
  return await page.evaluate(() => {
    const headings: { tag: string; size: string; weight: string }[] = [];
    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headingElements.forEach((el) => {
      const computed = window.getComputedStyle(el);
      headings.push({
        tag: el.tagName.toLowerCase(),
        size: computed.fontSize,
        weight: computed.fontWeight,
      });
    });

    const bodyElements = document.querySelectorAll('p, span, div');
    const bodyText = new Set<string>();
    
    Array.from(bodyElements).slice(0, 50).forEach((el) => {
      const computed = window.getComputedStyle(el);
      bodyText.add(computed.fontSize);
    });

    return {
      headings: headings.slice(0, 10),
      bodyText: Array.from(bodyText),
    };
  });
}

// Helper: Take screenshot with annotations
async function takeAnnotatedScreenshot(page: Page, name: string) {
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${name}.png`,
    fullPage: true,
  });
}

// Main audit function
async function auditPage(page: Page, pageInfo: typeof PAGES_TO_AUDIT[0]): Promise<LayoutAudit> {
  console.log(`\n📊 Auditing: ${pageInfo.name} (${pageInfo.category})`);
  
  try {
    await page.goto(pageInfo.path);
    await takeAnnotatedScreenshot(page, pageInfo.name);
  } catch (error) {
    console.log(`⚠️  Could not load ${pageInfo.path}: ${error}`);
    return {
      pageName: pageInfo.name,
      category: pageInfo.category,
      colors: { backgrounds: [], texts: [], borders: [] },
      layout: { hasHeader: false, hasSidebar: false, hasFooter: false, navigationPattern: 'none' },
      typography: { headings: [], bodyText: [] },
      spacing: { containerPadding: [], cardGaps: [] },
      inconsistencies: ['Page could not be loaded'],
    };
  }

  const colors = await extractColors(page);
  const layout = await detectLayoutPattern(page);
  const typography = await extractTypography(page);
  const paletteAnalysis = analyzePalette(colors.backgrounds, pageInfo.category);

  // Detect inconsistencies
  const inconsistencies: string[] = [];

  // Check if using wrong color scheme
  if (pageInfo.category === 'doctor' || pageInfo.category === 'public') {
    const hasLightPurple = colors.backgrounds.some(c => c.includes('230') && c.includes('224') && c.includes('242')); // #E6E0F2
    if (hasLightPurple) {
      inconsistencies.push('❌ Using patient light-purple theme instead of dark theme');
    }
  }

  if (pageInfo.category === 'patient') {
    const hasDarkTheme = colors.backgrounds.some(c => {
      const rgb = c.match(/\d+/g);
      if (rgb) {
        const r = parseInt(rgb[0]);
        const g = parseInt(rgb[1]);
        const b = parseInt(rgb[2]);
        return r < 50 && g < 50 && b < 50; // Very dark colors
      }
      return false;
    });
    if (hasDarkTheme) {
      inconsistencies.push('⚠️  Patient page using dark theme - should use light/purple theme');
    }
  }

  // Check for mixed navigation patterns
  if (layout.navigationPattern === 'mixed') {
    inconsistencies.push('⚠️  Mixed navigation pattern detected (both top and side nav)');
  }

  // Check for too many colors
  if (colors.backgrounds.length > 15) {
    inconsistencies.push(`⚠️  Too many background colors (${colors.backgrounds.length}) - should use consistent palette`);
  }

  inconsistencies.push(...paletteAnalysis.warnings);

  return {
    pageName: pageInfo.name,
    category: pageInfo.category,
    colors,
    layout,
    typography,
    spacing: { containerPadding: [], cardGaps: [] },
    palette: {
      expectedTheme: paletteAnalysis.expectedTheme,
      mismatchRatio: paletteAnalysis.mismatchRatio,
      mismatchedSamples: paletteAnalysis.mismatchedSamples,
    },
    inconsistencies,
  };
}

// Generate HTML report
function generateHTMLReport(audits: LayoutAudit[]) {
  const timestamp = new Date().toISOString();
  
  const doctorPages = audits.filter(a => a.category === 'doctor');
  const patientPages = audits.filter(a => a.category === 'patient');
  const publicPages = audits.filter(a => a.category === 'public');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Layout Universalization Audit - InstantHPI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d0d0d; color: #e6e6e6; padding: 40px; line-height: 1.6; }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { font-size: 36px; margin-bottom: 10px; color: #fff; }
    h2 { font-size: 24px; margin: 40px 0 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
    h3 { font-size: 18px; margin: 20px 0 10px; color: #999; }
    .meta { color: #666; font-size: 14px; margin-bottom: 40px; }
    .summary { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 24px; margin: 30px 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; }
    .summary-card { background: #222; padding: 20px; border-radius: 6px; border: 1px solid #2a2a2a; }
    .summary-card h4 { color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .summary-card .value { font-size: 32px; font-weight: bold; color: #e6e6e6; }
    .page-audit { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 24px; margin: 20px 0; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-name { font-size: 20px; font-weight: 600; color: #fff; }
    .category-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .category-doctor { background: #1e3a8a; color: #93c5fd; }
    .category-patient { background: #581c87; color: #e9d5ff; }
    .category-public { background: #065f46; color: #6ee7b7; }
    .section { margin: 20px 0; }
    .section-title { font-size: 14px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .color-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; margin-top: 10px; }
    .color-swatch { height: 60px; border-radius: 4px; border: 1px solid #333; position: relative; }
    .color-label { position: absolute; bottom: 4px; left: 4px; right: 4px; background: rgba(0,0,0,0.8); color: #fff; font-size: 9px; padding: 2px 4px; border-radius: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .inconsistency { background: #450a0a; border: 1px solid #7f1d1d; border-radius: 4px; padding: 12px; margin: 8px 0; font-size: 14px; }
    .layout-info { background: #222; padding: 16px; border-radius: 4px; border: 1px solid #2a2a2a; }
    .layout-info p { margin: 6px 0; font-size: 14px; }
    .recommendations { background: #064e3b; border: 1px solid #047857; border-radius: 8px; padding: 24px; margin: 30px 0; }
    .recommendations h3 { color: #6ee7b7; }
    .recommendations ul { margin: 16px 0; padding-left: 20px; }
    .recommendations li { margin: 10px 0; color: #d1fae5; }
    .screenshot { width: 100%; max-width: 400px; border: 1px solid #333; border-radius: 4px; margin-top: 10px; }
    code { background: #000; padding: 2px 6px; border-radius: 3px; font-size: 12px; color: #6ee7b7; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎨 Layout Universalization Audit</h1>
    <div class="meta">Generated: ${timestamp} | InstantHPI Medical Platform</div>

    <div class="summary">
      <h3>Executive Summary</h3>
      <div class="summary-grid">
        <div class="summary-card">
          <h4>Pages Audited</h4>
          <div class="value">${audits.length}</div>
        </div>
        <div class="summary-card">
          <h4>Doctor Pages</h4>
          <div class="value">${doctorPages.length}</div>
        </div>
        <div class="summary-card">
          <h4>Patient Pages</h4>
          <div class="value">${patientPages.length}</div>
        </div>
        <div class="summary-card">
          <h4>Total Inconsistencies</h4>
          <div class="value">${audits.reduce((sum, a) => sum + a.inconsistencies.length, 0)}</div>
        </div>
      </div>
    </div>

    <div class="recommendations">
      <h3>🎯 Recommendations for Universalization</h3>
      <ul>
        <li><strong>Adopt Single Design System:</strong> Use the Linear/GitHub-style dark theme across ALL doctor and public pages (bg-[#0d0d0d], bg-[#1a1a1a])</li>
        <li><strong>Standardize Navigation:</strong> Doctor pages should use sidebar navigation (already in doctor-dashboard-new). Remove mixed patterns.</li>
        <li><strong>Patient Portal Exception:</strong> Patient pages can keep light theme (#E6E0F2) but should use consistent components (buttons, cards, inputs)</li>
        <li><strong>Color Palette Enforcement:</strong> Limit backgrounds to 5-6 core colors maximum. Use design tokens.</li>
        <li><strong>Typography Consistency:</strong> Enforce headings (font-medium), body (text-sm), labels (text-xs) across all pages</li>
        <li><strong>Component Library:</strong> Create shared UI components for buttons, cards, inputs that follow the design system</li>
      </ul>
    </div>

    <h2>Doctor Pages Audit</h2>
    ${doctorPages.map(audit => renderAudit(audit)).join('')}

    <h2>Patient Pages Audit</h2>
    ${patientPages.map(audit => renderAudit(audit)).join('')}

    <h2>Public Pages Audit</h2>
    ${publicPages.map(audit => renderAudit(audit)).join('')}
  </div>
</body>
</html>`;

  function renderAudit(audit: LayoutAudit) {
    return `
      <div class="page-audit">
        <div class="page-header">
          <div class="page-name">${audit.pageName}</div>
          <span class="category-badge category-${audit.category}">${audit.category}</span>
        </div>

        ${audit.inconsistencies.length > 0 ? `
          <div class="section">
            <div class="section-title">⚠️  Inconsistencies Found</div>
            ${audit.inconsistencies.map(inc => `<div class="inconsistency">${inc}</div>`).join('')}
          </div>
        ` : '<div class="section"><div style="color: #6ee7b7;">✅ No major inconsistencies detected</div></div>'}

        <div class="section">
          <div class="section-title">Layout Pattern</div>
          <div class="layout-info">
            <p><strong>Header:</strong> ${audit.layout.hasHeader ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Sidebar:</strong> ${audit.layout.hasSidebar ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Footer:</strong> ${audit.layout.hasFooter ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Navigation:</strong> ${audit.layout.navigationPattern}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Color Palette</div>
          <div class="color-grid">
            ${audit.colors.backgrounds.slice(0, 12).map(color => `
              <div class="color-swatch" style="background: ${color};">
                <div class="color-label">${color}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Palette Check</div>
          <div class="layout-info">
            <p><strong>Expected Theme:</strong> ${audit.palette.expectedTheme === 'dark' ? 'Dark (Linear-inspired)' : 'Patient Light'}</p>
            <p><strong>Mismatch Ratio:</strong> ${(audit.palette.mismatchRatio * 100).toFixed(0)}%</p>
            ${audit.palette.mismatchedSamples.length ? `<p><strong>Outliers:</strong> ${audit.palette.mismatchedSamples.slice(0, 4).join(', ')}</p>` : '<p><strong>Outliers:</strong> None detected</p>'}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Screenshot</div>
          <img src="../../screenshots/layout-audit/${audit.pageName}.png" alt="${audit.pageName}" class="screenshot" />
        </div>
      </div>
    `;
  }

  return html;
}

// Create directories
test.beforeAll(async () => {
  [SCREENSHOT_DIR, REPORT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
});

// Main test suite
test.describe('Layout Universalization Audit', () => {
  let allAudits: LayoutAudit[] = [];

  test('1. Audit All Pages', async ({ page }) => {
    for (const pageInfo of PAGES_TO_AUDIT) {
      const audit = await auditPage(page, pageInfo);
      allAudits.push(audit);
      
      console.log(`   Colors: ${audit.colors.backgrounds.length} backgrounds, ${audit.colors.texts.length} text colors`);
      console.log(`   Layout: ${audit.layout.navigationPattern} navigation`);
      if (audit.inconsistencies.length > 0) {
        console.log(`   Issues: ${audit.inconsistencies.length} inconsistencies`);
        audit.inconsistencies.forEach(inc => console.log(`     ${inc}`));
      }
    }
  });

  test('2. Generate Comprehensive Report', async () => {
    const html = generateHTMLReport(allAudits);
    const reportPath = `${REPORT_DIR}/layout-audit-${Date.now()}.html`;
    fs.writeFileSync(reportPath, html);
    console.log(`\n✅ Report generated: ${reportPath}`);
    
    // Also save JSON for programmatic access
    const jsonPath = `${REPORT_DIR}/layout-audit-${Date.now()}.json`;
    fs.writeFileSync(jsonPath, JSON.stringify(allAudits, null, 2));
    console.log(`✅ JSON data saved: ${jsonPath}`);
  });

  test('3. Verify Design System Compliance', async () => {
    const doctorPages = allAudits.filter(a => a.category === 'doctor');
    
    doctorPages.forEach(audit => {
      const totalIssues = audit.inconsistencies.length;
      expect(totalIssues).toBeLessThan(5); // Should have minimal inconsistencies
    });
  });
});
