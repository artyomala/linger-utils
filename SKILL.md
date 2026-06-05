---
name: linger-utils
description: Agent standard function library system. Use before writing code to find reusable standard functions, lint after writing, and register newly created reusable helpers.
---

# Agent Standard Function Library

This skill is not just a TypeScript utility package. It is the agent's reuse discipline:

```text
check/find before writing -> use an existing standard function when available
write once when missing   -> register/sync it into the catalog
lint after writing        -> catch repeated native implementations
```

## Required Pre-Code Hook

Before writing code, run:

```bash
python3 ~/openclaw-identity/tools/toolkit.py check "<feature or module>"
python3 ~/openclaw-identity/tools/toolkit.py find "<feature or module>"
```

If a standard function exists, use it instead of writing another implementation.

Common mappings:

| Need | Standard function |
|:--|:--|
| HTTP request | `apiFetch`, `createApiClient` |
| retry/backoff | `retry`, `sleep`, `withTimeout` |
| file read/write | `tryReadFile`, `tryWriteFile`, `backupFile` |
| IDs/time | `shortId`, `createCorrelationId`, `isoTimestamp`, `formatZhTime` |
| logs | `logger`, `createLogger` |
| API result shapes | `ok`, `fail`, `isSuccess`, `isError`, `ERRORS` |

## After Writing Code

Run:

```bash
python3 ~/openclaw-identity/tools/toolkit.py lint <file> --ci
```

If you wrote a reusable helper that was not already present:

```bash
python3 ~/openclaw-identity/tools/toolkit.py register <file> \
  --name <functionName> \
  --description "<what future agents should search for>"
python3 ~/openclaw-identity/tools/toolkit.py sync
```

## Local Development

Inside this repo:

```bash
npm run ci
python3 scripts/toolkit.py find "retry"
python3 scripts/toolkit.py list
```

The canonical delivery model is clone + install/configure, not npm publish.
