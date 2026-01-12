# SEO Build Check Hook

This hook triggers before deployment/build commands to suggest running SEO validation.

## Trigger Conditions

This hook activates when detecting deployment-related Bash commands:

- `bun run build`
- `npm run build`
- `wrangler deploy`
- `wrangler pages deploy`
- `git push` (to main/master/production branches)
- `gh pr merge`

## Check Logic

When a build/deploy command is about to run:

1. Check if SEO audit has been run recently (check for validation report)
2. Check if robots.txt exists
3. Check if sitemap.xml exists

## Response Actions

### Pre-Deployment Reminder

```
🚀 Pre-Deployment SEO Checklist

Before deploying to production, consider verifying:

□ SEO Audit passed (`/rubot-seo-audit`)
□ robots.txt is configured correctly
□ sitemap.xml is generated and valid
□ Core Web Vitals meet thresholds
□ Structured data validates without errors
□ Social sharing tags are complete

Quick checks:
- Run `/rubot-seo-check-vitals` for Core Web Vitals
- Run `/rubot-seo-check-schema` for structured data
- Run `/rubot-seo-check-og` for social sharing

Note: This is a reminder only. The build/deploy will proceed.
```

### If Critical SEO Files Missing

```
⚠️ SEO Files Check

The following SEO files may be missing:

□ robots.txt - Run `/rubot-seo-generate-robots` to create
□ sitemap.xml - Run `/rubot-seo-generate-sitemap` to create

These files are important for:
- Search engine crawling and indexing
- Controlling what content is discoverable
- Helping search engines find all your pages

Proceed with deployment? The build will continue, but consider adding these files.
```

### If Deploying to Production

```
🎯 Production Deployment Detected

For production deployments, ensure:

1. **Environment variables** are set:
   - SITE_URL (for absolute URLs in sitemap/OG tags)
   - NODE_ENV=production

2. **SEO files** return correct content:
   - robots.txt allows crawling (not blocking all)
   - sitemap.xml uses production URLs

3. **Post-deployment**:
   - Submit sitemap to Google Search Console
   - Request indexing for important pages
   - Monitor Core Web Vitals in field data

After deployment, run `/rubot-seo-audit` on the live URL to verify.
```

## Detection Patterns

Commands that trigger this hook:

```bash
# Build commands
bun run build
npm run build
yarn build
pnpm build

# Deployment commands
wrangler deploy
wrangler pages deploy
vercel --prod
netlify deploy --prod

# Git pushes to production
git push origin main
git push origin master
git push production
git push --tags

# PR merges
gh pr merge
```

## Non-Blocking

This hook is **advisory only**. It does not block the build/deploy command. It provides reminders and suggestions without interrupting the workflow.

## Integration

This hook works with:
- `seo-master` agent for pre-deployment audits
- `qa-tester` agent for pre-deployment testing
- `/rubot-seo-audit` command for comprehensive checks
- `debug-master` for validation before deploy

## Workspace Context

If a rubot workspace exists (`.claude/rubot.local.md`), check:
- Has `/rubot-seo-audit` been run in this session?
- When was the last validation report generated?
- Are there any SEO-related blockers in the plan?

Provide contextual reminders based on workspace state.
