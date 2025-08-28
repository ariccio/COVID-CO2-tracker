# Rails MCP Server Usage Guide

## Configuration Complete ✅
The rails-mcp-server is now configured for your COVID CO2 Tracker and DeeDee Prototype projects.

## Configuration Files
- **Projects Config**: `~/.config/rails-mcp/projects.yml`
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`

## Configured Projects
1. **covid-co2-tracker**: `~/Documents/GitHub/COVID-CO2-tracker`
2. **deedee-prototype**: `~/Documents/GitHub/DeeDee-Prototype`

## What the MCP Server Provides
The rails-mcp-server gives Claude Code enhanced Rails capabilities:

### 1. File Browsing
- Navigate project structure
- Read files without full path specification
- Quick access to models, controllers, views

### 2. Route Inspection
```ruby
# Access all routes programmatically
# View route constraints and parameters
# Understand API endpoints
```

### 3. Model Analysis
```ruby
# Inspect model attributes
# View associations
# Check validations
# Review scopes
```

### 4. Database Schema
- View current schema
- Check migrations
- Understand relationships

### 5. Environment Configuration
- Review Rails settings
- Check gem dependencies
- Access credentials safely

## Usage in Claude Desktop
After restarting Claude Desktop, the MCP server will automatically be available. You can then:
1. Ask about specific models: "Show me the Measurement model"
2. Request route information: "What API endpoints exist?"
3. Browse files: "Show controllers in this project"
4. Check configuration: "What's the database configuration?"

## Troubleshooting

### If you see gem version conflicts:
The server runs outside of your project's bundle context, so version conflicts may occur when running from within a project directory.

### If Claude Desktop doesn't show MCP features:
1. Restart Claude Desktop after configuration
2. Check the config exists: `cat ~/Library/Application Support/Claude/claude_desktop_config.json | jq .mcpServers.railsMcpServer`
3. Verify projects.yml is correct: `cat ~/.config/rails-mcp/projects.yml`

## Adding More Projects
Edit `~/.config/rails-mcp/projects.yml`:
```yaml
new-project: "~/path/to/new/rails/project"
```

## Manual Server Testing
You can test the server manually (though this isn't necessary for Claude Desktop):
```bash
# From outside project directories to avoid bundle conflicts
cd ~
rails-mcp-server --mode stdio
```

## Benefits for COVID CO2 Tracker Development
- Quickly inspect models like Measurement, Place, Device, User
- Review API endpoints for mobile app integration
- Check ActiveAdmin configurations
- Navigate complex controller logic
- Understand service objects structure

## ⚠️ CRITICAL: Activation Requirements
**The MCP server will NOT be available until you:**
1. Complete configuration (✅ Already done)
2. **RESTART Claude Desktop** (Required after configuration)
3. The server runs automatically in STDIO mode when Claude starts

## MCP Tools Available

The rails-mcp-server provides the following tools that AI assistants can use:

### 1. `switch_project`
**Purpose**: Change the active Rails project  
**Parameters**: `project_name` (required, string - must match exactly as defined in projects.yml)  
**Available Projects**: 
- `covid-co2-tracker` - COVID CO2 Tracker
- `deedee-prototype` - DeeDee Prototype
**Example Usage**: "Can you switch to the 'covid-co2-tracker' project?"

### 2. `project_info`
**Purpose**: Retrieve comprehensive information about the current Rails project  
**Parameters**: None  
**Example Usage**: "Tell me about this Rails application. What version is it running?"  
**Returns**: Rails version, Ruby version, database adapter, gem dependencies, and more

### 3. `list_files`
**Purpose**: List files in the Rails project  
**Parameters**:
- `directory` (optional, string) - specific directory to list
- `pattern` (optional, string with glob syntax) - filter files

**Example Usage**: 
- "Can you list all the model files in this project?"
- "Show me all controllers"
- "List files in app/services"

### 4. `get_file`
**Purpose**: Retrieve complete content of a specific file  
**Parameters**: `path` (required, string)  
**Example Usage**: "Can you show me the content of the Measurement model?"

### 5. `get_routes`
**Purpose**: Retrieve all HTTP routes in the Rails application  
**Parameters**: None  
**Example Usage**: "Can you show me all the API routes?" or "What endpoints does this app expose?"

### 6. `analyze_models`
**Purpose**: Get detailed information about Active Record models  
**Parameters**: `model_name` (optional, string)  
**Example Usage**: 
- "I'd like to understand the User model in detail"
- "Show me all models and their associations"
- "What attributes does the Measurement model have?"

**Returns**: Attributes, associations, validations, scopes, callbacks, and custom methods

### 7. `get_schema`
**Purpose**: Retrieve database schema information  
**Parameters**: `table_name` (optional, string)  
**Example Usage**: 
- "Can you show me the complete database schema?"
- "What's the schema for the measurements table?"

### 8. `analyze_controller_views`
**Purpose**: Analyze relationships between controllers, actions, and views  
**Parameters**: `controller_name` (optional, string)  
**Example Usage**: 
- "Can you analyze the MeasurementsController and its views?"
- "Show me all controllers and their actions"

### 9. `analyze_environment_config`
**Purpose**: Analyze environment configurations  
**Parameters**: None  
**Example Usage**: "Can you check for any security issues in the configurations?"  
**Returns**: Database config, cache settings, mail settings, and other Rails configurations

### 10. `load_guide`
**Purpose**: Load official documentation guides  
**Parameters**: 
- `guides` (required, string) - Documentation library to use:
  - `'rails'` - Rails framework guides
  - `'turbo'` - Turbo documentation
  - `'stimulus'` - Stimulus documentation
  - `'kamal'` - Kamal deployment tool docs
  - `'custom'` - Custom guides
- `guide` (optional, string) - Specific guide name; if omitted, returns list of available guides

**Example Usage**: 
- "Can you load the Rails getting started guide?"
- "Show me the available Turbo guides"
- "Load the Active Record associations guide from Rails"

## COVID CO2 Tracker Specific Examples

### Exploring Models
```
"Analyze the Measurement model to understand CO2 data structure"
"Show me how Place and Measurement models are related"
"What validations exist on the Device model?"
```

### API Inspection
```
"Show me all API endpoints for measurements"
"What routes are available for the mobile app?"
"List all admin routes"
```

### Code Navigation
```
"Show me the AlertService implementation"
"List all files in app/services"
"Get the content of the measurements controller"
```

### Schema Understanding
```
"What's the database schema for places?"
"Show me all tables related to users"
"What indexes exist on the measurements table?"
```

## Testing After Claude Desktop Restart

### How to Verify MCP Server is Active
After restarting Claude Desktop, test with these commands:
1. "Switch to the covid-co2-tracker project" (sets active project)
2. "Show me the project info" (confirms Rails version, gems, etc.)
3. "List the models in this project" (shows all Active Record models)

### If MCP Tools Don't Work
- The server may not be active yet - ensure Claude Desktop was fully restarted
- Check that projects.yml exists at `~/.config/rails-mcp/projects.yml`
- Verify the railsMcpServer entry exists in Claude Desktop config
- The project name must match exactly (case-sensitive)

## Next Steps
1. **RESTART Claude Desktop** to activate the MCP server (required!)
2. Test by switching to a project first
3. Then explore models, routes, and code
4. Use natural language to interact with your Rails app

---
*Created: 2025-08-28*
*MCP Server Version: 1.1.1*
*Updated with MCP tool documentation: 2025-08-28*