# Auto-Claude: Autonomous Development Loop

A new tool has been set up to enable autonomous Claude Code loops for this project.

## What Is This?

`auto-claude` is a bash script that runs Claude Code in a loop, automatically continuing work until tasks are complete. It's installed at `~/.local/bin/auto-claude`.

## How To Use It

### 1. Create a TASK.md file with checkboxes

```markdown
# InstantHPI Development Tasks

## Current Sprint
- [ ] Task 1 description
- [ ] Task 2 description
- [ ] Task 3 description

## Context
[Any relevant context for the AI to understand the project]
```

### 2. Run the autonomous loop

```bash
# Basic usage
auto-claude

# With tmux monitoring (recommended)
auto-claude -m

# Use opus model for complex tasks
auto-claude --model opus

# Limit to 20 loops
auto-claude -n 20
```

## How It Works

1. **Loop**: Runs `claude --continue -p <TASK.md contents>` repeatedly
2. **Context**: Uses `--continue` to maintain conversation history across loops
3. **Progress**: Claude updates checkboxes `[ ]` → `[x]` as it completes items
4. **Completion Detection**:
   - All checkboxes marked `[x]}` → stops
   - Claude outputs "DONE" or "COMPLETE" → stops
   - No file changes for 3 loops → stops (stagnation)

## Commands

```bash
auto-claude --help          # Show all options
auto-claude -m              # Run with tmux split-screen monitor
auto-claude -r              # Reset state (start fresh)
auto-claude --model opus    # Use specific model
auto-claude -n 50 -d 5      # Max 50 loops, 5s delay between
```

## Best Practices for TASK.md

1. **Use checkboxes** - They're the primary progress indicator
2. **Be specific** - Clear tasks = better results
3. **Include context** - Reference files, patterns, constraints
4. **Order matters** - Put tasks in logical sequence

### Example TASK.md for InstantHPI:

```markdown
# InstantHPI Feature: Patient Intake

## Tasks
- [ ] Create PatientIntakeForm component in src/components/
- [ ] Add form validation with zod schema
- [ ] Integrate with Supabase patients table
- [ ] Add error handling and loading states
- [ ] Write tests in __tests__/

## Technical Context
- Framework: Next.js 14 with App Router
- UI: Tailwind CSS + shadcn/ui
- Database: Supabase
- Validation: Zod
- Testing: Vitest

## Files to Reference
- src/components/ExistingForm.tsx (for patterns)
- src/lib/supabase.ts (database client)
- src/types/patient.ts (type definitions)
```

## Logs & State

- Logs: `./logs/auto-claude.log` and `./logs/loop_*.log`
- State: `./.auto-claude-state` (tracks progress across interrupts)

## Integration with Current Work

If you're already working on this project:

1. Create a `TASK.md` with remaining work as checkboxes
2. Run `auto-claude -m` in a separate terminal
3. It will continue from where you left off using `--continue`

## Source Code

The script is at `~/.local/bin/auto-claude` (~300 lines of bash).

Key features:
- Bash 3 compatible (works on macOS)
- Rate limit detection (waits on 429)
- 10min timeout per loop
- State persistence (survives interrupts)
- Git-based stagnation detection

---

*This autonomous loop system was set up to accelerate development. Use TASK.md files to define work, and let auto-claude handle the iteration.*
