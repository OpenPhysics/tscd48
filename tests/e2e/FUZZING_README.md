# HTML Page Fuzzing Tests - User Guide

## What is Fuzzing?

Fuzzing is an automated testing technique that systematically tests all interactive elements on web pages to find broken links, non-functional buttons, and other issues that could impact user experience.

## Quick Start

### Run All Fuzzing Tests

```bash
npm run test:e2e -- tests/e2e/link-button-fuzzing.spec.ts
```

### Run Specific Test Suites

```bash
# Test only link validation
npm run test:e2e -- tests/e2e/link-button-fuzzing.spec.ts -g "Link Validation"

# Test only button functionality
npm run test:e2e -- tests/e2e/link-button-fuzzing.spec.ts -g "Button Functionality"

# Test navigation consistency
npm run test:e2e -- tests/e2e/link-button-fuzzing.spec.ts -g "Navigation Consistency"

# Test interactive elements (search, filters)
npm run test:e2e -- tests/e2e/link-button-fuzzing.spec.ts -g "Interactive Elements"

# Generate comprehensive inventory
npm run test:e2e -- tests/e2e/link-button-fuzzing.spec.ts -g "generate full link inventory"
```

## What Gets Tested?

### 1. Link Validation

The fuzzing tests check every link on every page:

- ✅ Internal links navigate to valid pages
- ✅ External links have proper format (https://)
- ✅ External links have security attributes (`rel="noopener noreferrer"`)
- ✅ Anchor links (`#`) point to existing elements
- ✅ Relative links resolve correctly

**Example Output:**

```
Broken links on /examples/:
  - Documentation (../docs/)
```

### 2. Button Functionality

All buttons are checked for interactivity:

- ✅ Buttons have click handlers
- ✅ Buttons are part of forms or have event listeners
- ✅ Interactive classes are properly applied
- ✅ Buttons are keyboard accessible

### 3. Navigation Consistency

Ensures consistent navigation across pages:

- ✅ Navigation bars exist on pages
- ✅ Navigation structure is consistent
- ✅ Example cards navigate correctly
- ✅ Back/forward navigation works

### 4. Interactive Elements

Tests dynamic UI components:

- ✅ Search functionality filters results
- ✅ Category filters work correctly
- ✅ Tab switching functions properly
- ✅ Example cards are clickable

### 5. Accessibility

Validates keyboard and screen reader support:

- ✅ All interactive elements are keyboard accessible
- ✅ Links have descriptive text or ARIA labels
- ✅ Focus indicators are visible
- ✅ Tab order is logical

## Test Results Interpretation

### Passing Tests ✅

```
✓ /examples/ - all links are valid and accessible (1.2s)
```

Indicates all links on the page are working correctly.

### Failing Tests ❌

```
✘ / - all links are valid and accessible (1.7s)

Broken links on /:
  - Documentation (docs/)
```

Indicates broken links that need fixing.

### Warnings ⚠️

Some tests may show warnings but not fail. These indicate potential issues that should be reviewed but don't break functionality.

## Interactive Test Modes

### UI Mode (Recommended for Development)

```bash
npm run test:e2e:ui -- tests/e2e/link-button-fuzzing.spec.ts
```

- Interactive test runner
- Visual test selection
- Real-time results
- Screenshot viewing

### Headed Mode (Watch Tests Run)

```bash
npm run test:e2e:headed -- tests/e2e/link-button-fuzzing.spec.ts
```

- See browser automation in action
- Useful for debugging
- Watch link clicks and navigation

### Debug Mode (Step Through Tests)

```bash
npm run test:e2e:debug -- tests/e2e/link-button-fuzzing.spec.ts
```

- Pause at breakpoints
- Inspect page state
- Debug failing tests

## CI/CD Integration

### GitHub Actions Example

Add to `.github/workflows/test.yml`:

```yaml
name: Fuzzing Tests

on: [push, pull_request]

jobs:
  fuzz-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install chromium
      - run: npm run test:e2e -- tests/e2e/link-button-fuzzing.spec.ts
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: fuzzing-test-results
          path: tests/e2e-report/
```

### Pre-commit Hook Example

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run link fuzzing on changed HTML files
if git diff --cached --name-only | grep -q '\.html$'; then
  echo "Running link fuzzing tests..."
  npm run test:e2e -- tests/e2e/link-button-fuzzing.spec.ts || exit 1
fi
```

## Common Issues and Solutions

### Issue: Tests Timeout

**Problem:** Tests take too long or timeout

**Solution:**

```bash
# Increase timeout
npm run test:e2e -- tests/e2e/link-button-fuzzing.spec.ts --timeout=60000
```

Or modify `playwright.config.js`:

```javascript
timeout: 60 * 1000, // 60 seconds
```

### Issue: Flaky Tests

**Problem:** Tests pass/fail intermittently

**Solution:**

1. Add retries in `playwright.config.js`:

   ```javascript
   retries: process.env.CI ? 2 : 1;
   ```

2. Add explicit waits:
   ```javascript
   await page.waitForLoadState('networkidle');
   ```

### Issue: Too Many Failures

**Problem:** Many broken links reported

**Solution:**

1. Review `FUZZING_RESULTS.md` for detailed findings
2. Fix high-priority issues first (docs, navigation)
3. Run tests incrementally as you fix issues

### Issue: External Link Validation

**Problem:** External links can't be validated

**Solution:**
The tests currently validate format only. To check actual accessibility:

1. Use online link checkers
2. Add custom external link validation logic
3. Run tests with network access

## Customizing Tests

### Add New Pages to Test

Edit `link-button-fuzzing.spec.ts`:

```typescript
const HTML_PAGES = [
  '/',
  '/examples/',
  '/your-new-page.html', // Add here
] as const;
```

### Exclude Certain Links

Modify the `extractLinks` function to filter out specific links:

```typescript
// Skip certain URLs
if (href.includes('skip-me')) {
  return;
}
```

### Add Custom Validations

Add new test cases:

```typescript
test('custom validation', async ({ page }) => {
  await page.goto('/your-page');
  // Your custom checks
});
```

## Best Practices

### 1. Run Before Commits

Always run fuzzing tests before committing HTML changes:

```bash
npm run test:e2e -- tests/e2e/link-button-fuzzing.spec.ts --project=chromium
```

### 2. Fix High-Priority Issues First

Focus on:

1. Broken navigation links
2. Broken documentation links
3. Security issues (missing `noopener`)
4. Accessibility problems

### 3. Regular Monitoring

Run fuzzing tests:

- After adding new pages
- After updating navigation
- Weekly (to catch external link breakage)
- Before major releases

### 4. Review Reports

Check `FUZZING_RESULTS.md` for:

- Broken link inventory
- Recommendations
- Test metrics
- Trending issues

## Performance Tips

### Run Subset of Tests

```bash
# Test only one page
npm run test:e2e -- tests/e2e/link-button-fuzzing.spec.ts -g "/ - all links"

# Test only examples
npm run test:e2e -- tests/e2e/link-button-fuzzing.spec.ts -g "/examples/"
```

### Parallel Execution

Tests run in parallel by default. Adjust workers in `playwright.config.js`:

```javascript
workers: 8, // Increase for faster execution
```

### Selective Browser Testing

```bash
# Test only Chromium (fastest)
npm run test:e2e -- tests/e2e/link-button-fuzzing.spec.ts --project=chromium

# Test all browsers
npm run test:e2e -- tests/e2e/link-button-fuzzing.spec.ts
```

## Viewing Results

### HTML Report

```bash
# Generate and view report
npm run test:e2e:report
```

Opens an interactive HTML report showing:

- Pass/fail status
- Screenshots of failures
- Detailed error messages
- Test timing information

### Console Output

Look for:

- ✅ Green checkmarks for passing tests
- ❌ Red X for failing tests
- 📊 Summary statistics
- 🔍 Detailed failure messages

### Screenshots

Failed tests automatically capture screenshots in:

```
tests/e2e-report/test-results/[test-name]/test-failed-1.png
```

## Troubleshooting

### No browsers installed

```bash
npx playwright install
```

### Tests won't run

```bash
# Reinstall dependencies
npm ci
npx playwright install chromium
```

### Can't find pages

Check that:

1. Server is running (configured in `playwright.config.js`)
2. Base URL is correct
3. HTML files exist at expected paths

### Tests are too slow

1. Use only Chromium: `--project=chromium`
2. Reduce worker count if resource-constrained
3. Test fewer pages during development

## Advanced Usage

### Custom Fuzzing Strategy

Create your own fuzzing patterns:

```typescript
// Fuzz with random inputs
const randomStrings = generateRandomStrings(100);
for (const str of randomStrings) {
  await page.fill('#searchInput', str);
  // Check for crashes or errors
}
```

### Integration with Other Tools

Combine with:

- **Lighthouse** for performance audits
- **axe-core** for accessibility testing
- **Pa11y** for additional a11y checks
- **Link checkers** for external link validation

### Continuous Fuzzing

Set up scheduled tests:

```yaml
# .github/workflows/scheduled-fuzzing.yml
on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday
```

## Getting Help

If you encounter issues:

1. Check `FUZZING_RESULTS.md` for known issues
2. Review test output and screenshots
3. Run in headed mode to see what's happening
4. Use debug mode to step through tests
5. Check Playwright documentation: https://playwright.dev

## Summary

The fuzzing test suite provides:

- ✅ Automated link validation
- ✅ Button functionality testing
- ✅ Navigation consistency checks
- ✅ Accessibility validation
- ✅ Interactive element testing
- ✅ Comprehensive reporting

**Run regularly to ensure all pages remain functional!**

---

**Quick Reference:**

```bash
# Basic run
npm run test:e2e -- tests/e2e/link-button-fuzzing.spec.ts

# Interactive mode
npm run test:e2e:ui -- tests/e2e/link-button-fuzzing.spec.ts

# View results
npm run test:e2e:report
```
