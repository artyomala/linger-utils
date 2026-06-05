# Linger Agent Standard Library System

This repository is not primarily an npm package. It is a small, cloneable system for building an agent-owned standard function library that improves every time agents write code.

The loop is:

```text
Before coding  -> toolkit check/find asks whether a standard function exists
If found        -> use the existing standard function
If not found    -> write the function once
After coding    -> toolkit register/sync indexes it into the local catalog
Next time       -> toolkit find surfaces it before duplicate code is written
```

## What Is In This Repo

| Path | Purpose |
|:--|:--|
| `src/` | TypeScript standard functions such as `apiFetch`, `retry`, `logger`, file helpers, IDs, and response helpers. |
| `scripts/toolkit.py` | Portable toolkit command center: `find`, `sync`, `check`, `lint`, `register`, `list`, `status`. |
| `SKILL.md` | OpenClaw/Codex skill instructions that teach agents to check before writing and register after writing. |
| `catalog/standard-functions.json` | Generated local function catalog used by `toolkit find`. |
| `scripts/install.py` | Installer that links/copies the toolkit and skill into a target agent workspace. |

The TypeScript code remains buildable and testable because the standard library needs a real implementation, but publishing to npm is not the delivery model.

## Install Into An Agent Workspace

Clone the repository somewhere stable:

```bash
git clone https://github.com/artyomala/linger-utils.git ~/agent-stdlib
cd ~/agent-stdlib
python3 scripts/install.py \
  --workspace ~/.openclaw/workspace \
  --identity ~/openclaw-identity \
  --agent-name "绫儿"
```

Then agents use:

```bash
python3 ~/openclaw-identity/tools/toolkit.py check "http request"
python3 ~/openclaw-identity/tools/toolkit.py find "retry"
python3 ~/openclaw-identity/tools/toolkit.py lint path/to/file.ts --ci
```

The installer writes a small config file at `.agent-stdlib.json` and installs:

```text
<identity>/tools/toolkit.py
<workspace>/skills/linger-utils/SKILL.md
<workspace>/skills/linger-utils/src/...
```

Use `.agent-stdlib.example.json` as the template if you want to manage the config manually.

## Minimum Workflow For Another Agent

1. Clone this repo.
2. Run `python3 scripts/install.py --workspace <workspace> --identity <identity> --agent-name <name>`.
3. Add the rule to the agent instructions: before writing code, run `toolkit.py check "<feature>"`; after writing, run `toolkit.py lint <file> --ci`.
4. When a new reusable function is created, run `toolkit.py register <file> --name <functionName> --description "<what it does>"`.
5. Run `toolkit.py sync` whenever `src/` changes.

## Why Some Linger-Specific Pieces Stay

This repo started as 绫儿's working standard library. That is useful: a standard library without a real agent's taste and repeated use becomes a generic utility dump.

Keep as examples or defaults:

- The `linger-utils` skill name: it is the seed library identity.
- Chinese examples and `[绫儿]` style log prefixes in documentation: they show that each agent should own a recognizable house style.
- OpenClaw-oriented paths in examples: they document the original deployment target.

Generalize for reuse:

- Runtime paths must come from installer/config, not hard-coded `/root/.openclaw`.
- Agent name and log prefix must be configurable.
- `toolkit.py` must work from a cloned repo before it is installed.
- Public docs should describe the check/find/register loop instead of `npm install`.

## Development

```bash
npm install
npm run ci
python3 scripts/toolkit.py status
python3 scripts/toolkit.py sync
python3 scripts/toolkit.py find "file read"
```

`npm run ci` verifies the TypeScript library. `toolkit.py sync` verifies that exported functions are discoverable by the agent workflow.

To refresh the optional CodeGraph index as well:

```bash
python3 scripts/toolkit.py sync --codegraph
```

## Architecture Review Notes

What the current architecture did right:

- It made reuse mandatory at the agent behavior layer, not just available as a package.
- It used source code as the source of truth and let indexing discover functions.
- It combined code search, usage stats, and linting into one command center.
- It kept the standard functions small, concrete, and close to recurring agent tasks.

What was wrong in the npm-oriented direction:

- `npm install @linger/utils` solves library distribution but not agent behavior.
- Removing local defaults such as the Gateway base URL made the seed library less useful in its home environment.
- English-only generic docs hid the real self-evolving workflow.
- `prepublishOnly`, package `files`, npm installation docs, and public package positioning distracted from clone/install/configure.

Missing key components:

- A portable installer.
- A generated registry file with descriptions and keywords, not only CodeGraph output.
- A real `register` command for newly written functions.
- Configuration for workspace, identity, agent name, and source library path.
- Clear OpenClaw Skill instructions shipped with the repo.
- Optional deeper integration with CodeGraph when it exists, with a local fallback when it does not.
