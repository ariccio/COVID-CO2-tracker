# Subagent Delegation Prompts
*Ready-to-use prompts for knowledgebase improvement tasks*

## Instructions for User
Copy and paste these prompts to delegate specific improvement tasks to new AI agents. Each prompt includes the "ultrathink" keyword to trigger deep analysis mode.

---

## Subagent Prompt 1: Archive Session Files and Clean Directory

```
You need to ultrathink and clean up the copilot_notes directory by archiving old session files.

TASK: Archive session-specific files to reduce clutter

1. Create directory: copilot_notes/archive/sessions/
2. Move all files matching these patterns to archive:
   - *-session-*-context-preservation.md
   - *-continuation-prompt-*.md (except the most recent)
   - Any files older than 1 week that contain session-specific context

3. Keep these files in main directory:
   - All guides and references
   - Current templates
   - Active documentation

DELIVERABLE: Clean copilot_notes/ directory with <40 active files

Report what was moved and current file count.
```

---

## Subagent Prompt 2: Create Master Index with Metadata

```
You need to ultrathink and create a comprehensive index of all markdown documentation.

TASK: Generate INDEX-MASTER.md with complete metadata

Read all .md files in copilot_notes/ and subdirectories, then create:

# Master Knowledge Index

## Structure Required:
1. Group files by category:
   - Quick References (5-min reads)
   - Comprehensive Guides (deep dives)
   - Problem Solutions (troubleshooting)
   - Critical Procedures (emergencies)
   - Templates (reusable)

2. For each file, include:
   - Relative link to file
   - Word count
   - One-line description
   - Last modified date
   - Estimated reading time

3. Add section for most commonly needed:
   - Top 10 most useful files
   - Emergency procedures
   - Quick start guides

Format as markdown table for easy scanning.

DELIVERABLE: copilot_notes/INDEX-MASTER.md with every file indexed
```

---

## Subagent Prompt 3: Consolidate Heroku Documentation

```
You need to ultrathink and consolidate all Heroku documentation into one comprehensive guide.

TASK: Merge 8 Heroku files into single comprehensive guide

Files to consolidate:
- heroku-quick-reference.md
- heroku-memory-optimization.md
- heroku-database-connections.md
- heroku-streaming-exports.md
- heroku-problem-solution-map.md
- heroku-monitoring-setup.md
- heroku-export-deployment-commands.md
- heroku-scaling-economics.md

Create: guides/comprehensive/HEROKU-COMPLETE-GUIDE.md

Structure:
1. Quick Command Reference (top of file)
2. Table of Contents
3. Deployment Procedures
4. Memory Management
5. Database Optimization
6. Monitoring & Alerts
7. Troubleshooting Matrix
8. Scaling & Economics
9. Emergency Procedures

Requirements:
- Remove ALL redundancy
- Keep ALL unique information
- Add cross-references between sections
- Include copy-pasteable commands
- Add "Quick Fix" boxes for common issues

DELIVERABLE: Single searchable Heroku guide under 10,000 words
```

---

## Subagent Prompt 4: Organize Export System Documentation

```
You need to ultrathink and consolidate the export system documentation.

TASK: Organize all export-related documentation

Files to process (all 2025-*-export-*.md files):
1. Read all export-related files
2. Create guides/focused/export-system/ directory
3. Create EXPORT-SYSTEM-MASTER.md with:

## Required Sections:
- Current Implementation Status
- Security Requirements (CRITICAL)
- Architecture Overview
- API Endpoints
- Database Schema
- Step-by-Step Deployment
- Testing Checklist
- Performance Considerations
- Troubleshooting Guide

Special Focus:
- Token hashing security fix
- Memory limits for large exports
- Streaming implementation
- Rate limiting

Move supporting files to subdirectory, keep master in main guides.

DELIVERABLE: Complete, secure, production-ready export documentation
```

---

## Subagent Prompt 5: Add Navigation and Cross-References

```
You need to ultrathink and add navigation to all documentation files.

TASK: Add consistent navigation and cross-references

For each .md file in copilot_notes/:

1. Add at TOP of file (after title):
   ```markdown
   [← Index](../INDEX-MASTER.md) | [Category: XXX] | [Reading Time: X min]
   ```

2. Add "Related Documentation" section:
   ```markdown
   ## Related Documentation
   - For [topic]: See [Guide Name](../path/to/guide.md)
   - Prerequisites: [List required reading]
   - Next Steps: [What to read next]
   ```

3. Add "See Also" for similar topics

4. Fix any broken internal links

5. Create bidirectional links between related docs

DELIVERABLE: Every doc navigable, no dead ends
```

---

## Subagent Prompt 6: Create Emergency Playbook

```
You need to ultrathink and create a production emergency playbook.

TASK: Create guides/critical/PRODUCTION-EMERGENCY-PLAYBOOK.md

Include these scenarios with EXACT commands:

## 1. Site Completely Down
- Symptoms (what users see)
- First 5 steps (with exact commands)
- Diagnosis flowchart
- Recovery procedures
- Verification steps

## 2. Memory Exhaustion (R14)
- How to identify
- Immediate fix
- Root cause analysis
- Prevention

## 3. Database Connection Exhaustion
- Symptoms
- Commands to diagnose
- How to fix
- Long-term solutions

## 4. High Error Rate
- Monitoring commands
- Common causes
- Rollback procedures
- Communication template

## 5. Data Loss/Corruption
- Detection
- Recovery procedures
- Backup restoration
- User communication

For each: Include EXACT Heroku commands, expected output, and time estimates.

DELIVERABLE: Complete emergency playbook a panicking developer can follow
```

---

## Subagent Prompt 7: Standardize Documentation Format

```
You need to ultrathink and standardize formatting across all documentation.

TASK: Apply consistent format to all active .md files

Standard Template:
```markdown
# [Clear Title]
*Last Updated: YYYY-MM-DD | Category: [Category] | Reading Time: [X] min*

## Quick Summary
[1-2 sentences explaining what this doc covers]

## Prerequisites
- [What you need to know first]
- [Required access/tools]

## Table of Contents
- [Main sections with anchor links]

## [Content Sections]
[Use consistent heading levels]

## Troubleshooting
[Common issues and solutions]

## Related Documentation
[Links to related guides]

## Footer
---
*[Any notes about automation, generation, etc.]*
```

Apply to all files in guides/ directory.
Preserve all content, just restructure.

DELIVERABLE: Consistent, professional documentation
```

---

## Subagent Prompt 8: Fill Critical Documentation Gaps

```
You need to ultrathink and create missing critical documentation.

TASK: Create these critical missing documents

1. SECURITY-INCIDENT-RESPONSE.md
   - Detection procedures
   - Immediate containment steps
   - Investigation process
   - Recovery procedures
   - Notification requirements
   - Post-incident review

2. DATA-RECOVERY-PROCEDURES.md
   - Backup verification
   - Point-in-time recovery
   - Corruption detection
   - Recovery testing
   - RTO/RPO targets

3. PERFORMANCE-TROUBLESHOOTING.md
   - Diagnosis flowchart
   - Common bottlenecks
   - Profiling commands
   - Query optimization
   - Caching strategies

4. DATABASE-MIGRATION-ROLLBACK.md
   - Safe migration patterns
   - Rollback procedures
   - Zero-downtime strategies
   - Testing requirements

Even if incomplete, create structure with known information and clear TODOs.

DELIVERABLE: 4 new critical procedure documents
```

---

## Subagent Prompt 9: Create Command Cheatsheets

```
You need to ultrathink and create quick reference cheatsheets.

TASK: Create 3 command cheatsheets

1. RAILS-COMMANDS-CHEATSHEET.md
   ```bash
   # Database
   rails db:migrate              # Run migrations
   rails db:rollback STEP=1      # Rollback one migration
   rails db:seed                 # Load seed data
   
   # Console
   rails console                 # Start console
   User.find_by(email: "x")     # Find user
   
   [etc - 50 most useful commands]
   ```

2. HEROKU-COMMANDS-CHEATSHEET.md
   - Deployment commands
   - Debugging commands
   - Database commands
   - Scaling commands
   - Monitoring commands

3. TROUBLESHOOTING-CHEATSHEET.md
   - Error codes and meanings
   - Quick fixes for common issues
   - Debug commands
   - Log analysis

Format: Command | Description | Example
Make everything copy-pasteable.

DELIVERABLE: 3 cheatsheets developers can print and keep handy
```

---

## Subagent Prompt 10: Optimize Token Usage

```
You need to ultrathink and optimize documentation for AI token efficiency.

TASK: Reduce token usage while preserving information

For top 10 largest .md files:

1. Remove redundancy
   - Repeated information
   - Verbose explanations
   - Duplicate examples

2. Compress without losing meaning
   - Use concise language
   - Replace verbose descriptions
   - Combine similar sections

3. Extract patterns to templates
   - Move repeated structures to templates
   - Use references instead of duplication

4. Create summary sections
   - Add TL;DR at top
   - Executive summary for long docs
   - Quick reference boxes

Target: 30% token reduction without information loss

DELIVERABLE: Optimized docs that load faster in AI context
```

---

## Master Delegation Prompt (Coordinate All Subagents)

```
You need to ultrathink and coordinate the knowledgebase improvement project.

CONTEXT: We have 10 subagent prompts to improve our markdown documentation tonight.

YOUR ROLE: Project coordinator

TASKS:
1. Review the pragmatic plan in 2025-09-02-KNOWLEDGEBASE-PRAGMATIC-PLAN.md
2. Assess which tasks are truly completable tonight
3. Identify any dependencies between tasks
4. Suggest optimal execution order
5. Create a timeline for a 4-6 hour work session
6. Identify which tasks could be batched together
7. Flag any tasks that might conflict
8. Recommend which tasks to prioritize if time runs short

DELIVERABLE: Execution plan with specific order and time allocations

Help us achieve maximum improvement in minimum time.
```

---

## Verification Prompt

```
You need to ultrathink and verify the knowledgebase improvements.

TASK: Test that improvements actually help

1. Try to find information about:
   - How to handle R14 memory errors
   - Export system security requirements  
   - Database connection limits
   - Emergency procedures

2. Measure:
   - Time to find each piece of information
   - Number of files you had to check
   - Clarity of the information found
   - Completeness of instructions

3. Compare before/after if possible

4. Report:
   - What improved
   - What still needs work
   - Any broken links or missing info
   - Recommendations for phase 2

DELIVERABLE: Improvement verification report with metrics
```

---

*Each prompt is self-contained and can be run independently. Use "ultrathink" keyword for maximum effectiveness.*