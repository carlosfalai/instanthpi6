#!/usr/bin/env node

/**
 * CLI helper to call the Gemini API for layout and UI generation.
 *
 * Usage example:
 *   GEMINI_API_KEY=... node scripts/call-gemini-layout.mjs \
 *     --prompt scripts/prompts/landing-ui-prompt.md \
 *     --context DESIGN_SYSTEM.md \
 *     --output tmp/gemini-landing.tsx
 *
 * The script combines any context files with the primary prompt and sends a single
 * request to Gemini. The response text is written to the specified output file or
 * printed to stdout when no output path is provided.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import process from "node:process";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-pro-latest";
const API_KEY = process.env.GEMINI_API_KEY;

const args = process.argv.slice(2);
const options = {
  promptPath: undefined,
  promptText: undefined,
  outputPath: undefined,
  contextPaths: [],
  model: DEFAULT_MODEL,
  temperature: undefined,
  topP: undefined,
  topK: undefined,
  maxOutputTokens: undefined,
};

const flagParsers = new Map([
  ["--prompt", (value) => (options.promptPath = value)],
  ["-p", (value) => (options.promptPath = value)],
  ["--prompt-text", (value) => (options.promptText = value)],
  ["--output", (value) => (options.outputPath = value)],
  ["-o", (value) => (options.outputPath = value)],
  ["--context", (value) => options.contextPaths.push(value)],
  ["-c", (value) => options.contextPaths.push(value)],
  ["--model", (value) => (options.model = value)],
  ["--temperature", (value) => (options.temperature = Number.parseFloat(value))],
  ["--top-p", (value) => (options.topP = Number.parseFloat(value))],
  ["--top-k", (value) => (options.topK = Number.parseInt(value, 10))],
  ["--max-output-tokens", (value) => (options.maxOutputTokens = Number.parseInt(value, 10))],
]);

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  const parse = flagParsers.get(arg);
  if (!parse) {
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    console.error(`Unknown flag: ${arg}`);
    printHelp();
    process.exit(1);
  }
  const next = args[i + 1];
  if (!next || next.startsWith("-")) {
    console.error(`Flag ${arg} requires a value.`);
    process.exit(1);
  }
  parse(next);
  i += 1;
}

if (!options.promptPath && !options.promptText) {
  console.error("Provide a prompt via --prompt <file> or --prompt-text \"...\".");
  printHelp();
  process.exit(1);
}

await main(options);

async function main(opts) {
  if (!API_KEY) {
    console.error("Missing GEMINI_API_KEY environment variable.");
    process.exit(1);
  }

  const finalPrompt = await buildPrompt(opts);

  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(opts.model)}:generateContent`
  );
  url.searchParams.set("key", API_KEY);

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: finalPrompt }],
      },
    ],
  };

  const generationConfig = {};
  if (Number.isFinite(opts.temperature)) {
    generationConfig.temperature = opts.temperature;
  }
  if (Number.isFinite(opts.topP)) {
    generationConfig.topP = opts.topP;
  }
  if (Number.isFinite(opts.topK)) {
    generationConfig.topK = opts.topK;
  }
  if (Number.isFinite(opts.maxOutputTokens)) {
    generationConfig.maxOutputTokens = opts.maxOutputTokens;
  }
  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini API request failed (${response.status}): ${errorText}`);
    process.exit(1);
  }

  const data = await response.json();
  const text = extractText(data);

  if (!text) {
    console.error("Gemini response did not contain any text content.");
    process.exit(1);
  }

  if (opts.outputPath) {
    const absoluteOutput = resolve(opts.outputPath);
    await mkdir(dirname(absoluteOutput), { recursive: true });
    await writeFile(absoluteOutput, text, "utf8");
    console.error(`Gemini output written to ${absoluteOutput}`);
  } else {
    console.log(text);
  }
}

async function buildPrompt(opts) {
  const segments = [];

  for (const contextPath of opts.contextPaths) {
    const absolutePath = resolve(contextPath);
    const content = await readFile(absolutePath, "utf8");
    segments.push(`### Context from ${contextPath}\n${content.trim()}`);
  }

  if (opts.promptText) {
    segments.push(opts.promptText.trim());
  }

  if (opts.promptPath) {
    const absolutePrompt = resolve(opts.promptPath);
    const promptContent = await readFile(absolutePrompt, "utf8");
    segments.push(promptContent.trim());
  }

  return segments.join("\n\n");
}

function extractText(data) {
  const candidate = data?.candidates?.[0];
  if (!candidate) {
    return "";
  }
  const parts = candidate.content?.parts ?? [];
  return parts
    .map((part) => {
      if (typeof part.text === "string") {
        return part.text;
      }
      return "";
    })
    .join("")
    .trim();
}

function printHelp() {
  console.log(`
Usage: node scripts/call-gemini-layout.mjs [options]

Options:
  --prompt, -p <file>          Path to the primary prompt text file.
  --prompt-text <text>         Inline prompt text (alternative to --prompt).
  --context, -c <file>         Additional context file(s) included before the prompt. Repeatable.
  --output, -o <file>          Write Gemini's response to the given file instead of stdout.
  --model <model>              Gemini model identifier (default: ${DEFAULT_MODEL}).
  --temperature <value>        Sampling temperature (float).
  --top-p <value>              Nucleus sampling parameter (float).
  --top-k <value>              Top-K sampling parameter (integer).
  --max-output-tokens <value>  Maximum number of tokens in the response (integer).
  --help, -h                   Show this help message.

Environment variables:
  GEMINI_API_KEY               Required. Your Gemini API key.
  GEMINI_MODEL                 Optional. Default model identifier override.

Example:
  GEMINI_API_KEY=... node scripts/call-gemini-layout.mjs \\
    --prompt scripts/prompts/landing-ui-prompt.md \\
    --context DESIGN_SYSTEM.md \\
    --output tmp/gemini-landing.tsx
`);
}
