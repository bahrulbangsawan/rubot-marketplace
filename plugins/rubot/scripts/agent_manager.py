#!/usr/bin/env python3
"""
Agent Manager for Rubot Plugin
===============================

A comprehensive Python script to manage, validate, sync, and report on
all agents in the rubot multi-agent orchestration plugin.

Usage:
    python agent_manager.py <command> [options]

Commands:
    list     - List all agents in the folder
    check    - Validate agent structure and required fields
    add      - Add new agents to rubot plugin
    sync     - Sync agents from source folder to rubot
    validate - Validate agent frontmatter and system prompts
    report   - Generate agent capability report

Examples:
    python agent_manager.py list
    python agent_manager.py check
    python agent_manager.py sync                    # syncs from ~/.claude/agents/ by default
    python agent_manager.py sync /custom/path      # sync from custom source
    python agent_manager.py report
    python agent_manager.py validate backend-master
"""

import os
import sys
import re
import shutil
import argparse
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional
import json


# Configuration
PLUGIN_ROOT = Path(__file__).parent.parent
AGENTS_DIR = PLUGIN_ROOT / "agents"
SOURCE_AGENTS_DIR = Path.home() / ".claude" / "agents"

# Required frontmatter fields
REQUIRED_FIELDS = ["name", "description", "model"]
OPTIONAL_FIELDS = ["color", "permissionMode", "tools"]
VALID_MODELS = ["opus", "sonnet", "haiku"]
VALID_COLORS = ["red", "orange", "yellow", "green", "cyan", "blue", "purple", "pink", "gray"]


@dataclass
class AgentInfo:
    """Represents parsed agent information."""
    name: str
    file_path: Path
    description: str = ""
    model: str = ""
    color: str = ""
    permission_mode: str = ""
    tools: list = field(default_factory=list)
    has_system_prompt: bool = False
    system_prompt_length: int = 0
    errors: list = field(default_factory=list)
    warnings: list = field(default_factory=list)


def parse_frontmatter(content: str) -> tuple[dict, str]:
    """Parse YAML frontmatter from markdown content."""
    frontmatter = {}
    body = content

    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            frontmatter_text = parts[1].strip()
            body = parts[2].strip()

            # Simple YAML parsing (handles basic key: value pairs)
            lines = frontmatter_text.split("\n")
            i = 0

            while i < len(lines):
                line = lines[i]

                if line.strip().startswith("#") or not line.strip():
                    i += 1
                    continue

                # Check for new key
                match = re.match(r'^(\w+):\s*(.*)$', line)
                if match:
                    key = match.group(1)
                    value = match.group(2).strip()

                    if value == "|" or value == ">":
                        # Multiline value - collect all indented lines
                        multiline_value = []
                        i += 1
                        while i < len(lines):
                            next_line = lines[i]
                            # Check if line is indented (part of multiline) or a new key
                            if next_line.startswith("  ") or next_line.strip() == "":
                                multiline_value.append(next_line)
                                i += 1
                            elif re.match(r'^(\w+):', next_line):
                                # New key found, stop collecting
                                break
                            else:
                                multiline_value.append(next_line)
                                i += 1
                        frontmatter[key] = "\n".join(multiline_value).strip()
                        continue
                    elif value.startswith("["):
                        # Inline list
                        frontmatter[key] = [
                            item.strip().strip("'\"")
                            for item in value.strip("[]").split(",")
                            if item.strip()
                        ]
                    elif value == "":
                        # Could be a list starting on next line, or multiline without |
                        collected = []
                        i += 1
                        while i < len(lines):
                            next_line = lines[i]
                            # Check if this is a new top-level key (not indented)
                            if re.match(r'^[a-zA-Z]', next_line) and ':' in next_line:
                                break
                            elif next_line.startswith("  ") or next_line.strip() == "":
                                collected.append(next_line)
                                i += 1
                            else:
                                break

                        # Process collected lines
                        if collected:
                            # Check if it's a list (lines starting with -)
                            is_list = all(
                                l.strip().startswith("- ") or l.strip() == ""
                                for l in collected if l.strip()
                            )
                            if is_list:
                                list_items = [
                                    l.strip()[2:].strip()
                                    for l in collected
                                    if l.strip().startswith("- ")
                                ]
                                frontmatter[key] = list_items
                            else:
                                # It's multiline text
                                frontmatter[key] = "\n".join(collected).strip()
                        continue
                    else:
                        frontmatter[key] = value.strip("'\"")

                i += 1

    return frontmatter, body


def parse_agent_file(file_path: Path) -> AgentInfo:
    """Parse an agent markdown file and extract information."""
    content = file_path.read_text(encoding="utf-8")
    frontmatter, body = parse_frontmatter(content)

    info = AgentInfo(
        name=frontmatter.get("name", file_path.stem),
        file_path=file_path,
        description=frontmatter.get("description", ""),
        model=frontmatter.get("model", ""),
        color=frontmatter.get("color", ""),
        permission_mode=frontmatter.get("permissionMode", ""),
        tools=frontmatter.get("tools", []),
        has_system_prompt=len(body) > 100,
        system_prompt_length=len(body)
    )

    # Validate required fields
    for field in REQUIRED_FIELDS:
        if not frontmatter.get(field):
            info.errors.append(f"Missing required field: {field}")

    # Validate model
    if info.model and info.model not in VALID_MODELS:
        info.warnings.append(f"Unknown model: {info.model} (valid: {', '.join(VALID_MODELS)})")

    # Validate color
    if info.color and info.color not in VALID_COLORS:
        info.warnings.append(f"Unknown color: {info.color} (valid: {', '.join(VALID_COLORS)})")

    # Check system prompt
    if not info.has_system_prompt:
        info.warnings.append("System prompt is very short or missing")

    return info


def list_agents(agents_dir: Path = AGENTS_DIR) -> list[AgentInfo]:
    """List all agent files in the directory."""
    agents = []

    if not agents_dir.exists():
        print(f"Error: Agents directory not found: {agents_dir}")
        return agents

    for file_path in sorted(agents_dir.glob("*.md")):
        try:
            info = parse_agent_file(file_path)
            agents.append(info)
        except Exception as e:
            print(f"Error parsing {file_path.name}: {e}")

    return agents


def cmd_list(args):
    """List all agents command."""
    agents = list_agents()

    if not agents:
        print("No agents found.")
        return

    print(f"\n{'='*60}")
    print(f"RUBOT AGENTS ({len(agents)} total)")
    print(f"{'='*60}\n")

    # Table header
    print(f"{'Name':<25} {'Model':<8} {'Color':<8} {'Prompt':<8} {'Status':<10}")
    print(f"{'-'*25} {'-'*8} {'-'*8} {'-'*8} {'-'*10}")

    for agent in agents:
        status = "OK" if not agent.errors else f"ERR({len(agent.errors)})"
        prompt_size = f"{agent.system_prompt_length//1000}k" if agent.system_prompt_length > 1000 else f"{agent.system_prompt_length}"
        print(f"{agent.name:<25} {agent.model:<8} {agent.color:<8} {prompt_size:<8} {status:<10}")

    print(f"\nLocation: {AGENTS_DIR}")


def cmd_check(args):
    """Check/validate all agents command."""
    agents = list_agents()

    if not agents:
        print("No agents found.")
        return

    print(f"\n{'='*60}")
    print("AGENT VALIDATION REPORT")
    print(f"{'='*60}\n")

    total_errors = 0
    total_warnings = 0

    for agent in agents:
        has_issues = agent.errors or agent.warnings

        if has_issues or args.verbose:
            print(f"\n{agent.name}")
            print(f"  File: {agent.file_path.name}")

            if agent.errors:
                for error in agent.errors:
                    print(f"  [ERROR] {error}")
                    total_errors += 1

            if agent.warnings:
                for warning in agent.warnings:
                    print(f"  [WARN]  {warning}")
                    total_warnings += 1

            if not has_issues:
                print("  [OK] All checks passed")

    print(f"\n{'='*60}")
    print(f"SUMMARY: {len(agents)} agents, {total_errors} errors, {total_warnings} warnings")
    print(f"{'='*60}")

    return total_errors == 0


def cmd_sync(args):
    """Sync agents from source directory to rubot plugin."""
    source_dir = Path(args.source) if args.source else SOURCE_AGENTS_DIR

    if not source_dir.exists():
        print(f"Error: Source directory not found: {source_dir}")
        return False

    print(f"\n{'='*60}")
    print("SYNC AGENTS")
    print(f"{'='*60}")
    print(f"Source: {source_dir}")
    print(f"Target: {AGENTS_DIR}\n")

    source_files = list(source_dir.glob("*.md"))
    target_files = {f.name: f for f in AGENTS_DIR.glob("*.md")}

    synced = 0
    updated = 0
    skipped = 0

    for source_file in source_files:
        target_file = AGENTS_DIR / source_file.name

        if source_file.name == "rubot.md":
            print(f"  SKIP: {source_file.name} (rubot orchestrator)")
            skipped += 1
            continue

        if target_file.exists():
            # Compare modification times
            source_mtime = source_file.stat().st_mtime
            target_mtime = target_file.stat().st_mtime

            if source_mtime > target_mtime:
                if not args.dry_run:
                    shutil.copy2(source_file, target_file)
                print(f"  UPDATE: {source_file.name}")
                updated += 1
            else:
                print(f"  OK: {source_file.name} (up to date)")
        else:
            if not args.dry_run:
                shutil.copy2(source_file, target_file)
            print(f"  ADD: {source_file.name}")
            synced += 1

    # Also sync CSS files like theme-example.css
    for source_file in source_dir.glob("*.css"):
        target_file = AGENTS_DIR / source_file.name

        if target_file.exists():
            source_mtime = source_file.stat().st_mtime
            target_mtime = target_file.stat().st_mtime

            if source_mtime > target_mtime:
                if not args.dry_run:
                    shutil.copy2(source_file, target_file)
                print(f"  UPDATE: {source_file.name}")
                updated += 1
        else:
            if not args.dry_run:
                shutil.copy2(source_file, target_file)
            print(f"  ADD: {source_file.name}")
            synced += 1

    print(f"\n{'='*60}")
    action = "Would sync" if args.dry_run else "Synced"
    print(f"{action}: {synced} new, {updated} updated, {skipped} skipped")
    print(f"{'='*60}")

    return True


def cmd_add(args):
    """Add a new agent to the rubot plugin."""
    source_file = Path(args.agent)

    if not source_file.exists():
        print(f"Error: Agent file not found: {source_file}")
        return False

    if not source_file.suffix == ".md":
        print(f"Error: Agent file must be a .md file")
        return False

    target_file = AGENTS_DIR / source_file.name

    if target_file.exists() and not args.force:
        print(f"Error: Agent already exists: {target_file}")
        print("Use --force to overwrite")
        return False

    # Validate the agent file first
    try:
        info = parse_agent_file(source_file)
        if info.errors:
            print(f"Warning: Agent has validation errors:")
            for error in info.errors:
                print(f"  - {error}")
            if not args.force:
                print("Use --force to add anyway")
                return False
    except Exception as e:
        print(f"Error parsing agent file: {e}")
        return False

    shutil.copy2(source_file, target_file)
    print(f"Added agent: {info.name} -> {target_file}")

    return True


def cmd_validate(args):
    """Validate a specific agent or all agents."""
    if args.agent:
        # Validate specific agent
        agent_file = AGENTS_DIR / f"{args.agent}.md"
        if not agent_file.exists():
            agent_file = AGENTS_DIR / args.agent
            if not agent_file.exists():
                print(f"Error: Agent not found: {args.agent}")
                return False

        info = parse_agent_file(agent_file)
        agents = [info]
    else:
        agents = list_agents()

    print(f"\n{'='*60}")
    print("DETAILED AGENT VALIDATION")
    print(f"{'='*60}\n")

    all_valid = True

    for agent in agents:
        print(f"\n## {agent.name}")
        print(f"   File: {agent.file_path}")
        print(f"   Model: {agent.model}")
        print(f"   Color: {agent.color}")
        print(f"   Permission Mode: {agent.permission_mode or 'default'}")
        print(f"   Tools: {len(agent.tools)} defined")
        print(f"   System Prompt: {agent.system_prompt_length} chars")

        if agent.errors:
            all_valid = False
            print("\n   ERRORS:")
            for error in agent.errors:
                print(f"   - {error}")

        if agent.warnings:
            print("\n   WARNINGS:")
            for warning in agent.warnings:
                print(f"   - {warning}")

        if not agent.errors and not agent.warnings:
            print("\n   STATUS: VALID")

    return all_valid


def cmd_report(args):
    """Generate a comprehensive agent capability report."""
    agents = list_agents()

    if not agents:
        print("No agents found.")
        return

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print(f"\n{'='*70}")
    print("RUBOT AGENT CAPABILITY REPORT")
    print(f"Generated: {timestamp}")
    print(f"{'='*70}\n")

    # Summary statistics
    total_agents = len(agents)
    opus_count = sum(1 for a in agents if a.model == "opus")
    sonnet_count = sum(1 for a in agents if a.model == "sonnet")
    haiku_count = sum(1 for a in agents if a.model == "haiku")

    print("## Summary Statistics\n")
    print(f"   Total Agents: {total_agents}")
    print(f"   By Model: opus={opus_count}, sonnet={sonnet_count}, haiku={haiku_count}")

    # Color distribution
    colors = {}
    for agent in agents:
        colors[agent.color] = colors.get(agent.color, 0) + 1
    print(f"   By Color: {', '.join(f'{c}={n}' for c, n in sorted(colors.items()))}")

    # Agents with tools
    agents_with_tools = [a for a in agents if a.tools]
    print(f"   With Custom Tools: {len(agents_with_tools)}")

    # Agents with bypass permissions
    bypass_agents = [a for a in agents if a.permission_mode == "bypassPermissions"]
    print(f"   With Bypass Permissions: {len(bypass_agents)}")

    print("\n## Agent Details\n")

    for agent in sorted(agents, key=lambda a: a.name):
        print(f"### {agent.name}")

        # Extract first sentence of description
        desc = agent.description
        if isinstance(desc, str):
            first_line = desc.split("\n")[0][:100]
            if len(first_line) < len(desc.split("\n")[0]):
                first_line += "..."
        else:
            first_line = str(desc)[:100]

        print(f"    {first_line}")
        print(f"    Model: {agent.model} | Color: {agent.color} | Prompt: {agent.system_prompt_length} chars")

        if agent.tools:
            print(f"    Tools: {', '.join(agent.tools[:5])}")
            if len(agent.tools) > 5:
                print(f"           ... and {len(agent.tools) - 5} more")

        print()

    # Domain coverage
    print("## Domain Coverage\n")
    domains = {
        "Backend/API": ["backend-master"],
        "Database": ["neon-master"],
        "Frontend/UI": ["shadcn-ui-designer", "dashboard-master"],
        "Charts/Visualization": ["chart-master"],
        "Theming": ["theme-master"],
        "SSR/Hydration": ["hydration-solver"],
        "Responsive": ["responsive-master"],
        "Full-stack": ["tanstack"],
        "Deployment": ["cloudflare"],
        "Testing/QA": ["qa-tester"],
        "Debugging": ["debug-master"],
        "SEO": ["seo-master"]
    }

    agent_names = {a.name for a in agents}

    for domain, required_agents in domains.items():
        coverage = all(a in agent_names for a in required_agents)
        status = "COVERED" if coverage else "MISSING"
        agents_str = ", ".join(required_agents)
        print(f"   [{status}] {domain}: {agents_str}")

    print(f"\n{'='*70}")
    print("END OF REPORT")
    print(f"{'='*70}\n")

    # Output JSON if requested
    if args.json:
        report_data = {
            "generated": timestamp,
            "total_agents": total_agents,
            "agents": [
                {
                    "name": a.name,
                    "model": a.model,
                    "color": a.color,
                    "permission_mode": a.permission_mode,
                    "tools_count": len(a.tools),
                    "prompt_length": a.system_prompt_length,
                    "valid": len(a.errors) == 0
                }
                for a in agents
            ]
        }

        output_file = PLUGIN_ROOT / "agent_report.json"
        with open(output_file, "w") as f:
            json.dump(report_data, f, indent=2)
        print(f"JSON report saved to: {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description="Agent Manager for Rubot Plugin",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # List command
    list_parser = subparsers.add_parser("list", help="List all agents")

    # Check command
    check_parser = subparsers.add_parser("check", help="Validate all agents")
    check_parser.add_argument("-v", "--verbose", action="store_true", help="Show all agents, not just those with issues")

    # Sync command
    sync_parser = subparsers.add_parser("sync", help="Sync agents from source directory")
    sync_parser.add_argument("source", nargs="?", help="Source directory (default: ~/.claude/agents)")
    sync_parser.add_argument("-n", "--dry-run", action="store_true", help="Show what would be synced without making changes")

    # Add command
    add_parser = subparsers.add_parser("add", help="Add a new agent")
    add_parser.add_argument("agent", help="Path to agent file to add")
    add_parser.add_argument("-f", "--force", action="store_true", help="Overwrite existing agent")

    # Validate command
    validate_parser = subparsers.add_parser("validate", help="Validate agent(s) in detail")
    validate_parser.add_argument("agent", nargs="?", help="Agent name to validate (all if not specified)")

    # Report command
    report_parser = subparsers.add_parser("report", help="Generate capability report")
    report_parser.add_argument("--json", action="store_true", help="Also output JSON report")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # Ensure agents directory exists
    AGENTS_DIR.mkdir(parents=True, exist_ok=True)

    commands = {
        "list": cmd_list,
        "check": cmd_check,
        "sync": cmd_sync,
        "add": cmd_add,
        "validate": cmd_validate,
        "report": cmd_report
    }

    result = commands[args.command](args)

    if result is False:
        sys.exit(1)


if __name__ == "__main__":
    main()
