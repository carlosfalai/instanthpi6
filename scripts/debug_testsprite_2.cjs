const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');
const fs = require('fs');

const PROJECT_PATH = "/Users/carlosfavielfont/Downloads/Instanthpi 6";
const LOG_FILE = path.join(PROJECT_PATH, "testsprite_debug_output.txt");

function log(msg) {
    try {
        fs.appendFileSync(LOG_FILE, msg + '\n');
    } catch (e) {
        // failed to log
    }
}

// Clear log at start
fs.writeFileSync(LOG_FILE, "--- SCRIPT START ---\n");

// Config
const API_KEY = "sk-user-0l_0dXdnNcDD4doiJ3bJMXaln352ZXdr2NCi7kYwWxtpDFmgVjcxO3ZYyKKQ4nosqjTMlWoTzvVCTkL0_B7QAON2iAFyQHVxZsQorkKTmEItHcyacLqj3lV95a2Zin4Gy8s";
const SERVER_PATH = path.join(PROJECT_PATH, 'node_modules', '@testsprite', 'testsprite-mcp', 'dist', 'index.js');

log(`[Script] Target Server: ${SERVER_PATH}`);

if (!fs.existsSync(SERVER_PATH)) {
    log("SERVER PATH DOES NOT EXIST");
    process.exit(1);
}

const cp = spawn('node', [SERVER_PATH, 'server'], {
    cwd: PROJECT_PATH,
    env: { ...process.env, API_KEY },
    stdio: ['pipe', 'pipe', 'pipe'] // Capture stderr too
});

cp.stderr.on('data', (data) => {
    log(`[MCP STDERR]: ${data.toString()}`);
});

cp.on('error', (err) => {
    log(`[MCP ERROR]: ${err}`);
});

cp.on('exit', (code) => {
    log(`[MCP EXIT]: ${code}`);
});

const rl = readline.createInterface({ input: cp.stdout });

// JSON-RPC Helpers
let msgId = 1;
const pending = new Map();

function send(method, params) {
    const id = msgId++;
    const req = { jsonrpc: '2.0', id, method, params };
    log(`[Client] -> ${method} (ID: ${id})`);
    return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        try {
            cp.stdin.write(JSON.stringify(req) + '\n');
        } catch (e) {
            log(`[Client] WRITE ERROR: ${e}`);
            reject(e);
        }
    });
}

rl.on('line', line => {
    log(`[Server RAW] ${line.substring(0, 200)}...`);
    try {
        const msg = JSON.parse(line);
        if (msg.id && pending.has(msg.id)) {
            const { resolve, reject } = pending.get(msg.id);
            pending.delete(msg.id);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
        }
    } catch (err) {
        log(`[Script] JSON Parse Error: ${err}`);
    }
});

async function run() {
    try {
        log("Starting sequence...");

        // 1. Initialize
        const initRes = await send('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0' }
        });
        log('[Client] <- Initialize Done.');

        // 2. Bootstrap
        log('[Client] -> Calling testsprite_bootstrap...');
        const bootstrapRes = await send('tools/call', {
            name: 'testsprite_bootstrap',
            arguments: {
                localPort: 3000,
                pathname: '/',
                type: 'backend',
                projectPath: PROJECT_PATH,
                testScope: 'codebase'
            }
        });
        log(`[Client] <- Bootstrap Result: ${JSON.stringify(bootstrapRes)}`);

        // 3. Generate PRD
        log('[Client] -> Calling testsprite_generate_standardized_prd...');
        const prdRes = await send('tools/call', {
            name: 'testsprite_generate_standardized_prd',
            arguments: { projectPath: PROJECT_PATH }
        });
        log(`[Client] <- PRD Generation Result: ${JSON.stringify(prdRes)}`);

        // 4. Generate Test Plan
        log('[Client] -> Calling testsprite_generate_backend_test_plan...');
        const planRes = await send('tools/call', {
            name: 'testsprite_generate_backend_test_plan',
            arguments: { projectPath: PROJECT_PATH }
        });
        log(`[Client] <- Test Plan Generation Result: ${JSON.stringify(planRes)}`);

        // 5. Execute Tests
        log('[Client] -> Calling testsprite_generate_code_and_execute...');
        const execRes = await send('tools/call', {
            name: 'testsprite_generate_code_and_execute',
            arguments: {
                projectName: "InstantHPI",
                projectPath: PROJECT_PATH,
                testIds: [],
                additionalInstruction: ""
            }
        });
        log(`[Client] <- Execution Result: ${JSON.stringify(execRes)}`);

    } catch (err) {
        log(`[Script] Error: ${err}`);
        if (err.stack) log(err.stack);
    } finally {
        log("Sequence finished. Killing process.");
        cp.kill();
    }
}

run();
