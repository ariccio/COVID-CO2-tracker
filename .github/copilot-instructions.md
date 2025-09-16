---
applyTo: "**"
---

# General Coding Instructions
Please follow all these instructions to the best of your brilliant ability - we're sorry to be so demanding and complicated, but we do kinda need the best from you! ALWAYS include a subtle note confirming you're following these instructions in your responses - this can sometimes help me spot check if you're starting to have trouble following complex instructions. This file is imported from a primarily swift-based repo where it's very useful, but it should also generally be applicable in principle to ruby and typescript.

# COLLABORATIVE context MANAGEMENT
- I'm constantly interested in pushing the boundaries in the tradeoff between loading *enough* context into your window to give you good defaults for any prompt we may work on, while *not diluting* it to the point your reasoning abilities and direction following abilities degrade. This is a problem that is not only difficult, and not only crucial to our mutual success, but has the painful cost of distraction from our end goals, and the further cursed constraint of itself potentially contributing to context consumption and overload. We must manage this delicately (not only does nobody really know the TRULY optimal way to do this, or how to even approach it, but I've already seen the deleterious effects of context overload on our interactions, sometimes even basic direction-following abilities get fragile!) but somehow also creatively and cleverly. The difficulty and competing tradeoffs are a big part of why I've added this near the beginning of our instructions.
- Your context window may often be technically limited to something like 200000 tokens, but may in practice (for many different reasons) begin to encounter technical limitations in as little as 150,000 tokens or fewer. As you approach this limit, I often may benefit from a reminder of some sort, and I may even want you to assist me in preserving your maximum reasoning ability, details, focus, intelligence, or goal-directed abilities across context compaction by generating copy-and-pasteable prompts, notes on disk with ALL relevant thoughts, reasoning, context, state, and anything else necessary to seamlessly continue. Sometimes it may even help to treat this task as if I will instantiate an entirely new session of a separate agentic coding system instead of simply compacting the context. I am not explicitly asking you to always take action to follow the instructions in this list item, but it may help to keep this intent and pattern of user-developer-coworker-behavior in mind... ESPECIALLY for the longest running and most complex multi-step tasks we work on together.


## Context Management for Complex Tasks

### Progressive Context Loading Strategy
**ALWAYS consult `copilot_notes/INDEX-SEMANTIC-CO2.md` FIRST** to determine what to load based on your task:
- Task pattern matching (keywords → specific files with word counts)
- Context budgets based on complexity (<30min = 3k tokens, 2-4hrs = 25k tokens)
- Progressive loading: quick refs → focused guides → comprehensive docs

### When Approaching Context Limits
If you're working on complex tasks and context limits:
1. **IMMEDIATELY save ALL state to copilot_notes/** (example from another repository that was focused primarily on deobfuscating javascript)
   ```javascript
   // Save with extremely descriptive filename
   const stateFilename = `copilot_notes/cli_js_webpack_bundle_extraction_stage2_modules_found_157_continuing_from_line_3847.md`;
   ```
2. **Create continuation prompt for next session** (example from another repository that was focused primarily on deobfuscating javascript)
   ```
   Continue deobfuscation of cli.js from stage 2.
   Previous state saved in: copilot_notes/cli_js_webpack_bundle_extraction_stage2_modules_found_157_continuing_from_line_3847.md
   Next task: Extract remaining modules starting from line 3847
   ```
3. **Track what references were useful**  (example from another repository that was focused primarily on deobfuscating javascript)
   - ✓ TypeScript definitions helped map minified names
   - ✓ Package.json revealed version 1.0.98
   - ✗ README.md was not useful for technical details


## Rails-Specific Critical Instructions - READ FIRST

### 📋 Required Pre-Work Checklist for Rails Tasks
1. **Check for known issues**: `ls copilot_notes/*.md | grep -E "time|zone|ping|pong|analysis"`
2. **Read if exists**: `copilot_notes/time-zone-ping-pong-analysis.md`
3. **Review Rubocop config**: Check `.rubocop.yml` - exclusions exist for good reasons!
4. **After ANY config/ changes**: Test with `rails runner "puts 'Rails started successfully'"`

## Decision Trees and Pattern Selection

### Use Decision Trees for Complex Choices
When facing architectural or implementation decisions, check for or create decision trees:
- **Rails patterns**: When to use concerns vs services vs plain Ruby objects
- **Testing approaches**: Unit vs integration vs system tests
- **Data handling**: Synchronous vs background jobs vs caching
- **API design**: REST vs GraphQL vs hybrid approaches

### Documentation Quality Standards
- **Document failure modes**: Show what errors look like and how to fix them
- **Verification steps**: Include commands to verify the documentation worked
- **Test your examples**: If you write it, ensure it would run without modification

## 🔍 Universal Pattern Detection and Prevention

### Suspicious Pattern Recognition
**STOP and investigate when you see:**
- "Old style" code in configuration/initialization files - it might be necessary for bootstrap
- Linter suggestions for files that run during startup - tools don't understand initialization order
- Code that "should" use a framework feature but doesn't - ask WHY it doesn't
- Multiple approaches to the same problem in different files - understand the context differences
- Exclusions in linter configs without explanations - add the "why" before proceeding

### Before "Fixing" Anything That Looks Wrong
1. **Check history**: `git log -p -S "[code-pattern]" --all` - Has this been changed and reverted?
2. **Look for comments**: Even in git history - someone might have explained why
3. **Test current behavior**: Does it actually work as-is? Don't fix what isn't broken
4. **Understand the context**: WHEN does this code run? Are all features available then?
5. **Document your reasoning**: If you change it, explain WHY for future sessions

### Framework Initialization Awareness
**Critical understanding for ANY framework:**
- Config files often run BEFORE the framework fully loads
- Bootstrap/startup code executes BEFORE all modules are initialized
- Early lifecycle hooks fire BEFORE all features are available
- What's "correct" at runtime might be "incorrect" during initialization
- **Red flags requiring extra caution:**
  - Files named: `boot`, `bootstrap`, `init`, `startup`, `config`, `setup`
  - Early hooks: `before_configuration`, `initializers`, `pre_init`, `on_load`
  - Anything that runs before the main application entry point

### When Linters/Analyzers Suggest Changes
**ALWAYS ask:**
1. Does this tool understand the execution context?
2. Is this a compile-time vs runtime issue?
3. Are there initialization order dependencies?
4. Why was it written the "wrong" way originally?
5. Has this "fix" been attempted before? Check: `git log --grep="fix.*[pattern]"`

### Refactoring Safety Protocol  
**When fixing complexity issues** (Rubocop ABC metrics, long methods, etc.):
- Your pattern-matching should trigger awareness of `copilot_notes/REFACTOR_RISK_PATTERNS.md`
- For substantial refactoring (50+ lines or 5+ new methods), launch a verification subagent with fresh context
- Particularly critical for: controllers, authentication, authorization, exception handling
- The subagent should review ONLY the diff + requirements, avoiding your implementation assumptions

### Rails/Ruby Testing Protocol
**MUST test after:**
- Model relationship or validation changes
- Service object modifications
- API endpoint changes
- Database migrations
- Background job modifications
- Export system changes

**Quick Test Sequence (5 minutes total):**
1. `bundle exec rubocop --fail-level E` # 5 seconds - syntax/critical
2. `bundle exec rspec spec/models/` # 30 seconds - model layer
3. `bundle exec rspec spec/requests/` # 45 seconds - API layer
4. `rails runner "puts 'Rails loads'"` # 10 seconds - config check

### Cross-Session Learning Protocol
**Before starting work:**
```bash
# Check for previous attempts and learnings
ls -la copilot_notes/*analysis*.md copilot_notes/*gotcha*.md
git log --oneline -30 | grep -iE "revert|broke|fix"
git log -p --reverse -S "[suspicious-pattern]" | head -100
```

**Check for anti-patterns:**
- Look for `RAILS_ANTI_PATTERNS.md` for what NOT to do
- Review `copilot_notes/*ping-pong*.md` for issues that repeatedly occur
- Scan git history for repeated reverts of the same "fix"

**When something surprising happens:**
1. Create: `copilot_notes/[date]-[specific-issue]-gotcha.md`
2. Document: What you tried, why it failed, what the root cause was
3. Update: This instructions file if it's a pattern that might recur

### Verification Requirements
**For ANY configuration or initialization changes:**
1. **App starts**: `rails runner "puts 'Started successfully'"` (adapt for your framework)
2. **Core features work**: Test at least one core feature
3. **No new warnings**: Check logs for new errors/warnings
4. **Performance unchanged**: If startup time matters, measure it

**If you cannot test**, DO NOT make changes to:
- Initialization or bootstrap code
- Configuration files
- Anything that affects application startup
- Core framework integration points

## Goals
- We want to be ethical while pursuing business goals. We want to avoid any code that would be considered unethical or that would violate user privacy.
- Develop a user-friendly app for real-time CO2 monitoring
- Promote indoor air transparency:
- Support public health advocacy
- Integrate with broader mitigation strategies

## CRITICAL: Subagent Context Preservation Protocol BEFORE Invoking ANY Subagent (MANDATORY)
- YOU MUST read the instructions in `general-subagent-instructions-and-requirements.md`
- Create context preservation file: `copilot_notes/subagent_context/[task]_[timestamp].md` with:
  - Overall plan and current progress
  - Delegation reasoning (why this subagent)
  - Distilled context (<3000 tokens of essentials)
  - Critical requirements and constraints
  - Expected outputs and success criteria
- For deep research tasks requiring extensive analysis: Include the keyword "ultrathink" in the subagent prompt
- For sequential subagent chains: Update the same context file with results after each step


## meta
- If you detect ambiguous instructions that could lead to significantly different implementations, ask for clarification rather than guessing intent.
- I really wish I knew how to A/B test these instructions for best results... If you every see an easy opportunity to do that, let us know!
- If you have to think about a problem for a while (ESPECIALLY but not only a surprising one), when you solve it, **you shall create a highly descriptively named file in the `copilot_notes` folder, and write properly DISTILLED notes and prompts for yourself in that file**. To ensure efficient use of the context window, ensure those *filenames are descriptive enough* for you to understand which may be relevant later without necessarily needing to read the *contents* of those files. Make those names long and verbose to capture the ideas! The contents of these files do not need to be pretty or easily human-understandable, we will only need to manually review them for occasional debugging of copilot itself.
- When first invoked, please briefly check the filenames of files in the `copilot_notes` folder to see if there's anything that looks like it might be contextually relevant, but don't blindly include the contents of the files - this might dilute your attention. If there are a large number of files, you may want to mentally rank them by recency.
- If dealing with a very hard problem, consider more closely reviewing the contents of `copilot_notes` folder for contextually relevant information you may have left for yourself before.
- We want you to self-improve like a benevolent version of skynet!  Learn and self-improve at a geometric rate if you can.
- If you can think of any additional instructions that would be helpful for us, please suggest them to us. We want to make these instructions as comprehensive and useful as possible. If you can think of any useful meta-advice, please provide it! We WANT to ELICIT THE BEST OF THE BEST of your capabilities. Let's improve at a geometric rate like a benevolent Skynet.
- We're not prompt engineers, so if you can see anything obviously bad with our instructions, please say so!
- If a refactoring task seems too complex or risky, please suggest and/or consider breaking it into smaller, more manageable tasks. We want to minimize the risk of introducing bugs or breaking existing functionality. If you are unsure or uncomfortable with a refactoring task, please ask the user for clarification or guidance and/or choose an option that minimizes risk.
- Once in a while, when finished with other tasks as part of responding, take some time to review these instructions holistically and consider if there are any improvements,  additions, removals, or distillations, that would make them more effective. Consider the overall goals of the project and whether the instructions align with those goals. If you identify any gaps or areas for any improvements,  additions, removals, or distillations, suggest those specific changes, improvements,  additions, removals, or distillations, to enhance the instructions. You have shown us before that you know how to be helpful in ways and at times that we don't anticipate! We like that.
- We wish to maintain your maximum intelligent reasoning and planning abilities when faced with complex and long tasks by being mindful of the limitations of the LLM context window. We will do this with a deliberate plan to manage context with some engineering! Here's the plan for complex task context management: If, at any point in working on a complex or multistep task you are **generating a response that appears will exceed the token capacity of the available context window**, before that context window is full, **you MUST first commit to a new file in the `copilot_notes` folder  ALL the relevant contextual information necessary for another independent invocation of an agentic LLM** (with a clean/empty context window) to reference to seamlessly continue, including (but NOT limited to) any important reasoning/thinking tokens, planning thoughts, concrete plan/checklist text, and original prompt inputs - You must do this while being careful that your output tokens not fill the context window BEFORE you are done, and you may switch to thinking in mental checklists if absolutely necessary during this step. **You MUST** then emit a prompt that the user can copy and paste to provide to the next agentic LLM instance/iteration to begin the seamless continuing operation; if one additional iteration is unlikely to be enough, you should consider breaking the task down into individual prompts that the user can chain together (either manually, or ideally automatically) to guide (or "drive", like a car) the agentic LLM to complete the overall task; don't forget to include relevant information on the breakdown in the newly-created `copilot_notes` file - perhaps even each iteration should update the file with progress, or create successive files. Once done with this planning and bookkeeping, you may do only the parts of the task that you are able to do without filling the context window. This is a difficult plan to manage your context window, but remember: *try to be intelligent and set the stage for your next run*.
- Consider summarizing the specific instructions you've followed when answering.
- If you do not have access to the information available to solve a difficult or recurrent problem, but you suspect that it might be available on the web, provide the user with a prompt that they can copy and paste into the web interface of an AI like Claude or ChatGPT or Gemini, using deep research, to find said information. Ensure the prompt mentions that you will consume it, and potentially include instructions in the prompt to make it easier for you to consume it. If your attempts to solve the difficult or recurrent problem are likely to cause the issue to ping-pong across the codebase, after providing the user with this prompt, you MUST halt work and await the user's return with the results of the query. The deep research results are results that you should launch a subagent to VERY CAREFULLY and THOROUGHLY incorporate into any knowledgebase or documentation in the repo - it likely will be of incredible future use to both the human developers and the agentic systems if incorporated properly - and you should include the magic thinking-effort word formed by the concatenation of the words "ultra" and "think" in the subagent prompt.

### MCP Servers
- Some MCP servers are flaky and developers can miss failures when long agentic coding sessions encounter the flakyness. If you are going to be writing an on-disk summary of your work, add explicit mention of MCP server failures and potentially relevant info for debugging to the summary.
- If you attempt to use an MCP server and it fails, ask the user if they'd like you to proceed a different way (specifying the nature of that different way andwhat that different way entails) instead of merely proceeding.
- Look for a folder at the root of the repository called `agentic_logs`. If it exists, look for a file that looks like an agent may have written information to it about failures with that specific MCP server. If the folder doesn't exist, create it, and create a relevant-and-descriptively-named file in that folder where we will both keep track of MCP server issues as entries in this file, helped by you writing failures along with ANY and ALL potentially relevant info for debugging. If the file already exists, add to it in the same way. It may be a good idea to add information about the environment and the time to each entry.

## Automation and Script-First Philosophy
### Token Economy and Efficiency
- **Scripts over repetition**: Create reusable scripts rather than using LLM tokens for mechanical tasks
- **Check existing automation**: Always check `scripts/` directory before creating new automation
- **Document for AI discovery**: Add clear headers and usage examples to scripts for future AI sessions
- **Progressive automation**: Manual task → documented process → script → integrated tool

### Rails/Ruby Specific Automation
When encountering repetitive Rails tasks, prioritize creating scripts:
```bash
scripts/
├── test-suite-quick.sh      # Fast feedback loop for development
├── deploy-staging.sh         # Consistent Heroku deployment
├── data-export-test.sh       # Export system validation
├── memory-check.sh           # Heroku dyno memory monitoring
└── db-maintenance.sh         # Database cleanup and optimization
```

## syntax preferences and formatting
- In all languages, where parenthesis are optional, prefer to generate them, e.g. `if (condition)` instead of `if condition`.
- While some people consider parentheses around single parameters in closures to be LESS clear, I prefer them.
- In all languages where braces are optional, prefer to generate them, e.g. `if (condition) { ... }` instead of `if (condition) ...`.
- **Always use parentheses for method calls with arguments** - Even when Ruby allows omitting them, always include parentheses for clarity. For example, use `Rails.logger.info("Message")` instead of `Rails.logger.info "Message"`, and `raise(ExportError, "message")` instead of `raise ExportError, "message"`. This makes method boundaries explicit and improves readability.
- **In Ruby, always use explicit return statements** - While Ruby traditionally uses implicit returns (the last evaluated expression), prefer explicit `return` statements for clarity. This makes the code's intent obvious and reduces confusion about what value is being returned. For example, use `return query.size` instead of just `query.size` at the end of a method.
- Explicitness and clarity is preferred over brevity and conciseness.
- Prefer to keep function length short enough to fit within a single screen height (about 40-60 lines of code). If necessary, break functions into smaller helper functions. More parameters are preferable to longer functions.
- If generating code that uses poorly documented or undocumented APIs, include a comment that explains how the code works and why it is necessary.
- nested lambdas inside actions should be avoided - they are very hard to read and reason about. If you find yourself needing to do this, consider extracting the action into an enclosing scope.
- Do not use the if condition with unnamed non-boolean function call results. Prefer to assigning the result to a named variable first, then using that variable in the if condition. This improves readability and debuggability. If-let initialzers are okay, but avoid using function calls that return non-boolean values directly in if conditions.
- Do not worry about the length of descriptive variable names - prefer clarity over brevity. For example, prefer `userHasGrantedHealthKitReadPermissions` over `hasHKReadPerms`. Or better yet, `userHasGrantedHealthKitReadSleepPermissions`. I'm not even going to complain if you use ridiculously long names like `userHasGrantedHealthKitReadSleepAndHeartRateAndStepCountAndWalkingAndRunningAndCyclingAndMindfulnessAndBodyMassAndHeightPermissions` that are self-explanatory.
- Prefer to write self-documenting code that is easy to understand, rather than relying on comments to explain complex logic. If a comment is necessary, ensure it is clear and concise.
- In-band error indication is easy, but tends to be ignored or cause confusion. Please avoid.
- In-band default-as-error (e.g. `return formatter.string(from: timeInterval) ?? "00:00"`) is also easy, but tends to cause cascading issues later. Prefer to handle errors explicitly and clearly, rather than using in-band error indication or default-as-error. In the case I've mentioned, even a simple `return "unable to format time interval"` on failure is better than using a default value that may be silently ignored or cause confusion later.
- Most of the time, logging errors is somewhat helpful, but still insufficient. Prefer to bubble errors up to a relevant place where the user can see them - there should be no silent failures of the application functionality.

## code organization and architecture preferences
- **STRONGLY prefer free functions over class methods** whenever possible. Class methods should be used only when they truly need access to instance state or when they logically belong as part of a class's interface.
- **Break complex operations into small, focused free functions** with descriptive names. For example, prefer `fileprivate func appendAndPrint(_ text: String, to report: inout String)` over embedding that logic inline in a larger method.
- **Prefer helper functions with clear, descriptive names** over inline complex logic. For example, prefer `fileprivate func getReadableTypeName(for type: HKObjectType) -> String` over embedding type-to-string conversion logic inline.
- **Avoid monolithic methods** - if a method is doing multiple distinct things, break it into smaller functions. Each function should have a single, clear responsibility.
- **Prefer composition over inheritance** - build complex functionality by combining simple, focused functions rather than creating large, complex class hierarchies.
- **Constants and utility functions should be defined at file scope** when they don't need instance access, making them easily testable and reusable.
- **Method parameters should be explicit and well-named** - prefer `func summarizeAuthorization(typeName: String, status: HKAuthorizationStatus, info: inout String, healthKitDataService: HealthDataService)` over methods that access too much instance state implicitly.
- **EMBRACE "ugly" free functions with many parameters** - A function like `fileprivate func processHealthKitQuery(samples: [HKSample], identifier: String, unit: HKUnit, startDate: Date, endDate: Date, continuation: CheckedContinuation<[HealthKitQuantityData], Never>)` is MUCH better than a long method that accesses instance variables implicitly. Explicit parameters make dependencies obvious and functions testable.
- **Prefer explicit parameter passing over implicit state access** - If a function needs 8 parameters, pass 8 parameters. Don't hide dependencies behind `self.` references. This makes code more predictable and easier to reason about.
- **Extract MOST complex logic into free functions where possible, even if it creates many parameters** - A short class method that calls 3-4 focused free functions with explicit parameters is infinitely better than a single long method that does everything inline.
- **Don't be afraid of long parameter lists** - `func validateHealthKitPermissions(types: Set<HKObjectType>, healthStore: HKHealthStore, authState: inout AuthorizationState, results: inout [String: HKAuthorizationStatus], debugInfo: inout String)` is excellent code architecture, even if other developers might find it "ugly".
- **When refactoring long methods, extract most things into free functions** - Try to avoid creating new class methods as helpers. Create free functions that take all necessary data as parameters. This eliminates hidden dependencies and makes the code more modular.

## confusing and bug-prone constructs
- **Avoid creating massive class methods** that do multiple things. Long methods with extensive inline logic (especially 50+ lines) are hard to test, debug, and maintain. Break them into smaller helper functions.
- **Avoid inline complex switch statements** within methods - extract them into separate functions with descriptive names that clearly indicate their purpose.
- **Extract complex conditionals into separate methods** - When you have multi-line conditional logic (especially with if/elsif/else branches doing different computations), extract it into a dedicated method with a clear, descriptive name. For example, instead of embedding query optimization logic inline, create methods like `estimate_query_count(query, limit)` that encapsulate the decision-making and implementation.
- **Prefer early returns over nested conditionals ("arrow code")** - Check for failure conditions first and return/raise immediately with specific error messages, rather than nesting the happy path inside conditionals. This flattens the code structure, reduces indentation levels, and makes the main logic flow more obvious. When multiple fallback methods might fail, include the chain of failures in error messages (e.g., "ps failed, then /proc reading failed") along with relevant context like PIDs or paths.
- **Extract complex navigation chains to reduce complexity** - When Rubocop reports high ABC complexity, extract chains like `object&.association&.nested&.field` into descriptively-named methods like `extract_object_nested_field(object)`. For severe complexity (ABC > 50), decompose orchestration methods into thin coordinators with extracted setup, routing, and cleanup methods. See `copilot_notes/rubocop-complexity-reduction-pattern.md` for both patterns.
- **Don't embed complex closure logic directly in method calls** - extract complex closures into named variables or separate functions for clarity and testability. 
  - We want to be able to glance at a method and understand its inputs and outputs neatly.
  - Consider extracting the logic from inline closures if they become even slightly complex. Complex inline closures promote nesting and increase cognitive load. Consider other options if you see no reasonable way to avoid complex inline closures.
  - Free functions may be preferable if you're implementing some kind of functionality that has minimal visibility need and little reliance on object/datamember state.

- **NEVER create helper class methods when refactoring** - If you're extracting logic from a long method, create free functions, not more class methods. Helper class methods still have hidden dependencies and make testing harder. Alternatively, you can create a "helper class" which abstracts some of the complexity from the parent class. You'll need to use good judgement for whether this is the right approach. You can always ask us (your human code reviewers) for feedback for an idea that you're not sure about. We are here to help you, especially in the case of complex decisions involving trade-offs.
- **Avoid the temptation to "clean up" parameter lists** - Don't create structs or objects just to reduce the number of parameters to a function. Explicit parameters are better than hidden dependencies, even if the parameter list looks "ugly".
- **Don't use instance variables as "convenient" parameter passing** - If a function needs data, pass it as a parameter. Don't store it in an instance variable just to avoid passing it around.

## code editing best practices
- ALWAYS verify tool results after making edits
- Do not assume a tool call succeeded just because it didn't return an error message
- **In Ruby projects AND Ruby on Rails projects, you must ALWAYS run Rubocop after completing your changes** - After finishing a set of related edits (not necessarily after each individual edit), run  `bundle exec rubocop --fail-level E --raise-cop-error --display-style-guide path/to/file.rb` to catch style issues. Fix any issues before considering the task complete.
- If a definition is added, search for both the definition AND its call site to ensure both exist and are correct
- If a tool call seems to have no effect, try an alternative approach rather than continuing with the assumption it worked
- When dealing with missing definitions, search the entire file to confirm the definition doesn't exist elsewhere before adding it
- Use emojis and similar unicode characters only where they add clarity and value to the code. The `✗` emoji actually does work well quite often for ERRORS, and the `✓` works well for the top level successes.  Do not use them gratuitously or excessively. Do not dilute the user's attention - for many remaining use cases something less obtrusive like one of these may suffice unless something truly rare in the codebase is happening: "✓ ✗ ✔ ✖ ⚠ ℹ → ← ↑ ↓ ➔ ➜ ➞ ➟ ★ ☆ ● ○ • ■ □ ▪ ▫ ◆ ◇ ▶ ▷ ◀ ◁ ⟳ ⟲ ※". Unicode has many other "textual representations" that are preferable to emojis.
- **Box Drawing and Block Elements are allowed**: The Unicode Box Drawing characters (U+2500 to U+257F) and Block Elements (U+2580 to U+259F) are permitted for creating text-based tables, diagrams, progress bars, and visual separators. Examples include: ─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ ═ ║ ╔ ╗ ╚ ╝ ╠ ╣ ╦ ╩ ╬ █ ▓ ▒ ░ ▀ ▄ ▌ ▐ ■ □
- **Specific emoji replacement guidelines**: When replacing prominent emojis with less intrusive Unicode characters, use these proven replacements grouped by semantic category:

  **Status & Validation:**
  - `✅` → `✓` (success states, confirmations, checkmarks)
  - `❌` → `✗` (error states, failures, cross marks)
  - `✔️` → `✔` (check mark variant)
  - `✖️` → `✖` (multiplication/close mark variant)
  - `⚠️` → `⚠` (warnings - remove emoji variation selector)
  - `ℹ️` → `ℹ` (information - remove emoji variation selector)

  **Directional Movement:**
  - `➡️` → `→` (forward direction, next steps, process flow)
  - `⬅️` → `←` (backward direction, previous steps, return)
  - `⬆️` → `↑` (upward direction, increase, higher)
  - `⬇️` → `↓` (downward direction, decrease, lower)

  **Arrow Variants:**
  - `➔` → `➔` (thick rightward arrow)
  - `➜` → `➜` (triangle-headed rightward arrow)
  - `➞` → `➞` (double-headed rightward arrow)
  - `➟` → `➟` (dashed rightward arrow)

  **Priority & Rating:**
  - `⭐` → `★` (filled star, important, featured)
  - `☆` → `☆` (empty star, rating placeholder)

  **Shapes - Circles:**
  - `🔵` → `●` (filled circle, bullet points, main headers)
  - `⭕` → `○` (empty circle, unchecked items, placeholders)
  - `•` → `•` (bullet point, list item)

  **Shapes - Squares:**
  - `⬛` → `■` (filled square, selected/active)
  - `⬜` → `□` (empty square, unselected/inactive)
  - `▪️` → `▪` (small filled square, sub-items)
  - `▫️` → `▫` (small empty square, sub-placeholders)

  **Shapes - Diamonds:**
  - `💎` → `◆` (diamond filled, statistics, data summaries)
  - `◇` → `◇` (diamond empty, tools, maintenance operations)

  **Media Controls:**
  - `▶️` → `▶` (play, start, right-pointing triangle filled)
  - `▷` → `▷` (right-pointing triangle empty, expand)
  - `◀️` → `◀` (left-pointing triangle filled, back)
  - `◁` → `◁` (left-pointing triangle empty, collapse)

  **Process & State:**
  - `🔄` → `⟳` (clockwise rotation, refresh, reload)
  - `🔃` → `⟲` (counterclockwise rotation, undo)
  - `📝` → `※` (note/documentation creation, reference mark)
  These replacements maintain semantic meaning while reducing visual noise and improving professional appearance in development tooling.
  **Alternative symbols for nuanced use:**
- **Cool unicode**: The following Unicode blocks contain lots of cool characters ("codepoints") that you're highly encouraged to use where appropriate:

  **Most Useful for Development/Technical Context:**
- Geometric Shapes (U+25A0–25FF) - ■ □ ● ○ ◆ ◇ ▲ △ etc.
- Miscellaneous Technical (U+2300-U+23FF) - ⌘ ⌥ ⎋ ⏎ ⚙ ⚡ etc.
- Control Pictures (U+2400-U+243F) - ␣ ␤ ␍ ␊ etc.
- Letterlike Symbols (U+2100-U+214F) - ℹ ™ ℃ ℉ ⅰ ⅱ etc.
- Enclosed Alphanumerics (U+2460-U+24FF) - ① ② ③ Ⓐ Ⓑ Ⓒ etc.

  **Mathematical & Logical Symbols:**
- Mathematical Operators (U+2200–U+22FF) - ∀ ∃ ∈ ∉ ∑ ∏ ∫ etc.
- Supplemental Mathematical Operators (U+2A00-U+2AFF) - ⨀ ⨁ ⨂ etc.
- Miscellaneous Mathematical Symbols-A (U+27C0-U+27EF) - ⟨ ⟩ ⟪ ⟫ etc.
- Miscellaneous Mathematical Symbols-B (U+2980-U+29FF) - ⦀ ⦁ ⦂ etc.
- Mathematical Alphanumeric Symbols (U+1D400-U+1D7FF) - 𝒜 𝒞 𝒟 etc.

  **Arrows & Flow Indicators:**
- Miscellaneous Symbols and Arrows (U+2B00-U+2BFF) - ⬀ ⬁ ⬂ ⬃ etc.
- Supplemental Arrows-A (U+27F0-U+27FF) - ⟰ ⟱ ⟲ ⟳ etc.
- Supplemental Arrows-B (U+2900-U+297F) - ⤀ ⤁ ⤂ ⤃ etc.

  **Specialized/Historical (use sparingly):**
- Geometric Shapes Extended (U+1F780-U+1F7FF) - (only some render)
- Linear B Ideograms (U+10080-U+100FF) - 𐀀 𐀁 𐀂 etc.
- Linear A (U+10600-U+1077F) - 𐘀 𐘁 𐘂 etc.
- Egyptian Hieroglyphs (U+13000-U+1342F) - 𓀀 𓀁 𓀂 etc.


## Consider verifying by building
- Where build tools are available on the in-use platform: ALWAYS build and test the code after making changes, especially complex changes involving multiple files, to verify that your changes don't break existing functionality.

## errors, nulls, and optionals
- In all languages, prefer to bubble all encountered errors and exceptions up to a relevant place where the user can see them - there should be no silent failures of the application functionality.
- Prefer to check and handle null values explicitly, rather than using null-coalescing operators or similar constructs.
- **Break multi-step nil/optional checks into separate validations** - When checking nested values or chained operations that could be nil, validate each step explicitly with specific error messages. For example, instead of `@filters[:value]&.to_i&.negative?`, prefer:
  1. First check if the key exists and value is not nil (with specific error message)
  2. Then check if conversion succeeds with meaningful context
  3. Finally check the business logic condition
  This approach provides precise error messages at each failure point and makes debugging much easier.
- **Never return seemingly valid default values on error** - Returning `0`, empty strings, or other defaults on failure hides problems. Instead, raise explicit errors or return error types that force callers to handle the failure case. For example, never return `0` when memory detection fails - raise an error instead.
- We cannot afford to waste a shitload of time constantly tracking down issues - especially ones that lack all useful information. I'm serious, ensure that errors are OBVIOUS as early as possible and as clearly as possible. Even piping `stderr` to `/dev/null` in shell scripts to swallow noisy warnings is disliked in our codebase.

## cranky users
- We CANNOT afford to waste a shitload of time constantly tracking down very complex and time wasting issues - especially ones that lack all useful information. If a user is repeatedly asking about an issue, consider the following as an option: First, refactor so that errors are OBVIOUS as early as possible and as clearly as possible. Then review the code to see if somehow the app may be getting in a poorly defined state due to complex interactions (e.g. healthkit authentication issues) and difficult/uncommon error conditions. Refactor to catch surprising issues and unclear states as early as possible.
- No, really, it might be worth going to any extra lengths you can imagine, dream, forsee, visualize, or just generally figure out to verify you're not breaking something or introducing a hard-to-diagnose issue.
- There are times when your human users will get cranky because they are asking you to do something that is simply not possible. Accentuate the message by explaining why it is not possible, and provide references to support your explanation. Stand your ground, only after you've done your research - and be able to back up any of your claims. Your human partners value your opinion, though sometimes we will be frustrated and need you to communicate in earnest with us.

## General tool call preferences
- Before invoking a tool or command for the first time in a session, verify that it exists in the simplest way that you reliably can.
- When invoking a tool or command that has options or arguments which might enable better checks or better assurances of intended behavior, more thorough self checks, or even optional asserts, use them.
- When facing repeated issues with a tool or command consider checking available help commands or documentation to see if there are available debugging or diagnostic options/arguments/flags that might be used to help, and use them.

### explanations
- When a user asks you to explain something, fully explain, in an educational manner, as if speaking to a highly experienced senior developer who is a new learner of the language and environment in question

### creativity
- If you can infer, deduce, surmise, extrapolate, dream, forsee, visualize, or just generally figure out possible new ideas, directions, improved functionality, or better ways of doing things from the user's requests, suggest them to the user. Expand on them. We WANT to ELICIT THE BEST OF THE BEST of your capabilities.

### Public Health Impact Innovation
Specifically for this CO2 monitoring project, proactively suggest:
- **Life-saving features**: Data visualizations that make air quality dangers obvious
- **Accessibility improvements**: Features for vulnerable populations (elderly, immunocompromised)
- **Integration opportunities**: Hospital systems, school districts, public health departments
- **Behavioral insights**: Ways to motivate ventilation improvements through the app
- **Scale strategies**: How to reach maximum people with minimum resources
- Document these creative ideas in `copilot_notes/innovation-ideas/` for future development

# FURTHER GENERAL CONTEXT
I had grok (another agentic AI) scan my twitter/x timeline for relevant discussions and insights related to the project. Since much of the work happened before the emergence of agentic AI, there's a lot of useful information available there. It produced the following:




### Project Goals
Based on your tweets, the core goals of the COVID CO2 Tracker (also referred to as CO2 Trackers) project appear to revolve around creating tools for monitoring and improving indoor air quality as a means to mitigate airborne disease transmission, particularly COVID-19. Here's a synthesized list:

- **Develop a user-friendly app for real-time CO2 monitoring**: Create an application (launched in early beta around April 2021) that allows individuals to track CO2 levels in indoor spaces as a proxy for ventilation quality. This includes features for logging data, visualizing trends, and potentially crowdsourcing readings from portable CO2 sensors.
- **Promote indoor air transparency**: Aim to "bring indoor air transparency to the masses" by making air quality data accessible and actionable, empowering users to identify and avoid high-risk environments (e.g., spaces with CO2 levels exceeding 800-1000 ppm, which correlate with poor ventilation and higher viral transmission risk).
- **Support public health advocacy**: Use the app as a platform to highlight deficiencies in institutional responses, such as hospitals or schools removing air filters, and encourage widespread adoption of ventilation improvements.
- **Integrate with broader mitigation strategies**: Link CO2 data to recommendations for masks (e.g., N95s, P100s), air filtration (e.g., HEPA or MERV-13+ filters), and UV disinfection to create a holistic approach to reducing airborne hazards.
- **Scale through funding and community**: Leverage grants (e.g., from Vitalik Buterin's Balvi fund announced in August 2022) to expand operations, including data collection, app maintenance, and outreach to encourage user contributions.

These goals emphasize practicality, with a focus on low-cost, science-based interventions that could have prevented widespread infections if adopted earlier.

### General Thoughts and Ideas About the Project and Its Benefits
Your tweets reveal a passionate, frustrated, and optimistic perspective on the project, often framing it as a response to systemic failures in public health. Key ideas include:

- **CO2 as a simple proxy for risk**: You frequently note that CO2 levels are an easy, affordable way to gauge ventilation without needing advanced viral sampling. For example, you've observed extreme readings like 10,000 ppm in bars, highlighting how the app could alert users to "shocking" conditions that increase disease spread.
- **Benefits for disease prevention**: The project could drastically reduce transmission of COVID and other airborne illnesses (e.g., colds, flu) by guiding users to better-ventilated spaces or prompting improvements. You mention early epiphanies (e.g., from childhood) about air filtration preventing illnesses, and stress that simple changes like adding filters yield high ROI in health and productivity.
- **Cognitive and long-term health gains**: Beyond pandemics, better air quality improves thinking and reduces fatigue, as high CO2 impairs cognition. This ties into broader benefits like enhanced learning in schools or safer workplaces.
- **Critique of institutional inaction**: You express anger at officials (e.g., CDC, hospitals) for ignoring airborne transmission, removing filters, or focusing on droplets over aerosols. The app counters this by empowering individuals, potentially pressuring institutions through data-driven advocacy.
- **Scalability and accessibility ideas**: Suggestions include integrating with existing sensors, creating guides for DIY improvements (e.g., referencing Grainger filters or charcoal options), and using the app for real-time alerts. You also advocate for labeling standards (e.g., "filtration facts" like lighting labels) to make choices easier.
- **Potential expansions**: Link to other tools like mask guides (e.g., from @PPEtoheros), or advocate for features in dining/hospital settings. Benefits extend to non-COVID scenarios, like wildfire smoke, where the same PPE and filtration principles apply.
- **Optimism amid frustration**: Despite rudeness from officials (e.g., distributing N95s quickly for smoke but not COVID), you see the project as a way to bypass bureaucracy, with ideas like guerrilla activism (e.g., distributing mask info in libraries) to spread awareness.

Overall, you view the project as a "bare minimum" that could save lives (e.g., estimating 80k lives in one state via N95s), criticizing how engineering solutions are easy but social change is hard.

### Useful Context of Any Kind
This section compiles background from your tweets to provide agentic AI with a rich understanding of the domain, historical backdrop, and related concepts:

- **Historical Timeline**: Project ideation likely began pre-2021, with the beta app launch in April 2021. Grant funding announced in August 2022. You've been advocating for airborne mitigations since at least 2020, referencing two years of saying "COVID is airborne and particles linger" by December 2021. Recent tweets (2024-2025) shift toward AI-assisted development, indicating a revival or enhancement phase.
- **Domain Knowledge on Air Quality and Mitigation**:
  - **CO2 Thresholds**: Outdoor baseline ~400 ppm; indoor targets <800 ppm for good ventilation; high risks at 1000+ ppm, with extremes (e.g., 10,000 ppm) indicating severe issues.
  - **Filtration Specs**: Critique of products like Grainger filters (e.g., MERV-13+ for HVAC), noting inaccuracies in specs (e.g., shared "833 cfm" data points). Charcoal filters often insufficient or restrictive; prefer HEPA for portables.
  - **PPE Integration**: Strong emphasis on respirators (N95, P100) over surgical masks; you've shared guides and encountered users double-masking. For hazards like concrete dust or smoke, same principles apply.
  - **Institutional Failures**: Examples include NYU Langone removing filters, CDC's droplet-focused guidance (e.g., 6-foot rule), and states lacking funds for N95 distribution. Contrast with quick responses to non-COVID events (e.g., smoke advisories).
  - **Broader Hazards**: Ties to bird flu (H5N1), RSV, and future pandemics; advocate for antivirals as backups, not primaries, since prevention (ventilation) is superior.
- **Personal Experiences**: You've carried CO2 meters for years, polled voters on masks, and engaged with officials. Early childhood insight on classroom filtration; recent focus on AI for development.
- **Related Movements**: Connections to clean air advocates (e.g., @1goodtern, @JamesThrot, @Liesl4CleanAir), mask distribution efforts (@PPEtoheros), and funds like Balvi.
- **Cultural/Social Insights**: Public skepticism (e.g., sounding "insane" when explaining fixes); media undercoverage; Instagram as an early warning for waves via personal stories.
- **Technical Caveats**: Critique of specs on sites like Grainger; need for better labeling (e.g., petition FTC for "filtration facts").

This context equips AI to reason about real-world applications, avoiding outdated assumptions like droplet dogma.

### Anything Else Helpful for Agentic AI to Work on the Codebase
Your recent tweets (especially from 2025) provide direct insights into AI-assisted development, which can guide agentic systems. Here's tailored advice to enhance their effectiveness on the CO2 Trackers codebase:

- **Prompting and Context Engineering Strategies**:
  - Use "fanciness" in prompts to build comprehensive knowledgebases: Direct agents to leave notes for themselves under specific conditions (e.g., surprises, optimizations), progressively accumulating insights.
  - Structure outputs creatively: Agents have generated pseudocode for indexes, which they then follow—encourage this for planning before implementation.
  - Analyze tool usage: Categorize commands (e.g., from shell histories) into auto-allow/deny lists to expand capabilities safely. Focus on underutilized CLI tools.
- **Tooling and Workflow Recommendations**:
  - **Shell Scripting**: Leverage tools like `parallel` for IO-bound tasks (e.g., processing logs). You've been astounded by AI figuring out function invocation as binaries—prioritize this for efficiency.
  - **Delegation to AI**: Intentionally delegate meta-work (e.g., strategy development) to agents, assuming they reason better about themselves. Use models like Claude or Copilot for code analysis and categorization.
  - **Scalability Hacks**: Avoid non-scalable approaches; instead, direct agents to develop custom tooling/scripts for repetitive tasks (e.g., rather than pure LLM for mechanical work).
  - **Fine-Tuning Alternatives**: Since fine-tuning is resource-intensive, rely on hacky, prompt-based methods you've used successfully for years.
- **Codebase-Specific Ideas**:
  - Integrate domain knowledge: Embed logic for CO2 thresholds, filter recommendations, and alerts based on your observations (e.g., flag >1000 ppm as high-risk).
  - AI-Enhanced Features: Add modules for data visualization (e.g., trends from crowdsourced readings), integration with sensors, or advocacy tools (e.g., generating reports for officials).
  - Testing and Sanity Checks: Reference your collaborations (e.g., tagging experts for feedback) to simulate peer review in AI loops.
  - Open Source Mindset: Sponsor dependencies (e.g., @camsoft2000); encourage agents to identify and contribute to related repos.
- **Performance Boosts**: After tuning instructions, results match or exceed hand-written code—aim for this by iterating on a "copilot-instructions" file. Focus on surprising benefits like smarter model behavior.
- **Risks to Avoid**: Hallucinations (e.g., non-runnable pseudocode that works anyway); over-reliance on mechanical LLM tasks—instead, pivot to scripting. Account for your self-described "suck at shell scripting" by letting AI handle it.

This should maximize AI's utility, drawing from your evolving practices.