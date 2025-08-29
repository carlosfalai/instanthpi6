# Story Documentation

Purpose

- Keep a persistent, human-readable narrative of product intent and design decisions.
- Make it easy for any collaborator or AI to understand why changes were made and how the app is meant to work.

How this folder works

- Each change or feature gets its own markdown file named by date and slug:
  - YYYY-MM-DD-your-short-slug.md
- Each document follows the same structure:
  1. Title
  2. Date
  3. Status (planned | in-progress | deployed)
  4. Intent (why are we doing this?)
  5. User story and acceptance criteria
  6. Scope (what’s in / out)
  7. Affected routes and components
  8. Design notes (UI/UX rationale, language considerations)
  9. Implementation notes (key code changes)
  10. Deployment/rollback notes
  11. Verification steps (how to check it works)
  12. Open questions / follow-ups

Conventions

- Keep secrets out of this folder (and the repo). Do not paste API keys, tokens, or PII.
- Link to code paths using absolute paths from repo root.
- If screenshots are helpful, reference them from an external system or local assets that are not sensitive.

Deployment Policy

- All accepted design and code changes are deployed directly to the public live production site (Netlify, instanthpi.ca). No private or staging deployments unless explicitly requested.
- Each story entry should record the deployment status and verification steps.

Index

- Use the file list in this folder as the running index. Newest entries should prefix with the current date for easy sorting.
