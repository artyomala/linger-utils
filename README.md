# @linger/utils

Shared TypeScript utilities for API clients, structured responses, logging, file operations, IDs, and retry logic.

## Installation

```bash
npm install @linger/utils
```

The package is ESM-only and supports Node.js 20 or newer.

Express helpers are exposed as an optional subpath. Install Express in applications that use it:

```bash
npm install express
```

## API

### Fetch

`apiFetch(path, options)` wraps `fetch` and returns an `ApiResponse<T>` instead of throwing for HTTP or network failures.

```ts
import { apiFetch, createApiClient } from '@linger/utils';

const res = await apiFetch('https://api.example.com/status');

const api = createApiClient({ baseUrl: 'https://api.example.com' });
const user = await api<{ id: string }>('/users/123', {
  headers: { Authorization: 'Bearer token' },
});
```

There is no default `baseUrl`. Pass an absolute URL to `apiFetch`, pass `baseUrl` in options, or create a client with `createApiClient({ baseUrl })`.

### Responses

```ts
import { ok, fail, isSuccess, ERRORS } from '@linger/utils';

const created = ok({ id: '123' });
const denied = fail(ERRORS.FORBIDDEN.error, ERRORS.FORBIDDEN.code);

if (isSuccess(created)) {
  console.log(created.data.id);
}
```

### Logger

```ts
import { logger, createLogger } from '@linger/utils';

logger.info('Server', 'Started');

const appLogger = createLogger({ prefix: '[my-app]' });
appLogger.warn('Config', 'Using fallback value', { key: 'timeout' });
```

The default logger has no brand prefix. Use `createLogger` to add one.

### File Helpers

```ts
import { tryReadFile, tryWriteFile, backupFile, simpleDiff } from '@linger/utils';

await tryWriteFile('./data/result.txt', 'hello');
const content = await tryReadFile('./data/result.txt');
const backupPath = await backupFile('./data/result.txt');
const diff = simpleDiff('old', 'new');
```

`tryWriteFile` writes through a unique temporary file before renaming it into place.

### IDs And Time

```ts
import { shortId, createCorrelationId, isoTimestamp, formatZhTime } from '@linger/utils';

shortId();
createCorrelationId('web', 'room-1');
isoTimestamp();
formatZhTime();
```

### Retry And Timeout

```ts
import { retry, withTimeout } from '@linger/utils';

const result = await retry(() => fetchImportantData(), {
  maxAttempts: 3,
  backoffMs: 250,
});

await withTimeout(async (signal) => {
  const res = await fetch('https://api.example.com/slow', { signal });
  return res.json();
}, 1000);
```

When `withTimeout` receives a function, it passes an `AbortSignal` and aborts it on timeout.

### Express Helpers

```ts
import { sendError, sendKnownError } from '@linger/utils/express';

app.get('/private', (_req, res) => {
  return sendKnownError(res, 'AUTH_REQUIRED', 401);
});

app.post('/items', (_req, res) => {
  return sendError(res, { error: 'Invalid item', code: 'VALIDATION_ERROR' }, 400);
});
```

## Development

```bash
npm install
npm test -- --run
npm run build
npm run ci
```
