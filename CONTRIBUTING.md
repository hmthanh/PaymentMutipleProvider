# Contributing to Payment System

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature`

## Development Workflow

### Setting Up Development Environment

```bash
# Install dependencies
npm install

# Copy environment example
cp .dev.vars.example .dev.vars

# Fill in your development credentials in .dev.vars
```

### Running Locally

```bash
# Start development server
npm run dev

# In another terminal, run tests
npm run test:watch
```

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Format code
npm run format

# Lint code
npm run lint
```

## Adding a New Payment Provider

To add support for a new payment provider:

### 1. Create Provider Adapter

Create a new file in `src/adapters/` (e.g., `src/adapters/square.js`):

```javascript
import { ProviderAdapter } from './providerAdapter.js';

export class SquareAdapter extends ProviderAdapter {
  constructor(env, logger) {
    super(env, logger);
    this.apiKey = env.SQUARE_API_KEY;
    // ... other configuration
  }

  getName() {
    return 'square';
  }

  async createCheckoutSession(payload) {
    // Implementation
  }

  async verifyWebhook(request) {
    // Implementation
  }

  async getSession(sessionId) {
    // Implementation
  }

  async createSubscription(payload) {
    // Implementation
  }

  async cancelSubscription(subscriptionId) {
    // Implementation
  }
}
```

### 2. Register in Provider Factory

Update `src/adapters/providerAdapter.js`:

```javascript
export async function getProviderAdapter(provider, env, logger) {
  switch (providerName) {
    case 'square': {
      const { SquareAdapter } = await import('./square.js');
      return new SquareAdapter(env, logger);
    }
    // ... existing cases
  }
}
```

### 3. Add Environment Variables

Update `wrangler.toml` and `.dev.vars.example`:

```toml
# In wrangler.toml comments
# wrangler secret put SQUARE_API_KEY
# wrangler secret put SQUARE_WEBHOOK_SECRET
```

### 4. Write Tests

Create `src/tests/square.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { SquareAdapter } from '../adapters/square.js';

describe('SquareAdapter', () => {
  it('should create checkout session', async () => {
    // Test implementation
  });
});
```

### 5. Update Documentation

- Add provider to README.md
- Update API_REFERENCE.md
- Add webhook configuration to DEPLOYMENT.md

## Testing Guidelines

### Writing Tests

- Write tests for all new features
- Maintain test coverage above 80%
- Use descriptive test names
- Mock external dependencies

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test adapter.test.js

# Run with coverage
npm run test:coverage
```

### Test Structure

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something specific', async () => {
    // Arrange
    const input = {
      /* ... */
    };

    // Act
    const result = await someFunction(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

## Pull Request Process

1. **Create a feature branch** from `main`
2. **Write code** following our style guidelines
3. **Add tests** for your changes
4. **Update documentation** if needed
5. **Run tests** and ensure they pass
6. **Format code** with Prettier
7. **Commit** with clear, descriptive messages
8. **Push** to your fork
9. **Create a Pull Request** with:
   - Clear description of changes
   - Link to related issues
   - Screenshots (if UI changes)

### Commit Message Format

Use clear, descriptive commit messages:

```
feat: Add Square payment provider support
fix: Correct webhook signature verification for PayPal
docs: Update API reference for new endpoints
test: Add tests for subscription cancellation
refactor: Simplify KV storage helper functions
```

Prefixes:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

## Code Review

All submissions require review. We review for:

- **Functionality**: Does it work as intended?
- **Tests**: Are there adequate tests?
- **Code Quality**: Is it readable and maintainable?
- **Documentation**: Is it well documented?
- **Performance**: Are there any performance concerns?
- **Security**: Are there any security issues?

## Bug Reports

When filing a bug report, include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Worker version, provider, etc.
6. **Logs**: Relevant error logs
7. **Screenshots**: If applicable

## Feature Requests

When requesting a feature:

1. **Use Case**: Describe the problem you're solving
2. **Proposed Solution**: How would you solve it?
3. **Alternatives**: What alternatives have you considered?
4. **Additional Context**: Any other relevant information

## Code Style

### JavaScript

- Use ES6+ features
- Prefer `const` over `let`
- Use async/await over promises
- Use descriptive variable names
- Add JSDoc comments for functions

### File Organization

```
src/
├── adapters/       # Payment provider implementations
├── utils/          # Utility functions
├── tests/          # Test files
└── config/         # Configuration files
```

### Naming Conventions

- **Files**: `camelCase.js`
- **Classes**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Variables**: `camelCase`

## Documentation

- Update README.md for major changes
- Add JSDoc comments to public functions
- Update API_REFERENCE.md for API changes
- Add examples for new features

## Security

- Never commit secrets or API keys
- Report security issues privately
- Follow secure coding practices
- Validate all inputs
- Use parameterized queries

## Questions?

- Open a discussion on GitHub
- Check existing issues
- Review documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Code of Conduct

Be respectful and inclusive. We're all here to build great software together.

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Git commit history

Thank you for contributing! 🎉
