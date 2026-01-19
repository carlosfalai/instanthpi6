const fs = require('fs');
const path = require('path');

console.log("STARTING DEBUG SCRIPT");
try {
    const projectPath = process.cwd();
    console.log(`CWD: ${projectPath}`);

    // Check module existence
    const serverPath = path.join(projectPath, 'node_modules', '@testsprite', 'testsprite-mcp', 'dist', 'index.js');
    console.log(`Checking Server Path: ${serverPath}`);
    if (fs.existsSync(serverPath)) {
        console.log("Server file exists.");
    } else {
        console.error("Server file MISSING!");
    }

    // Try to require common stuff
    const cp = require('child_process');
    console.log("child_process required.");

} catch (e) {
    console.error("ERROR:", e);
}
console.log("ENDING DEBUG SCRIPT");
