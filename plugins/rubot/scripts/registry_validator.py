#!/usr/bin/env python3
"""
Registry Validator for components.json

Validates that a project's components.json contains all mandatory shadcn
registries defined in the rubot template.

Usage:
    python registry_validator.py <project_path>
    python registry_validator.py /path/to/project
    python registry_validator.py .  # current directory
"""

import argparse
import json
import sys
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ValidationResult:
    """Holds validation results."""
    errors: list = field(default_factory=list)
    warnings: list = field(default_factory=list)
    info: list = field(default_factory=list)

    def add_error(self, message: str) -> None:
        self.errors.append(f"ERROR: {message}")

    def add_warning(self, message: str) -> None:
        self.warnings.append(f"WARNING: {message}")

    def add_info(self, message: str) -> None:
        self.info.append(f"INFO: {message}")

    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0

    def print_report(self) -> None:
        print("=" * 60)
        print("REGISTRY VALIDATION REPORT")
        print("=" * 60)
        print()

        if self.info:
            for msg in self.info:
                print(f"  {msg}")
            print()

        if self.errors:
            print("ERRORS:")
            for msg in self.errors:
                print(f"  {msg}")
            print()

        if self.warnings:
            print("WARNINGS:")
            for msg in self.warnings:
                print(f"  {msg}")
            print()

        print("=" * 60)
        status = "PASSED" if self.is_valid else "FAILED"
        print(f"SUMMARY: {len(self.errors)} errors, {len(self.warnings)} warnings - {status}")
        print("=" * 60)


def get_template_path() -> Path:
    """Get path to the template file."""
    # Template is relative to this script's location
    script_dir = Path(__file__).parent.resolve()
    template_path = script_dir.parent / "templates" / "components.json.template"
    return template_path


def find_components_json(project_path: Path) -> Optional[Path]:
    """Find components.json in common locations."""
    common_locations = [
        project_path / "components.json",
        project_path / "src" / "components.json",
    ]

    for location in common_locations:
        if location.exists():
            return location

    return None


def load_json_file(file_path: Path, result: ValidationResult) -> Optional[dict]:
    """Load and parse a JSON file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        result.add_error(f"Invalid JSON in {file_path.name}: {e}")
        return None
    except Exception as e:
        result.add_error(f"Failed to read {file_path.name}: {e}")
        return None


def validate_registries(
    project_data: dict,
    template_data: dict,
    result: ValidationResult
) -> None:
    """Validate that all template registries are present in project."""
    template_registries = template_data.get("registries", {})
    project_registries = project_data.get("registries", {})

    if not template_registries:
        result.add_warning("Template has no registries defined")
        return

    if not project_registries:
        result.add_error("Project components.json has no 'registries' field")
        return

    result.add_info(f"Template defines {len(template_registries)} mandatory registries")
    result.add_info(f"Project has {len(project_registries)} registries configured")

    # Check each required registry
    missing_registries = []
    mismatched_urls = []
    found_registries = []

    for registry_name, template_url in template_registries.items():
        if registry_name not in project_registries:
            missing_registries.append(registry_name)
        else:
            project_url = project_registries[registry_name]
            if project_url != template_url:
                mismatched_urls.append({
                    "name": registry_name,
                    "expected": template_url,
                    "found": project_url
                })
            else:
                found_registries.append(registry_name)

    # Report missing registries
    if missing_registries:
        for registry in missing_registries:
            result.add_error(f"Missing registry: {registry}")
            result.add_info(f"  Expected URL: {template_registries[registry]}")

    # Report mismatched URLs
    if mismatched_urls:
        for mismatch in mismatched_urls:
            result.add_warning(f"Registry URL mismatch: {mismatch['name']}")
            result.add_info(f"  Expected: {mismatch['expected']}")
            result.add_info(f"  Found: {mismatch['found']}")

    # Report found registries
    if found_registries:
        result.add_info(f"Correctly configured: {len(found_registries)}/{len(template_registries)} registries")

    # Check for extra registries (informational only)
    extra_registries = set(project_registries.keys()) - set(template_registries.keys())
    if extra_registries:
        result.add_info(f"Additional registries in project: {', '.join(sorted(extra_registries))}")


def validate_basic_structure(project_data: dict, result: ValidationResult) -> None:
    """Validate basic components.json structure."""
    required_fields = ["$schema", "style", "tsx", "tailwind", "aliases"]

    for field in required_fields:
        if field not in project_data:
            result.add_warning(f"Missing recommended field: {field}")

    # Check tailwind config
    tailwind_config = project_data.get("tailwind", {})
    if tailwind_config:
        if "css" not in tailwind_config:
            result.add_warning("tailwind.css path not specified")
        if "cssVariables" not in tailwind_config:
            result.add_warning("tailwind.cssVariables not specified")

    # Check aliases
    aliases = project_data.get("aliases", {})
    if aliases:
        recommended_aliases = ["components", "utils", "ui", "lib", "hooks"]
        for alias in recommended_aliases:
            if alias not in aliases:
                result.add_warning(f"Missing recommended alias: {alias}")


def validate_components_json(
    project_file: Path,
    template_file: Path,
    result: ValidationResult
) -> None:
    """Main validation function."""
    result.add_info(f"Project file: {project_file}")
    result.add_info(f"Template file: {template_file}")

    # Load template
    template_data = load_json_file(template_file, result)
    if template_data is None:
        return

    # Load project file
    project_data = load_json_file(project_file, result)
    if project_data is None:
        return

    # Validate basic structure
    validate_basic_structure(project_data, result)

    # Validate registries
    validate_registries(project_data, template_data, result)


def generate_fix_snippet(template_path: Path) -> str:
    """Generate a snippet showing how to add missing registries."""
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            template_data = json.load(f)

        registries = template_data.get("registries", {})
        if not registries:
            return ""

        snippet = '\n"registries": ' + json.dumps(registries, indent=2)
        return snippet
    except Exception:
        return ""


def main():
    parser = argparse.ArgumentParser(
        description="Validate components.json against rubot registry template",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python registry_validator.py /path/to/project
    python registry_validator.py .
    python registry_validator.py ~/projects/my-app

The script looks for components.json in:
    - <project>/components.json
    - <project>/src/components.json

Template location:
    ~/.claude/plugins/rubot/templates/components.json.template
        """
    )
    parser.add_argument(
        "project_path",
        type=str,
        help="Path to the project directory"
    )
    parser.add_argument(
        "--file",
        type=str,
        help="Direct path to components.json (overrides auto-detection)",
        default=None
    )
    parser.add_argument(
        "--template",
        type=str,
        help="Custom template file path (overrides default)",
        default=None
    )
    parser.add_argument(
        "--show-fix",
        action="store_true",
        help="Show snippet to fix missing registries"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON"
    )

    args = parser.parse_args()
    result = ValidationResult()

    project_path = Path(args.project_path).resolve()

    if not project_path.exists():
        result.add_error(f"Project path does not exist: {project_path}")
        result.print_report()
        sys.exit(1)

    # Find or use specified components.json
    if args.file:
        components_file = Path(args.file).resolve()
    else:
        components_file = find_components_json(project_path)

    if components_file is None:
        result.add_error(f"Could not find components.json in project: {project_path}")
        result.add_info("Searched in: components.json, src/components.json")
        result.print_report()
        sys.exit(1)

    if not components_file.exists():
        result.add_error(f"Components file does not exist: {components_file}")
        result.print_report()
        sys.exit(1)

    # Get template path
    if args.template:
        template_file = Path(args.template).resolve()
    else:
        template_file = get_template_path()

    if not template_file.exists():
        result.add_error(f"Template file does not exist: {template_file}")
        result.print_report()
        sys.exit(1)

    # Run validation
    validate_components_json(components_file, template_file, result)

    # Output results
    if args.json:
        import json as json_module
        output = {
            "valid": result.is_valid,
            "errors": result.errors,
            "warnings": result.warnings,
            "info": result.info
        }
        print(json_module.dumps(output, indent=2))
    else:
        result.print_report()

    # Show fix snippet if requested and there are errors
    if args.show_fix and not result.is_valid:
        print("\n" + "=" * 60)
        print("FIX: Add the following registries to your components.json:")
        print("=" * 60)
        snippet = generate_fix_snippet(template_file)
        if snippet:
            print(snippet)

    # Exit with appropriate code
    sys.exit(0 if result.is_valid else 1)


if __name__ == "__main__":
    main()
