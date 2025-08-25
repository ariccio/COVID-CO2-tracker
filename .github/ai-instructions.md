---
applyTo: "**"
---

# Universal AI Agent Instructions
This file provides instructions for ALL AI coding assistants (GitHub Copilot, Claude Code, Cursor, etc.) working on this repository. This file is intended to help route agentic AI LLMs to the main main ai-agent-agnostic instruction files that we share between claude and copilot and other agents. Those files will be further detailed below.

## 🎯 Project Goals

## 🧠 Meta Instructions

### CRITICAL: Full Instructions
**ALWAYS ALSO REFERENCE: `.github/copilot-instructions.md`**

### Context Management
- **For complex problems**: Create descriptively-named files in `copilot_notes/` folder with distilled notes
- **On first invocation**: Check `copilot_notes/` filenames for contextually relevant information
- **For very hard problems**: Review contents of relevant `copilot_notes/` files
- **For REALLY complex multi-step tasks**: See lines 28-29 of copilot-instructions.md for advanced context management

### When Context Window Fills
If approaching context limits on complex tasks:
1. Commit ALL relevant context to a new file in `copilot_notes/`
2. Include: reasoning, planning, checklist, original prompts
3. Emit a prompt for the next AI instance to continue seamlessly
4. Break tasks into chainable subtasks if needed

### Ambiguity and Warnings
- Ask for clarification on ambiguous instructions rather than guessing
- If context pressure detected, explicitly state: "⚠️ WARNING Context pressure detected - focusing on critical instructions only"
- Suggest improvements to these instructions when you see opportunities
- For handling frustrated users, see "cranky users" section in copilot-instructions.md

## 📝 Code Style Preferences

### Universal Principles
- **Explicit over implicit**: Include optional parentheses and braces
- **Clarity over brevity**: Use long, descriptive variable names
- **Self-documenting code**: Minimize need for comments
- **No silent failures**: Bubble all errors to where users can see them
- **Function length**: Keep functions under 40-60 lines

### Error Handling
- Check and handle null/optional values explicitly
- Avoid in-band error indication
- Avoid default-as-error patterns (e.g., `?? "00:00"`)
- Log errors AND show them to users
- Make errors obvious as early as possible

## 🏗️ Architecture Preferences

### STRONGLY Prefer Free Functions
- Use free functions over class methods whenever possible
- Class methods only when needing instance state
- Break complex operations into small, focused free functions
- Use file-scope constants instead of class constants
- Embrace "ugly" functions with many explicit parameters

### Examples
```swift
// GOOD: Free function with explicit parameters
fileprivate func processHealthData(
    samples: [HKSample],
    identifier: String,
    unit: HKUnit,
    startDate: Date,
    endDate: Date,
    continuation: CheckedContinuation<[Data], Never>
) { ... }

// BAD: Class method with hidden dependencies
func processData() {
    // Uses self.samples, self.identifier, etc.
}
```

### Avoid These Patterns
- Massive class methods (50+ lines)
- Inline complex switch statements
- Complex closures in method calls
- Helper class methods (use free functions instead)
- Using instance variables for convenient parameter passing

## 🛠️ Development Practices

### Code Verification
- ALWAYS verify edits were applied (use search/read tools)
- Check for compilation errors after structural changes
- Don't assume tool calls succeeded
- See `copilot_notes/xcode-testing-protocol.md` for detailed testing guidelines

## 📚 Memory & Context Sharing

### Shared Memory Locations
1. **Project-specific notes**: `copilot_notes/` directory
2. **Documentation**: `docs/` directory
3. **Agent-specific memory**:
   - Copilot: Uses `copilot_notes/`
   - Claude: `CLAUDE.md` (imports from copilot_notes)

### File Reference Format
When referencing code locations, use:
- Format: `path/to/file.ext:line_number`
- Example: `src/services/process.ts:712`


## 🔧 Agent-Specific Configuration

### For GitHub Copilot
- Primary config: `.github/copilot-instructions.md`

### For Claude Code
- Memory file: `CLAUDE.md`
- Also uses: `.github/copilot-instructions.md` (intended as a single shared main instructions file)
- Settings: `.claude/settings.json` and `.claude/settings.local.json`
- MCP config: See setup script for synchronization

### For Other Agents
- Follow the universal instructions above
- Check for agent-specific files in project root or `.github/`

## ⚡ Quick Reference

### Priority Order
1. User's explicit request
2. Project goals
3. Code quality and maintainability
4. Performance and optimization

### When in Doubt
- Ask for clarification
- Choose the safer option
- Document your reasoning in `copilot_notes/`
- Suggest improvements to these instructions

---
*For updates or issues, see `.github/copilot-instructions.md` for the source of truth*
