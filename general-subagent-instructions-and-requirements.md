## 🧠 CRITICAL: Subagent Context Preservation Protocol
- This has been imported from a project/repository that was focused on reverse engineering claude code to improve user experience. Consider adjusting the exact names and references to apply here.


### BEFORE Invoking ANY Subagent (MANDATORY)

1. **Create Context Preservation File**
   ```javascript
   // Create file with EXTREMELY descriptive name
   const contextFile = `copilot_notes/subagent_notes/stage2_webpack_bundle_extraction_for_cli_js_expecting_157_modules_context_and_reasoning.md`;
   ```

2. **Write Context Preservation Content** (MUST include ALL of these):
   ```markdown
   # Subagent Context: [Task Name]
   Created: [ISO timestamp]
   Parent Context Usage: [X%]

   ## Overall Plan Review
   [Brief review of the entire pipeline/project plan we're executing]

   ## Delegation Reasoning
   [Why this specific task is being delegated to a subagent]

   ## Distilled Context (AGGRESSIVE SUMMARY - MAX 3000 tokens)
   ### What We Know So Far
   - [Key discoveries]
   - [Critical patterns identified]
   - [Important file locations]

   ### Current State
   - [What's been completed]
   - [What's in progress]
   - [Known blockers/issues]

   ## Critical Requirements
   - [User's style preferences that apply to this task]
   - [Validation requirements]
   - [Expected outputs]

   ## Reasoning Chain
   [Key reasoning steps that led to this point]
   [Important decisions already made]
   [Hypotheses being tested]

   ## Creative Directions & Ideas
   [Promising approaches to explore]
   [Patterns that might be worth investigating]
   [Potential optimizations or improvements]

   ## References & Resources
   - Key files: [paths]
   - Useful patterns found: [examples]
   - Tools that worked: [list]

   ## For Subagent to Add:
   - [ ] Your initial plan
   - [ ] Key reasoning steps
   - [ ] Decisions made
   - [ ] Discoveries
   - [ ] Final summary of work completed
   ```

3. **Select Applicable Repository Instructions**
   - Analyze which parts of CLAUDE.md apply to the subagent's specific task
   - Extract ONLY relevant sections (don't overwhelm with irrelevant instructions)
   - Include user's style preferences if code will be written

### WHEN Invoking the Subagent

Include in the subagent prompt:
```
CONTEXT PRESERVATION:
First, read the context file at: copilot_notes/subagent_notes/[filename].md
This contains important context, reasoning, and state from the parent agent.
Consider this information as you plan your approach.

REPOSITORY INSTRUCTIONS:
@/Users/alexanderriccio/Documents/claude_code_reversing/package/CLAUDE.md
Review the repository-level instructions for coding standards, error handling requirements, and project-specific guidelines.

As you work:
- Add your initial plan to the context file
- Document key reasoning steps and decisions
- Note any important discoveries
- When complete, add a summary of your work

[Then include task-specific instructions and applicable repository requirements]
```

### For Sequential Subagent Chains

When chaining multiple subagents:
```javascript
// Use the SAME context file for related tasks
const sharedContext = `copilot_notes/subagent_notes/stage2_complete_bundle_extraction_shared_context.md`;

// Each subagent APPENDS their work
// Creates a persistent reasoning chain
```

### Benefits of This Approach
- **Preserves reasoning quality** across agent boundaries
- **Maintains creative momentum** and insights
- **Creates audit trail** of decisions and discoveries
- **Enables self-improvement** through documented learning
- **Maximizes disk as communication channel** between agents
- **Reduces context re-discovery** overhead

### Subagent Task Delegation Pattern
```javascript
// ALWAYS provide complete context to subagents
const subagentTask = {
    description: "Beautify and analyze cli.js",
    workingDirectory: "/Users/alexanderriccio/Documents/claude_code_reversing/package/deobfuscation",
    inputFile: "../cli.js",
    outputFiles: {
        beautified: "stage1_beautified/cli.beautified.js",
        strings: "stage1_beautified/cli.strings.txt",
        report: "reports/cli_analysis.json"
    },
    specificTasks: [
        "Apply js-beautify with indent_size=2",
        "Extract ALL string literals",
        "Identify bundler type (webpack/rollup/esbuild)",
        "Count modules if bundled",
        "Identify React version if present"
    ],
    validationRequired: [
        "Output file must exist",
        "Output file must be larger than input (due to formatting)",
        "Report must contain bundler_type field"
    ]
};
```
