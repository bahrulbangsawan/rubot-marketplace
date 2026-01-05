#!/usr/bin/env python3
"""
Responsive Audit Script for Tailwind CSS Codebases

Performs static responsive audit to enforce strict Tailwind responsive standards
and detect anti-patterns through static analysis.

Usage:
    python3 responsive_audit.py <project_path>
    python3 responsive_audit.py <project_path> --json
    python3 responsive_audit.py <project_path> --json --output report.json

Exit Codes:
    0 - No violations
    1 - Warnings only
    2 - Critical violations
"""

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path


class Severity(Enum):
    WARNING = "warning"
    CRITICAL = "critical"


class Category(Enum):
    BREAKPOINT_COMPLIANCE = "breakpoint_compliance"
    HARDCODED_SIZE = "hardcoded_size"
    LAYOUT_ANTIPATTERN = "layout_antipattern"
    RESPONSIVE_COVERAGE = "responsive_coverage"
    FLEX_GRID_PATTERN = "flex_grid_pattern"
    INLINE_STYLE = "inline_style"


@dataclass
class Violation:
    """Represents a single audit violation."""
    file_path: str
    line_number: int
    category: Category
    severity: Severity
    rule: str
    snippet: str
    message: str


@dataclass
class AuditResult:
    """Holds all audit results."""
    violations: list = field(default_factory=list)
    files_scanned: int = 0

    def add_violation(self, violation: Violation) -> None:
        self.violations.append(violation)

    @property
    def total_violations(self) -> int:
        return len(self.violations)

    @property
    def critical_count(self) -> int:
        return sum(1 for v in self.violations if v.severity == Severity.CRITICAL)

    @property
    def warning_count(self) -> int:
        return sum(1 for v in self.violations if v.severity == Severity.WARNING)

    def violations_by_category(self) -> dict:
        counts = {cat.value: 0 for cat in Category}
        for v in self.violations:
            counts[v.category.value] += 1
        return counts

    def violations_by_file(self) -> dict:
        by_file = {}
        for v in self.violations:
            if v.file_path not in by_file:
                by_file[v.file_path] = []
            by_file[v.file_path].append(v)
        return by_file

    def to_dict(self) -> dict:
        return {
            "summary": {
                "files_scanned": self.files_scanned,
                "total_violations": self.total_violations,
                "critical_violations": self.critical_count,
                "warnings": self.warning_count,
                "violations_by_category": self.violations_by_category()
            },
            "violations": [
                {
                    "file": v.file_path,
                    "line": v.line_number,
                    "category": v.category.value,
                    "severity": v.severity.value,
                    "rule": v.rule,
                    "snippet": v.snippet,
                    "message": v.message
                }
                for v in self.violations
            ]
        }

    def print_cli_report(self) -> None:
        print("=" * 70)
        print("RESPONSIVE AUDIT REPORT")
        print("=" * 70)
        print()

        if not self.violations:
            print("  No violations found!")
            print()
        else:
            by_file = self.violations_by_file()
            for file_path, violations in sorted(by_file.items()):
                print(f"  {file_path}")
                print("  " + "-" * (len(file_path)))
                for v in sorted(violations, key=lambda x: x.line_number):
                    severity_icon = "!!" if v.severity == Severity.CRITICAL else "!"
                    print(f"    [{severity_icon}] Line {v.line_number}: {v.rule}")
                    print(f"        {v.message}")
                    if v.snippet:
                        snippet_display = v.snippet[:60] + "..." if len(v.snippet) > 60 else v.snippet
                        print(f"        Snippet: {snippet_display}")
                print()

        print("=" * 70)
        print("SUMMARY")
        print("=" * 70)
        print(f"  Files scanned:       {self.files_scanned}")
        print(f"  Total violations:    {self.total_violations}")
        print(f"  Critical:            {self.critical_count}")
        print(f"  Warnings:            {self.warning_count}")
        print()
        print("  By Category:")
        for cat, count in self.violations_by_category().items():
            if count > 0:
                print(f"    {cat}: {count}")
        print("=" * 70)

        if self.critical_count > 0:
            print("STATUS: FAILED (critical violations)")
        elif self.warning_count > 0:
            print("STATUS: PASSED WITH WARNINGS")
        else:
            print("STATUS: PASSED")
        print("=" * 70)


# Allowed breakpoints (ONLY these are valid)
ALLOWED_BREAKPOINTS = {"sm", "md", "lg", "xl"}

# Invalid breakpoint patterns
INVALID_BREAKPOINT_PATTERNS = [
    r'\b2xl:',           # 2xl breakpoint
    r'\b3xl:',           # 3xl breakpoint
    r'\bxs:',            # xs breakpoint
    r'\bmax-sm:',        # max-* variants
    r'\bmax-md:',
    r'\bmax-lg:',
    r'\bmax-xl:',
    r'\bmax-2xl:',
    r'\bmin-\[',         # arbitrary min-[]
    r'\bmax-\[',         # arbitrary max-[]
]

# Breakpoint order for mobile-first (lower index = smaller screen)
BREAKPOINT_ORDER = ["sm", "md", "lg", "xl"]

# Hardcoded pixel patterns to flag
HARDCODED_PX_PATTERNS = [
    (r'\bw-\[\d+px\]', "w-[px]"),
    (r'\bh-\[\d+px\]', "h-[px]"),
    (r'\bmin-w-\[\d+px\]', "min-w-[px]"),
    (r'\bmax-w-\[\d+px\]', "max-w-[px]"),
    (r'\bmin-h-\[\d+px\]', "min-h-[px]"),
    (r'\bmax-h-\[\d+px\]', "max-h-[px]"),
    (r'\bgap-\[\d+px\]', "gap-[px]"),
    (r'\bp-\[\d+px\]', "p-[px]"),
    (r'\bm-\[\d+px\]', "m-[px]"),
    (r'\btop-\[\d+px\]', "top-[px]"),
    (r'\bright-\[\d+px\]', "right-[px]"),
    (r'\bbottom-\[\d+px\]', "bottom-[px]"),
    (r'\bleft-\[\d+px\]', "left-[px]"),
]

# Inline style patterns with pixel values
INLINE_STYLE_PX_PATTERNS = [
    r'style\s*=\s*["\'][^"\']*width\s*:\s*\d+px',
    r'style\s*=\s*["\'][^"\']*height\s*:\s*\d+px',
    r'style\s*=\s*\{\s*\{[^}]*width\s*:\s*["\']?\d+px',
    r'style\s*=\s*\{\s*\{[^}]*height\s*:\s*["\']?\d+px',
]

# Layout utilities that should have responsive variants
LAYOUT_UTILITIES = [
    "flex", "grid", "block", "inline-block", "inline-flex", "inline-grid",
    "hidden", "visible", "invisible"
]

# Grid column patterns
GRID_COLS_PATTERN = r'\bgrid-cols-(\d+|\[.*?\])'

# Flex direction patterns
FLEX_ROW_PATTERN = r'\bflex-row\b'
FLEX_COL_PATTERN = r'\bflex-col\b'

# Position utilities
POSITION_UTILITIES = ["absolute", "fixed", "relative", "sticky"]

# File extensions to scan
SCAN_EXTENSIONS = {".tsx", ".jsx", ".ts", ".js", ".html", ".mdx"}


def find_files(project_path: Path) -> list:
    """Find all files to scan."""
    files = []
    for ext in SCAN_EXTENSIONS:
        files.extend(project_path.rglob(f"*{ext}"))

    # Filter out node_modules and other common exclusions
    exclusions = ["node_modules", ".git", "dist", "build", ".next", ".nuxt", "coverage"]
    filtered = []
    for f in files:
        if not any(excl in f.parts for excl in exclusions):
            filtered.append(f)

    return sorted(filtered)


def extract_class_strings(content: str, line_num: int, line: str) -> list:
    """Extract potential Tailwind class strings from a line."""
    classes = []

    # Match className="..." or class="..."
    class_patterns = [
        r'className\s*=\s*"([^"]*)"',
        r'className\s*=\s*\'([^\']*)\'',
        r'class\s*=\s*"([^"]*)"',
        r'class\s*=\s*\'([^\']*)\'',
        r'className\s*=\s*\{[`\'"]([^`\'"]*)[`\'"]\}',
        r'className\s*=\s*\{`([^`]*)`\}',
    ]

    for pattern in class_patterns:
        matches = re.findall(pattern, line)
        classes.extend(matches)

    return classes


def check_breakpoint_compliance(line: str, line_num: int, file_path: str, result: AuditResult) -> None:
    """Check for breakpoint compliance violations."""

    # Check for invalid breakpoint patterns
    for pattern in INVALID_BREAKPOINT_PATTERNS:
        matches = re.findall(pattern, line)
        if matches:
            result.add_violation(Violation(
                file_path=file_path,
                line_number=line_num,
                category=Category.BREAKPOINT_COMPLIANCE,
                severity=Severity.CRITICAL,
                rule="invalid_breakpoint",
                snippet=line.strip()[:100],
                message="Invalid breakpoint pattern detected. Only sm, md, lg, xl allowed."
            ))

    # Check for breakpoint order violations (mobile-first)
    class_strings = extract_class_strings("", line_num, line)
    for class_str in class_strings:
        check_breakpoint_order(class_str, line_num, file_path, line, result)


def check_breakpoint_order(class_str: str, line_num: int, file_path: str, line: str, result: AuditResult) -> None:
    """Check that breakpoints are in mobile-first order."""
    classes = class_str.split()

    # Group classes by their base utility
    utility_breakpoints = {}

    for cls in classes:
        # Check if class has a breakpoint prefix
        for bp in BREAKPOINT_ORDER:
            if cls.startswith(f"{bp}:"):
                utility = cls[len(bp)+1:]  # Remove breakpoint prefix
                if utility not in utility_breakpoints:
                    utility_breakpoints[utility] = []
                utility_breakpoints[utility].append((bp, classes.index(cls)))

    # Check order for each utility
    for utility, breakpoints in utility_breakpoints.items():
        if len(breakpoints) > 1:
            bp_indices = [BREAKPOINT_ORDER.index(bp) for bp, _ in breakpoints]
            position_indices = [pos for _, pos in breakpoints]

            # Check if breakpoints appear in correct order in the class string
            for i in range(len(bp_indices) - 1):
                if bp_indices[i] > bp_indices[i + 1] and position_indices[i] < position_indices[i + 1]:
                    result.add_violation(Violation(
                        file_path=file_path,
                        line_number=line_num,
                        category=Category.BREAKPOINT_COMPLIANCE,
                        severity=Severity.WARNING,
                        rule="breakpoint_order",
                        snippet=class_str[:80],
                        message=f"Breakpoint order violation for '{utility}'. Use mobile-first order: sm -> md -> lg -> xl"
                    ))
                    break


def check_hardcoded_sizes(line: str, line_num: int, file_path: str, result: AuditResult) -> None:
    """Check for hardcoded pixel values."""

    # Check Tailwind arbitrary values with px
    for pattern, name in HARDCODED_PX_PATTERNS:
        matches = re.findall(pattern, line)
        if matches:
            result.add_violation(Violation(
                file_path=file_path,
                line_number=line_num,
                category=Category.HARDCODED_SIZE,
                severity=Severity.WARNING,
                rule="hardcoded_px_value",
                snippet=line.strip()[:100],
                message=f"Hardcoded pixel value detected ({name}). Use Tailwind scale tokens, %, rem, or em instead."
            ))

    # Check inline styles with px
    for pattern in INLINE_STYLE_PX_PATTERNS:
        if re.search(pattern, line, re.IGNORECASE):
            result.add_violation(Violation(
                file_path=file_path,
                line_number=line_num,
                category=Category.HARDCODED_SIZE,
                severity=Severity.CRITICAL,
                rule="inline_style_px",
                snippet=line.strip()[:100],
                message="Inline style with pixel value detected. Use Tailwind utilities instead."
            ))


def check_layout_antipatterns(line: str, line_num: int, file_path: str, content: str, result: AuditResult) -> None:
    """Check for layout anti-patterns."""

    class_strings = extract_class_strings(content, line_num, line)

    for class_str in class_strings:
        classes = class_str.split()

        # Check absolute/fixed without responsive context
        has_absolute = "absolute" in classes
        has_fixed = "fixed" in classes
        has_responsive_position = any(
            cls.startswith(f"{bp}:absolute") or cls.startswith(f"{bp}:fixed") or
            cls.startswith(f"{bp}:relative") or cls.startswith(f"{bp}:static")
            for bp in ALLOWED_BREAKPOINTS
            for cls in classes
        )

        if (has_absolute or has_fixed) and not has_responsive_position:
            # Check if there's responsive positioning on the same element
            position_utility = "absolute" if has_absolute else "fixed"
            result.add_violation(Violation(
                file_path=file_path,
                line_number=line_num,
                category=Category.LAYOUT_ANTIPATTERN,
                severity=Severity.WARNING,
                rule="position_no_responsive",
                snippet=class_str[:80],
                message=f"'{position_utility}' used without responsive override. Consider adding breakpoint variants."
            ))

        # Check overflow-hidden on potential layout containers
        if "overflow-hidden" in classes:
            layout_indicators = ["flex", "grid", "container", "mx-auto"]
            if any(ind in classes for ind in layout_indicators):
                result.add_violation(Violation(
                    file_path=file_path,
                    line_number=line_num,
                    category=Category.LAYOUT_ANTIPATTERN,
                    severity=Severity.WARNING,
                    rule="overflow_hidden_layout",
                    snippet=class_str[:80],
                    message="'overflow-hidden' on layout container may cause clipping issues."
                ))

        # Check h-screen without breakpoint control
        if "h-screen" in classes:
            has_responsive_height = any(
                cls.startswith(f"{bp}:h-") for bp in ALLOWED_BREAKPOINTS for cls in classes
            )
            if not has_responsive_height:
                result.add_violation(Violation(
                    file_path=file_path,
                    line_number=line_num,
                    category=Category.LAYOUT_ANTIPATTERN,
                    severity=Severity.WARNING,
                    rule="h_screen_no_responsive",
                    snippet=class_str[:80],
                    message="'h-screen' without breakpoint control may cause issues on mobile."
                ))


def check_responsive_coverage(line: str, line_num: int, file_path: str, result: AuditResult) -> None:
    """Check for missing responsive coverage on layout utilities."""

    class_strings = extract_class_strings("", line_num, line)

    for class_str in class_strings:
        # Check grid-cols without responsive variants
        grid_cols_matches = re.findall(GRID_COLS_PATTERN, class_str)
        if grid_cols_matches:
            has_responsive_grid = any(
                re.search(rf'\b{bp}:grid-cols-', class_str)
                for bp in ALLOWED_BREAKPOINTS
            )
            # Only flag if grid-cols > 1 and no responsive variants
            for match in grid_cols_matches:
                try:
                    cols = int(match) if match.isdigit() else 2
                    if cols > 1 and not has_responsive_grid:
                        result.add_violation(Violation(
                            file_path=file_path,
                            line_number=line_num,
                            category=Category.RESPONSIVE_COVERAGE,
                            severity=Severity.WARNING,
                            rule="grid_cols_no_responsive",
                            snippet=class_str[:80],
                            message=f"'grid-cols-{match}' without responsive variants. Consider: grid-cols-1 md:grid-cols-{match}"
                        ))
                        break
                except ValueError:
                    pass


def check_flex_grid_patterns(line: str, line_num: int, file_path: str, result: AuditResult) -> None:
    """Check for flex and grid pattern violations."""

    class_strings = extract_class_strings("", line_num, line)

    for class_str in class_strings:
        classes = class_str.split()

        # Check flex-row without flex-col base
        has_flex = "flex" in classes
        has_flex_row = "flex-row" in classes
        has_flex_col = "flex-col" in classes
        has_responsive_flex_row = any(
            cls.startswith(f"{bp}:flex-row") for bp in ALLOWED_BREAKPOINTS for cls in classes
        )

        if has_flex and has_flex_row and not has_flex_col and not has_responsive_flex_row:
            result.add_violation(Violation(
                file_path=file_path,
                line_number=line_num,
                category=Category.FLEX_GRID_PATTERN,
                severity=Severity.WARNING,
                rule="flex_row_no_base",
                snippet=class_str[:80],
                message="'flex-row' without 'flex-col' base. Consider: flex flex-col md:flex-row"
            ))

        # Check for responsive flex-row pattern (this is good, but flag if only flex-row with breakpoint and no base)
        if has_flex and has_responsive_flex_row and not has_flex_col and not has_flex_row:
            # This is actually the correct pattern: flex md:flex-row implies column on mobile
            pass

        # Check grid-cols defined only once without escalation
        grid_matches = re.findall(r'\bgrid-cols-(\d+)\b', class_str)
        responsive_grid_matches = re.findall(r'\b(?:sm|md|lg|xl):grid-cols-(\d+)\b', class_str)

        if len(grid_matches) == 1 and len(responsive_grid_matches) == 0:
            cols = grid_matches[0]
            if int(cols) > 2:
                result.add_violation(Violation(
                    file_path=file_path,
                    line_number=line_num,
                    category=Category.FLEX_GRID_PATTERN,
                    severity=Severity.WARNING,
                    rule="grid_no_escalation",
                    snippet=class_str[:80],
                    message=f"'grid-cols-{cols}' without breakpoint escalation. Consider: grid-cols-1 sm:grid-cols-2 md:grid-cols-{cols}"
                ))


def check_inline_styles(line: str, line_num: int, file_path: str, result: AuditResult) -> None:
    """Check for inline styles and CSS violations."""

    # Check for inline style attributes (JSX style={{}})
    if re.search(r'style\s*=\s*\{\s*\{', line):
        # Check if it contains layout properties
        layout_props = ["width", "height", "display", "position", "flex", "grid", "margin", "padding"]
        for prop in layout_props:
            if re.search(rf'{prop}\s*:', line, re.IGNORECASE):
                result.add_violation(Violation(
                    file_path=file_path,
                    line_number=line_num,
                    category=Category.INLINE_STYLE,
                    severity=Severity.CRITICAL,
                    rule="inline_style_layout",
                    snippet=line.strip()[:100],
                    message=f"Inline style with layout property '{prop}'. Use Tailwind utilities instead."
                ))
                break

    # Check for style="" attributes (HTML style)
    if re.search(r'style\s*=\s*["\']', line):
        layout_props = ["width", "height", "display", "position", "flex", "grid"]
        for prop in layout_props:
            if re.search(rf'{prop}\s*:', line, re.IGNORECASE):
                result.add_violation(Violation(
                    file_path=file_path,
                    line_number=line_num,
                    category=Category.INLINE_STYLE,
                    severity=Severity.CRITICAL,
                    rule="inline_style_html",
                    snippet=line.strip()[:100],
                    message=f"HTML inline style with layout property '{prop}'. Use Tailwind utilities instead."
                ))
                break

    # Check for <style> blocks
    if re.search(r'<style[^>]*>', line, re.IGNORECASE):
        result.add_violation(Violation(
            file_path=file_path,
            line_number=line_num,
            category=Category.INLINE_STYLE,
            severity=Severity.WARNING,
            rule="style_block",
            snippet=line.strip()[:100],
            message="<style> block detected. Prefer Tailwind utilities for styling."
        ))

    # Check for @media queries in style blocks or strings
    if re.search(r'@media\s*\(', line):
        result.add_violation(Violation(
            file_path=file_path,
            line_number=line_num,
            category=Category.INLINE_STYLE,
            severity=Severity.CRITICAL,
            rule="custom_media_query",
            snippet=line.strip()[:100],
            message="Custom @media query detected. Use Tailwind breakpoint prefixes instead."
        ))


def audit_file(file_path: Path, result: AuditResult) -> None:
    """Audit a single file for responsive violations."""
    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception:
        return

    lines = content.split("\n")
    rel_path = str(file_path)

    for line_num, line in enumerate(lines, start=1):
        # Skip empty lines and comments
        stripped = line.strip()
        if not stripped or stripped.startswith("//") or stripped.startswith("/*"):
            continue

        # Run all checks
        check_breakpoint_compliance(line, line_num, rel_path, result)
        check_hardcoded_sizes(line, line_num, rel_path, result)
        check_layout_antipatterns(line, line_num, rel_path, content, result)
        check_responsive_coverage(line, line_num, rel_path, result)
        check_flex_grid_patterns(line, line_num, rel_path, result)
        check_inline_styles(line, line_num, rel_path, result)


def run_audit(project_path: Path) -> AuditResult:
    """Run the full responsive audit."""
    result = AuditResult()

    files = find_files(project_path)
    result.files_scanned = len(files)

    for file_path in files:
        audit_file(file_path, result)

    return result


def main():
    parser = argparse.ArgumentParser(
        description="Responsive Audit for Tailwind CSS Codebases",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exit Codes:
    0 - No violations
    1 - Warnings only
    2 - Critical violations

Examples:
    python3 responsive_audit.py /path/to/project
    python3 responsive_audit.py . --json
    python3 responsive_audit.py . --json --output report.json
        """
    )
    parser.add_argument(
        "project_path",
        type=str,
        help="Path to the project directory"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON"
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Write JSON output to file",
        default=None
    )

    args = parser.parse_args()

    project_path = Path(args.project_path).resolve()

    if not project_path.exists():
        print(f"ERROR: Project path does not exist: {project_path}", file=sys.stderr)
        sys.exit(2)

    if not project_path.is_dir():
        print(f"ERROR: Project path is not a directory: {project_path}", file=sys.stderr)
        sys.exit(2)

    # Run audit
    result = run_audit(project_path)

    # Output results
    if args.json or args.output:
        json_output = json.dumps(result.to_dict(), indent=2)
        if args.output:
            Path(args.output).write_text(json_output)
            print(f"JSON report written to: {args.output}")
        else:
            print(json_output)
    else:
        result.print_cli_report()

    # Determine exit code
    if result.critical_count > 0:
        sys.exit(2)
    elif result.warning_count > 0:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
