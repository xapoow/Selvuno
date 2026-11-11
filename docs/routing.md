# URL navigation

The URL is the source of truth for the active screen. `lib/routes.ts` defines the
supported paths; `state/appStore.ts` performs navigation with the History API and
updates Zustand. `AppRouter` owns the `popstate` listener and the not-found screen.
Do not update `activeView` directly with `setState`; use `navigate` or `setActiveView`.

| Path | Screen |
| --- | --- |
| `/` | Home |
| `/analytics`, `/budget` | Home subpages |
| `/history`, `/history/table`, `/history/calendar` | History display modes |
| `/add`, `/add/recurring` | Single / recurring transactions |
| `/wallets`, `/wallets/transfers`, `/wallets/goals` | Wallet hub tabs |
| `/settings` | General settings |
| `/settings/appearance`, `/settings/automation`, `/settings/features` | Appearance, quick entry and optional features |
| `/settings/privacy`, `/settings/categories`, `/settings/backup`, `/settings/sync` | Other settings sections |
| `/settings/storage` | Local usage, receipt files and restore-history management |

`/index.html`, `/dashboard`, `/settings/general` and trailing slashes are normalized
with `replaceState`. Unknown paths show the existing 404 screen. Debug is not a route.

The `wallet` query parameter accepts `all` or a wallet UUID on Home, analytics,
budget, History and Add. Wallet swipes replace the current history entry, so swiping
does not flood the Back stack. Main-page and tab changes push an entry. A valid but
missing/archived wallet is replaced with `wallet=all` after data loads. Changing URL
context does not write preferences; an explicit wallet selection retains the existing
preference-saving behavior. Invalid and unsupported query parameters are discarded.

Amounts, notes, attachment data, PINs, search text and financial filters are not put
in URLs. Transient dialogs remain local component state; optional transaction
drafts are saved in IndexedDB. Neither is a deep-link target.

## Hosting and PWA

Cloudflare Pages serves the SPA entry point for deep links by default when there is
no top-level `404.html`; keep the 404 screen client-side. See the
[Cloudflare serving-pages documentation](https://developers.cloudflare.com/pages/configuration/serving-pages/).
Vite's preview/dev servers also use SPA fallback. The PWA service worker explicitly
uses `/index.html` as its navigation fallback so cached routes can open offline.

## Manual checks

1. Navigate to History, Calendar, Settings → Privacy, Wallets → Goals.
2. Confirm the address changes and Back/Forward restores each screen.
3. Reload a nested URL, then paste it into a new tab.
4. Open a main-navigation link with Ctrl/Cmd-click or the browser context menu.
5. Swipe wallets and check the query parameter and Back stack.
6. Open an unknown route and use Go home; check a nonexistent wallet UUID.
7. On a phone, choose a settings section from the sheet: it must finish closing
   before the content changes. Browser navigation must dismiss any stale menu.
8. After a production build is cached, open a nested route offline.
