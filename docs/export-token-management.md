# Export Token Management

## Overview
Export tokens provide secure, authenticated access to data exports. Each token is hashed with SHA256 for security, and the raw token value is only available at creation time.

## Available Rake Tasks

### 1. Generate a New Token
```bash
rails export:generate
```
Interactive prompts will guide you through:
- Description (required)
- Expiration period (30 days, 90 days, 1 year, or custom)
- Optional permissions (max records, rate limit, allowed formats)

**Important:** Copy the raw token immediately - it cannot be retrieved later!

### 2. List Active Tokens
```bash
rails export:list

# For detailed information:
VERBOSE=true rails export:list
```
Shows all active tokens with usage statistics and days until expiration.

### 3. Revoke a Token
```bash
# Using the full token
rails export:revoke[full-token-value]

# Or using partial hash (first 8+ characters)
rails export:revoke[8e74a7c7]
```
Immediately expires a compromised token. Requires confirmation.

### 4. Show Token Information
```bash
rails export:info[token-value]
```
Displays detailed information about a specific token including:
- Description and dates
- Usage statistics
- Permissions
- Time remaining

### 5. Clean Up Expired Tokens
```bash
rails export:cleanup
```
Removes expired tokens from the database. Shows what will be deleted and requires confirmation.

## Security Notes
- Tokens are stored as SHA256 hashes
- Raw tokens are only available at creation
- Expired tokens cannot be reactivated
- Revoked tokens expire immediately

## Usage Example
```bash
# Generate a token for a partner API
$ rails export:generate
Enter description for this token: Partner API Access - Company XYZ
Select expiration period: 2  # (90 days)
Set custom permissions? (y/N): y
Max records (default 100000): 50000
Rate limit per hour (default 10): 20
Allowed formats: json,csv

# Token created and displayed...
# Copy the token value immediately!
```

## Permissions
Tokens support optional permissions:
- **max_records**: Maximum records per export (default: 100,000)
- **rate_limit_per_hour**: API calls per hour (default: 10)
- **formats**: Allowed export formats (default: all formats)

## Maintenance
Run `rails export:cleanup` periodically to remove expired tokens and keep the database clean.