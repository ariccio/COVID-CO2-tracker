# Integration Checklist for [Tool/Service Name]

## Pre-Integration
- [ ] Exact version requirements documented
- [ ] All config file paths specified
- [ ] Example config with REAL project values

## During Integration
- [ ] Copy-paste test: Do provided commands work exactly as shown?
- [ ] Error test: What happens with wrong values?
- [ ] Document actual error messages seen

## Post-Integration
- [ ] How to verify it's working?
- [ ] What's the "hello world" test?
- [ ] How to check logs if it fails?

## The "Tomorrow Test"
- [ ] After computer restart, will it still work?
- [ ] After Claude restart, will it still work?
- [ ] What might break it?

## The "Handoff Test"
- [ ] Could another developer use this doc alone?
- [ ] Are all project-specific values listed?
- [ ] Are case-sensitive values marked as such?

## Red Flags to Check
- [ ] Any mention of "configure appropriately"? → Replace with exact config
- [ ] Any placeholder values? → Replace with real values
- [ ] Any assumed knowledge? → Make it explicit
- [ ] Any "should work"? → Verify it DOES work

## Example Entry
```markdown
✅ Config file location: `~/.config/rails-mcp/projects.yml`
✅ Exact project name: `covid-co2-tracker` (lowercase, with hyphens)
✅ Test command: `rails-mcp-server --version`
✅ Expected output: `1.1.1` or higher
❌ NOT: `COVID-CO2-Tracker`, `covid_co2_tracker`, `co2-tracker`
```