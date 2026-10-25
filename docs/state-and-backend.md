# Application state and backend integration

The React application uses Redux Toolkit with the NgRx-style flow:

`UI -> typed async command -> injected FinanceGateway -> persistence -> snapshot patch -> reducer -> memoized selectors -> UI`

`state/appStore.ts` creates isolated stores and injects dependencies. `financeSlice.ts` keeps domain entities normalized with `createEntityAdapter`; `uiSlice.ts` owns navigation; `exchangeRatesSlice.ts` owns rates and their request state. Pure selectors own wallet context, converted totals, history filtering/sorting, budgets, observations, and recent transactions. Temporary form fields and animations remain component state. PIN credentials remain device-only and never enter finance commands or Redux state.

Automatic backups run through listener middleware, are debounced, and do not trigger themselves. Async commands expose pending request IDs and structured errors. Settings use per-request optimistic changes, so rejection rolls back only that request. Persisting a command and reading its affected resources are serialized per store. A failed read after a successful write produces a refresh error, not a failed-write response that could cause duplicate submissions.

IndexedDB remains persistent storage in local mode. Redux is its in-memory projection, not a second database. Existing database versions and user data are retained. Creating/editing a transaction together with attachments is atomic locally. File/Blob objects stay outside entity state; uploads exist only as transient thunk arguments and attachment viewers hold object URLs locally. Production Redux DevTools are disabled.

## Modes

Copy `apps/web/.env.example` to `.env.local` for local development:

```dotenv
VITE_DATA_MODE=local
```

The HTTP adapter is implemented, but this repository does **not** yet contain a backend or authentication UI. To connect a server implementing the following contract:

```dotenv
VITE_DATA_MODE=remote
VITE_API_BASE_URL=/api
```

Restart/rebuild after changing Vite variables. Never put secrets in `VITE_*` variables. Remote mode does not upload or migrate the existing local database automatically. A server failure does not silently switch to local storage. Remote offline mutations, account migration, conflict resolution and a synchronization outbox need a separate implementation once the backend's ownership/authentication model is chosen. Local mode retains current offline behavior.

## Shared contract

Both frontend and future backend can import `@myfinances/api-contracts`. This workspace package has no React, browser APIs, or IndexedDB dependency. It exports Zod schemas and types for snapshots, command inputs/results, attachment metadata, and errors. Backend validation must use these schemas and enforce account ownership and domain constraints.

Base URL below is `VITE_API_BASE_URL`, with `/v1` appended by the client.

| Endpoint | Request | Response |
| --- | --- | --- |
| `GET /v1/finance?resources=settings,wallets,...` | Comma-separated `FinanceResource` keys | `{ "data": { "settings": ..., "wallets": [...] } }` |
| `POST /v1/commands/{command}` | JSON `{ "input": ... }` validated by `commandInputSchemas[command]` | `{ "data": ... }` validated by `commandResultSchemas[command]` |
| `GET /v1/transactions/{id}/attachments` | Authenticated transaction ID | `{ "data": AttachmentMetadata[] }` |
| `GET /v1/transactions/{id}/attachments/{attachmentId}/content` | Authenticated IDs | Raw image/PDF bytes, matching metadata MIME type |

All requested snapshot resources must be present; a partial resource is not accepted. Each supplied array replaces that complete resource collection, so these endpoints must not paginate silently. Wallets include active and archived wallets, excluding deleted ones. Other collections contain active, non-deleted items. Deleted resources are represented by omission on refresh. A future paginated/delta API needs its own merge contract.

The server should read requested resources consistently, and must finish a command before returning success. Recurring transaction materialization happens on the server in remote mode; the browser never locally seeds an account or generates server schedules.

No-input commands (`exportBackup`, `createBackupSnapshot`) use `{ "input": null }`. Void results use `{ "data": null }`. Export/import use the versioned `FinanceBackup` schemas. Existing backups still exclude attachment bytes.

For `addTransactionWithAttachments` and `updateTransactionWithAttachments`, use `multipart/form-data`:

- `input`: JSON matching the shared command input schema; `newFiles` is omitted from JSON.
- `files`: repeated file fields, maximum five files total per transaction, each at most 10 MB.
- Creating uses `{ input: TransactionInput, removedAttachmentIds: [] }`; editing uses `{ id, submission: { input, removedAttachmentIds } }`.

The server must atomically save the transaction, add/remove attachments, and update `attachmentCount`. It must validate MIME type, size, file content, and ownership; frontend validation is not a security boundary.

## Authentication, errors and retries

Requests use `credentials: include`, suitable for an HttpOnly cookie session. The server must enforce authentication, authorization, CSRF/Origin checks and restrictive credentialed CORS where needed. No token is stored in Redux/localStorage. An account UI and session lifecycle are future backend work.

Mutating commands receive `Idempotency-Key` from their Redux request ID. The server must scope deduplication by account, command and key, return the original result for the same request, and reject reuse with a different payload. Do not blindly retry commands with a fresh key after uncertain network failure. The client does not automatically retry writes.

Errors use `{ "error": { "code": "...", "message": "..." } }`. Supported HTTP errors are preserved, including 401/403 for access, 409 for conflicts, 422 for validation, 429 for throttling and 5xx for server faults. Network errors and server errors are distinguishable in request state. No conflict is resolved automatically. Errors displayed to users must contain a safe user-facing message.

Use `createAppStore({ finance: testGateway, automaticBackups: false })` in tests. Gateway injection permits testing delayed responses, failures and cancellation without changing components.
