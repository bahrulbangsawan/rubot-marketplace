#!/usr/bin/env python3
"""
SEO Technical Audit Script for rubot plugin.

Performs comprehensive technical SEO audits for websites including:
- Metadata validation
- robots.txt analysis
- sitemap.xml validation
- HTTP status checks
- Crawlability assessment

Usage:
    python seo_audit.py <base_url> [--json] [--output <file>]

Examples:
    python seo_audit.py https://example.com
    python seo_audit.py https://example.com --json
    python seo_audit.py https://example.com --output report.json
"""

import argparse
import json
import re
import sys
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Optional
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser
import xml.etree.ElementTree as ET

try:
    import requests
    from requests.exceptions import RequestException, Timeout, ConnectionError
except ImportError:
    print("Error: 'requests' library is required. Install with: pip install requests", file=sys.stderr)
    sys.exit(1)

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Error: 'beautifulsoup4' library is required. Install with: pip install beautifulsoup4", file=sys.stderr)
    sys.exit(1)


class Status(Enum):
    """Audit result status."""
    PASS = "PASS"
    WARN = "WARN"
    FAIL = "FAIL"
    SKIP = "SKIP"


@dataclass
class AuditResult:
    """Single audit check result."""
    name: str
    status: Status
    message: str
    details: Optional[str] = None
    value: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "status": self.status.value,
            "message": self.message,
            "details": self.details,
            "value": self.value
        }


@dataclass
class AuditReport:
    """Complete audit report."""
    url: str
    results: list[AuditResult] = field(default_factory=list)
    summary: dict = field(default_factory=dict)

    def add(self, result: AuditResult) -> None:
        self.results.append(result)

    def compute_summary(self) -> None:
        self.summary = {
            "total": len(self.results),
            "passed": sum(1 for r in self.results if r.status == Status.PASS),
            "warnings": sum(1 for r in self.results if r.status == Status.WARN),
            "failures": sum(1 for r in self.results if r.status == Status.FAIL),
            "skipped": sum(1 for r in self.results if r.status == Status.SKIP),
        }

    def has_critical_failures(self) -> bool:
        """Check for critical SEO failures that warrant non-zero exit."""
        critical_checks = [
            "page_accessible",
            "title_tag",
            "meta_description",
            "robots_txt_accessible",
            "sitemap_accessible",
            "noindex_detection",
        ]
        for result in self.results:
            if result.name in critical_checks and result.status == Status.FAIL:
                return True
        return False

    def to_dict(self) -> dict:
        return {
            "url": self.url,
            "summary": self.summary,
            "results": [r.to_dict() for r in self.results]
        }


class SEOAuditor:
    """Technical SEO auditor for websites."""

    REQUEST_TIMEOUT = 15
    USER_AGENT = "RubotSEOAuditor/1.0 (+https://github.com/rubot)"
    MAX_SITEMAP_URLS = 50000

    def __init__(self, base_url: str):
        self.base_url = self._normalize_url(base_url)
        self.parsed_url = urlparse(self.base_url)
        self.report = AuditReport(url=self.base_url)
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": self.USER_AGENT})
        self.page_content: Optional[str] = None
        self.page_soup: Optional[BeautifulSoup] = None
        self.robots_content: Optional[str] = None
        self.sitemap_content: Optional[str] = None

    def _normalize_url(self, url: str) -> str:
        """Ensure URL has proper scheme."""
        if not url.startswith(("http://", "https://")):
            url = f"https://{url}"
        return url.rstrip("/")

    def _fetch(self, url: str, allow_redirects: bool = True) -> Optional[requests.Response]:
        """Fetch URL with error handling."""
        try:
            response = self.session.get(
                url,
                timeout=self.REQUEST_TIMEOUT,
                allow_redirects=allow_redirects
            )
            return response
        except Timeout:
            return None
        except ConnectionError:
            return None
        except RequestException:
            return None

    def run_audit(self) -> AuditReport:
        """Execute complete SEO audit."""
        # Fetch main page first
        self._fetch_main_page()

        # Run all audit checks
        self._audit_page_accessibility()
        self._audit_title_tag()
        self._audit_meta_description()
        self._audit_meta_robots()
        self._audit_canonical_link()
        self._audit_open_graph()
        self._audit_twitter_cards()
        self._audit_robots_txt()
        self._audit_sitemap()
        self._audit_http_status()
        self._audit_redirects()
        self._audit_noindex()
        self._audit_blocked_paths()

        self.report.compute_summary()
        return self.report

    def _fetch_main_page(self) -> None:
        """Fetch and parse the main page."""
        response = self._fetch(self.base_url)
        if response and response.status_code == 200:
            self.page_content = response.text
            self.page_soup = BeautifulSoup(self.page_content, "html.parser")

    # =========================================================================
    # Page Accessibility
    # =========================================================================

    def _audit_page_accessibility(self) -> None:
        """Check if the main page is accessible."""
        response = self._fetch(self.base_url)

        if response is None:
            self.report.add(AuditResult(
                name="page_accessible",
                status=Status.FAIL,
                message="Page is not accessible",
                details="Connection failed or timed out"
            ))
            return

        if response.status_code == 200:
            self.report.add(AuditResult(
                name="page_accessible",
                status=Status.PASS,
                message="Page is accessible",
                value=str(response.status_code)
            ))
        elif 300 <= response.status_code < 400:
            self.report.add(AuditResult(
                name="page_accessible",
                status=Status.WARN,
                message="Page redirects",
                details=f"Redirects to: {response.headers.get('Location', 'unknown')}",
                value=str(response.status_code)
            ))
        else:
            self.report.add(AuditResult(
                name="page_accessible",
                status=Status.FAIL,
                message="Page returns error status",
                value=str(response.status_code)
            ))

    # =========================================================================
    # Metadata Checks
    # =========================================================================

    def _audit_title_tag(self) -> None:
        """Check for presence and quality of title tag."""
        if not self.page_soup:
            self.report.add(AuditResult(
                name="title_tag",
                status=Status.SKIP,
                message="Cannot check title - page not loaded"
            ))
            return

        title_tag = self.page_soup.find("title")

        if not title_tag:
            self.report.add(AuditResult(
                name="title_tag",
                status=Status.FAIL,
                message="Missing <title> tag",
                details="Every page should have a unique, descriptive title"
            ))
            return

        title_text = title_tag.get_text(strip=True)

        if not title_text:
            self.report.add(AuditResult(
                name="title_tag",
                status=Status.FAIL,
                message="Empty <title> tag",
                details="Title tag exists but contains no text"
            ))
            return

        title_len = len(title_text)

        if title_len < 10:
            self.report.add(AuditResult(
                name="title_tag",
                status=Status.WARN,
                message="Title is too short",
                details=f"Title length: {title_len} chars. Recommended: 30-60 chars",
                value=title_text
            ))
        elif title_len > 60:
            self.report.add(AuditResult(
                name="title_tag",
                status=Status.WARN,
                message="Title may be truncated in search results",
                details=f"Title length: {title_len} chars. Recommended: 30-60 chars",
                value=title_text[:100] + "..." if len(title_text) > 100 else title_text
            ))
        else:
            self.report.add(AuditResult(
                name="title_tag",
                status=Status.PASS,
                message="Title tag is present and well-formed",
                details=f"Length: {title_len} chars",
                value=title_text
            ))

    def _audit_meta_description(self) -> None:
        """Check for presence and quality of meta description."""
        if not self.page_soup:
            self.report.add(AuditResult(
                name="meta_description",
                status=Status.SKIP,
                message="Cannot check meta description - page not loaded"
            ))
            return

        meta_desc = self.page_soup.find("meta", attrs={"name": "description"})

        if not meta_desc:
            self.report.add(AuditResult(
                name="meta_description",
                status=Status.FAIL,
                message="Missing meta description",
                details="Meta description helps search engines understand page content"
            ))
            return

        content = meta_desc.get("content", "")

        if not content:
            self.report.add(AuditResult(
                name="meta_description",
                status=Status.FAIL,
                message="Empty meta description",
                details="Meta description tag exists but has no content"
            ))
            return

        desc_len = len(content)

        if desc_len < 50:
            self.report.add(AuditResult(
                name="meta_description",
                status=Status.WARN,
                message="Meta description is too short",
                details=f"Length: {desc_len} chars. Recommended: 120-160 chars",
                value=content
            ))
        elif desc_len > 160:
            self.report.add(AuditResult(
                name="meta_description",
                status=Status.WARN,
                message="Meta description may be truncated",
                details=f"Length: {desc_len} chars. Recommended: 120-160 chars",
                value=content[:200] + "..." if len(content) > 200 else content
            ))
        else:
            self.report.add(AuditResult(
                name="meta_description",
                status=Status.PASS,
                message="Meta description is present and well-formed",
                details=f"Length: {desc_len} chars",
                value=content
            ))

    def _audit_meta_robots(self) -> None:
        """Check meta robots tag."""
        if not self.page_soup:
            self.report.add(AuditResult(
                name="meta_robots",
                status=Status.SKIP,
                message="Cannot check meta robots - page not loaded"
            ))
            return

        meta_robots = self.page_soup.find("meta", attrs={"name": "robots"})

        if not meta_robots:
            self.report.add(AuditResult(
                name="meta_robots",
                status=Status.PASS,
                message="No meta robots tag (defaults to index, follow)",
                details="Page will be indexed and links followed by default"
            ))
            return

        content = meta_robots.get("content", "").lower()

        if "noindex" in content or "none" in content:
            self.report.add(AuditResult(
                name="meta_robots",
                status=Status.WARN,
                message="Page is set to noindex",
                details="This page will not appear in search results",
                value=content
            ))
        elif "nofollow" in content:
            self.report.add(AuditResult(
                name="meta_robots",
                status=Status.WARN,
                message="Links on this page are nofollowed",
                details="Search engines won't follow links from this page",
                value=content
            ))
        else:
            self.report.add(AuditResult(
                name="meta_robots",
                status=Status.PASS,
                message="Meta robots allows indexing",
                value=content
            ))

    def _audit_canonical_link(self) -> None:
        """Check for canonical link tag."""
        if not self.page_soup:
            self.report.add(AuditResult(
                name="canonical_link",
                status=Status.SKIP,
                message="Cannot check canonical - page not loaded"
            ))
            return

        canonical = self.page_soup.find("link", attrs={"rel": "canonical"})

        if not canonical:
            self.report.add(AuditResult(
                name="canonical_link",
                status=Status.WARN,
                message="Missing canonical link",
                details="Canonical tags help prevent duplicate content issues"
            ))
            return

        href = canonical.get("href", "")

        if not href:
            self.report.add(AuditResult(
                name="canonical_link",
                status=Status.FAIL,
                message="Canonical link has no href",
                details="Canonical tag exists but has no URL"
            ))
            return

        # Check if canonical is self-referencing or points elsewhere
        canonical_normalized = href.rstrip("/")
        base_normalized = self.base_url.rstrip("/")

        if canonical_normalized == base_normalized:
            self.report.add(AuditResult(
                name="canonical_link",
                status=Status.PASS,
                message="Self-referencing canonical link present",
                value=href
            ))
        else:
            self.report.add(AuditResult(
                name="canonical_link",
                status=Status.WARN,
                message="Canonical points to different URL",
                details="Verify this is intentional",
                value=href
            ))

    def _audit_open_graph(self) -> None:
        """Check for Open Graph meta tags."""
        if not self.page_soup:
            self.report.add(AuditResult(
                name="open_graph",
                status=Status.SKIP,
                message="Cannot check Open Graph - page not loaded"
            ))
            return

        required_og = ["og:title", "og:description", "og:image", "og:url"]
        found_og = {}
        missing_og = []

        for prop in required_og:
            tag = self.page_soup.find("meta", attrs={"property": prop})
            if tag and tag.get("content"):
                found_og[prop] = tag.get("content")
            else:
                missing_og.append(prop)

        if not found_og:
            self.report.add(AuditResult(
                name="open_graph",
                status=Status.WARN,
                message="No Open Graph tags found",
                details="OG tags improve social media sharing appearance"
            ))
        elif missing_og:
            self.report.add(AuditResult(
                name="open_graph",
                status=Status.WARN,
                message="Missing some Open Graph tags",
                details=f"Missing: {', '.join(missing_og)}",
                value=json.dumps(found_og)
            ))
        else:
            self.report.add(AuditResult(
                name="open_graph",
                status=Status.PASS,
                message="All essential Open Graph tags present",
                value=json.dumps(found_og)
            ))

    def _audit_twitter_cards(self) -> None:
        """Check for Twitter Card meta tags."""
        if not self.page_soup:
            self.report.add(AuditResult(
                name="twitter_cards",
                status=Status.SKIP,
                message="Cannot check Twitter Cards - page not loaded"
            ))
            return

        twitter_card = self.page_soup.find("meta", attrs={"name": "twitter:card"})
        twitter_title = self.page_soup.find("meta", attrs={"name": "twitter:title"})
        twitter_desc = self.page_soup.find("meta", attrs={"name": "twitter:description"})

        found_twitter = {}

        if twitter_card and twitter_card.get("content"):
            found_twitter["twitter:card"] = twitter_card.get("content")
        if twitter_title and twitter_title.get("content"):
            found_twitter["twitter:title"] = twitter_title.get("content")
        if twitter_desc and twitter_desc.get("content"):
            found_twitter["twitter:description"] = twitter_desc.get("content")

        if not found_twitter:
            # Check if OG tags can serve as fallback
            og_title = self.page_soup.find("meta", attrs={"property": "og:title"})
            og_desc = self.page_soup.find("meta", attrs={"property": "og:description"})

            if og_title and og_desc:
                self.report.add(AuditResult(
                    name="twitter_cards",
                    status=Status.PASS,
                    message="No Twitter Card tags, but OG tags serve as fallback",
                    details="Twitter will use Open Graph tags when Twitter-specific tags are absent"
                ))
            else:
                self.report.add(AuditResult(
                    name="twitter_cards",
                    status=Status.WARN,
                    message="No Twitter Card meta tags found",
                    details="Twitter Cards improve appearance when shared on Twitter/X"
                ))
        elif "twitter:card" not in found_twitter:
            self.report.add(AuditResult(
                name="twitter_cards",
                status=Status.WARN,
                message="Missing twitter:card type",
                details="Specify card type (summary, summary_large_image, etc.)",
                value=json.dumps(found_twitter)
            ))
        else:
            self.report.add(AuditResult(
                name="twitter_cards",
                status=Status.PASS,
                message="Twitter Card tags present",
                value=json.dumps(found_twitter)
            ))

    # =========================================================================
    # robots.txt Checks
    # =========================================================================

    def _audit_robots_txt(self) -> None:
        """Comprehensive robots.txt audit."""
        robots_url = urljoin(self.base_url, "/robots.txt")
        response = self._fetch(robots_url)

        # Check existence and status
        if response is None:
            self.report.add(AuditResult(
                name="robots_txt_accessible",
                status=Status.FAIL,
                message="Cannot access robots.txt",
                details="Connection failed or timed out"
            ))
            return

        if response.status_code == 404:
            self.report.add(AuditResult(
                name="robots_txt_accessible",
                status=Status.WARN,
                message="robots.txt not found (404)",
                details="Consider creating a robots.txt file"
            ))
            return

        if response.status_code != 200:
            self.report.add(AuditResult(
                name="robots_txt_accessible",
                status=Status.WARN,
                message=f"robots.txt returned status {response.status_code}",
                details="Unexpected status code for robots.txt"
            ))
            return

        self.robots_content = response.text

        self.report.add(AuditResult(
            name="robots_txt_accessible",
            status=Status.PASS,
            message="robots.txt is accessible",
            value=robots_url
        ))

        # Validate syntax
        self._validate_robots_syntax()

        # Check for sitemap reference
        self._check_robots_sitemap_reference()

    def _validate_robots_syntax(self) -> None:
        """Validate robots.txt syntax."""
        if not self.robots_content:
            return

        lines = self.robots_content.strip().split("\n")
        valid_directives = {
            "user-agent", "disallow", "allow", "sitemap",
            "crawl-delay", "host", "clean-param"
        }
        errors = []
        has_user_agent = False

        for i, line in enumerate(lines, 1):
            line = line.strip()

            # Skip empty lines and comments
            if not line or line.startswith("#"):
                continue

            # Check for directive format
            if ":" not in line:
                errors.append(f"Line {i}: Invalid format (missing colon)")
                continue

            directive = line.split(":")[0].strip().lower()

            if directive == "user-agent":
                has_user_agent = True
            elif directive not in valid_directives:
                errors.append(f"Line {i}: Unknown directive '{directive}'")

        if not has_user_agent:
            errors.append("No User-agent directive found")

        if errors:
            self.report.add(AuditResult(
                name="robots_txt_syntax",
                status=Status.WARN,
                message="robots.txt has syntax issues",
                details="; ".join(errors[:5])  # Limit to first 5 errors
            ))
        else:
            self.report.add(AuditResult(
                name="robots_txt_syntax",
                status=Status.PASS,
                message="robots.txt syntax is valid"
            ))

    def _check_robots_sitemap_reference(self) -> None:
        """Check if robots.txt references a sitemap."""
        if not self.robots_content:
            return

        sitemap_refs = []
        for line in self.robots_content.split("\n"):
            line = line.strip().lower()
            if line.startswith("sitemap:"):
                sitemap_url = line.split(":", 1)[1].strip()
                sitemap_refs.append(sitemap_url)

        if sitemap_refs:
            self.report.add(AuditResult(
                name="robots_txt_sitemap_ref",
                status=Status.PASS,
                message="robots.txt references sitemap",
                details=f"Found {len(sitemap_refs)} sitemap reference(s)",
                value=", ".join(sitemap_refs[:3])  # Show first 3
            ))
        else:
            self.report.add(AuditResult(
                name="robots_txt_sitemap_ref",
                status=Status.WARN,
                message="No sitemap reference in robots.txt",
                details="Add 'Sitemap: <url>' directive for better discoverability"
            ))

    # =========================================================================
    # Sitemap Checks
    # =========================================================================

    def _audit_sitemap(self) -> None:
        """Comprehensive sitemap.xml audit."""
        sitemap_url = urljoin(self.base_url, "/sitemap.xml")
        response = self._fetch(sitemap_url)

        if response is None:
            self.report.add(AuditResult(
                name="sitemap_accessible",
                status=Status.FAIL,
                message="Cannot access sitemap.xml",
                details="Connection failed or timed out"
            ))
            return

        if response.status_code == 404:
            self.report.add(AuditResult(
                name="sitemap_accessible",
                status=Status.WARN,
                message="sitemap.xml not found (404)",
                details="Consider creating a sitemap for better crawlability"
            ))
            return

        if response.status_code != 200:
            self.report.add(AuditResult(
                name="sitemap_accessible",
                status=Status.WARN,
                message=f"sitemap.xml returned status {response.status_code}"
            ))
            return

        self.sitemap_content = response.text

        self.report.add(AuditResult(
            name="sitemap_accessible",
            status=Status.PASS,
            message="sitemap.xml is accessible",
            value=sitemap_url
        ))

        # Validate XML and analyze
        self._validate_sitemap_xml()

    def _validate_sitemap_xml(self) -> None:
        """Validate sitemap XML structure and content."""
        if not self.sitemap_content:
            return

        try:
            root = ET.fromstring(self.sitemap_content)
        except ET.ParseError as e:
            self.report.add(AuditResult(
                name="sitemap_xml_valid",
                status=Status.FAIL,
                message="Invalid sitemap XML",
                details=str(e)
            ))
            return

        self.report.add(AuditResult(
            name="sitemap_xml_valid",
            status=Status.PASS,
            message="Sitemap XML is valid"
        ))

        # Handle namespaces
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}

        # Check if it's a sitemap index or regular sitemap
        if root.tag.endswith("sitemapindex"):
            sitemaps = root.findall(".//sm:sitemap", ns) or root.findall(".//sitemap")
            self.report.add(AuditResult(
                name="sitemap_type",
                status=Status.PASS,
                message="Sitemap index detected",
                details=f"Contains {len(sitemaps)} sitemap reference(s)"
            ))
            return

        # Regular sitemap - count URLs
        urls = root.findall(".//sm:url", ns) or root.findall(".//url")
        url_count = len(urls)

        if url_count == 0:
            self.report.add(AuditResult(
                name="sitemap_url_count",
                status=Status.WARN,
                message="Sitemap contains no URLs",
                details="Empty sitemap provides no value"
            ))
        elif url_count > self.MAX_SITEMAP_URLS:
            self.report.add(AuditResult(
                name="sitemap_url_count",
                status=Status.FAIL,
                message=f"Sitemap exceeds {self.MAX_SITEMAP_URLS} URL limit",
                details=f"Contains {url_count} URLs. Split into multiple sitemaps.",
                value=str(url_count)
            ))
        else:
            self.report.add(AuditResult(
                name="sitemap_url_count",
                status=Status.PASS,
                message=f"Sitemap contains {url_count} URL(s)",
                value=str(url_count)
            ))

        # Check for lastmod
        lastmod_count = 0
        for url in urls:
            lastmod = url.find("sm:lastmod", ns) or url.find("lastmod")
            if lastmod is not None and lastmod.text:
                lastmod_count += 1

        if url_count > 0:
            lastmod_percentage = (lastmod_count / url_count) * 100

            if lastmod_percentage == 0:
                self.report.add(AuditResult(
                    name="sitemap_lastmod",
                    status=Status.WARN,
                    message="No <lastmod> dates in sitemap",
                    details="Adding lastmod helps search engines prioritize crawling"
                ))
            elif lastmod_percentage < 100:
                self.report.add(AuditResult(
                    name="sitemap_lastmod",
                    status=Status.WARN,
                    message=f"Only {lastmod_percentage:.0f}% of URLs have <lastmod>",
                    details=f"{lastmod_count} of {url_count} URLs have lastmod dates"
                ))
            else:
                self.report.add(AuditResult(
                    name="sitemap_lastmod",
                    status=Status.PASS,
                    message="All URLs have <lastmod> dates",
                    value=f"{lastmod_count}/{url_count}"
                ))

    # =========================================================================
    # HTTP Checks
    # =========================================================================

    def _audit_http_status(self) -> None:
        """Check HTTP response status and headers."""
        response = self._fetch(self.base_url, allow_redirects=False)

        if response is None:
            self.report.add(AuditResult(
                name="http_status",
                status=Status.FAIL,
                message="Cannot fetch page for HTTP analysis"
            ))
            return

        status = response.status_code

        if status == 200:
            self.report.add(AuditResult(
                name="http_status",
                status=Status.PASS,
                message="Page returns HTTP 200 OK",
                value=str(status)
            ))
        elif 300 <= status < 400:
            self.report.add(AuditResult(
                name="http_status",
                status=Status.WARN,
                message=f"Page returns redirect ({status})",
                details=f"Redirects to: {response.headers.get('Location', 'unknown')}",
                value=str(status)
            ))
        elif status >= 400:
            self.report.add(AuditResult(
                name="http_status",
                status=Status.FAIL,
                message=f"Page returns error status ({status})",
                value=str(status)
            ))

        # Check for X-Robots-Tag header
        x_robots = response.headers.get("X-Robots-Tag")
        if x_robots:
            if "noindex" in x_robots.lower():
                self.report.add(AuditResult(
                    name="x_robots_tag",
                    status=Status.WARN,
                    message="X-Robots-Tag header contains noindex",
                    details="Page will not be indexed due to HTTP header",
                    value=x_robots
                ))
            else:
                self.report.add(AuditResult(
                    name="x_robots_tag",
                    status=Status.PASS,
                    message="X-Robots-Tag header present",
                    value=x_robots
                ))

    def _audit_redirects(self) -> None:
        """Check redirect chain."""
        response = self._fetch(self.base_url, allow_redirects=False)

        if response is None:
            return

        redirect_count = 0
        current_url = self.base_url
        max_redirects = 10
        redirect_chain = [current_url]

        while 300 <= response.status_code < 400 and redirect_count < max_redirects:
            redirect_count += 1
            location = response.headers.get("Location")

            if not location:
                break

            current_url = urljoin(current_url, location)
            redirect_chain.append(current_url)
            response = self._fetch(current_url, allow_redirects=False)

            if response is None:
                break

        if redirect_count == 0:
            self.report.add(AuditResult(
                name="redirect_chain",
                status=Status.PASS,
                message="No redirects detected"
            ))
        elif redirect_count == 1:
            self.report.add(AuditResult(
                name="redirect_chain",
                status=Status.PASS,
                message="Single redirect detected",
                details=" -> ".join(redirect_chain)
            ))
        elif redirect_count <= 3:
            self.report.add(AuditResult(
                name="redirect_chain",
                status=Status.WARN,
                message=f"Redirect chain has {redirect_count} hops",
                details="Consider reducing redirect chain length",
                value=" -> ".join(redirect_chain)
            ))
        else:
            self.report.add(AuditResult(
                name="redirect_chain",
                status=Status.FAIL,
                message=f"Long redirect chain ({redirect_count} hops)",
                details="Excessive redirects harm SEO and performance",
                value=" -> ".join(redirect_chain[:5]) + "..."
            ))

    # =========================================================================
    # Crawlability Checks
    # =========================================================================

    def _audit_noindex(self) -> None:
        """Detect noindex signals from multiple sources."""
        noindex_sources = []

        # Check meta robots
        if self.page_soup:
            meta_robots = self.page_soup.find("meta", attrs={"name": "robots"})
            if meta_robots:
                content = meta_robots.get("content", "").lower()
                if "noindex" in content or "none" in content:
                    noindex_sources.append("meta robots tag")

        # Check X-Robots-Tag header
        response = self._fetch(self.base_url, allow_redirects=False)
        if response:
            x_robots = response.headers.get("X-Robots-Tag", "").lower()
            if "noindex" in x_robots:
                noindex_sources.append("X-Robots-Tag header")

        if noindex_sources:
            self.report.add(AuditResult(
                name="noindex_detection",
                status=Status.FAIL,
                message="Page has noindex directive",
                details=f"Sources: {', '.join(noindex_sources)}",
                value=", ".join(noindex_sources)
            ))
        else:
            self.report.add(AuditResult(
                name="noindex_detection",
                status=Status.PASS,
                message="No noindex directives detected"
            ))

    def _audit_blocked_paths(self) -> None:
        """Check if common important paths are blocked in robots.txt."""
        if not self.robots_content:
            self.report.add(AuditResult(
                name="blocked_paths",
                status=Status.SKIP,
                message="Cannot check blocked paths - no robots.txt"
            ))
            return

        # Parse robots.txt
        rp = RobotFileParser()
        robots_url = urljoin(self.base_url, "/robots.txt")
        rp.set_url(robots_url)

        try:
            rp.parse(self.robots_content.split("\n"))
        except Exception:
            self.report.add(AuditResult(
                name="blocked_paths",
                status=Status.WARN,
                message="Could not parse robots.txt for path checking"
            ))
            return

        # Important paths to check
        important_paths = [
            "/",
            "/sitemap.xml",
            "/robots.txt",
        ]

        blocked_important = []

        for path in important_paths:
            full_url = urljoin(self.base_url, path)
            if not rp.can_fetch("*", full_url):
                blocked_important.append(path)

        if blocked_important:
            self.report.add(AuditResult(
                name="blocked_paths",
                status=Status.WARN,
                message="Important paths blocked in robots.txt",
                details=f"Blocked: {', '.join(blocked_important)}",
                value=", ".join(blocked_important)
            ))
        else:
            self.report.add(AuditResult(
                name="blocked_paths",
                status=Status.PASS,
                message="No important paths blocked",
                details="Root, sitemap, and robots.txt are accessible"
            ))


def format_cli_report(report: AuditReport) -> str:
    """Format audit report for CLI output."""
    lines = []
    lines.append("=" * 70)
    lines.append("SEO TECHNICAL AUDIT REPORT")
    lines.append("=" * 70)
    lines.append(f"URL: {report.url}")
    lines.append("")

    # Group results by category
    categories = {
        "Page Accessibility": ["page_accessible", "http_status", "redirect_chain"],
        "Metadata": ["title_tag", "meta_description", "meta_robots", "canonical_link"],
        "Social Media": ["open_graph", "twitter_cards"],
        "robots.txt": ["robots_txt_accessible", "robots_txt_syntax", "robots_txt_sitemap_ref"],
        "Sitemap": ["sitemap_accessible", "sitemap_xml_valid", "sitemap_type", "sitemap_url_count", "sitemap_lastmod"],
        "Crawlability": ["noindex_detection", "x_robots_tag", "blocked_paths"],
    }

    results_by_name = {r.name: r for r in report.results}

    for category, check_names in categories.items():
        category_results = [results_by_name[name] for name in check_names if name in results_by_name]

        if not category_results:
            continue

        lines.append(f"\n{category}")
        lines.append("-" * len(category))

        for result in category_results:
            status_icon = {
                Status.PASS: "[PASS]",
                Status.WARN: "[WARN]",
                Status.FAIL: "[FAIL]",
                Status.SKIP: "[SKIP]"
            }[result.status]

            lines.append(f"  {status_icon} {result.message}")

            if result.details:
                lines.append(f"         {result.details}")

            if result.value and len(result.value) < 80:
                lines.append(f"         Value: {result.value}")

    # Summary
    lines.append("\n" + "=" * 70)
    lines.append("SUMMARY")
    lines.append("=" * 70)
    lines.append(f"  Total checks: {report.summary['total']}")
    lines.append(f"  Passed:       {report.summary['passed']}")
    lines.append(f"  Warnings:     {report.summary['warnings']}")
    lines.append(f"  Failures:     {report.summary['failures']}")
    lines.append(f"  Skipped:      {report.summary['skipped']}")

    if report.has_critical_failures():
        lines.append("\n  CRITICAL SEO ISSUES DETECTED")

    lines.append("=" * 70)

    return "\n".join(lines)


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Perform a technical SEO audit for a website",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s https://example.com
  %(prog)s https://example.com --json
  %(prog)s https://example.com --output report.json
  %(prog)s example.com --json --output audit.json
        """
    )

    parser.add_argument(
        "url",
        help="Base URL to audit (e.g., https://example.com)"
    )

    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results in JSON format"
    )

    parser.add_argument(
        "--output", "-o",
        type=str,
        help="Write JSON output to file"
    )

    args = parser.parse_args()

    # Run audit
    try:
        auditor = SEOAuditor(args.url)
        report = auditor.run_audit()
    except Exception as e:
        print(f"Error during audit: {e}", file=sys.stderr)
        return 2

    # Output results
    if args.json or args.output:
        json_output = json.dumps(report.to_dict(), indent=2)

        if args.output:
            try:
                with open(args.output, "w") as f:
                    f.write(json_output)
                print(f"JSON report written to: {args.output}")
            except IOError as e:
                print(f"Error writing to file: {e}", file=sys.stderr)
                return 2

        if args.json:
            print(json_output)
    else:
        print(format_cli_report(report))

    # Exit with non-zero on critical failures
    if report.has_critical_failures():
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
