# Rubocop Complexity Reduction Patterns

## Pattern 1: Extract Complex Navigation Chains

### Problem
Methods with ABC (Assignment Branch Condition) complexity violations often contain:
- Long case/switch statements with complex navigation chains
- Multiple safe navigation operators chained together (e.g., `measurement.sub_location&.place&.google_place_id`)
- Repetitive patterns of `sanitize_for_export(complex&.navigation&.chain)`

### Solution
When Rubocop reports high ABC/Cyclomatic/Perceived complexity:

1. **Extract complex navigation chains** into small, descriptively-named methods:
   - `sanitize_for_export(measurement.device&.model&.name)` 
   - becomes: `sanitize_measurement_device_model_name_for_export(measurement)`

2. **Name methods to describe the full relationship path**:
   - Include what's being extracted and from where
   - Use long, explicit names that self-document the navigation

3. **Each extracted method should be tiny** (1-3 lines):
   ```ruby
   def extract_measurement_latitude(measurement)
     return measurement.sub_location&.place&.place_lat
   end
   ```

### Results
This pattern reliably reduces complexity scores by 30-100%:
- json_service.rb: ABC reduced from 48.64 to passing (under 35)
- streaming_csv_service.rb: ABC reduced from 45.5 to passing
- Eliminates Cyclomatic and PerceivedComplexity violations as a side effect

## Pattern 2: Decompose Complex Orchestration Methods

### Problem
Large controller actions or service methods that orchestrate multiple operations:
- Setup/initialization logic mixed with business logic
- Multiple conditional branches for different execution paths
- Complex error handling and cleanup in ensure blocks
- ABC scores of 50+ that resist simple extraction

### Solution
Decompose the method into a thin orchestrator with extracted helper methods:

1. **Extract setup/initialization**: Move header setup, configuration into `setup_*` methods
2. **Extract branching logic**: Create a routing method that delegates to format/type-specific handlers
3. **Extract each branch**: Give each conditional path its own method
4. **Decompose error handling**: Create specific handlers for different error types
5. **Break apart ensure blocks**: Split cleanup into tiny, focused methods

### Example Transformation
Before (ABC: 75.22):
```ruby
def stream_export(format, fields, filters)
  # 70+ lines of mixed setup, branching, error handling, cleanup
  response.headers['Content-Type'] = content_type_for(format)
  # ... lots of logic ...
  if format == 'jsonl'
    # jsonl logic
  elsif format == 'multi_csv'  
    # multi_csv logic
  else
    # csv logic
  end
  # ... complex ensure block ...
end
```

After (ABC: passing):
```ruby
def stream_export(format, fields, filters)
  setup_export_response_headers(format)
  @export_token.record_usage!
  
  exporter = nil
  record_count = 0
  
  begin
    exporter = exporter_for(format).new(filters)
    exporter.validate_safety! if exporter.respond_to?(:validate_safety!)
    response.stream.write ''
    
    record_count = stream_format_specific_export(format, exporter, filters, fields)
    cache_export_metadata(format, fields, filters, record_count)
    
  rescue IOError, Errno::EPIPE => e
    handle_client_disconnect_during_export(e)
  rescue StandardError => e
    handle_export_error_with_logging(e)
    raise
  ensure
    cleanup_export_resources(response, exporter, record_count)
  end
end
```

### Key Principles
- **Main method becomes a thin orchestrator** - just coordinates the flow
- **Each extracted method has ONE responsibility** 
- **Error handlers are specific** - not generic catch-alls
- **Cleanup is decomposed** - even 3-line ensure blocks get extracted if complex

### Results
- stream_export: ABC reduced from 75.22 → 59.64 → passing
- Improves testability - each piece can be tested in isolation
- Makes flow obvious at a glance

## When to Apply These Patterns

Use Pattern 1 (navigation extraction) when:
- Method has many safe navigation chains
- Building data structures from complex object graphs
- Case statements with repetitive navigation patterns

Use Pattern 2 (orchestration decomposition) when:
- Controller actions or service methods over 30 lines
- Mixed concerns (setup, business logic, cleanup) in one method
- Complex conditional flows with different execution paths
- ABC scores > 50 that don't respond to simple extraction

Note: These patterns can be combined - often Pattern 2 creates opportunities for Pattern 1.