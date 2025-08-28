# Documentation Quality Standards - Note for DeeDee-Prototype

## Context
While working on COVID CO2 Tracker's rails-mcp-server setup, we discovered a critical documentation gap: I documented the interface but not the concrete implementation details (like exact project names needed for `switch_project`). This led to creating a documentation quality framework.

## What We Created (in COVID CO2 Tracker repo)
1. **Test Script** (`scripts/test-documentation.sh`) - Checks for missing concrete values automatically
2. **Documentation Template** (`copilot_notes/DOCUMENTATION-TEMPLATE.md`) - Forces complete documentation
3. **AI Instructions** (`copilot_notes/AI-DOCUMENTATION-INSTRUCTIONS.md`) - Standards for AI-generated docs
4. **Integration Checklist** (`copilot_notes/integration-checklist-template.md`) - Reusable validation

## Core Principle: "Executable Documentation"
Every example should be copy-pasteable and work immediately. No placeholders, no "configure as needed", no assumed knowledge.

## Key Rules That Prevent "Unknown Unknowns"
1. **Concrete Values Rule**: Show EXACT values, not placeholders
2. **Copy-Paste-Run Rule**: Examples must work without editing
3. **Failure Documentation Rule**: Show what errors look like and how to fix
4. **Day 2 Rule**: Document how to verify, update, and troubleshoot tomorrow
5. **Fresh User Test**: Could someone with amnesia complete this task?

## If Porting to DeeDee-Prototype
Consider adding to `.github/documentation-standards/` with:
- The templates and checklist from COVID CO2 Tracker
- Reference in copilot-instructions.md or ai-instructions.md
- Update the agent command auto-allow list to include doc testing script

## Why This Matters for DeeDee
DeeDee-Prototype has 117+ files in copilot_notes/ with valuable patterns, but some may have these same "interface documented but not implementation" gaps. The testing script could help identify where concrete examples are missing.

## Decision Point
This is optional but could improve DeeDee's already impressive documentation system. The overhead is minimal (a few template files and one instruction update), but the prevention of frustrating "unknown unknown" issues could save significant debugging time.

---
*Created: 2025-08-28*
*Origin: COVID CO2 Tracker rails-mcp-server integration experience*