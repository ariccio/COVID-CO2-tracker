# Unicode Usage Guidelines - Textual Codepoints for Professional Output

Standards for unicode usage in code and output. Load this when formatting output, creating status indicators, or questioning emoji vs unicode choices.

## Core Philosophy

**Use unicode textual codepoints, not emoji characters**.

**Why**:
- Professional appearance
- Less visual noise
- Better terminal compatibility
- Semantic meaning through geometry
- Distinctive without distraction

**Examples**:
- ✓ Use `✓` (unicode textual codepoint U+2713)
- ✗ Use `✅` (emoji, visually heavy)

## Primary Status Indicators

Use these consistently across all output:

| Purpose | Unicode | Codepoint | Usage |
|---------|---------|-----------|-------|
| Success | `✓` | U+2713 | Tests passed, operation succeeded, confirmation |
| Error | `✗` | U+2717 | Tests failed, operation failed, rejection |
| Warning | `⚠` | U+26A0 | Caution, potential issue, check needed |
| Info | `ℹ` | U+2139 | Information, note, FYI |
| Progress | `→` | U+2192 | Process flow, next step, direction |
| Refresh | `⟳` | U+27F3 | Reload, retry, circular process |
| Critical | `⁂` | U+2042 | Asterism, breaking change, very important |
| Note | `※` | U+203B | Reference mark, annotation, personal note |

## Emoji to Unicode Replacements

Complete mapping of common emojis to textual unicode alternatives:

### Status & Validation
```
✅ → ✓   (success states, confirmations, checkmarks)
❌ → ✗   (error states, failures, cross marks)
✔️ → ✔   (check mark variant)
✖️ → ✖   (multiplication/close mark variant)
⚠️ → ⚠   (warnings - remove emoji variation selector)
ℹ️ → ℹ   (information - remove emoji variation selector)
```

### Directional Movement
```
➡️ → →   (forward direction, next steps, process flow)
⬅️ → ←   (backward direction, previous steps, return)
⬆️ → ↑   (upward direction, increase, higher)
⬇️ → ↓   (downward direction, decrease, lower)
```

### Arrow Variants
```
➔ → ➔   (thick rightward arrow)
➜ → ➜   (triangle-headed rightward arrow)
➞ → ➞   (double-headed rightward arrow)
➟ → ➟   (dashed rightward arrow)
```

### Priority & Rating
```
⭐ → ★   (filled star, important, featured)
☆ → ☆   (empty star, rating placeholder)
```

### Shapes - Circles
```
🔵 → ●   (filled circle, bullet points, main headers)
⭕ → ○   (empty circle, unchecked items, placeholders)
• → •   (bullet point, list item)
```

### Shapes - Squares
```
⬛ → ■   (filled square, selected/active)
⬜ → □   (empty square, unselected/inactive)
▪️ → ▪   (small filled square, sub-items)
▫️ → ▫   (small empty square, sub-placeholders)
```

### Shapes - Diamonds
```
💎 → ◆   (diamond filled, statistics, data summaries)
◇ → ◇   (diamond empty, tools, maintenance operations)
```

### Media Controls
```
▶️ → ▶   (play, start, right-pointing triangle filled)
▷ → ▷   (right-pointing triangle empty, expand)
◀️ → ◀   (left-pointing triangle filled, back)
◁ → ◁   (left-pointing triangle empty, collapse)
```

### Process & State
```
🔄 → ⟳   (clockwise rotation, refresh, reload)
🔃 → ⟲   (counterclockwise rotation, undo)
📝 → ※   (note/documentation creation, reference mark)
```

## Box Drawing Characters (Allowed)

Unicode Box Drawing (U+2500 to U+257F) and Block Elements (U+2580 to U+259F) are permitted for creating text-based tables, diagrams, progress bars, and visual separators.

**Single-line box drawing**:
```
─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼
```

**Double-line box drawing**:
```
═ ║ ╔ ╗ ╚ ╝ ╠ ╣ ╦ ╩ ╬
```

**Block elements**:
```
█ ▓ ▒ ░ ▀ ▄ ▌ ▐ ■ □
```

**Example usage**:
```
╔═══════════════════════════════╗
║  Export System Status         ║
╠═══════════════════════════════╣
║  ✓ Token validated            ║
║  ✓ Data fetched               ║
║  → Processing CSV export      ║
║  □ Pending completion         ║
╚═══════════════════════════════╝
```

## Shape Families for Semantic Grouping

Use shape families to create visual consistency:

### Diamonds (Focus/Precision)
```
⟐  Centered focus, main concept
◈  Nested/layered knowledge
⟢  Actionable/executable items
⬡  Data/visualization
```

**Usage**: Test sections, focused operations, precision tasks

### Circles (Status/Process)
```
◎  Complete/success (bullseye - hit the target!)
⊗  Cancelled/failed (circled times - mathematical negation)
⟳  Clockwise/active (running, in progress)
⟲  Anticlockwise/incomplete (something missing)
◯  Empty/pending (ready to be filled)
◉  Attention/info (fisheye - scanning, looking)
⊙  Inactive/disabled (present but not active)
```

**Usage**: Status indicators, process states, test results

### Hexagons (Technical/Architecture)
```
⬢  Configuration, technical structure
⬡  Data architecture
```

**Usage**: Technical sections, system architecture, configuration

### Triangles (Navigation/Hierarchy)
```
▸  Section marker
▹  Entry point
△  Upward trend
▽  Downward trend
```

**Usage**: Navigation, hierarchical lists, trends

### Special Marks (Annotations)
```
※  Reference/note (canonical annotation symbol)
⁂  Critical importance (asterism - three stars)
‡  Emphasis (double dagger)
‼  Urgent (double exclamation)
```

**Usage**: Notes, annotations, emphasis, critical items

## Context-Specific Usage Patterns

### Test Output Pattern
```
⟐ Running test suite
  ◎ Model tests passed (25/25)
  ◎ Controller tests passed (18/18)
  ⊗ Integration test failed (1/5)
  → Investigating failure...
```

### Script Output Pattern
```
✓ Configuration loaded
✓ Database connected
→ Processing records...
  ● Record 1/100 processed
  ● Record 2/100 processed
  ...
✓ All records processed
```

### Status Dashboard Pattern
```
◉ System Status Dashboard
─────────────────────────────
  ◎ Web dynos: Healthy
  ◎ Worker dynos: Healthy
  ⟲ Database: Under maintenance
  ◯ Redis: Starting...
```

### Error Message Pattern
```
✗ Export failed
  ⚠ Memory limit exceeded (512MB/512MB)
  → Recommendation: Scale to standard-2x dyno
  ℹ See: .ai/heroku-operations-overflow.md
```

## When to Use Unicode vs ASCII

### Use Unicode When:
✓ Status indicators (✓✗⚠ℹ)
✓ Visual separators (─ ═)
✓ Progress indicators (→ ⟳)
✓ Professional script output
✓ Documentation headers

### Use ASCII When:
✓ Code identifiers (variable names, function names)
✓ File paths
✓ URLs
✓ JSON keys
✓ Database fields
✓ Maximum compatibility needed

## Examples of Good vs Bad Usage

### Good (Professional)
```
✓ Tests passed
✗ Build failed
⚠ Memory usage high
ℹ Check logs for details
→ Next: Deploy to staging
```

### Bad (Too visually noisy)
```
✅ Tests passed
❌ Build failed
⚠️ Memory usage high
ℹ️ Check logs for details
➡️ Next: Deploy to staging
```

### Good (Box drawing)
```
╔════════════════════╗
║  Export Progress   ║
╠════════════════════╣
║  [████████░░] 80%  ║
╚════════════════════╝
```

### Bad (ASCII approximation when unicode available)
```
+===================+
|  Export Progress  |
+===================+
|  [########--] 80% |
+===================+
```

## Terminal Compatibility

**Well-supported** (use freely):
- Basic arrows: → ← ↑ ↓
- Check/cross: ✓ ✗
- Warning/info: ⚠ ℹ
- Stars: ★ ☆
- Basic shapes: ● ○ ■ □ ◆ ◇
- Box drawing: ─ │ ┌ ┐ └ ┘

**May not render** (use cautiously):
- Exotic shapes: ⬢ ⬡ ⟐ ⟢
- Mathematical operators: ⊗ ⊙ ⨀
- Rare symbols: ⁂ ‡ ※

**Test in target terminal** if using exotic characters.

## Cool Unicode Blocks for Development

### Most Useful for Technical Context
```
Geometric Shapes (U+25A0–25FF): ■ □ ● ○ ◆ ◇ ▲ △
Miscellaneous Technical (U+2300-U+23FF): ⌘ ⌥ ⎋ ⏎ ⚙ ⚡
Control Pictures (U+2400-U+243F): ␣ ␤ ␍ ␊
Letterlike Symbols (U+2100-U+214F): ℹ ™ ℃ ℉ ⅰ ⅱ
Enclosed Alphanumerics (U+2460-U+24FF): ① ② ③ Ⓐ Ⓑ Ⓒ
```

### Mathematical & Logical
```
Mathematical Operators (U+2200–U+22FF): ∀ ∃ ∈ ∉ ∑ ∏ ∫
Supplemental Math Operators (U+2A00-U+2AFF): ⨀ ⨁ ⨂
Miscellaneous Math Symbols-A (U+27C0-U+27EF): ⟨ ⟩ ⟪ ⟫
```

### Arrows & Flow
```
Misc Symbols and Arrows (U+2B00-U+2BFF): ⬀ ⬁ ⬂ ⬃
Supplemental Arrows-A (U+27F0-U+27FF): ⟰ ⟱ ⟲ ⟳
Supplemental Arrows-B (U+2900-U+297F): ⤀ ⤁ ⤂ ⤃
```

## Quick Reference: Common Scenarios

### Script Success/Failure
```ruby
puts "✓ Export completed successfully"
puts "✗ Export failed: #{error.message}"
puts "⚠ Export completed with warnings"
puts "ℹ Export queued for background processing"
```

### Progress Indicators
```ruby
puts "→ Processing records..."
(1..100).each do |i|
  print "\r● Processing #{i}/100"
  sleep 0.1
end
puts "\n✓ All records processed"
```

### Test Output
```ruby
context "with valid data" do
  it "creates export" do
    expect { create_export }.to change { Export.count }.by(1)
    # Prints: ✓ creates export
  end
end

context "with invalid data" do
  it "raises error" do
    expect { create_export }.to raise_error
    # Prints: ✓ raises error (test passed, even though code failed as expected)
  end
end
```

### Configuration Status
```ruby
def check_configuration
  puts "Configuration Check:"
  puts "  ✓ Database connected" if database_connected?
  puts "  ✓ Redis available" if redis_available?
  puts "  ✗ S3 bucket not configured" unless s3_configured?
  puts "  ⚠ Rate limit low (#{remaining_calls} remaining)" if rate_limit_low?
end
```

## Summary

**Primary Status Indicators**: ✓ ✗ ⚠ ℹ → ⟳ ※ ⁂

**Use unicode textual codepoints** (✓✗⚠ℹ), **not emojis** (✅❌⚠️ℹ️)

**Box drawing allowed** for tables, diagrams, progress bars

**Shape families** create semantic consistency:
- Diamonds for focus
- Circles for status
- Hexagons for technical
- Triangles for navigation

**Professional appearance** through geometric meaning, not cartoon characters

---

✓ Following unicode guidelines for professional output formatting.
