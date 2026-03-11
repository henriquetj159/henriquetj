# GitHub Secrets Management

**Document:** `.github/SECRETS.md`
**Last Updated:** 2026-03-11
**Story:** 5.10
**Audience:** DevOps, Repository Admins

---

## Overview

Repository secrets are encrypted environment variables used by GitHub Actions workflows to access external services, publish packages, and authenticate with third-party APIs.

**Key Principles:**
- ✅ Secrets are encrypted at rest and in transit
- ✅ Secrets are only available to workflow runs on `main` branch (or specified branches)
- ✅ Secrets are never logged or echoed in workflow output
- ✅ Only organization admins and users with `admin:repo_hook` can view/manage secrets
- ✅ Rotate secrets every 90 days or upon compromise

---

## Required Secrets

### 1. NPM_TOKEN

**Purpose:** Authenticate with npm registry for publishing packages
**Used In:** `npm-publish.yml`, `semantic-release.yml`
**Scope:** `packages:write`, `read:packages`
**Sensitivity:** 🔴 CRITICAL

**Configuration:**

```bash
# Generate from https://www.npmjs.com/settings/YOUR_NPM_USER/tokens
# Scopes required:
#   - read:packages (read from npm registry)
#   - publish:write (publish to npm registry)

# Set in GitHub:
gh secret set NPM_TOKEN --repo SynkraAI/aiox-core
# Paste token when prompted
```

**Rotation:**
- Rotate: Every 90 days
- Action: Generate new token in npm, update secret, revoke old token
- Documented in: `.github/SECRETS.md` → Rotation Schedule (below)

**Validation:**
- Used in `npm-publish.yml` line 45: `npm publish --token ${{ secrets.NPM_TOKEN }}`
- Verify in npm settings: https://www.npmjs.com/settings/SynkraAI/tokens

---

### 2. CODECOV_TOKEN

**Purpose:** Upload coverage reports to Codecov.io
**Used In:** `ci.yml`, `pr-automation.yml`
**Scope:** Codecov API
**Sensitivity:** 🟡 MODERATE
**Fail on Missing:** No (`fail_ci_if_error: false`)

**Configuration:**

```bash
# Get from https://app.codecov.io/gh/SynkraAI/aiox-core/settings
# No scope restriction for Codecov

# Set in GitHub:
gh secret set CODECOV_TOKEN --repo SynkraAI/aiox-core
# Paste token when prompted
```

**Usage:**
- Uploads Jest coverage reports to Codecov
- Creates coverage badge: `https://codecov.io/gh/SynkraAI/aiox-core`
- Optional: workflow continues if upload fails

**Rotation:**
- Rotate: Every 180 days (lower sensitivity)
- Action: Generate new token in Codecov, update secret, revoke old token

**Validation:**
- Used in `ci.yml` line 156: `codecov --token ${{ secrets.CODECOV_TOKEN }}`
- Verify in Codecov dashboard: https://app.codecov.io/gh/SynkraAI/aiox-core

---

### 3. GITHUB_TOKEN (Automatic)

**Purpose:** Authenticate with GitHub API for PR comments, issue creation, etc.
**Used In:** All workflows
**Scope:** Provided automatically by GitHub Actions
**Sensitivity:** 🟢 LOW (auto-managed)

**Configuration:**

No manual configuration needed. GitHub automatically provides `GITHUB_TOKEN` with:
- `contents: read`
- `pull-requests: write`
- `issues: write`
- `checks: write`
- `statuses: write`

**Usage Examples:**
- `gh api` calls in workflows
- Post PR comments (coverage reports)
- Create/update GitHub issues
- Set workflow status checks

---

## Rotation Schedule

**Every 90 Days** (next rotation: June 11, 2026)

| Secret | Rotation Date | Owner | Status |
|--------|---------------|-------|--------|
| `NPM_TOKEN` | 2026-06-11 | @Pedrovaleriolopez | ✅ Track |
| `CODECOV_TOKEN` | 2026-09-11 | @devops | ✅ Track |

**Checklist (when rotating):**

1. **Generate new token** in the service (npm, Codecov, etc.)
2. **Test new token locally** (optional):
   ```bash
   npm config set //registry.npmjs.org/:_authToken=$NPM_TOKEN
   npm whoami  # Should print your username
   ```
3. **Update secret in GitHub:**
   ```bash
   gh secret set SECRET_NAME --repo SynkraAI/aiox-core
   # Paste new token when prompted
   ```
4. **Revoke old token** in the service
5. **Document** in this file with new rotation date
6. **Test** by running a workflow that uses the secret (pr-automation on next PR)

---

## Security Considerations

### Access Control

**Who can view secrets:**
- Repository owners/admins only
- Cannot be viewed directly in UI
- Only visible in workflow logs if explicitly echoed (DO NOT DO THIS)

**Who can modify secrets:**
- Repository owners/admins
- Users with `admin:repo_hook` scope

**GitHub Enterprise:**
- Organization owners can restrict secret usage
- Only allow secrets in specific workflows (recommended)

### Secret Masking

GitHub Actions automatically masks secrets in logs:

```
##[group]Run npm publish
npm publish --token ***  # Masked in logs
```

**DO NOT:**
```bash
echo "Token is: ${{ secrets.NPM_TOKEN }}"  # ❌ NEVER ECHO SECRETS
npm publish --registry https://registry.npmjs.org --verbose  # ❌ May print auth header
```

**DO:**
```bash
npm publish --registry https://registry.npmjs.org  # ✅ OK (token in config)
# or use npm config set from secret
```

---

## Troubleshooting

### Error: "Couldn't authenticate with npm"

**Cause 1:** NPM_TOKEN is invalid or expired

```
npm ERR! code E401
npm ERR! 401 Unauthorized
```

**Fix:**
1. Generate new token in npm
2. Update secret: `gh secret set NPM_TOKEN --repo SynkraAI/aiox-core`
3. Re-run workflow

**Cause 2:** Token has wrong scopes

```
npm ERR! 403 Forbidden
npm ERR! You must be logged in to publish
```

**Fix:**
1. Check npm token scopes: https://www.npmjs.com/settings/SynkraAI/tokens
2. Regenerate with `publish:write` + `read:packages`

---

### Error: "Codecov upload failed"

**Cause:** CODECOV_TOKEN is invalid or missing

```
Codecov upload failed: HTTP 403 Unauthorized
```

**Fix:**
1. Verify token in Codecov: https://app.codecov.io/gh/SynkraAI/aiox-core/settings
2. Update secret: `gh secret set CODECOV_TOKEN --repo SynkraAI/aiox-core`
3. Re-run workflow (workflow continues on failure, so next PR will succeed)

**Note:** This is non-critical — workflow passes even if Codecov upload fails.

---

### Error: "Permission denied for secret"

**Cause:** User doesn't have permission to manage secrets

```
gh: not authorized to perform this action
```

**Fix:**
1. Check you're a repository admin or have `admin:repo_hook` scope
2. If using personal access token (PAT), regenerate with correct scopes:
   ```bash
   gh auth login
   # Select "Paste an authentication token"
   # Token needs: repo, workflow, admin:repo_hook
   ```

---

## References

### Documentation

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [NPM Authentication](https://docs.npmjs.com/creating-and-viewing-authentication-tokens)
- [Codecov Documentation](https://docs.codecov.io/)

### Related Files

- `.github/workflows/npm-publish.yml` — Uses NPM_TOKEN
- `.github/workflows/semantic-release.yml` — Uses NPM_TOKEN
- `.github/workflows/ci.yml` — Uses CODECOV_TOKEN
- `.github/CODEOWNERS` — Who manages secrets

### Stories

- **Story 5.10** — GitHub DevOps Setup for User Projects
- **Story INS-4.10** — Publish Safety Gate

---

## Checklist: Setting Up Secrets for New Repository

If you're setting up secrets for a new fork or repository:

- [ ] Generate NPM_TOKEN from https://www.npmjs.com/settings/SynkraAI/tokens
- [ ] Set NPM_TOKEN: `gh secret set NPM_TOKEN --repo OWNER/REPO`
- [ ] Generate CODECOV_TOKEN from https://app.codecov.io/gh/OWNER/REPO/settings
- [ ] Set CODECOV_TOKEN: `gh secret set CODECOV_TOKEN --repo OWNER/REPO`
- [ ] Test by running `npm-publish.yml` workflow (manual trigger)
- [ ] Verify tokens work (check npm, codecov dashboards)
- [ ] Document rotation date in this file
- [ ] Add calendar reminder for 90-day rotation

---

**Last Updated:** 2026-03-11
**Status:** ✅ Complete
**Review by:** @devops (Gage)

— Gage, secrets documented com confiança 🔐
