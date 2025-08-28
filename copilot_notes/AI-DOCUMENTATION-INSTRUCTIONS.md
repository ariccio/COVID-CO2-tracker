# Instructions for AI Agents Creating Documentation

## The "Fresh User Test"
When creating any setup or configuration documentation, mentally run through this test:
1. Pretend you're a new user who has NEVER seen this repo
2. Can they complete the task with ONLY your documentation?
3. What would they type EXACTLY?
4. What errors might they see?
5. How would they verify success?

## Required Elements for Every Guide

### 1. Concrete Values Rule
❌ BAD: "Set project_name to your project"
✅ GOOD: "Set project_name to `covid-co2-tracker` (exactly as shown, case-sensitive)"

### 2. Copy-Paste-Run Rule
Every command or configuration should be copy-pasteable and work immediately:
❌ BAD: `configure <your-project>`
✅ GOOD: `configure covid-co2-tracker`

### 3. Failure Documentation Rule
For every setup step, document:
- What success looks like
- What failure looks like
- How to fix common failures

### 4. The "Day 2" Rule
Always include:
- How to verify it's still working tomorrow
- How to update/modify the configuration
- How to completely remove/reset if needed

## Self-Check Questions
Before considering documentation complete, ask:
1. Did I include the EXACT values users need?
2. Can someone copy-paste my examples without editing?
3. Did I document what happens AFTER setup?
4. Did I test my instructions on a fresh setup?
5. Would this work for someone who doesn't know what I know?

## Example Anti-Patterns to Avoid
- "Use the appropriate value" → SPECIFY the value
- "Configure as needed" → SHOW the configuration
- "Standard setup" → DETAIL the steps
- "Should work" → CONFIRM it works
- "See documentation" → INCLUDE or link specifically

## The Golden Rule
If you had amnesia and could only read this documentation, could you successfully complete the task?