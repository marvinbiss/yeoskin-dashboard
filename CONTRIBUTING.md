# Contributing to Yeoskin Dashboard

Thank you for your interest in contributing! This guide will help you get started.

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the issue, not the person
- Help others learn and grow

---

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/dashboard.git
   cd dashboard
   ```
3. **Set up development environment**
   - Follow [ONBOARDING.md](docs/ONBOARDING.md)
4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

---

## Development Workflow

### 1. Pick an Issue

- Check [GitHub Issues](https://github.com/yeoskin/dashboard/issues)
- Look for `good first issue` labels
- Comment to claim an issue

### 2. Make Changes

- Write clean, readable code
- Follow existing patterns
- Add tests if applicable
- Update documentation if needed

### 3. Validate Your Changes

```bash
# Run all checks
npm run validate

# Individual checks
npm run lint          # Code style
npm run typecheck     # TypeScript
npm run test          # Tests
npm run security:check # Secret scanning
```

### 4. Commit Your Changes

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: type(scope): description

# Examples:
git commit -m "feat(creators): add bulk export feature"
git commit -m "fix(auth): resolve session timeout bug"
git commit -m "docs: update API documentation"
git commit -m "refactor(hooks): simplify data fetching"
git commit -m "test(api): add health check tests"
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, no code change
- `refactor` - Code change without feature/fix
- `test` - Adding tests
- `chore` - Maintenance tasks

### 5. Push and Create PR

```bash
git push origin feature/your-feature
```

Then create a Pull Request on GitHub.

---

## Pull Request Guidelines

### PR Title

Use the same format as commits:
```
feat(creators): add bulk export feature
```

### PR Description

Use the [PR template](.github/PULL_REQUEST_TEMPLATE.md):

- Describe your changes
- Link related issues
- List testing done
- Add screenshots if UI changes

### Review Process

1. CI checks must pass
2. At least 1 approval required
3. Address review comments
4. Squash and merge when approved

---

## Code Style

### TypeScript

```typescript
// Use explicit types
function processCreator(creator: Creator): ProcessResult {
  // ...
}

// Use interfaces for objects
interface Creator {
  id: string
  email: string
  status: 'active' | 'inactive'
}

// Avoid `any`
// ❌ const data: any = ...
// ✅ const data: Creator = ...
```

### React Components

```tsx
// Use functional components
function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <div className="...">
      {creator.name}
    </div>
  )
}

// Define props interface
interface CreatorCardProps {
  creator: Creator
  onSelect?: (id: string) => void
}

// Export at bottom
export default CreatorCard
```

### API Routes

```typescript
// Use auth middleware
import { verifyAdminAuth, unauthorizedResponse } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error)
  }

  // Handle request...
}
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `CreatorCard.tsx`)
- Utilities: `camelCase.ts` (e.g., `authMiddleware.ts`)
- Tests: `*.test.ts` (e.g., `auth.test.ts`)
- Pages: `page.tsx` (Next.js convention)

---

## Testing

### Write Tests For

- New features
- Bug fixes (add test to prevent regression)
- Complex logic
- API routes

### Test Structure

```typescript
describe('FeatureName', () => {
  describe('functionName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = { ... }

      // Act
      const result = functionName(input)

      // Assert
      expect(result).toBe(expected)
    })
  })
})
```

### Run Tests

```bash
npm test              # All tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

---

## Documentation

### When to Update Docs

- New features → Update API.md
- New patterns → Update ARCHITECTURE.md
- Environment changes → Update .env.example
- Complex logic → Add code comments

### Code Comments

```typescript
/**
 * Calculates creator commission for an order.
 *
 * @param order - The Shopify order
 * @param rate - Commission rate (0.15 = 15%)
 * @returns Calculated commission amount
 */
function calculateCommission(order: Order, rate: number): number {
  // Apply commission rate to order subtotal (excluding tax/shipping)
  return order.subtotal * rate
}
```

---

## Security

### Never Commit

- API keys or tokens
- Passwords
- Database credentials
- Private keys

### Use Environment Variables

```typescript
// ✅ Good
const apiKey = process.env.API_KEY

// ❌ Bad
const apiKey = 'sk_live_xxxxx'
```

### Run Security Check

```bash
npm run security:check
```

---

## Questions?

- Check existing documentation in `/docs`
- Search closed issues/PRs
- Ask in team chat
- Create a discussion on GitHub

---

## Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes (for significant contributions)

Thank you for contributing! 🎉
