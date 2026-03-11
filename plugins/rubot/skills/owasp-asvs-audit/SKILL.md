---
name: owasp-asvs-audit
version: 1.0.0
description: |
  Master orchestration skill for comprehensive OWASP Application Security Verification Standard (ASVS) 5.0.0 security audits across all 17 chapters (~350 requirements). ACTIVATE THIS SKILL when the user wants to: run a security audit, perform OWASP ASVS verification, assess application security posture, check OWASP compliance, do a vulnerability assessment, generate a security audit report, review application security before deployment, create a remediation plan for security findings, verify security controls against ASVS levels (L1/L2/L3), perform penetration testing preparation, audit authentication/authorization/session management/cryptography/API security, or assess overall application security maturity.

  Trigger on: "OWASP ASVS", "security audit", "ASVS compliance", "OWASP compliance", "application security verification", "security assessment", "vulnerability assessment", "security posture", "security review", "penetration test prep", "pentest preparation", "security controls audit", "ASVS level 1", "ASVS level 2", "ASVS level 3", "L1 audit", "L2 audit", "L3 audit", "comprehensive security audit", "security verification standard", "ASVS 5.0", "pre-deployment security review", "security compliance check", "application security audit".

  DO NOT trigger for: fixing a single specific vulnerability (use the relevant chapter skill directly), configuring a WAF or firewall, setting up network security, infrastructure hardening, DevSecOps pipeline setup, container security scanning, or dependency vulnerability scanning (use rubot-skills-security-check for ClawSec advisory scans). Those are specialized tasks, not comprehensive ASVS auditing.
agents:
  - debug-master
  - backend-master
---

# OWASP ASVS 5.0.0 Master Audit Skill

> Comprehensive application security verification across all 17 ASVS chapters with scored compliance reporting and prioritized remediation

## Overview

The **OWASP Application Security Verification Standard (ASVS) 5.0.0** is the definitive framework for verifying the security of web applications. Released by the Open Worldwide Application Security Project (OWASP), ASVS 5.0.0 provides a structured set of security requirements organized into **17 chapters** covering approximately **350 verification requirements**.

ASVS defines **three verification levels** that allow organizations to select the depth of security assurance appropriate for their risk profile:

- **Level 1 (L1)**: Opportunistic — Defends against the most common, easily discovered vulnerabilities
- **Level 2 (L2)**: Standard — The recommended baseline for most applications handling sensitive data
- **Level 3 (L3)**: Advanced — Required for high-assurance applications in critical sectors (finance, healthcare, defense, critical infrastructure)

This master skill orchestrates all 17 chapter-specific audit skills to produce a unified, scored security assessment with actionable remediation plans.

## When to Use

- Running a full OWASP ASVS security audit on a web application
- Performing a targeted security assessment on specific ASVS chapters
- Verifying compliance with ASVS Level 1, Level 2, or Level 3
- Preparing for a penetration test by identifying known weaknesses
- Generating a security posture report for stakeholders or compliance teams
- Conducting a pre-deployment security review for production readiness
- Creating a prioritized remediation roadmap for security improvements
- Assessing security maturity of an application against industry standards
- Comparing current security controls against ASVS requirements
- Fulfilling regulatory or contractual security verification obligations

For individual security domain fixes, use the specific chapter skill directly (e.g., `owasp-authentication` for auth issues, `owasp-cryptography` for crypto fixes).

## ASVS Level Definitions

### Level 1: Opportunistic (~70 requirements, ~20% of total)

Level 1 represents the minimum viable security posture. It covers critical first-layer defenses that protect against the most commonly exploited vulnerabilities. Every application should meet Level 1 at minimum.

**Characteristics:**
- Defends against vulnerabilities in the OWASP Top 10 and similar common attack vectors
- Can be verified through automated scanning and basic manual review
- Focuses on input validation, output encoding, authentication basics, and access control fundamentals
- Achievable with moderate security effort for most development teams

**Typical Use Cases:** Internal tools, low-risk applications, applications without sensitive data, MVP/prototype deployments.

### Level 2: Standard (~175 requirements, ~50% of total, ~70% cumulative with L1)

Level 2 is the recommended baseline for most applications that handle sensitive data or business logic. It adds defense-in-depth controls on top of Level 1 and addresses more sophisticated attack vectors.

**Characteristics:**
- Covers the majority of security risks relevant to modern web applications
- Requires both automated and manual verification methods
- Includes session management hardening, cryptographic controls, API security, and detailed logging
- Addresses business logic flaws and more nuanced authorization patterns

**Typical Use Cases:** E-commerce applications, SaaS platforms, applications handling PII, B2B applications, healthcare portals, financial dashboards.

### Level 3: Advanced (~105 requirements, ~30% of total, 100% cumulative)

Level 3 provides the highest level of assurance and is required for applications where a security breach could have severe consequences. It covers advanced threats and requires deep architectural review.

**Characteristics:**
- Requires thorough code review, architecture analysis, and adversarial testing
- Covers advanced attack vectors including cryptographic side channels, race conditions, and complex authorization bypass
- Demands formal threat modeling and security architecture documentation
- Requires specialized security expertise for verification

**Typical Use Cases:** Banking and payment systems, healthcare systems with PHI, government and defense applications, critical infrastructure control systems, applications processing classified data.

## Audit Methodology

### Step 1: Determine Target ASVS Level

Establish the target verification level based on application risk profile:

| Factor | L1 Indicator | L2 Indicator | L3 Indicator |
|--------|-------------|-------------|-------------|
| Data Sensitivity | Public data, no PII | PII, financial data | PHI, classified, payment card data |
| Regulatory Requirements | None specific | GDPR, SOC 2 | PCI DSS, HIPAA, FedRAMP |
| User Base | Internal, small | Public-facing, moderate | Large-scale, critical services |
| Breach Impact | Low business impact | Moderate financial/reputational | Severe legal, financial, safety |
| Industry | General, low-risk | Technology, retail, services | Finance, healthcare, government, defense |

### Step 2: Identify Applicable Chapters

Not every chapter applies to every application. Analyze the codebase and architecture to determine which chapters are relevant:

| Chapter | Applicability Check | Skip If |
|---------|-------------------|---------|
| V1: Encoding & Sanitization | Always applicable | Never skip |
| V2: Validation & Business Logic | Always applicable | Never skip |
| V3: Web Frontend Security | Has web frontend | API-only service with no frontend |
| V4: API & Web Service | Has API endpoints | Static site with no API |
| V5: File Handling | Has file upload/download/processing | No file operations |
| V6: Authentication | Has user authentication | Public-only, no auth |
| V7: Session Management | Has user sessions | Stateless API with token-only auth |
| V8: Authorization | Has access control | Single-role, no authorization logic |
| V9: Self-contained Tokens | Uses JWT/PASETO/signed tokens | Cookie-only session management |
| V10: OAuth & OIDC | Uses OAuth 2.0 or OpenID Connect | No OAuth/OIDC integration |
| V11: Cryptography | Uses encryption/hashing/signing | No cryptographic operations |
| V12: Secure Communication | Has network communication | N/A (always applicable for web apps) |
| V13: Configuration | Always applicable | Never skip |
| V14: Data Protection | Handles any user or sensitive data | Never skip |
| V15: Secure Coding & Architecture | Always applicable | Never skip |
| V16: Security Logging | Always applicable | Never skip |
| V17: WebRTC | Uses WebRTC peer connections | No WebRTC functionality |

### Step 3: Run Chapter Audits

Execute each applicable chapter audit in order using the corresponding chapter skill. For each chapter:

1. Load the chapter skill via the Skill tool
2. Execute all verification requirements for the target level
3. Record findings with requirement IDs, severity, and evidence
4. Calculate chapter compliance score

**Chapter execution order:**

1. `owasp-encoding-sanitization` — V1: Encoding and Sanitization
2. `owasp-validation-logic` — V2: Validation and Business Logic
3. `owasp-web-frontend-security` — V3: Web Frontend Security
4. `owasp-api-security` — V4: API and Web Service
5. `owasp-file-handling` — V5: File Handling
6. `owasp-authentication` — V6: Authentication
7. `owasp-session-management` — V7: Session Management
8. `owasp-authorization` — V8: Authorization
9. `owasp-self-contained-tokens` — V9: Self-contained Tokens
10. `owasp-oauth-oidc` — V10: OAuth and OIDC
11. `owasp-cryptography` — V11: Cryptography
12. `owasp-secure-communication` — V12: Secure Communication
13. `owasp-configuration-security` — V13: Configuration
14. `owasp-data-protection` — V14: Data Protection
15. `owasp-secure-coding` — V15: Secure Coding and Architecture
16. `owasp-security-logging` — V16: Security Logging and Error Handling
17. `owasp-webrtc-security` — V17: WebRTC

### Step 4: Generate Consolidated Security Report

Compile all chapter results into a single report written to `.claude/rubot/security-audit-report.md`. See the Report Template section below for the required format.

### Step 5: Create Prioritized Remediation Plan

Organize all findings into a phased remediation plan:

- **Phase 1 (Immediate, 0-2 weeks):** Critical and High severity findings that are actively exploitable
- **Phase 2 (Short-term, 2-6 weeks):** High and Medium severity findings that require code changes
- **Phase 3 (Medium-term, 1-3 months):** Medium severity findings requiring architectural changes
- **Phase 4 (Long-term, 3-6 months):** Low severity findings and defense-in-depth improvements

## Chapter Skills Reference

| Chapter | Skill Name | Domain | Key Areas |
|---------|-----------|--------|-----------|
| V1 | `owasp-encoding-sanitization` | Encoding and Sanitization | Output encoding, injection prevention, HTML/URL/SQL encoding, sanitization filters |
| V2 | `owasp-validation-logic` | Validation and Business Logic | Input validation, business rule enforcement, anti-automation, integrity checks |
| V3 | `owasp-web-frontend-security` | Web Frontend Security | CSP, DOM security, XSS prevention, iframe protection, browser security headers |
| V4 | `owasp-api-security` | API and Web Service | REST/GraphQL/WebSocket security, rate limiting, schema validation, CORS |
| V5 | `owasp-file-handling` | File Handling | Upload validation, storage security, path traversal, malware scanning, file type verification |
| V6 | `owasp-authentication` | Authentication | Credential security, MFA, password policy, brute force protection, credential recovery |
| V7 | `owasp-session-management` | Session Management | Session lifecycle, cookie security, session fixation, concurrent sessions, timeout |
| V8 | `owasp-authorization` | Authorization | Access control models, privilege escalation, IDOR, resource-level permissions |
| V9 | `owasp-self-contained-tokens` | Self-contained Tokens | JWT/PASETO security, token signing, claims validation, key management, token lifecycle |
| V10 | `owasp-oauth-oidc` | OAuth and OIDC | OAuth 2.0 flows, OIDC verification, PKCE, token exchange, scope management |
| V11 | `owasp-cryptography` | Cryptography | Algorithm selection, key management, random number generation, hashing, encryption |
| V12 | `owasp-secure-communication` | Secure Communication | TLS configuration, certificate validation, HSTS, certificate pinning, protocol security |
| V13 | `owasp-configuration-security` | Configuration | Server hardening, dependency management, default credentials, environment isolation |
| V14 | `owasp-data-protection` | Data Protection | PII handling, data classification, retention policies, privacy controls, data minimization |
| V15 | `owasp-secure-coding` | Secure Coding and Architecture | Secure design patterns, threat modeling, dependency security, build integrity |
| V16 | `owasp-security-logging` | Security Logging and Error Handling | Audit trails, log integrity, error handling, monitoring, alerting, incident detection |
| V17 | `owasp-webrtc-security` | WebRTC | Peer connection security, SRTP/DTLS, ICE/TURN configuration, media stream protection |

## Report Template

The consolidated audit report must follow this structure:

```markdown
# OWASP ASVS 5.0.0 Security Audit Report

**Application:** [Application Name]
**Date:** [Audit Date]
**Target Level:** ASVS Level [1/2/3]
**Auditor:** RuBot Security Audit
**Version:** 1.0

---

## Executive Summary

**Overall Compliance Score:** [X]% ([passed]/[total applicable] requirements)

| Metric | Value |
|--------|-------|
| Total Requirements Assessed | [N] |
| Passed | [N] |
| Failed | [N] |
| Not Applicable | [N] |
| Compliance Percentage | [X]% |

**Risk Rating:** [Critical / High / Medium / Low / Compliant]

[2-3 sentence summary of the overall security posture and key areas of concern.]

---

## Per-Chapter Compliance Matrix

| Chapter | Domain | Applicable | Passed | Failed | N/A | Score |
|---------|--------|-----------|--------|--------|-----|-------|
| V1 | Encoding & Sanitization | [N] | [N] | [N] | [N] | [X]% |
| V2 | Validation & Business Logic | [N] | [N] | [N] | [N] | [X]% |
| V3 | Web Frontend Security | [N] | [N] | [N] | [N] | [X]% |
| V4 | API & Web Service | [N] | [N] | [N] | [N] | [X]% |
| V5 | File Handling | [N] | [N] | [N] | [N] | [X]% |
| V6 | Authentication | [N] | [N] | [N] | [N] | [X]% |
| V7 | Session Management | [N] | [N] | [N] | [N] | [X]% |
| V8 | Authorization | [N] | [N] | [N] | [N] | [X]% |
| V9 | Self-contained Tokens | [N] | [N] | [N] | [N] | [X]% |
| V10 | OAuth & OIDC | [N] | [N] | [N] | [N] | [X]% |
| V11 | Cryptography | [N] | [N] | [N] | [N] | [X]% |
| V12 | Secure Communication | [N] | [N] | [N] | [N] | [X]% |
| V13 | Configuration | [N] | [N] | [N] | [N] | [X]% |
| V14 | Data Protection | [N] | [N] | [N] | [N] | [X]% |
| V15 | Secure Coding & Architecture | [N] | [N] | [N] | [N] | [X]% |
| V16 | Security Logging | [N] | [N] | [N] | [N] | [X]% |
| V17 | WebRTC | [N] | [N] | [N] | [N] | [X]% |

---

## Compliance by ASVS Level

| Level | Requirements | Passed | Failed | Score |
|-------|-------------|--------|--------|-------|
| Level 1 | [N] | [N] | [N] | [X]% |
| Level 2 | [N] | [N] | [N] | [X]% |
| Level 3 | [N] | [N] | [N] | [X]% |

---

## Critical Findings

### [FINDING-001] [Title]
- **Severity:** Critical
- **ASVS Requirement:** V[X].[Y].[Z]
- **Chapter:** [Chapter Name]
- **Description:** [What was found]
- **Evidence:** [Code snippet, configuration, or observation]
- **Impact:** [What an attacker could do]
- **Remediation:** [How to fix it]

[Repeat for each critical finding]

---

## High Severity Findings

[Same format as Critical Findings]

---

## Medium Severity Findings

[Same format as Critical Findings]

---

## Low Severity Findings

[Same format as Critical Findings]

---

## Remediation Roadmap

### Phase 1: Immediate (0-2 weeks)
| Finding | Severity | Chapter | Effort | Owner |
|---------|----------|---------|--------|-------|
| [FINDING-ID] | Critical | [Chapter] | [Hours/Days] | [Team] |

### Phase 2: Short-term (2-6 weeks)
[Same table format]

### Phase 3: Medium-term (1-3 months)
[Same table format]

### Phase 4: Long-term (3-6 months)
[Same table format]

---

## Appendix: Full Requirements Checklist

[Complete list of all assessed requirements with Pass/Fail/N/A status]
```

## Scoring Methodology

### Per-Chapter Compliance Score

```
Chapter Score = (Passed Requirements / Applicable Requirements) x 100
```

Where:
- **Passed Requirements** = requirements verified as correctly implemented
- **Applicable Requirements** = total requirements minus N/A requirements
- Requirements marked N/A are excluded from both numerator and denominator

### Overall Compliance Score

```
Overall Score = (Total Passed / Total Applicable) x 100
```

This is a weighted calculation across all applicable chapters. Each requirement counts equally regardless of which chapter it belongs to.

### Risk Rating Thresholds

| Score Range | Risk Rating | Interpretation |
|-------------|-------------|----------------|
| 95-100% | Compliant | Meets target ASVS level with minimal gaps |
| 80-94% | Low Risk | Generally secure, minor gaps to address |
| 60-79% | Medium Risk | Significant gaps requiring attention |
| 40-59% | High Risk | Major security weaknesses present |
| 0-39% | Critical Risk | Fundamental security controls missing |

### Severity Classification

Findings are classified using this severity matrix:

| Severity | Criteria | Examples |
|----------|----------|---------|
| Critical | Actively exploitable, leads to full compromise | SQL injection, authentication bypass, RCE |
| High | Exploitable with moderate effort, significant impact | Broken access control, insecure deserialization, missing encryption |
| Medium | Exploitable under specific conditions, moderate impact | CSRF, verbose error messages, weak password policy |
| Low | Minor impact, defense-in-depth improvement | Missing security headers, overly permissive CORS, informational exposure |

## References

- [OWASP ASVS 5.0.0 on GitHub](https://github.com/OWASP/ASVS/tree/v5.0.0)
- [OWASP ASVS Official Project Page](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Top 10 (2021)](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [NIST SP 800-63 Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)
