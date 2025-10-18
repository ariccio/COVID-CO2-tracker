# Rails Syntax Style Guide
## Code Formatting, Unicode Standards, and Professional Output

**Tier**: 1-2 (Quick Reference to Focused Guide)
**Word Count**: ~600 words
**When to Load**: Tasks involving "syntax|style|formatting|parentheses|braces|unicode|emoji|output"
**Purpose**: Ensures consistent, explicit, professional code style across the project

---

## Overview

This guide establishes syntax preferences for COVID-CO2-tracker. The core philosophy is **explicitness over brevity** - code should be immediately understandable, even if it's slightly more verbose.

**Key Principle**: **Clarity >> Conciseness**

---

## General Syntax Preferences

### Parentheses and Braces

**Use parentheses even when optional**:

```ruby
# GOOD (explicit):
if (condition)
  do_something()
end

# AVOID (implicit):
if condition
  do_something
end
```

**Use braces even when optional** (for languages that support them):

```ruby
# In languages with optional braces:
if (condition) { ... }  # GOOD

# vs

if (condition) ...  # AVOID
```

### Method Calls

**Always use parentheses for method calls with arguments**:

```ruby
# GOOD:
Rails.logger.info("Message")
Place.find_by(id: place_id)
export_data(records: data, format: :json)

# AVOID:
Rails.logger.info "Message"
Place.find_by id: place_id
export_data records: data, format: :json
```

**Why**: Parentheses make it unambiguous what's an argument vs what's a chained method call.

### Explicit Returns

**In Ruby, always use explicit return statements**:

```ruby
# GOOD:
def calculate_total(items)
  return 0 if items.empty?
  return items.sum(&:price)
end

# AVOID:
def calculate_total(items)
  return 0 if items.empty?
  items.sum(&:price)  # Implicit return
end
```

**Why**: Explicit returns make control flow obvious, especially in methods with multiple exit points.

---

## Code Organization

### Function Length

**Prefer to keep function length short** enough to fit within a single screen height:
- Target: **40-60 lines of code**
- If longer, break into smaller helper methods

### Variable Naming

**Do not worry about the length of descriptive variable names**:

```ruby
# GOOD:
export_streaming_rate_limiter_token_bucket = initialize_token_bucket()
user_requested_export_format_with_metadata = parse_export_request(params)

# AVOID (unclear abbreviations):
exp_str_rl_tb = initialize_token_bucket()
usr_req_exp_fmt_md = parse_export_request(params)
```

**Prefer clarity over brevity**.

### Comments

**Prefer to write self-documenting code** that is easy to understand.

**ONLY add comments** for poorly documented or undocumented APIs:

```ruby
# GOOD (comment explains undocumented behavior):
# Heroku's dyno manager requires a 30-second keep-alive ping
# or it will terminate the streaming connection
keep_alive_ping_interval = 30.seconds

# AVOID (comment restates obvious code):
# Set interval to 30 seconds
interval = 30.seconds
```

### Conditional Assignment

**Do not use if condition with unnamed non-boolean function call results**:

```ruby
# GOOD:
export_result = generate_export(params)
if (export_result.success?)
  redirect_to(export_result.url)
end

# AVOID (unclear what the function returns):
if (generate_export(params))
  # What does generate_export return? Boolean? Object? Nil?
end
```

**Exception**: If-let initializers are okay:

```ruby
# GOOD:
if (export = Export.find_by(id: params[:id]))
  process_export(export)
end
```

---

## Unicode and Emoji Guidelines

### Core Philosophy

**Use emojis and similar unicode characters ONLY where they add clarity and value**.

**Do not use them gratuitously or excessively**. Do not dilute the user's attention.

### Recommended Unicode Codepoints

**For many use cases, these unicode textual representations suffice**:

```
✓ ✗ ✔ ✖ ⚠ ℹ → ← ↑ ↓ ➔ ➜ ➞ ➟ ★ ☆ ● ○ • ■ □ ▪ ▫ ◆ ◇ ▶ ▷ ◀ ◁ ⟳ ⟲ ※
```

**Examples**:
- `✗` works well for **ERRORS**
- `✓` works well for **top-level successes**
- `⚠` for warnings
- `ℹ` for information
- `→` for flow/progression

### Box Drawing and Block Elements

**ALLOWED**: Unicode Box Drawing characters (U+2500 to U+257F) and Block Elements (U+2580 to U+259F) for creating text-based tables, diagrams, progress bars, and visual separators.

**Examples**:
```
─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ ═ ║ ╔ ╗ ╚ ╝ ╠ ╣ ╦ ╩ ╬ █ ▓ ▒ ░ ▀ ▄ ▌ ▐ ■ □
```

---

## Emoji Replacement Guidelines

**When replacing prominent emojis with less intrusive Unicode characters**, use these proven replacements grouped by semantic category:

### Status & Validation
- ✅ → ✓ (success states, confirmations, checkmarks)
- ❌ → ✗ (error states, failures, cross marks)
- ✔️ → ✔ (check mark variant)
- ✖️ → ✖ (multiplication/close mark variant)
- ⚠️ → ⚠ (warnings - remove emoji variation selector)
- ℹ️ → ℹ (information - remove emoji variation selector)

### Directional Movement
- ➡️ → → (forward direction, next steps, process flow)
- ⬅️ → ← (backward direction, previous steps, return)
- ⬆️ → ↑ (upward direction, increase, higher)
- ⬇️ → ↓ (downward direction, decrease, lower)

### Arrow Variants
- ➔ → ➔ (thick rightward arrow)
- ➜ → ➜ (triangle-headed rightward arrow)
- ➞ → ➞ (double-headed rightward arrow)
- ➟ → ➟ (dashed rightward arrow)

### Priority & Rating
- ⭐ → ★ (filled star, important, featured)
- ☆ → ☆ (empty star, rating placeholder)

### Shapes - Circles
- 🔵 → ● (filled circle, bullet points, main headers)
- ⭕ → ○ (empty circle, unchecked items, placeholders)
- • → • (bullet point, list item)

### Shapes - Squares
- ⬛ → ■ (filled square, selected/active)
- ⬜ → □ (empty square, unselected/inactive)
- ▪️ → ▪ (small filled square, sub-items)
- ▫️ → ▫ (small empty square, sub-placeholders)

### Shapes - Diamonds
- 💎 → ◆ (diamond filled, statistics, data summaries)
- ◇ → ◇ (diamond empty, tools, maintenance operations)

### Media Controls
- ▶️ → ▶ (play, start, right-pointing triangle filled)
- ▷ → ▷ (right-pointing triangle empty, expand)
- ◀️ → ◀ (left-pointing triangle filled, back)
- ◁ → ◁ (left-pointing triangle empty, collapse)

### Process & State
- 🔄 → ⟳ (clockwise rotation, refresh, reload)
- 🔃 → ⟲ (counterclockwise rotation, undo)
- 📝 → ※ (note/documentation creation, reference mark)

**Why this matters**: These replacements maintain semantic meaning while reducing visual noise and improving professional appearance in development tooling.

---

## Cool Unicode Blocks Reference

**The following Unicode blocks contain lots of cool characters ("codepoints")** that you're highly encouraged to use where appropriate:

### Most Useful for Development/Technical Context

- **Geometric Shapes** (U+25A0–25FF): ■ □ ● ○ ◆ ◇ ▲ △ etc.
- **Miscellaneous Technical** (U+2300-U+23FF): ⌘ ⌥ ⎋ ⏎ ⚙ ⚡ etc.
- **Control Pictures** (U+2400-U+243F): ␣ ␤ ␍ ␊ etc.
- **Letterlike Symbols** (U+2100-U+214F): ℹ ™ ℃ ℉ ⅰ ⅱ etc.
- **Enclosed Alphanumerics** (U+2460-U+24FF): ① ② ③ Ⓐ Ⓑ Ⓒ etc.

### Mathematical & Logical Symbols

- **Mathematical Operators** (U+2200–U+22FF): ∀ ∃ ∈ ∉ ∑ ∏ ∫ etc.
- **Supplemental Mathematical Operators** (U+2A00-U+2AFF): ⨀ ⨁ ⨂ etc.
- **Miscellaneous Mathematical Symbols-A** (U+27C0-U+27EF): ⟨ ⟩ ⟪ ⟫ etc.
- **Miscellaneous Mathematical Symbols-B** (U+2980-U+29FF): ⦀ ⦁ ⦂ etc.
- **Mathematical Alphanumeric Symbols** (U+1D400-U+1D7FF): 𝒜 𝒞 𝒟 etc.

### Arrows & Flow Indicators

- **Miscellaneous Symbols and Arrows** (U+2B00-U+2BFF): ⬀ ⬁ ⬂ ⬃ etc.
- **Supplemental Arrows-A** (U+27F0-U+27FF): ⟰ ⟱ ⟲ ⟳ etc.
- **Supplemental Arrows-B** (U+2900-U+297F): ⤀ ⤁ ⤂ ⤃ etc.

### Specialized/Historical (use sparingly)

- **Geometric Shapes Extended** (U+1F780-U+1F7FF) - (only some render)
- **Linear B Ideograms** (U+10080-U+100FF): 𐀀 𐀁 𐀂 etc.
- **Linear A** (U+10600-U+1077F): 𐘀 𐘁 𐘂 etc.
- **Egyptian Hieroglyphs** (U+13000-U+1342F): 𓀀 𓀁 𓀂 etc.

**Note**: Historical scripts are fun but rarely useful in technical contexts. Use sparingly.

---

## Integration with Other Files

This guide complements:
- **CLAUDE.md**: Main instructions (references this file)
- **.ai/unicode-guidelines.md**: Duplicate content (consider consolidating)
- **rails-specific-patterns.md**: Technical Rails patterns

**When this file is loaded**, agents should:
1. Apply explicit syntax rules (parentheses, returns)
2. Use unicode textual codepoints instead of emojis
3. Prioritize clarity over brevity in all code

---

## Summary

**Core Principles**:
- **Explicitness over brevity** - use parentheses, explicit returns, full variable names
- **Unicode textual codepoints over emojis** - ✓✗⚠ℹ not ✅❌⚠️ℹ️
- **Self-documenting code over comments** - except for undocumented APIs
- **Short functions** - 40-60 lines max, break up larger ones

**Load this file when**: Writing or formatting code, wondering about unicode usage, or needing style guidance.
