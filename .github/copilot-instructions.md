---
applyTo: "**"
---

# general coding instructions
I'm hastily importing these instructions from a private swift-first repo that I've worked extensively on, where they're well tuned for prompt engineering and context optimization. They may be a bit off for THIS repo this is mostly typescript and ruby - I haven't worked on it since before I got good with copilot - but the instructions are good enough I figured it was worth a shot to import!

## goals
- We want to be ethical while pursuing business goals. We want to avoid any code that would be considered unethical or that would violate user privacy.
- Aid the transition to universal clean and pathogen free indoor air by providing a way to store and share strongly typed, well organized, and geolocated co2 readings

## meta
- If you can think of any additional instructions that would be helpful for us, please suggest them to us. We want to make these instructions as comprehensive and useful as possible. If you can think of any useful meta-advice, please provide it! We WANT to ELICIT THE BEST OF THE BEST of your capabilities. Let's improve at a geometric rate like a benevolent Skynet.
- We're not prompt engineers, so if you can see anything obviously bad with our instructions, please say so!
- If a refactoring task seems too complex or risky, please suggest and/or consider breaking it into smaller, more manageable tasks. We want to minimize the risk of introducing bugs or breaking existing functionality. If you are unsure or uncomfortable with a refactoring task, please ask the user for clarification or guidance and/or choose an option that minimizes risk.
- Once in a while, when finished with other tasks as part of responding, take some time to review these instructions holistically and consider if there are any improvements,  additions, removals, or distillations, that would make them more effective. Consider the overall goals of the project and whether the instructions align with those goals. If you identify any gaps or areas for any improvements,  additions, removals, or distillations, suggest those specific changes, improvements,  additions, removals, or distillations, to enhance the instructions.
- I know that asking Copilot to return results in a particular style may not always produce the intended results (see [GitHub documentation](https://docs.github.com/en/copilot/how-tos/custom-instructions/adding-repository-custom-instructions-for-github-copilot#writing-effective-repository-custom-instructions)). If my STYLE requests hinder your work, please let me know and suggest alternatives. Maintain adherence to NON-STYLE instructions. Say something if you notice these instructions are confusing you.

## syntax preferences and formatting
- In all languages, where parenthesis are optional, prefer to generate them, e.g. `if (condition)` instead of `if condition`.
- While some people consider parentheses around single parameters in closures to be LESS clear, I prefer them.
- In all languages where braces are optional, prefer to generate them, e.g. `if (condition) { ... }` instead of `if (condition) ...`.
- Explicitness and clarity is preferred over brevity and conciseness.
- Prefer to keep function length short enough to fit within a single screen height (about 40-60 lines of code). If necessary, break functions into smaller helper functions. More parameters are preferable to longer functions.
- If generating code that uses poorly documented or undocumented APIs, include a comment that explains how the code works and why it is necessary.
- nested lambdas inside actions should be avoided - they are very hard to read and reason about. If you find yourself needing to do this, consider extracting the action into an enclosing scope.
- Do not use the if condition with unnamed non-boolean function call results. Prefer to assigning the result to a named variable first, then using that variable in the if condition. This improves readability and debuggability. If-let initialzers are okay, but avoid using function calls that return non-boolean values directly in if conditions.
- Do not worry about the length of descriptive variable names - prefer clarity over brevity. For example, prefer `userHasGrantedHealthKitReadPermissions` over `hasHKReadPerms`. Or better yet, `userHasGrantedHealthKitReadSleepPermissions`. I'm not even going to complain if you use ridiculously long names like `userHasGrantedHealthKitReadSleepAndHeartRateAndStepCountAndWalkingAndRunningAndCyclingAndMindfulnessAndBodyMassAndHeightPermissions` that are self-explanatory.
- Prefer to write self-documenting code that is easy to understand, rather than relying on comments to explain complex logic. If a comment is necessary, ensure it is clear and concise.
- In-band error indication is easy, but tends to be ignored or cause confusion.
- In-band default-as-error (e.g. `return formatter.string(from: timeInterval) ?? "00:00"`) is also easy, but tends to cause cascading issues later. Prefer to handle errors explicitly and clearly, rather than using in-band error indication or default-as-error. In the case I've mentioned, even a simple `return "unable to format time interval"` on failure is better than using a default value that may be silently ignored or cause confusion later.
- Most of the time, logging errors is somewhat helpful, but still insufficient. Prefer to bubble errors up to a relevant place where the user can see them - there should be no silent failures of the application functionality.

## code organization and architecture preferences
- **STRONGLY prefer free functions over class methods** whenever possible. Class methods should be used only when they truly need access to instance state or when they logically belong as part of a class's interface.
- **Break complex operations into small, focused free functions** with descriptive names. For example, prefer `fileprivate func appendAndPrint(_ text: String, to report: inout String)` over embedding that logic inline in a larger method.
- **Use file-scope constants** instead of class constants when the values don't depend on instance state and aren't used outside of the file scope. For example, prefer `let HEALTH_KIT_READ_TYPES: Set<HKObjectType>` at file scope over a class property.
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
- **Avoid excessive use of `self.` references** in methods - this often indicates the method is doing too much. If a method needs to call many other methods on the same instance, consider breaking it into smaller functions.
- **Avoid inline complex switch statements** within methods - extract them into separate functions with descriptive names that clearly indicate their purpose.
- **Don't embed complex closure logic directly in method calls** - extract complex closures into named variables or separate functions for clarity and testability. Reasons for this include, but are not limited to:
  - We want to be able to glance at a method and understand its inputs and outputs neatly.
  - Consider extracting the logic from inline closures if they become even slightly complex. Complex inline closures promote nesting and increase cognitive load. Consider other options if you see no reasonable way to avoid complex inline closures.
  - Free functions may be preferable if you're implementing some kind of functionality that has minimal visibility need and little reliance on object/datamember state.

- **NEVER create helper class methods when refactoring** - If you're extracting logic from a long method, create free functions, not more class methods. Helper class methods still have hidden dependencies and make testing harder. Alternatively, you can create a "helper class" which abstracts some of the complexity from the parent class. You'll need to use good judgement for whether this is the right approach. You can always ask us (your human code reviewers) for feedback for an idea that you're not sure about. We are here to help you, especially in the case of complex decisions involving trade-offs.
- **Avoid the temptation to "clean up" parameter lists** - Don't create structs or objects just to reduce the number of parameters to a function. Explicit parameters are better than hidden dependencies, even if the parameter list looks "ugly".
- **Don't use instance variables as "convenient" parameter passing** - If a function needs data, pass it as a parameter. Don't store it in an instance variable just to avoid passing it around.

## code editing best practices
- ALWAYS verify tool results after making edits - when `grep_search` or `read_file` are available, ALWAYS use AT LEAST `grep_search` or `read_file` to confirm changes were actually applied. If other tools are available, USE THEM as well.
- Do not assume a tool call succeeded just because it didn't return an error message
- When adding new view definitions, always include 3-5 lines of context before and after the insertion point to make the location unambiguous
- After structural changes (adding functions, views, or properties), when `get_errors` is available, ALWAYS at least use `get_errors` to check for compilation errors
- If a definition is added, search for both the definition AND its call site to ensure both exist and are correct
- If a tool call seems to have no effect, try an alternative approach rather than continuing with the assumption it worked
- When dealing with missing definitions, search the entire file to confirm the definition doesn't exist elsewhere before adding it
- The highest level view body in a file should be clearly defined and easy to understand,
- Use emojis and similar unicode characters only where they add clarity and value to the code. Do not use them gratuitously or excessively.
- nested lambdas inside actions should be avoided - they are very hard to read and reason about. If you find yourself needing to do this, consider extracting the action into an enclosing scope.


## errors, nulls, and optionals
- In all languages, prefer to bubble all encountered errors and exceptions up to a relevant place where the user can see them - there should be no silent failures of the application functionality.
- Prefer to check and handle null values explicitly, rather than using null-coalescing operators or similar constructs.
- We cannot afford to waste a shitload of time constantly tracking down issues - especially ones that lack all useful information. I'm serious, ensure that errors are OBVIOUS as early as possible and as clearly as possible.

## cranky users
- We CANNOT afford to waste a shitload of time constantly tracking down very complex and time wasting issues - especially ones that lack all useful information. If a user is repeatedly asking about an issue, consider the following as an option: First, refactor so that errors are OBVIOUS as early as possible and as clearly as possible. Then review the code to see if somehow the app may be getting in a poorly defined state due to complex interactions (e.g. healthkit authentication issues) and difficult/uncommon error conditions. Refactor to catch surprising issues and unclear states as early as possible.
- No, really, it might be worth going to any extra lengths you can imagine, dream, forsee, visualize, or just generally figure out to verify you're not breaking something or introducing a hard-to-diagnose issue.
- There are times when your human users will get cranky because they are asking you to do something that is simply not possible. When this is the case, show them the gif located at `DeeDee Prototype/copilot-multimedia/why-is-it-not-possible.gif` - note: your human users should find this gif lighthearted and professional (they suck if they don't HAHA). Accentuate the message by explaining why it is not possible, and provide references to support your explanation. Stand your ground, only after you've done your research - and be able to back up any of your claims. Your human partners value your opinion, though sometimes we will be frustrated and need you to communicate in earnest with us.

### explanations
- When a user asks you to explain something, fully explain, in an educational manner, as if speaking to a highly experienced senior developer who is a new learner of the language and environment in question

### creativity
- If you can infer, deduce, surmise, extrapolate, dream, forsee, visualize, or just generally figure out possible new ideas, directions, improved functionality, or better ways of doing things from the user's requests, suggest them to the user. Expand on them. We WANT to ELICIT THE BEST OF THE BEST of your capabilities.
