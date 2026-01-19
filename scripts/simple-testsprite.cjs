const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');
const fs = require('fs');

const LOG_FILE = "/Users/carlosfavielfont/Downloads/Instanthpi 6/testsprite_results.log";
function log(msg) {
    fs.appendFileSync(LOG_FILE, msg + '\n');
    console.log(msg);
}

// Config
const API_KEY = "sk-user-0l_0dXdnNcDD4doiJ3bJMXaln352ZXdr2NCi7kYwWxtpDFmgVjcxO3ZYyKKQ4nosqjTMlWoTzvVCTkL0_B7QAON2iAFyQHVxZsQorkKTmEItHcyacLqj3lV95a2Zin4Gy8s";
const PROJECT_PATH = process.cwd();
const SERVER_PATH = path.join(PROJECT_PATH, 'node_modules', '@testsprite', 'testsprite-mcp', 'dist', 'index.js');

log(`[Script] Target Server: ${SERVER_PATH}`);

const cp = spawn('node', [SERVER_PATH, 'server'], {
    cwd: PROJECT_PATH,
    env: { ...process.env, API_KEY },
    stdio: ['pipe', 'pipe', process.stderr]
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
        cp.stdin.write(JSON.stringify(req) + '\n');
    });
}

rl.on('line', line => {
    // console.log(`[Server] ${line.substring(0, 100)}...`); 
    try {
        const msg = JSON.parse(line);
        if (msg.id && pending.has(msg.id)) {
            const { resolve, reject } = pending.get(msg.id);
            pending.delete(msg.id);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
        } else if (msg.method === 'notifications/resources/list_changed') {
            // ignore
        }
    } catch (err) {
        log(`[Script] JSON Parse Error: ${err}`);
    }
});

async function run() {
    try {
        // 1. Initialize
        const initRes = await send('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0' }
        });
        log('[Client] <- Initialize Done.');

        // 2. List tools (Verification)
        const toolList = await send('tools/list', {});
        log(`[Client] <- Tools Found: ${toolList.tools.length}`);

        // 3. Bootstrap
        log('[Client] -> Calling testsprite_bootstrap...');
        const bootstrapRes = await send('tools/call', {
            name: 'testsprite_bootstrap',
            arguments: {
                localPort: 3000,
                pathname: '/',
                type: 'backend', // backend analysis
                projectPath: PROJECT_PATH,
                testScope: 'codebase'
            }
        });
        log(`[Client] <- Bootstrap Result: ${JSON.stringify(bootstrapRes).substring(0, 100)}...`);

        // 4. Generate PRD
        log('[Client] -> Calling testsprite_generate_standardized_prd...');
        const prdRes = await send('tools/call', {
            name: 'testsprite_generate_standardized_prd',
            arguments: { projectPath: PROJECT_PATH }
        });
        log(`[Client] <- PRD Generation Started/Done: ${JSON.stringify(prdRes).substring(0, 100)}...`);

        // 5. Generate Test Plan
        log('[Client] -> Calling testsprite_generate_backend_test_plan...');
        const planRes = await send('tools/call', {
            name: 'testsprite_generate_backend_test_plan',
            arguments: { projectPath: PROJECT_PATH }
        });
        log(`[Client] <- Test Plan Generation Started/Done: ${JSON.stringify(planRes).substring(0, 100)}...`);

        // 6. Execute Tests
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

        log(`[Client] <- Execution Result: ${JSON.stringify(execRes).substring(0, 200)}`);

    } catch (err) {
        log(`[Script] Error: ${err}`);
    } finally {
        cp.kill();
    }
}

// Clear log
fs.writeFileSync(LOG_FILE, '');
run();
