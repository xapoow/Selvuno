# Local data safety

All financial data and receipt files remain local to this browser origin. There
is no account, backend upload or cross-device synchronization in these features.
IndexedDB version 13 adds draft and retained-file tables without replacing the
existing database or deleting existing records.

## Full backup

Settings → Backup downloads `selvuno-backup-YYYY-MM-DD.zip` containing:

- The existing version-8 financial JSON: wallets, categories, transactions
  (including Trash), templates, budgets, recurring payments, goals, transfers and
  app preferences.
- Current receipt photos and PDFs, including files attached to trashed operations.
- A manifest with metadata and SHA-256 checksums for data and every attachment.

The archive is **not encrypted**. Keep it private. It deliberately excludes PIN
secrets, draft transactions, older restore points, camera preferences, caches and
other browser-local UI state. PIN protection must be configured separately on a
new device. Checksums detect corruption, not the authenticity of the sender.

Limits: 128 MiB per archive and unpacked contents, 16 MiB for financial JSON,
1,000 files, five files per transaction and 10 MiB per file. ZIP creation leaves
1 MiB of headroom for metadata. JPEG, PNG, WebP and PDF are supported. The importer
accepts stored or deflated entries, bounds inflation and rejects unexpected paths,
duplicate entries, missing files and invalid metadata before replacement.

Import first shows creation date and wallet, transaction and file counts. No data
is replaced until explicit confirmation. A `before-restore` snapshot is saved
first; if this fails (for example because of quota), replacement does not start.
Replacement runs in one database transaction. Imported file IDs are regenerated
so an external archive cannot replace bytes retained by older restore points.

Legacy JSON versions 1–8 remain supported. JSON contains **no file bytes**. Only
files already present locally whose transaction IDs match the restored data can
be kept; missing files cannot be recovered from JSON. Attachment counts are
recomputed from the files actually restored.

## Local restore history

New restore points retain receipt bytes in a separate table. Immutable live file
IDs are shared between restore points, rather than duplicated for every snapshot.
Deleting a restore point removes only copies no remaining restore point needs;
live attachments are unaffected. Up to 12 restore points are kept. Existing
automatic snapshots in the same ten-minute session continue to be updated.

Old restore points without stored receipt copies follow the legacy JSON rule.
Local restore history is not protection against browser data deletion or losing
the device. Export ZIP archives outside the browser periodically.

## Transaction drafts

Settings → Optional features → Transaction drafts controls autosave (on by
default). It applies only to unfinished **new single transactions**, not edits,
recurring-payment forms or PINs. One draft is kept per starting wallet context.

Amount expressions, category, wallet, date, note, tags and selected files are
saved after a 400 ms idle interval. Navigation flushes pending changes; page-hide
and background flushes are best effort, because a browser may terminate the page
before asynchronous writes finish. Wait for the saved indicator before closing.

Returning to the form offers Continue draft / Delete draft without silently
overwriting the form. Successful transaction saving clears the draft; failed
saving keeps it. Writes and deletion are serialized to prevent stale writes
from recreating a completed draft. Draft files use the same size/type limits as
normal attachments. Drafts older than 30 days are pruned on the next app access.

Turning autosave off stops new writes but does not delete existing drafts. Use
Storage to delete them explicitly. Full ZIP exports contain saved transactions,
not drafts.

## Storage controls

Settings → Storage (`/settings/storage`) shows browser usage/quota estimates,
transaction/wallet counts, current receipt sizes, restore-file sizes, draft-file
sizes and the date the last ZIP was prepared. That date cannot prove the browser
actually saved a download to disk. Browser estimates include application caches;
file-specific totals do not include database overhead.

The page lists up to 100 largest current receipt files. Deleting a file requires
confirmation, updates its transaction's file count and preserves any copies still
referenced by restore history. This also works for trashed transactions. Clearing
drafts or restore history has its own confirmation and does not remove saved
transactions or current receipts.

Request persistent storage is an explicit, optional browser permission request.
Nothing is requested automatically. The browser may refuse or lack the API;
storage controls still work. A grant reduces automatic eviction risk but is not
a backup and does not protect against manual deletion or device loss.

## Manual device checks before release

1. Attach a photo and PDF, export a ZIP, then restore it in a separate browser
   profile. Verify file previews and amounts. Do not clear a real profile to test.
2. Cancel a restore preview; verify current data is unchanged. Import an old JSON
   and check that its warning is clear and missing file counts are corrected.
3. Type an amount expression and attach a file. Leave the form, return and resume.
   Save, return again and verify no completed draft reappears.
4. Turn drafts off and verify new forms do not autosave. Clear saved drafts in
   Storage explicitly if desired.
5. Test storage request granted/refused/unsupported, and deletion confirmations
   on mobile and desktop. Check that clearing history leaves current files intact.
