const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');
const fs = require('fs');

// Hardcoded API Key provided by user
const API_KEY = process.env.API_KEY || "sk-user-0l_0dXdnNcDD4doiJ3bJMXaln352ZXdr2NCi7kYwWxtpDFmgVjcxO3ZYyKKQ4nosqjTMlWoTzvVCTkL0_B7QAON2iAFyQHVxZsQorkKTmEItHcyacLqj3lV95a2Zin4Gy8s";
const PROJECT_PATH = "/Users/carlosfavielfont/Downloads/Instanthpi 6";
const MCP_SERVER_SCRIPT = path.join(PROJECT_PATH, "node_modules/@testsprite/testsprite-mcp/dist/index.js");

async function main() {
    console.log("🚀 Starting TestSprite MCP Workflow...");
    console.log(`📂 Project Path: ${PROJECT_PATH}`);
    console.log(`🔌 API Key: ${API_KEY.substring(0, 10)}...`);
    console.log(`📜 Script: ${MCP_SERVER_SCRIPT}`);

    if (!fs.existsSync(MCP_SERVER_SCRIPT)) {
        console.error(`❌ MCP Server script not found at ${MCP_SERVER_SCRIPT}`);
        process.exit(1);
    }

    // Use node directly to run the MCP server script
    const serverProcess = spawn('node', [MCP_SERVER_SCRIPT, 'server'], {
        cwd: PROJECT_PATH,
        env: { ...process.env, API_KEY },
        stdio: ['pipe', 'pipe', 'inherit'] // Pipe stdin/stdout, inherit stderr for debugging
    });

    serverProcess.on('exit', (code) => console.log(`[MCP Server] Exited with code ${code}`));
    serverProcess.on('error', (err) => console.error(`[MCP Server] Error:`, err));

    const rl = readline.createInterface({
        input: serverProcess.stdout,
        terminal: false
    });

    let requestId = 0;
    const pendingRequests = new Map();

    rl.on('line', (line) => {
        // Log raw output for debugging
        console.log(`[MCP Server Raw]: ${line}`);
        try {
            const msg = JSON.parse(line);
            // Handle JSON-RPC Response
            if (msg.id !== undefined && pendingRequests.has(msg.id)) {
                const { resolve, reject, timer } = pendingRequests.get(msg.id);
                clearTimeout(timer);
                if (msg.error) {
                    reject(msg.error);
                } else {
                    resolve(msg.result);
                }
                pendingRequests.delete(msg.id);
            }
        } catch (e) {
            // ignore non-json lines
        }
    });

    function sendRequest(method, params) {
        return new Promise((resolve, reject) => {
            requestId++;
            const id = requestId;
            const msg = {
                jsonrpc: "2.0",
                id,
                method,
                params
            };

            // Set a timeout for requests to avoid hanging indefinitely
            const timer = setTimeout(() => {
                if (pendingRequests.has(id)) {
                    pendingRequests.delete(id);
                    reject(new Error(`Request ${id} (${method}) timed out`));
                }
            }, 120000); // 2 minute timeout

            pendingRequests.set(id, { resolve, reject, timer });
            console.log(`[Client] Sending Request ${id}: ${method}`);
            serverProcess.stdin.write(JSON.stringify(msg) + "\n");
        });
    }

    try {
        // 1. Initialize
        console.log("1️⃣  Initializing (Bootstrap)...");
        await sendRequest("initialize", {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "custom-script", version: "1.0.0" }
        });
        console.log("✅ Initialize acknowledged.");

        // Call bootstrap tool
        console.log("🛠 Calling testsprite_bootstrap...");
        const bootstrapResult = await sendRequest("tools/call", {
            name: "testsprite_bootstrap",
            arguments: {
                localPort: 3000,
                pathname: "/",
                type: "backend",
                projectPath: PROJECT_PATH,
                testScope: "codebase"
            }
        });
        console.log("✅ Bootstrap result:", JSON.stringify(bootstrapResult, null, 2));

        // 2. Generate PRD
        console.log("2️⃣  Generating Standardized PRD...");
        const prdResult = await sendRequest("tools/call", {
            name: "testsprite_generate_standardized_prd",
            arguments: {
                projectPath: PROJECT_PATH
            }
        });
        console.log("✅ PRD result:", JSON.stringify(prdResult, null, 2));

        // 3. Generate Backend Test Plan
        console.log("3️⃣  Generating Backend Test Plan...");
        const planResult = await sendRequest("tools/call", {
            name: "testsprite_generate_backend_test_plan",
            arguments: {
                projectPath: PROJECT_PATH
            }
        });
        console.log("✅ Test Plan result:", JSON.stringify(planResult, null, 2));

        // 4. Generate Code and Execute
        console.log("4️⃣  Generating Code and Executing Tests...");
        const execResult = await sendRequest("tools/call", {
            name: "testsprite_generate_code_and_execute",
            arguments: {
                projectName: "Instanthpi 6",
                projectPath: PROJECT_PATH,
                testIds: [],
                additionalInstruction: ""
            }
        });
        console.log("✅ Execution result:", JSON.stringify(execResult, null, 2));

    } catch (err) {
        console.error("❌ Error in workflow:", err);
    } finally {
        console.log("🛑 Stopping server...");
        serverProcess.kill();
        process.exit(0);
    }
}

main();
