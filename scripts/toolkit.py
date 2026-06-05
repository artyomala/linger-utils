#!/usr/bin/env python3
"""
Portable toolkit for the Agent Standard Function Library.

Commands:
  find <query>       Search the standard function catalog.
  check <query>      Pre-code hook: show likely standard functions.
  sync               Rebuild catalog/standard-functions.json from src/*.ts.
  register <file>    Add or enrich a newly written reusable function.
  lint <file> --ci   Flag native patterns that should use standard functions.
  list               List catalog entries.
  status             Show configured paths and catalog status.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = REPO_ROOT / "catalog" / "standard-functions.json"
CONFIG_FILE = REPO_ROOT / ".agent-stdlib.json"

FUNCTION_RE = re.compile(
    r"^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)(?:<[^>]+>)?\s*\("
)
CONST_RE = re.compile(r"^export\s+const\s+([A-Za-z_$][\w$]*)\s*=")
TYPE_RE = re.compile(r"^export\s+(?:interface|type)\s+([A-Za-z_$][\w$]*)\b")


MODULE_SUGGESTIONS = {
    "http": ["apiFetch", "createApiClient"],
    "request": ["apiFetch", "createApiClient"],
    "fetch": ["apiFetch", "createApiClient"],
    "retry": ["retry", "sleep", "withTimeout"],
    "backoff": ["retry"],
    "sleep": ["sleep"],
    "timeout": ["withTimeout"],
    "file": ["tryReadFile", "tryWriteFile", "backupFile"],
    "read": ["tryReadFile"],
    "write": ["tryWriteFile"],
    "backup": ["backupFile"],
    "id": ["shortId", "createCorrelationId"],
    "uuid": ["shortId"],
    "time": ["isoTimestamp", "formatZhTime"],
    "log": ["logger", "createLogger"],
    "logger": ["logger", "createLogger"],
    "response": ["ok", "fail", "isSuccess", "isError", "ERRORS"],
    "error": ["fail", "ERRORS"],
}

LINT_PATTERNS = [
    (re.compile(r"\bfetch\("), "apiFetch/createApiClient"),
    (re.compile(r"\baxios\b"), "apiFetch/createApiClient"),
    (re.compile(r"\bsetTimeout\("), "sleep/withTimeout"),
    (re.compile(r"\bDate\.now\("), "isoTimestamp"),
    (re.compile(r"\b" + "random" + "UUID" + r"\b|\buuid\b"), "shortId/createCorrelationId"),
    (re.compile(r"\bconsole\.log\("), "logger.info/logger.warn/logger.error"),
    (re.compile(r"\breadFileSync\b|\bfs\.readFile\("), "tryReadFile"),
    (re.compile(r"\bwriteFileSync\b|\bfs\.writeFile\("), "tryWriteFile"),
]


@dataclass
class Config:
    repo_root: Path
    catalog: Path
    agent_name: str
    log_prefix: str


def load_config() -> Config:
    data: dict[str, Any] = {}
    if CONFIG_FILE.exists():
        data = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))

    agent_name = (
        os.environ.get("AGENT_STDLIB_AGENT_NAME")
        or data.get("agent_name")
        or "绫儿"
    )
    log_prefix = (
        os.environ.get("AGENT_STDLIB_LOG_PREFIX")
        or data.get("log_prefix")
        or f"[{agent_name}]"
    )
    catalog = Path(data.get("catalog", DEFAULT_CATALOG)).expanduser()
    if not catalog.is_absolute():
        catalog = REPO_ROOT / catalog
    return Config(REPO_ROOT, catalog, agent_name, log_prefix)


def read_json(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return fallback


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def emit(message: str = "", *, error: bool = False) -> None:
    stream = sys.stderr if error else sys.stdout
    stream.write(message + "\n")


def extract_description(lines: list[str], line_index: int) -> str:
    comments: list[str] = []
    i = line_index - 1
    while i >= 0:
        text = lines[i].strip()
        if text.startswith("/**") or text.startswith("*") or text.startswith("//") or text.endswith("*/"):
            clean = (
                text.replace("/**", "")
                .replace("*/", "")
                .lstrip("*")
                .strip()
            )
            if clean and not clean.startswith("@"):
                comments.append(clean)
            i -= 1
            continue
        if text == "":
            i -= 1
            continue
        break
    comments.reverse()
    return comments[0] if comments else ""


def keywords_for(name: str, description: str, file_path: Path) -> list[str]:
    words = re.findall(r"[A-Za-z][A-Za-z0-9_]+|[\u4e00-\u9fff]+", f"{name} {description} {file_path.stem}")
    return sorted({w.lower() for w in words if len(w) > 1})


def scan_source(src_dir: Path) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    for path in sorted(src_dir.glob("*.ts")):
        lines = path.read_text(encoding="utf-8").splitlines()
        for idx, line in enumerate(lines, start=1):
            stripped = line.strip()
            match = FUNCTION_RE.match(stripped) or CONST_RE.match(stripped) or TYPE_RE.match(stripped)
            if not match:
                continue
            name = match.group(1)
            rel = path.relative_to(REPO_ROOT).as_posix()
            description = extract_description(lines, idx - 1)
            entries.append(
                {
                    "name": name,
                    "kind": "export",
                    "file": rel,
                    "line": idx,
                    "signature": stripped,
                    "description": description,
                    "keywords": keywords_for(name, description, path),
                    "source": "src",
                }
            )
    return entries


def load_catalog(config: Config) -> dict[str, Any]:
    return read_json(config.catalog, {"version": 1, "agent_name": config.agent_name, "functions": []})


def save_catalog(config: Config, entries: list[dict[str, Any]]) -> None:
    data = {
        "version": 1,
        "agent_name": config.agent_name,
        "log_prefix": config.log_prefix,
        "generated_by": "scripts/toolkit.py sync",
        "functions": sorted(entries, key=lambda item: item["name"].lower()),
    }
    write_json(config.catalog, data)


def score_entry(entry: dict[str, Any], terms: list[str]) -> int:
    blob = " ".join(
        [
            entry.get("name", ""),
            entry.get("description", ""),
            entry.get("file", ""),
            " ".join(entry.get("keywords", [])),
        ]
    ).lower()
    score = 0
    name = entry.get("name", "").lower()
    for term in terms:
        if term == name:
            score += 20
        elif term in name:
            score += 10
        elif term in entry.get("keywords", []):
            score += 5
        elif term in blob:
            score += 2
    return score


def command_sync(args: argparse.Namespace) -> int:
    config = load_config()
    entries = scan_source(config.repo_root / "src")
    save_catalog(config, entries)
    emit(f"Synced {len(entries)} standard functions -> {config.catalog}")

    if args.codegraph and shutil.which("npx"):
        try:
            subprocess.run(
                ["npx", "@colbymchenry/codegraph", "sync"],
                cwd=config.repo_root,
                check=False,
                timeout=45,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except (subprocess.TimeoutExpired, OSError):
            pass
    return 0


def command_find(args: argparse.Namespace) -> int:
    config = load_config()
    catalog = load_catalog(config)
    terms = [t.lower() for t in re.findall(r"[\w\u4e00-\u9fff]+", args.query)]
    ranked = []
    for entry in catalog.get("functions", []):
        score = score_entry(entry, terms)
        if score:
            ranked.append((score, entry))
    ranked.sort(key=lambda pair: (-pair[0], pair[1]["name"]))

    emit(f"Search: {args.query}")
    emit("-" * 48)
    if not ranked:
        emit("No standard function found. Write it once, then run toolkit register/sync.")
        return 1 if args.ci else 0

    for score, entry in ranked[: args.limit]:
        emit(f"- {entry['name']} ({entry['file']}:{entry['line']}, score={score})")
        if entry.get("description"):
            emit(f"  {entry['description']}")
        emit(f"  {entry.get('signature', '')}")
    return 0


def command_check(args: argparse.Namespace) -> int:
    config = load_config()
    catalog = load_catalog(config)
    q = args.query.lower()
    suggested_names: list[str] = []
    for key, names in MODULE_SUGGESTIONS.items():
        if key in q or q in key:
            suggested_names.extend(names)

    by_name = {entry["name"]: entry for entry in catalog.get("functions", [])}
    found = [by_name[name] for name in dict.fromkeys(suggested_names) if name in by_name]

    emit(f"Pre-code check: {args.query}")
    emit("-" * 48)
    emit(f"Agent: {config.agent_name}  Prefix: {config.log_prefix}")
    if found:
        emit("Use these before writing new code:")
        for entry in found:
            emit(f"- {entry['name']} -> {entry['file']}:{entry['line']}")
        return 0

    emit("No mapped standard function. Run toolkit find for broader search.")
    return 0


def command_register(args: argparse.Namespace) -> int:
    config = load_config()
    path = Path(args.file).expanduser()
    if not path.is_absolute():
        path = Path.cwd() / path
    if not path.exists():
        emit(f"ERROR: file not found: {path}", error=True)
        return 2

    entries = load_catalog(config).get("functions", [])
    rel = path.relative_to(config.repo_root).as_posix() if path.is_relative_to(config.repo_root) else str(path)
    text = path.read_text(encoding="utf-8")
    line_num = 1
    signature = ""
    if args.name:
        for idx, line in enumerate(text.splitlines(), start=1):
            if re.search(rf"\b{re.escape(args.name)}\b", line):
                line_num = idx
                signature = line.strip()
                break

    name = args.name or path.stem
    entry = {
        "name": name,
        "kind": args.kind,
        "file": rel,
        "line": line_num,
        "signature": signature,
        "description": args.description or "",
        "keywords": keywords_for(name, args.description or "", path),
        "source": "manual-register",
    }

    replaced = False
    for idx, existing in enumerate(entries):
        if existing.get("name") == name:
            entries[idx] = {**existing, **entry}
            replaced = True
            break
    if not replaced:
        entries.append(entry)
    save_catalog(config, entries)
    emit(f"Registered {name} -> {config.catalog}")
    return 0


def command_lint(args: argparse.Namespace) -> int:
    path = Path(args.file).expanduser()
    if not path.is_absolute():
        path = Path.cwd() / path
    if not path.exists():
        emit(f"ERROR: file not found: {path}", error=True)
        return 2

    errors: list[str] = []
    for idx, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("//") or stripped.startswith("#"):
            continue
        if re.match(r'"[A-Za-z0-9_]+":\s*\[', stripped):
            continue
        for pattern, suggestion in LINT_PATTERNS:
            if pattern.search(stripped):
                if "apiFetch" in stripped or "logger." in stripped or "tryReadFile" in stripped:
                    continue
                errors.append(f"E{idx}: {stripped[:80]} -> use {suggestion}")
                break

    emit(f"Lint: {path}")
    emit("-" * 48)
    if not errors:
        emit("No standard-library issues found.")
        return 0
    for err in errors:
        emit(err)
    return 1 if args.ci else 0


def command_list(args: argparse.Namespace) -> int:
    config = load_config()
    catalog = load_catalog(config)
    for entry in catalog.get("functions", []):
        emit(f"{entry['name']}\t{entry['file']}:{entry['line']}\t{entry.get('description', '')}")
    return 0


def command_status(args: argparse.Namespace) -> int:
    config = load_config()
    catalog = load_catalog(config)
    emit("Agent Standard Library Toolkit")
    emit("-" * 48)
    emit(f"repo:     {config.repo_root}")
    emit(f"catalog:  {config.catalog}")
    emit(f"agent:    {config.agent_name}")
    emit(f"prefix:   {config.log_prefix}")
    emit(f"entries:  {len(catalog.get('functions', []))}")
    emit(f"codegraph:{' available' if shutil.which('npx') else ' not checked'}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Agent standard function toolkit")
    sub = parser.add_subparsers(dest="command", required=True)

    p_find = sub.add_parser("find")
    p_find.add_argument("query")
    p_find.add_argument("--limit", type=int, default=8)
    p_find.add_argument("--ci", action="store_true")
    p_find.set_defaults(func=command_find)

    p_check = sub.add_parser("check")
    p_check.add_argument("query")
    p_check.set_defaults(func=command_check)

    p_sync = sub.add_parser("sync")
    p_sync.add_argument("--codegraph", action="store_true", help="Also run optional CodeGraph sync")
    p_sync.set_defaults(func=command_sync)

    p_register = sub.add_parser("register")
    p_register.add_argument("file")
    p_register.add_argument("--name", required=True)
    p_register.add_argument("--description", default="")
    p_register.add_argument("--kind", default="function")
    p_register.set_defaults(func=command_register)

    p_lint = sub.add_parser("lint")
    p_lint.add_argument("file")
    p_lint.add_argument("--ci", action="store_true")
    p_lint.set_defaults(func=command_lint)

    p_list = sub.add_parser("list")
    p_list.set_defaults(func=command_list)

    p_status = sub.add_parser("status")
    p_status.set_defaults(func=command_status)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
