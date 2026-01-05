#!/usr/bin/env python3
"""
CSS Theme Validator for index.css

Validates that a project's index.css follows the theme-master agent rules
and strict format requirements for shadcn/ui + Tailwind CSS theming.

Usage:
    python css_validator.py <project_path>
    python css_validator.py /path/to/project
    python css_validator.py .  # current directory
"""

import argparse
import re
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
        print("CSS THEME VALIDATION REPORT")
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


# Required CSS variables for :root and .dark blocks
REQUIRED_COLOR_TOKENS = [
    "background", "foreground",
    "card", "card-foreground",
    "popover", "popover-foreground",
    "primary", "primary-foreground",
    "secondary", "secondary-foreground",
    "muted", "muted-foreground",
    "accent", "accent-foreground",
    "destructive", "destructive-foreground",
    "border", "input", "ring",
    "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
    "sidebar", "sidebar-foreground",
    "sidebar-primary", "sidebar-primary-foreground",
    "sidebar-accent", "sidebar-accent-foreground",
    "sidebar-border", "sidebar-ring",
]

REQUIRED_TYPOGRAPHY_TOKENS = [
    "font-sans", "font-serif", "font-mono",
]

REQUIRED_SHADOW_TOKENS = [
    "shadow-x", "shadow-y", "shadow-blur", "shadow-spread",
    "shadow-opacity", "shadow-color",
    "shadow-2xs", "shadow-xs", "shadow-sm", "shadow",
    "shadow-md", "shadow-lg", "shadow-xl", "shadow-2xl",
]

ROOT_ONLY_TOKENS = [
    "radius", "spacing", "tracking-normal",
]

# Tokens that must use OKLCH format (color tokens)
OKLCH_REQUIRED_TOKENS = REQUIRED_COLOR_TOKENS + ["shadow-color"]

# @theme inline required mappings
THEME_INLINE_COLOR_MAPPINGS = [
    "color-background", "color-foreground",
    "color-card", "color-card-foreground",
    "color-popover", "color-popover-foreground",
    "color-primary", "color-primary-foreground",
    "color-secondary", "color-secondary-foreground",
    "color-muted", "color-muted-foreground",
    "color-accent", "color-accent-foreground",
    "color-destructive", "color-destructive-foreground",
    "color-border", "color-input", "color-ring",
    "color-chart-1", "color-chart-2", "color-chart-3", "color-chart-4", "color-chart-5",
    "color-sidebar", "color-sidebar-foreground",
    "color-sidebar-primary", "color-sidebar-primary-foreground",
    "color-sidebar-accent", "color-sidebar-accent-foreground",
    "color-sidebar-border", "color-sidebar-ring",
]

THEME_INLINE_FONT_MAPPINGS = [
    "font-sans", "font-mono", "font-serif",
]

THEME_INLINE_RADIUS_MAPPINGS = [
    "radius-sm", "radius-md", "radius-lg", "radius-xl",
]

THEME_INLINE_SHADOW_MAPPINGS = [
    "shadow-2xs", "shadow-xs", "shadow-sm", "shadow",
    "shadow-md", "shadow-lg", "shadow-xl", "shadow-2xl",
]


def find_index_css(project_path: Path) -> Optional[Path]:
    """Find index.css in common locations."""
    common_locations = [
        project_path / "index.css",
        project_path / "src" / "index.css",
        project_path / "app" / "index.css",
        project_path / "styles" / "index.css",
        project_path / "src" / "styles" / "index.css",
        project_path / "src" / "app" / "index.css",
    ]

    for location in common_locations:
        if location.exists():
            return location

    return None


def extract_block(css_content: str, block_pattern: str) -> Optional[str]:
    """Extract a CSS block by its selector/at-rule."""
    # Handle different block types
    if block_pattern == ":root":
        pattern = r':root\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}'
    elif block_pattern == ".dark":
        pattern = r'\.dark\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}'
    elif block_pattern == "@theme inline":
        pattern = r'@theme\s+inline\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}'
    else:
        return None

    match = re.search(pattern, css_content, re.DOTALL)
    return match.group(1) if match else None


def extract_variables(block_content: str) -> dict:
    """Extract CSS custom properties from a block."""
    variables = {}
    # Match CSS custom properties, handling multi-line values
    pattern = r'--([\w-]+)\s*:\s*([^;]+);'
    matches = re.findall(pattern, block_content, re.DOTALL)

    for name, value in matches:
        # Clean up the value (remove extra whitespace)
        value = ' '.join(value.split())
        variables[name] = value

    return variables


def is_oklch_format(value: str) -> bool:
    """Check if a value uses OKLCH color format."""
    value = value.strip()
    # Match oklch(L C H) or oklch(L C H / alpha)
    oklch_pattern = r'^oklch\s*\(\s*[\d.]+\s+[\d.]+\s+[\d.]+(\s*/\s*[\d.]+)?\s*\)$'
    return bool(re.match(oklch_pattern, value))


def validate_structure(css_content: str, result: ValidationResult) -> tuple:
    """Validate the three-block structure exists."""
    root_block = extract_block(css_content, ":root")
    dark_block = extract_block(css_content, ".dark")
    theme_block = extract_block(css_content, "@theme inline")

    if root_block is None:
        result.add_error("Missing :root { } block")
    else:
        result.add_info("Found :root block")

    if dark_block is None:
        result.add_error("Missing .dark { } block")
    else:
        result.add_info("Found .dark block")

    if theme_block is None:
        result.add_error("Missing @theme inline { } block")
    else:
        result.add_info("Found @theme inline block")

    return root_block, dark_block, theme_block


def validate_root_variables(root_block: str, result: ValidationResult) -> None:
    """Validate :root block has all required variables."""
    if not root_block:
        return

    variables = extract_variables(root_block)

    # Check color tokens
    for token in REQUIRED_COLOR_TOKENS:
        if token not in variables:
            result.add_error(f":root missing required color token: --{token}")
        elif token in OKLCH_REQUIRED_TOKENS and not is_oklch_format(variables[token]):
            result.add_warning(f":root --{token} should use OKLCH format, found: {variables[token][:50]}...")

    # Check typography tokens
    for token in REQUIRED_TYPOGRAPHY_TOKENS:
        if token not in variables:
            result.add_error(f":root missing required typography token: --{token}")

    # Check shadow tokens
    for token in REQUIRED_SHADOW_TOKENS:
        if token not in variables:
            result.add_error(f":root missing required shadow token: --{token}")

    # Check root-only tokens
    for token in ROOT_ONLY_TOKENS:
        if token not in variables:
            result.add_error(f":root missing required token: --{token}")


def validate_dark_variables(dark_block: str, result: ValidationResult) -> None:
    """Validate .dark block has all required variables."""
    if not dark_block:
        return

    variables = extract_variables(dark_block)

    # Check color tokens (required in dark mode)
    for token in REQUIRED_COLOR_TOKENS:
        if token not in variables:
            result.add_error(f".dark missing required color token: --{token}")
        elif token in OKLCH_REQUIRED_TOKENS and not is_oklch_format(variables[token]):
            result.add_warning(f".dark --{token} should use OKLCH format, found: {variables[token][:50]}...")

    # Typography and shadow tokens are optional in .dark (can inherit from :root)
    # But if present, validate them
    for token in REQUIRED_TYPOGRAPHY_TOKENS:
        if token in variables:
            result.add_info(f".dark overrides typography token: --{token}")

    for token in REQUIRED_SHADOW_TOKENS:
        if token in variables:
            result.add_info(f".dark overrides shadow token: --{token}")


def validate_theme_inline(theme_block: str, result: ValidationResult) -> None:
    """Validate @theme inline block has all required mappings."""
    if not theme_block:
        return

    variables = extract_variables(theme_block)

    # Check color mappings
    for mapping in THEME_INLINE_COLOR_MAPPINGS:
        if mapping not in variables:
            result.add_error(f"@theme inline missing color mapping: --{mapping}")

    # Check font mappings
    for mapping in THEME_INLINE_FONT_MAPPINGS:
        if mapping not in variables:
            result.add_error(f"@theme inline missing font mapping: --{mapping}")

    # Check radius mappings
    for mapping in THEME_INLINE_RADIUS_MAPPINGS:
        if mapping not in variables:
            result.add_error(f"@theme inline missing radius mapping: --{mapping}")

    # Check shadow mappings
    for mapping in THEME_INLINE_SHADOW_MAPPINGS:
        if mapping not in variables:
            result.add_error(f"@theme inline missing shadow mapping: --{mapping}")


def validate_block_order(css_content: str, result: ValidationResult) -> None:
    """Validate blocks appear in correct order: :root, .dark, @theme inline."""
    root_pos = css_content.find(":root")
    dark_pos = css_content.find(".dark")
    theme_pos = css_content.find("@theme inline")

    if root_pos == -1 or dark_pos == -1 or theme_pos == -1:
        return  # Missing blocks already reported

    if not (root_pos < dark_pos < theme_pos):
        result.add_warning("Blocks should be in order: :root, .dark, @theme inline")


def validate_css_file(file_path: Path, result: ValidationResult) -> None:
    """Main validation function for a CSS file."""
    result.add_info(f"Validating: {file_path}")

    try:
        css_content = file_path.read_text(encoding="utf-8")
    except Exception as e:
        result.add_error(f"Failed to read file: {e}")
        return

    if not css_content.strip():
        result.add_error("File is empty")
        return

    # Validate structure
    root_block, dark_block, theme_block = validate_structure(css_content, result)

    # Validate each block
    validate_root_variables(root_block, result)
    validate_dark_variables(dark_block, result)
    validate_theme_inline(theme_block, result)

    # Validate block order
    validate_block_order(css_content, result)


def main():
    parser = argparse.ArgumentParser(
        description="Validate index.css against theme-master rules",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python css_validator.py /path/to/project
    python css_validator.py .
    python css_validator.py ~/projects/my-app

The script looks for index.css in common locations:
    - <project>/index.css
    - <project>/src/index.css
    - <project>/app/index.css
    - <project>/styles/index.css
    - <project>/src/styles/index.css
    - <project>/src/app/index.css
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
        help="Direct path to CSS file (overrides auto-detection)",
        default=None
    )

    args = parser.parse_args()
    result = ValidationResult()

    project_path = Path(args.project_path).resolve()

    if not project_path.exists():
        result.add_error(f"Project path does not exist: {project_path}")
        result.print_report()
        sys.exit(1)

    # Find or use specified CSS file
    if args.file:
        css_file = Path(args.file).resolve()
    else:
        css_file = find_index_css(project_path)

    if css_file is None:
        result.add_error(f"Could not find index.css in project: {project_path}")
        result.add_info("Searched in: index.css, src/index.css, app/index.css, styles/index.css")
        result.print_report()
        sys.exit(1)

    if not css_file.exists():
        result.add_error(f"CSS file does not exist: {css_file}")
        result.print_report()
        sys.exit(1)

    # Run validation
    validate_css_file(css_file, result)
    result.print_report()

    # Exit with appropriate code
    sys.exit(0 if result.is_valid else 1)


if __name__ == "__main__":
    main()
