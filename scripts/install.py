#!/usr/bin/env python3
"""Install the agent standard library into an OpenClaw-style workspace."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def emit(message: str = "") -> None:
    sys.stdout.write(message + "\n")


def copy_tree(src: Path, dst: Path) -> None:
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


def main() -> int:
    parser = argparse.ArgumentParser(description="Install Linger agent standard library")
    parser.add_argument("--workspace", required=True, help="Agent workspace path, e.g. ~/.openclaw/workspace")
    parser.add_argument("--identity", required=True, help="Agent identity path, e.g. ~/openclaw-identity")
    parser.add_argument("--agent-name", default="绫儿")
    parser.add_argument("--copy", action="store_true", help="Copy files instead of symlinking toolkit.py")
    args = parser.parse_args()

    workspace = Path(args.workspace).expanduser().resolve()
    identity = Path(args.identity).expanduser().resolve()
    skill_dir = workspace / "skills" / "linger-utils"
    tools_dir = identity / "tools"

    skill_dir.mkdir(parents=True, exist_ok=True)
    tools_dir.mkdir(parents=True, exist_ok=True)

    copy_tree(REPO_ROOT / "src", skill_dir / "src")
    shutil.copy2(REPO_ROOT / "SKILL.md", skill_dir / "SKILL.md")
    shutil.copy2(REPO_ROOT / "package.json", skill_dir / "package.json")
    shutil.copy2(REPO_ROOT / "tsconfig.json", skill_dir / "tsconfig.json")

    target_toolkit = tools_dir / "toolkit.py"
    if target_toolkit.exists() or target_toolkit.is_symlink():
        target_toolkit.unlink()
    if args.copy:
        shutil.copy2(REPO_ROOT / "scripts" / "toolkit.py", target_toolkit)
    else:
        target_toolkit.symlink_to(REPO_ROOT / "scripts" / "toolkit.py")

    config = {
        "agent_name": args.agent_name,
        "log_prefix": f"[{args.agent_name}]",
        "workspace": str(workspace),
        "identity": str(identity),
        "catalog": str(REPO_ROOT / "catalog" / "standard-functions.json"),
    }
    (REPO_ROOT / ".agent-stdlib.json").write_text(
        json.dumps(config, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    emit("Installed agent standard library")
    emit(f"skill:   {skill_dir}")
    emit(f"toolkit: {target_toolkit}")
    emit("next:    python3 scripts/toolkit.py sync")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
