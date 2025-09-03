# Security Test Suite

## Overview
This directory contains comprehensive security tests for the COVID CO2 Tracker export system. The tests verify that all security measures are working correctly and help prevent regression of security fixes.

## Security Areas Covered

### 1. Token Security
- Token hashing with SHA256
- Constant-time comparison to prevent timing attacks
- Cryptographically secure token generation
- Prevention of token extraction through error messages

### 2. SQL Injection Prevention
- Classic SQL injection attempts (DROP TABLE, UNION SELECT, etc.)
- Second-order SQL injection
- Time-based blind SQL injection
- Boolean-based blind SQL injection
- ORM-specific injection prevention
- Mass assignment protection

### 3. Rate Limiting
- Per-hour rate limit enforcement
- Prevention of bypass attempts through:
  - Token casing variations
  - Parameter manipulation
  - Header variations
- Burst protection
- Proper rate limit reset after time window

### 4. Memory Leak Prevention
- Stream cleanup on client disconnect
- Temporary file cleanup on errors
- Database connection management
- Memory usage monitoring during large exports
- Resource limits enforcement

### 5. CORS Protection
- Origin validation in production
- Blocking of unauthorized origins
- Proper preflight request handling
- Prevention of CORS bypass through header injection
- Development vs production environment handling

### 6. Integration Security
- Combined attack vectors (SQL injection + rate limiting)
- Authentication bypass attempts with CORS
- Memory exhaustion with rate limiting
- Distributed attack simulation
- Privilege escalation prevention
- Security event logging

## Running the Tests

### Run all security tests:
```bash
bundle exec rspec spec/security/
```

### Run specific security test file:
```bash
bundle exec rspec spec/security/export_system_security_spec.rb
```

### Run specific test category:
```bash
# Token security tests only
bundle exec rspec spec/security/export_system_security_spec.rb -e "Token Security"

# SQL injection tests only
bundle exec rspec spec/security/export_system_security_spec.rb -e "SQL Injection"

# Rate limiting tests only
bundle exec rspec spec/security/export_system_security_spec.rb -e "Rate Limiting"

# Memory leak tests only
bundle exec rspec spec/security/export_system_security_spec.rb -e "Memory Leak"

# CORS tests only
bundle exec rspec spec/security/export_system_security_spec.rb -e "CORS Tests"
```

## Optional Dependencies

Some tests use optional gems for enhanced testing capabilities:

- **memory_profiler**: For memory usage analysis tests
- **timecop**: For time-based rate limiting tests

To install these optional dependencies for more comprehensive testing:

```bash
# Add to Gemfile test group:
group :test do
  gem 'memory_profiler'
  gem 'timecop'
end

# Then run:
bundle install
```

Tests that require these gems will be automatically skipped if they're not available.

## Test Coverage

The security test suite includes:
- **100+ individual test cases** covering various attack vectors
- **Classic attacks**: SQL injection, XSS, CSRF, authentication bypass
- **Modern attacks**: Timing attacks, second-order injection, mass assignment
- **Resource attacks**: Memory exhaustion, connection leaks, rate limit bypass
- **Integration attacks**: Combined attack vectors, chained exploits

## Continuous Security Testing

### Pre-commit Hook
Consider adding a git pre-commit hook to run security tests:

```bash
#!/bin/sh
# .git/hooks/pre-commit
echo "Running security tests..."
bundle exec rspec spec/security/ --fail-fast
```

### CI/CD Integration
Add to your CI pipeline (e.g., GitHub Actions):

```yaml
- name: Run Security Tests
  run: bundle exec rspec spec/security/
```

## Security Test Maintenance

### When to Update Tests
- After implementing new security features
- When new attack vectors are discovered
- After security audits or penetration testing
- When upgrading Rails or security-related gems

### Adding New Security Tests
1. Identify the security concern
2. Create a test that attempts the attack
3. Verify the defense mechanism works
4. Add both positive and negative test cases
5. Document the test purpose and attack vector

## Reporting Security Issues

If these tests reveal a security vulnerability:
1. Do NOT create a public issue
2. Contact the maintainers privately
3. Provide details of the failing test
4. Wait for a fix before disclosing publicly

## Test Performance

The full security test suite should complete in under 30 seconds. If tests are taking longer:
1. Check for unnecessary database operations
2. Use test doubles where appropriate
3. Consider parallelizing tests with `parallel_tests` gem

## Related Documentation
- [Export Security Implementation](../../app/controllers/api/v1/exports_controller.rb)
- [Token Model Security](../../app/models/export_token.rb)
- [CORS Configuration](../../config/initializers/cors.rb)
- [Rate Limiting Logic](../../app/models/concerns/rate_limitable.rb)