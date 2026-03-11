---
name: rubot-security-audit
description: Run a comprehensive OWASP ASVS 5.0.0 security audit on the codebase. Use when the user wants to check application security, run a vulnerability assessment, verify OWASP compliance, or generate a security audit report with remediation plan.
argument-hint: [level] [chapters]
allowed-tools:
  - WebFetch
  - WebSearch
  - AskUserQuestion
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Skill
---

# OWASP ASVS 5.0.0 Security Audit Command

Run a comprehensive security audit against the OWASP Application Security Verification Standard 5.0.0.

## Prerequisites

Before running this command:
1. Have access to the application codebase
2. Optionally have a running instance (local dev server or production URL) for live testing
3. Load the `owasp-asvs-audit` skill for the master audit methodology

## Execution Steps

### Step 1: Confirm Audit Scope

Use the AskUserQuestion tool to determine the audit parameters:

```
questions:
  - question: "What ASVS verification level should we target?"
    header: "Target ASVS Level"
    options:
      - label: "Level 1 — Opportunistic (~70 requirements)"
        description: "Baseline security for all applications. Covers OWASP Top 10 and common vulnerabilities. Good for internal tools, MVPs, and low-risk apps."
      - label: "Level 2 — Standard (~175 requirements, recommended)"
        description: "Recommended for most applications handling sensitive data. Covers PII, financial data, and business logic security. Good for SaaS, e-commerce, and B2B apps."
      - label: "Level 3 — Advanced (~350 requirements)"
        description: "Maximum assurance for critical applications. Required for healthcare (HIPAA), finance (PCI DSS), government (FedRAMP). Full coverage of all ASVS requirements."
    multiSelect: false
  - question: "Which chapters should we audit?"
    header: "Audit Scope"
    options:
      - label: "All applicable chapters (comprehensive)"
        description: "Audit all 17 ASVS chapters, skipping only those that don't apply to your stack"
      - label: "Authentication & Access Control only"
        description: "Focus on V6 Authentication, V7 Session Management, V8 Authorization, V9 Tokens, V10 OAuth"
      - label: "Data Security only"
        description: "Focus on V1 Encoding, V11 Cryptography, V12 Communication, V14 Data Protection"
      - label: "API & Frontend only"
        description: "Focus on V3 Web Frontend, V4 API Security, V5 File Handling"
      - label: "Specific chapters (I'll specify)"
        description: "Choose exactly which chapters to include"
    multiSelect: false
  - question: "What should we audit?"
    header: "Audit Target"
    options:
      - label: "Codebase only (static analysis)"
        description: "Analyze source code, configuration files, and dependencies"
      - label: "Live URL + Codebase"
        description: "Combine live testing against a running instance with source code analysis"
      - label: "Codebase + Documentation review"
        description: "Include review of security documentation, threat models, and architecture docs"
      - label: "Full audit (URL + Codebase + Docs)"
        description: "Comprehensive audit covering live testing, source analysis, and documentation"
    multiSelect: false
```

If the user selected "Specific chapters (I'll specify)", follow up with:

```
questions:
  - question: "Which ASVS chapters should we include?"
    header: "Select Chapters"
    options:
      - label: "V1: Encoding & Sanitization"
      - label: "V2: Validation & Business Logic"
      - label: "V3: Web Frontend Security"
      - label: "V4: API & Web Service"
      - label: "V5: File Handling"
      - label: "V6: Authentication"
      - label: "V7: Session Management"
      - label: "V8: Authorization"
      - label: "V9: Self-contained Tokens"
      - label: "V10: OAuth & OIDC"
      - label: "V11: Cryptography"
      - label: "V12: Secure Communication"
      - label: "V13: Configuration"
      - label: "V14: Data Protection"
      - label: "V15: Secure Coding & Architecture"
      - label: "V16: Security Logging & Error Handling"
      - label: "V17: WebRTC"
    multiSelect: true
```

### Step 2: Identify Applicable Chapters

Before running audits, analyze the codebase to determine which of the 17 chapters are actually relevant. This prevents wasting time auditing areas that don't exist in the application.

**Technology detection checks:**

```bash
# Check for GraphQL (V4 — GraphQL-specific requirements)
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" \) | head -20 | xargs grep -l "graphql\|GraphQL\|gql\`\|useQuery\|useMutation" 2>/dev/null | head -5

# Check for WebSocket usage (V4 — WebSocket-specific requirements)
find . -type f \( -name "*.ts" -o -name "*.js" \) | head -20 | xargs grep -l "WebSocket\|ws://\|wss://\|socket\.io\|Socket\.IO" 2>/dev/null | head -5

# Check for file upload functionality (V5)
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.tsx" \) | head -20 | xargs grep -l "multer\|formidable\|busboy\|multipart\|file.*upload\|input.*type.*file\|dropzone" 2>/dev/null | head -5

# Check for OAuth/OIDC (V10)
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.json" \) | head -20 | xargs grep -l "oauth\|OAuth\|openid\|OIDC\|passport\|next-auth\|NextAuth\|@auth/\|clerk\|lucia.*oauth\|google.*provider\|github.*provider" 2>/dev/null | head -5

# Check for JWT/self-contained tokens (V9)
find . -type f \( -name "*.ts" -o -name "*.js" \) | head -20 | xargs grep -l "jsonwebtoken\|jwt\|JWT\|jose\|paseto\|PASETO\|JWK\|JWS\|JWE" 2>/dev/null | head -5

# Check for WebRTC (V17)
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.tsx" \) | head -20 | xargs grep -l "RTCPeerConnection\|webrtc\|WebRTC\|getUserMedia\|getDisplayMedia\|RTCDataChannel" 2>/dev/null | head -5

# Check for authentication (V6)
find . -type f \( -name "*.ts" -o -name "*.js" \) | head -20 | xargs grep -l "login\|signIn\|sign_in\|authenticate\|password\|credential\|bcrypt\|argon2\|lucia\|clerk\|next-auth\|supabase.*auth\|firebase.*auth\|better-auth\|betterAuth" 2>/dev/null | head -5

# Check for session management (V7)
find . -type f \( -name "*.ts" -o -name "*.js" \) | head -20 | xargs grep -l "session\|Session\|cookie\|Cookie\|express-session\|iron-session\|lucia.*session" 2>/dev/null | head -5
```

Use Glob and Grep tools for more thorough detection:

- **Glob** for `**/package.json` to check dependencies
- **Grep** for framework-specific patterns in source files
- **Grep** for configuration files (`.env*`, `*.config.*`) for service integrations

Build an applicability matrix and inform the user which chapters will be audited and which will be skipped (with reasons).

### Step 3: Run Chapter Audits

For each applicable chapter, load the corresponding OWASP ASVS chapter skill and execute the audit. Process chapters in order:

**Authentication & Access Control block:**
1. Load `owasp-authentication` skill via Skill tool — audit V6 requirements for the target level
2. Load `owasp-session-management` skill via Skill tool — audit V7 requirements
3. Load `owasp-authorization` skill via Skill tool — audit V8 requirements
4. Load `owasp-self-contained-tokens` skill via Skill tool — audit V9 requirements (if applicable)
5. Load `owasp-oauth-oidc` skill via Skill tool — audit V10 requirements (if applicable)

**Input/Output Security block:**
6. Load `owasp-encoding-sanitization` skill via Skill tool — audit V1 requirements
7. Load `owasp-validation-logic` skill via Skill tool — audit V2 requirements
8. Load `owasp-web-frontend-security` skill via Skill tool — audit V3 requirements (if applicable)
9. Load `owasp-api-security` skill via Skill tool — audit V4 requirements (if applicable)
10. Load `owasp-file-handling` skill via Skill tool — audit V5 requirements (if applicable)

**Infrastructure & Data Security block:**
11. Load `owasp-cryptography` skill via Skill tool — audit V11 requirements
12. Load `owasp-secure-communication` skill via Skill tool — audit V12 requirements
13. Load `owasp-configuration-security` skill via Skill tool — audit V13 requirements
14. Load `owasp-data-protection` skill via Skill tool — audit V14 requirements

**Architecture & Operations block:**
15. Load `owasp-secure-coding` skill via Skill tool — audit V15 requirements
16. Load `owasp-security-logging` skill via Skill tool — audit V16 requirements
17. Load `owasp-webrtc-security` skill via Skill tool — audit V17 requirements (if applicable)

For each chapter audit:
- Execute all verification requirements for the selected ASVS level
- Record each requirement as **Pass**, **Fail**, or **N/A**
- For each **Fail**, document: requirement ID, description, evidence found (code snippet or configuration), severity (Critical/High/Medium/Low), and recommended remediation
- Calculate the chapter compliance score: `(Passed / Applicable) x 100`

### Step 4: Generate Consolidated Report

After all chapter audits complete, compile the results into a single consolidated report.

Write the report to `.claude/rubot/security-audit-report.md` using the template from the `owasp-asvs-audit` skill.

The report must include:

1. **Executive Summary** — Overall compliance score, risk rating, and 2-3 sentence assessment
2. **Per-Chapter Compliance Matrix** — Table showing Pass/Fail/N/A counts and score for each audited chapter
3. **Compliance by ASVS Level** — Breakdown showing L1/L2/L3 requirement compliance separately
4. **All Findings** organized by severity:
   - **Critical Findings** — Actively exploitable, leads to full compromise
   - **High Severity Findings** — Exploitable with moderate effort, significant impact
   - **Medium Severity Findings** — Exploitable under specific conditions
   - **Low Severity Findings** — Minor impact, defense-in-depth improvements
5. **Each finding must include:**
   - Unique finding ID (FINDING-001, FINDING-002, etc.)
   - Title
   - ASVS Requirement ID (e.g., V6.2.1)
   - Chapter name
   - Severity level
   - Description of what was found
   - Evidence (code snippet, configuration, or observation)
   - Impact statement
   - Remediation recommendation
6. **Remediation Roadmap** with four phases:
   - Phase 1: Immediate (0-2 weeks) — Critical and High severity, actively exploitable
   - Phase 2: Short-term (2-6 weeks) — High and Medium, requires code changes
   - Phase 3: Medium-term (1-3 months) — Medium severity, requires architectural changes
   - Phase 4: Long-term (3-6 months) — Low severity, defense-in-depth
7. **Appendix** — Full requirements checklist with Pass/Fail/N/A status

Calculate the overall compliance score:
```
Overall Score = (Total Passed across all chapters / Total Applicable across all chapters) x 100
```

Assign a risk rating:
| Score | Rating |
|-------|--------|
| 95-100% | Compliant |
| 80-94% | Low Risk |
| 60-79% | Medium Risk |
| 40-59% | High Risk |
| 0-39% | Critical Risk |

### Step 5: Present Results and Offer Next Steps

Display a summary of the audit results to the user, then use AskUserQuestion to offer next steps:

```
questions:
  - question: "The security audit is complete. What would you like to do next?"
    header: "Audit Complete — [X]% Compliance ([Risk Rating])"
    options:
      - label: "Fix critical issues first"
        description: "Address [N] critical findings immediately to eliminate the most severe risks"
      - label: "Fix all issues systematically"
        description: "Work through all [N] findings in priority order following the remediation roadmap"
      - label: "Review the full report first"
        description: "Open and review the detailed report at .claude/rubot/security-audit-report.md"
      - label: "Re-audit specific chapters"
        description: "Re-run the audit on specific chapters after making fixes"
      - label: "Export for compliance documentation"
        description: "Format the report for stakeholder review or compliance submission"
    multiSelect: false
```

If the user chooses to fix issues, begin with the highest severity findings and work through the remediation roadmap phases in order. For each fix:
1. Show the finding and its ASVS requirement
2. Implement the fix using the appropriate tools
3. Verify the fix addresses the requirement
4. Move to the next finding

## Related Commands

- `/rubot-skills-security-check` — Run ClawSec security advisory scan for malicious skill detection and dependency vulnerability checking
- `/rubot-wcag-audit` — Run WCAG 2.2 Level AA accessibility audit with scored compliance report
- `/rubot-seo-audit` — Run comprehensive SEO audit with live page analysis

## Related Skills

- `owasp-asvs-audit` — Master OWASP ASVS 5.0.0 audit methodology and scoring framework
- `owasp-encoding-sanitization` — V1: Encoding and Sanitization verification
- `owasp-validation-logic` — V2: Validation and Business Logic verification
- `owasp-api-security` — V4: API and Web Service verification
- `owasp-file-handling` — V5: File Handling verification
- `owasp-authentication` — V6: Authentication verification
- `owasp-session-management` — V7: Session Management verification
- `owasp-authorization` — V8: Authorization verification
- `owasp-self-contained-tokens` — V9: Self-contained Tokens verification
- `owasp-oauth-oidc` — V10: OAuth and OIDC verification
- `owasp-cryptography` — V11: Cryptography verification
- `owasp-secure-communication` — V12: Secure Communication verification
- `owasp-configuration-security` — V13: Configuration verification
- `owasp-data-protection` — V14: Data Protection verification
- `owasp-secure-coding` — V15: Secure Coding and Architecture verification
- `owasp-security-logging` — V16: Security Logging and Error Handling verification
- `owasp-webrtc-security` — V17: WebRTC verification
- `owasp-web-frontend-security` — V3: Web Frontend Security verification
- `rbac-auth` — Role-Based Access Control implementation patterns (complements V8 Authorization auditing)
