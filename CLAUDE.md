# Claude Code Instructions
This file is intended to route claude to the main ai-agent-agnostic instruction files that we share between claude and copilot and other agents. Those files are detailed below.

## Primary Instructions (YOU MUST include/read/reference these)
@.github/ai-instructions.md

## Primary Additional Context, also referenced from `ai-instructions.md` (YOU MUST include/read/reference these)
@.github/copilot-instructions.md

## Shared Memory Access
The `copilot_notes/` directory contains important context and memory from other AI agents. Check filenames there for relevant information when starting tasks.

## ⚠️ CRITICAL: Known Issues and Anti-Patterns

### The Time.zone Ping-Pong Pattern - DO NOT REPEAT
**NEVER** change `Time.now` to `Time.zone.now` in these files:
- `config/boot.rb`
- `config/application.rb`
- `config/environment.rb`
- `config/environments/*.rb`

These files run BEFORE Rails initializes. Time.zone doesn't exist yet!
This mistake has been made and reverted multiple times. See: `copilot_notes/time-zone-ping-pong-analysis.md`

### Before Making ANY Time-Related Changes
1. **MUST READ**: `copilot_notes/time-zone-ping-pong-analysis.md`
2. **MUST CHECK**: `.rubocop.yml` exclusions - they prevent real bugs
3. **MUST TEST**: Run `rails runner "puts 'Success'"` after any config changes

## 🧠 Memory Infrastructure Active
The COVID CO2 Tracker now uses an advanced memory and context management system.

### Quick Start for AI Agents
1. **ALWAYS** check `copilot_notes/INDEX-SEMANTIC-CO2.md` first
2. Load files based on task pattern matching
3. Respect context budgets (see index for guidelines)
4. Create continuation prompts if approaching limits

### Key Infrastructure Files
- `INDEX-SEMANTIC-CO2.md` - Task pattern matcher (START HERE)
- `PROBLEM_SOLUTION_MAP_CO2.md` - Debugging patterns
- `guides/quick/` - 1-hour implementation guides
- `continuation-templates/` - Multi-session work patterns

### Context Budget Management
- Simple tasks: <3,000 tokens
- Medium tasks: <10,000 tokens  
- Complex tasks: <25,000 tokens
- Architecture: No limit (use continuation prompts)

### When You Discover New Patterns
1. Create descriptive filename in copilot_notes/
2. Update INDEX-SEMANTIC-CO2.md with word count
3. Consider creating a script if repeatable

### Documentation Quality Standards
When creating documentation or guides:
1. **Include EXACT values** (not placeholders) for all parameters
2. **Make everything copy-pasteable** - test that examples work as-is
3. **Document failure modes** - what errors users might see and fixes
4. **Add verification steps** - how to confirm something worked
5. See `copilot_notes/AI-DOCUMENTATION-INSTRUCTIONS.md` for full standards
