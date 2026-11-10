# Selvuno branding

The product is now **Selvuno**. Runtime UI strings and PWA names use
`apps/web/src/lib/brand.ts`; the static HTML startup/failure screens also use
Selvuno. Workspace packages use the `@selvuno/*` scope. Downloads use
`selvuno-YYYY-MM-DD.csv` and `selvuno-backup-YYYY-MM-DD.json`.

## Compatibility identifiers — do not rename blindly

The following identifiers intentionally retain the old name. They are not visible
product branding:

- IndexedDB database `myfinances`: preserves wallets, transactions, attachments,
  categories, goals, preferences and backup snapshots without a data migration.
- Existing `myfinances:*`, `myfinances-*` and `myfinances.*` local-storage keys:
  preserve PIN protection, theme bootstrap, filters, notification read states,
  release history, camera choice and onboarding notices.
- The History API state key `myfinances:navigation`: keeps existing navigation
  entries compatible after the new bundle loads.
- PWA manifest `id`, `start_url` and `scope` remain `/`: this is the same installed
  application, not a second app.
- `wrangler.jsonc` still targets the existing Cloudflare Pages project
  `myfinances`. Do not change it until the deployment project is deliberately moved.

The GitHub repository, Git remote, local workspace folder and production domain
have not been renamed. Those are separate administrative changes. A different
website origin has separate browser storage; export a backup before changing the
domain and import it on the new origin. Attachments are not embedded in the JSON
backup and need a separate migration plan before moving to another origin.

Existing JSON backups do not depend on their filename or on the product name and
remain importable. Rebranding tests verify access to the original database and
PIN settings, and a backup round-trip containing existing finance data.
