# Production Testing Instructions

## Overview

This document provides instructions for running end-to-end tests against the production deployment at `https://instanthpi.ca`.

## Prerequisites

1. Node.js and npm installed
2. Playwright installed: `npm install`
3. Playwright browsers installed: `npx playwright install`

## Running Production Tests

### Quick Start

Run the production smoke test suite:

```bash
npm run test:prod
```

This runs the comprehensive production smoke tests against `https://instanthpi.ca`.

### Run All Production Tests

To run all test suites against production:

```bash
npm run test:prod:all
```

### Run Specific Test File

To run a specific test file against production:

```bash
BASE_URL=https://instanthpi.ca npx playwright test tests/production-smoke.spec.ts
```

### Run with Custom Base URL

To test against a different environment:

```bash
BASE_URL=https://your-domain.com npx playwright test tests/production-smoke.spec.ts
```

## Test Coverage

The production smoke test suite (`tests/production-smoke.spec.ts`) covers:

1. **Landing Page**
   - Page loads correctly
   - Main content is visible
   - Forms/buttons are accessible

2. **Patient Intake Form**
   - Form is accessible
   - Form fields are present
   - No critical errors on page load

3. **Doctor Login Flow**
   - Login page loads
   - Demo credentials work
   - Dashboard loads after login
   - No blank screen errors

4. **Dashboard Rendering**
   - Dashboard renders without JavaScript errors
   - No array operation errors (`.slice()`, `.map()`, `.filter()`)
   - Dashboard elements are present

5. **API Endpoints**
   - Critical endpoints respond (not 404/500)
   - Endpoints are accessible

6. **Navigation**
   - Sidebar navigation works
   - Page transitions are smooth
   - No navigation errors

7. **Form Submission**
   - Timeout handling works
   - Error messages are user-friendly
   - Page doesn't crash on timeout

## Test Results

After running tests, check:

1. **Test Results:** `test-results.json`
2. **HTML Report:** `playwright-report/index.html`
3. **Screenshots:** `test-results/` (on failure)
4. **Videos:** `test-results/` (on failure)

View HTML report:

```bash
npx playwright show-report
```

## Continuous Integration

To run production tests in CI:

```yaml
# Example GitHub Actions
- name: Run Production Tests
  run: |
    npm install
    npx playwright install --with-deps
    BASE_URL=https://instanthpi.ca npm run test:prod
  env:
    BASE_URL: https://instanthpi.ca
```

## Troubleshooting

### Tests Fail with Timeout

- Production may be slow during peak times
- Increase timeout in test file: `test.setTimeout(60000)`

### Authentication Issues

- Demo credentials: `doctor@instanthpi.ca` / `medical123`
- Clear cookies between test runs if needed
- Check if OAuth redirects are working

### Network Errors

- Verify production URL is accessible
- Check Netlify deployment status
- Verify API endpoints are responding

### Browser Issues

- Reinstall browsers: `npx playwright install`
- Check browser compatibility
- Try different browser: `npx playwright test --project=firefox`

## Test Maintenance

### Adding New Tests

1. Add test cases to `tests/production-smoke.spec.ts`
2. Follow existing test patterns
3. Use `BASE_URL` environment variable
4. Include error handling and assertions

### Updating Test Credentials

If demo credentials change, update:
- `tests/production-smoke.spec.ts`
- `tests/auth-flow.spec.ts`
- `tests/prod-nav-smoke.spec.ts`

## Best Practices

1. **Don't Test Against Production During Deployments**
   - Wait for deployment to complete
   - Check Netlify status page

2. **Use Appropriate Timeouts**
   - Production may be slower than local
   - Account for network latency

3. **Handle Flaky Tests**
   - Add retries for network-dependent tests
   - Use `waitForLoadState('networkidle')`

4. **Respect Rate Limits**
   - Don't run tests too frequently
   - Use test data that won't affect real users

5. **Monitor Test Results**
   - Track test pass rates over time
   - Investigate failures promptly
   - Update tests when UI changes

---

**Last Updated:** January 2025

