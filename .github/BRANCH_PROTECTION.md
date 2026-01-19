# Branch Protection Rules

This document outlines the recommended branch protection settings for the `tscd48` repository to ensure code quality and prevent accidental pushes to protected branches.

## Required Status Checks

The following CI jobs must pass before merging to `main`:

| Status Check | Job Name | Purpose |
|--------------|----------|---------|
| **lint** | Lint & Format | Ensures code follows ESLint rules and Prettier formatting |
| **typecheck** | TypeScript Check | Verifies TypeScript compiles without errors |
| **test** | Test (Node 20) | Runs unit tests on the primary Node.js version |
| **e2e** | E2E Tests | Runs Playwright end-to-end tests |
| **build** | Build Verification | Ensures the project builds successfully |
| **security** | Security Audit | Checks for vulnerable dependencies |

## Recommended GitHub Branch Protection Settings

### For `main` Branch

Navigate to **Settings > Branches > Add branch protection rule** and configure:

#### Branch name pattern
```
main
```

#### Protect matching branches

- [x] **Require a pull request before merging**
  - [x] Require approvals: `1` (or more for larger teams)
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners (if CODEOWNERS file exists)

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Status checks that are required:
    - `lint`
    - `typecheck`
    - `test (20)` (primary Node version)
    - `e2e`
    - `build`
    - `security`

- [x] **Require conversation resolution before merging**

- [x] **Require signed commits** (optional but recommended)

- [x] **Require linear history** (optional - enforces rebase/squash merges)

- [x] **Do not allow bypassing the above settings**

- [ ] **Allow force pushes** - Keep UNCHECKED

- [ ] **Allow deletions** - Keep UNCHECKED

### For Release Branches (`release/*`)

```
release/*
```

Same settings as `main`, but may allow maintainers to bypass for hotfixes.

## Local Pre-Push Checks

The repository includes a pre-push Git hook (`.husky/pre-push`) that runs the following checks locally before pushing:

1. **Format Check** (`npm run format:check`)
   - Verifies Prettier formatting
   - Fix with: `npm run format`

2. **Lint Check** (`npm run lint`)
   - Runs ESLint on all source files
   - Fix with: `npm run lint:fix`

3. **TypeScript Check** (`npm run typecheck`)
   - Verifies TypeScript compilation
   - Fix type errors manually

4. **Unit Tests** (`npm test -- --run`)
   - Runs all unit tests
   - Fix failing tests before pushing

### Bypassing Pre-Push Hooks (Not Recommended)

In emergency situations, you can bypass hooks with:

```bash
git push --no-verify
```

**Warning:** This should only be used in exceptional circumstances. The CI pipeline will still enforce all checks.

## CI Workflow Timeouts

All CI jobs have timeout limits to prevent runaway processes:

| Job | Timeout |
|-----|---------|
| Lint & Format | 10 minutes |
| TypeScript Check | 10 minutes |
| Test | 15 minutes |
| Security Audit | 10 minutes |
| E2E Tests | 20 minutes |
| Bundle Size Check | 10 minutes |
| Performance Benchmarks | 15 minutes |
| Build Verification | 15 minutes |
| CI Summary | 5 minutes |

## Setting Up Branch Protection via GitHub CLI

You can also configure branch protection using the GitHub CLI:

```bash
# Require status checks
gh api repos/{owner}/{repo}/branches/main/protection \
  -X PUT \
  -H "Accept: application/vnd.github+json" \
  -f required_status_checks='{"strict":true,"contexts":["lint","typecheck","test (20)","e2e","build","security"]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  -f restrictions=null
```

## Rulesets (GitHub Enterprise / Public Repos)

For repositories using GitHub Rulesets (newer feature), create a ruleset with:

1. **Target**: `main` branch
2. **Bypass list**: None (or specific teams for emergencies)
3. **Rules**:
   - Restrict deletions
   - Restrict force pushes
   - Require linear history
   - Require pull request
   - Require status checks (list above)
   - Require signed commits (optional)

## Troubleshooting

### Status check not appearing

If a status check doesn't appear in the list:
1. Ensure the workflow has run at least once on a PR
2. Check that the job name matches exactly
3. For matrix jobs, use the specific name like `test (20)`

### Pre-push hook not running

1. Ensure Husky is installed: `npm run prepare`
2. Check hook is executable: `chmod +x .husky/pre-push`
3. Verify Git hooks path: `git config core.hooksPath`

### CI failing but local passes

1. Ensure dependencies are up to date: `npm ci`
2. Check Node.js version matches CI (18, 20, 22, or 24)
3. Run the exact CI command locally
