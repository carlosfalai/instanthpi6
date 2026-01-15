const fs = require('fs');
const path = require('path');

const themePath = path.join(__dirname, 'temp_untitled_ui/src/styles/theme.css');
const content = fs.readFileSync(themePath, 'utf8');

const config = {
    colors: {},
    boxShadow: {},
    borderRadius: {},
    fontSize: {},
    lineHeight: {},
    letterSpacing: {},
    fontFamily: {},
    screens: {}, // Breakpoints
};

// Helper to set nested value
function set(obj, path, value) {
    let schema = obj;
    const pList = path.split('.');
    const len = pList.length;
    for (let i = 0; i < len - 1; i++) {
        const elem = pList[i];
        if (!schema[elem]) schema[elem] = {};
        schema = schema[elem];
    }
    schema[pList[len - 1]] = value;
}

// Regex to capture --name: value;
const regex = /--([a-zA-Z0-9-_]+):\s*([^;]+);/g;
let match;

while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    const value = match[2].trim();

    // Color mapping
    // --color-brand-50 -> colors.brand.50
    if (key.startsWith('color-')) {
        const name = key.replace('color-', '');
        // Handle utility colors? e.g. --color-utility-brand-50.
        // Maybe just put them all in colors?
        // Untitled UI uses `colors: { brand: { 50: ... } }`.
        // The name might contain hyphens, e.g. `gray-cool-25` -> `gray-cool`.

        // Simple heuristic: split by hyphen, try to group?
        // Or just Map everything flat first? No, tailwind needs nesting for nice class names like `bg-brand-50`.

        // Pattern: name-number -> colors.name.number
        // Pattern: name-subname-number -> colors.name-subname.number
        // If it ends with a number (25, 50, 100...950), extract it.

        const parts = name.split('-');
        const last = parts[parts.length - 1];
        if (/^\d+(_alt)?$/.test(last)) {
            // It's a scale color
            const scale = last;
            const colorName = parts.slice(0, parts.length - 1).join('-');
            set(config.colors, `${colorName}.${scale}`, `var(--${key})`);
        } else {
            // Single color, e.g. white, black, transparent
            set(config.colors, name, `var(--${key})`);
        }
    }
    // Radius
    else if (key.startsWith('radius-')) {
        const name = key.replace('radius-', '');
        config.borderRadius[name] = `var(--${key})`;
    }
    // Shadow
    else if (key.startsWith('shadow-')) {
        const name = key.replace('shadow-', '');
        config.boxShadow[name] = `var(--${key})`;
    }
    // Font Size
    else if (key.startsWith('text-') && !key.includes('line-height') && !key.includes('letter-spacing') && !key.startsWith('text-color')) {
        // --text-xs, --text-display-2xl
        const name = key.replace('text-', '');
        // Tailwind v3 fontSize can be [fontSize, { lineHeight, letterSpacing }]
        // But we just mapping values.
        // We need to look up corresponding line-height if it exists.

        // Store for later processing?
        // Actually for simplicity, let's just ignore fontSize generation for now as it's complex to pair with line-height in auto-script.
        // Also `theme.css` uses `calc(var(--spacing) * ...)` which implies `spacing` variable relies on v4.
        // v3 `spacing` is usually rems.
        // We might need to copy `spacing` vars too?
        // Or just let it fail?
    }
    // Breakpoints
    else if (key.startsWith('breakpoint-')) {
        const name = key.replace('breakpoint-', '');
        config.screens[name] = value;
    }

    // Font Family
    else if (key.startsWith('font-')) {
        const name = key.replace('font-', '');
        config.fontFamily[name] = `var(--${key})`;
    }
}

// Write to file
const outputPath = path.join(__dirname, 'tailwind-config-additions.json');
fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));
console.log('Config generated at ' + outputPath);
