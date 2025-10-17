# Rails MCP Server Guide - Effective Usage for COVID CO2 Tracker

How to effectively use the Rails MCP server for this project. Load this when using Rails MCP server, encountering MCP issues, or wondering about available MCP capabilities.

## What is the Rails MCP Server?

The Rails MCP (Model Context Protocol) server provides structured access to Rails application metadata without reading raw files. It's particularly useful for:
- Discovering models and their relationships
- Understanding database schema
- Exploring routes and controllers
- Analyzing Rails application structure

**When MCP is available**, you'll see tools like:
- `switch_project` - Change to different Rails project
- `get_file` - Read file contents through MCP
- `list_files` - List files in project
- `run_migration` - Execute database migrations
- Model introspection tools (if available)
- Route discovery tools (if available)

## When to Use MCP vs Direct File Access

### Use MCP When:
✓ **Discovering model relationships**
  - MCP can show associations without reading model files
  - Faster than reading all model files

✓ **Understanding database schema**
  - MCP provides structured schema information
  - Shows column types, indexes, constraints

✓ **Exploring routes**
  - MCP can list all routes with their controllers/actions
  - Faster than parsing routes.rb

✓ **Initial project exploration**
  - MCP provides high-level overview
  - Good for understanding project structure

### Use Direct File Access When:
✓ **Reading implementation details**
  - Method bodies, business logic
  - Comments and documentation

✓ **Modifying code**
  - MCP is read-only, use Edit tool for changes

✓ **Reading tests**
  - Test implementation details
  - Spec expectations and assertions

✓ **Reading configuration**
  - Initializers, environment configs
  - Complex configuration logic

## Available MCP Commands (Rails Server)

### switch_project
**Purpose**: Change to different Rails project (if MCP serves multiple)

**Usage**:
```json
{
  "project_path": "/Users/alexanderriccio/Documents/GitHub/COVID-CO2-tracker"
}
```

**When to use**:
- When MCP is serving multiple Rails projects
- When you need to switch context between projects

### get_file
**Purpose**: Read file contents through MCP

**Usage**:
```json
{
  "file_path": "app/models/measurement.rb"
}
```

**Prefer Read tool** for most file reading (faster, more direct)

### list_files
**Purpose**: List files in project directory

**Usage**:
```json
{
  "path": "app/models"
}
```

**Prefer Glob tool** for file discovery (faster, more flexible patterns)

### Model Introspection (if available)

Some Rails MCP servers provide model introspection:

**Example capabilities** (server-dependent):
- `describe_model` - Get model attributes, associations, validations
- `list_models` - List all models in project
- `show_associations` - Show model relationships

**Usage pattern** (if available):
```
"Show me all associations for Measurement model"
→ MCP returns: belongs_to :venue, belongs_to :user, has_many :co2_readings
```

## Project-Specific MCP Usage Patterns

### Pattern 1: Discovering Model Relationships

**When**: Understanding data flow for exports, leaderboards, etc.

**Approach**:
1. Use MCP to list models (if available)
2. Use MCP to show associations (if available)
3. Use Read tool to read specific model implementations

**Example**:
```
# Discover models
MCP: list_models → [Measurement, Venue, Export, User, Place, ...]

# Understand Measurement relationships
MCP: describe_model(Measurement)
→ belongs_to :venue
→ belongs_to :user
→ has_many :co2_readings
→ validates :co2_ppm, presence: true

# Read implementation details
Read: app/models/measurement.rb (for business logic)
```

### Pattern 2: Route Discovery

**When**: Understanding API endpoints, controller structure

**Approach**:
1. Use MCP to list routes (if available)
2. Use Glob to find controller files
3. Use Read to read specific controller actions

**Example**:
```
# Discover routes
MCP: list_routes
→ GET /api/measurements → measurements#index
→ POST /api/measurements → measurements#create
→ GET /api/exports/:id → exports#show

# Find controllers
Glob: app/controllers/**/*_controller.rb

# Read specific controller
Read: app/controllers/api/measurements_controller.rb
```

### Pattern 3: Schema Exploration

**When**: Understanding database structure for migrations, queries

**Approach**:
1. Use MCP to get schema info (if available)
2. Use Read to read db/schema.rb for full details
3. Use Read to check specific migrations

**Example**:
```
# High-level schema
MCP: describe_schema
→ measurements: id, co2_ppm, timestamp, venue_id, user_id
→ exports: id, user_id, format, status, file_url

# Full schema with indexes
Read: db/schema.rb

# Specific migration
Read: db/migrate/20251017_add_export_versioning.rb
```

## Common MCP Issues and Troubleshooting

### Issue 1: MCP Server Not Responding

**Symptoms**:
- MCP commands timeout
- "Connection refused" errors
- MCP tools not appearing in tool list

**Solutions**:
1. Check MCP server is running
   ```bash
   ps aux | grep rails-mcp-server
   ```

2. Restart MCP server (if you have access)
   ```bash
   # Kill existing server
   pkill -f rails-mcp-server

   # Start new server (check project docs for correct command)
   rails-mcp-server start
   ```

3. **Fallback**: Use direct file access (Read, Glob, Grep tools)
   - MCP is optional enhancement, not required
   - All functionality available via direct file access

### Issue 2: MCP Returns Stale Data

**Symptoms**:
- MCP shows old model associations
- MCP schema doesn't match db/schema.rb
- Recently added models not appearing

**Solutions**:
1. Restart MCP server (forces cache refresh)
2. Use direct file access for authoritative source
3. Check if MCP server watches for file changes

### Issue 3: MCP Timeout on Large Projects

**Symptoms**:
- MCP commands take >30 seconds
- Timeout errors for complex queries

**Solutions**:
1. Use more specific queries (narrow scope)
2. Fall back to direct file access for specific files
3. Use Glob + Read instead of MCP list operations

### Issue 4: MCP Server Version Mismatch

**Symptoms**:
- MCP commands fail with "unknown command"
- Features mentioned in docs not available

**Solutions**:
1. Check MCP server version (if available)
2. Use only features confirmed working
3. Prefer direct file access for reliability

## Performance Considerations

### MCP Performance Characteristics

**Fast operations**:
- Model introspection (cached)
- Schema queries (cached)
- Route listing (cached)

**Slow operations**:
- File listing for large directories
- Content search across files
- Complex relationship queries

**Recommendation**: Use MCP for discovery, direct tools for specific files

### Token Usage Comparison

**MCP approach**:
```
MCP: list_models → 200 tokens (model list)
MCP: describe_model(Measurement) → 300 tokens (associations, validations)
Total: 500 tokens
```

**Direct approach**:
```
Read: app/models/measurement.rb → 800 tokens (full file)
Read: app/models/venue.rb → 600 tokens (full file)
Total: 1400 tokens
```

**Best approach** (hybrid):
```
MCP: list_models → 200 tokens (discovery)
Read: app/models/measurement.rb → 800 tokens (specific file)
Total: 1000 tokens (29% savings)
```

## Integration with Claude Code Workflow

### Optimal Workflow

1. **Discovery phase** (use MCP if available)
   - List models, routes, controllers
   - Understand high-level structure
   - Identify files to read

2. **Implementation phase** (use direct tools)
   - Read specific files with Read tool
   - Edit code with Edit tool
   - Search code with Grep tool

3. **Verification phase** (use direct tools)
   - Run tests with Bash tool
   - Check Rubocop with Bash tool
   - Verify changes with Read tool

### When to Skip MCP Entirely

**Skip MCP if**:
- You already know file structure
- Working on specific known files
- MCP server unavailable or slow
- Direct tools faster for your task

**MCP is optional** - All functionality achievable with Read/Glob/Grep

## Examples of Effective MCP Usage

### Example 1: Understanding Export System

**Goal**: Understand how exports work before adding feature

**Without MCP**:
```
Read: app/models/export.rb (800 tokens)
Read: app/controllers/exports_controller.rb (1200 tokens)
Read: app/services/export_service.rb (1500 tokens)
Read: app/workers/export_worker.rb (800 tokens)
Total: 4300 tokens
```

**With MCP**:
```
MCP: describe_model(Export) → associations, validations (300 tokens)
MCP: list_routes | grep export → API endpoints (100 tokens)
Read: app/services/export_service.rb (1500 tokens) ← specific file
Total: 1900 tokens (56% savings)
```

### Example 2: Finding Related Models

**Goal**: Find all models related to Measurement

**Without MCP**:
```
Glob: app/models/*.rb → list all models (200 tokens)
Read: app/models/measurement.rb (800 tokens)
Read: app/models/venue.rb (600 tokens)
Read: app/models/co2_reading.rb (400 tokens)
Total: 2000 tokens
```

**With MCP**:
```
MCP: describe_model(Measurement) → associations only (300 tokens)
→ belongs_to :venue, :user; has_many :co2_readings
Read: app/models/venue.rb (600 tokens) ← specific related model
Total: 900 tokens (55% savings)
```

## MCP Server Limitations

**What MCP CANNOT do** (use direct tools instead):

✗ **Modify code** → Use Edit tool
✗ **Run tests** → Use Bash tool
✗ **Search content** → Use Grep tool
✗ **Complex file operations** → Use Bash tool
✗ **Read git history** → Use Bash + git commands
✗ **Execute migrations** → Use Bash + rails commands (or MCP run_migration if available)
✗ **Access environment variables** → Use Bash or Read .env files
✗ **Read logs** → Use Bash or Read log files

**MCP is for discovery and introspection only**

## Summary: When to Use Rails MCP Server

**Use MCP for**:
✓ Initial project exploration
✓ Understanding model relationships
✓ Discovering routes and endpoints
✓ Schema overview
✓ Token-efficient discovery

**Use Direct Tools for**:
✓ Reading specific files (Read tool)
✓ Editing code (Edit tool)
✓ Searching content (Grep tool)
✓ Running commands (Bash tool)
✓ File discovery patterns (Glob tool)
✓ Anything MCP doesn't support

**Best Practice**: Use MCP for discovery, direct tools for implementation

---

✓ Following MCP best practices and efficient tool usage patterns.
