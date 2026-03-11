---
name: owasp-authorization
version: 1.1.0
description: |
  Audits authorization implementations against OWASP ASVS v5.0 Chapter V8 covering access control policies (RBAC/ABAC), principle of least privilege, deny-by-default, function/data/field-level controls, IDOR prevention, multi-tenant isolation, and admin interface protection.
  MUST activate for: authorization audit, access control review, RBAC review, ABAC review, IDOR testing, privilege escalation, ASVS V8, permission check, role-based access, admin protection, multi-tenant security, horizontal privilege, vertical privilege, least privilege review, deny by default.
  Also activate when: user asks to check if API endpoints enforce authorization, test for IDOR vulnerabilities, review admin panel access controls, audit multi-tenant data isolation, find routes missing permission middleware, check for client-side-only access control, review role assignment endpoints for escalation, or verify deny-by-default configuration.
  Do NOT activate for: authentication (use owasp-authentication), session management (use owasp-session-management), OAuth scopes (use owasp-oauth-oidc), JWT claims (use owasp-self-contained-tokens), general RBAC setup (use rbac-auth).
  Covers: access control model documentation (RBAC, ABAC, ReBAC), roles and permissions matrix, decision factor documentation, environmental context (IP, time, device), principle of least privilege, deny-by-default enforcement, function-level access control on every endpoint, data-level access control (ownership filtering), field-level access control (sensitive field hiding by role), consistent cross-layer authorization (API, service, DB), server-side enforcement, centralized authorization logic, real-time permission checking (no stale cache), immediate permission revocation, batch/bulk operation authorization, admin interface MFA/VPN/IP protection, multi-tenant data isolation, horizontal privilege escalation prevention, vertical privilege escalation prevention, directory traversal prevention, rate limiting on authorization-sensitive operations, IDOR testing methodology.
agents:
  - debug-master
---

# OWASP ASVS V8 -- Authorization Audit

## Overview

This skill audits authorization implementations against OWASP ASVS v5.0
Chapter V8. Authorization determines what an authenticated user is allowed
to do. Broken access control is consistently ranked as one of the top
web application security risks (OWASP Top 10 #1, 2021).

This skill covers four sub-sections:

| Section | Topic |
|---------|-------|
| V8.1 | Authorization Documentation |
| V8.2 | General Authorization Design |
| V8.3 | Operation Level Authorization |
| V8.4 | Other Authorization Considerations |

## When to Use

- Reviewing access control implementations (RBAC, ABAC, ReBAC)
- Testing for IDOR (Insecure Direct Object Reference) vulnerabilities
- Evaluating privilege escalation risks (horizontal and vertical)
- Auditing admin interface protection
- Reviewing multi-tenant isolation
- Checking deny-by-default configurations
- Evaluating function-level, data-level, and field-level access controls

## Verification Requirements

### V8.1 -- Authorization Documentation

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 8.1.1 | Access control model documented (RBAC, ABAC, or hybrid) | | X | X |
| 8.1.2 | Roles and permissions matrix documented | | X | X |
| 8.1.3 | Decision factors documented (user attributes, resource ownership, env context) | | X | X |
| 8.1.4 | Environmental contexts documented (IP range, time-of-day, device trust) | | | X |

**Checklist:**
- [ ] Access control model (RBAC, ABAC, ReBAC) is documented
- [ ] Roles and their permissions are listed in a matrix
- [ ] Decision inputs (user role, resource owner, tenant) are documented
- [ ] At L3: environmental factors (IP, time, device) are documented

### V8.2 -- General Authorization Design

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 8.2.1 | Principle of least privilege applied (minimal permissions by default) | X | X | X |
| 8.2.2 | Deny by default (access denied unless explicitly granted) | X | X | X |
| 8.2.3 | Function-level access control enforced on every endpoint | X | X | X |
| 8.2.4 | Data-level access control enforced (users can only access their own data) | X | X | X |
| 8.2.5 | Field-level access control enforced (sensitive fields hidden by role) | | X | X |
| 8.2.6 | Authorization enforced consistently across all layers (API, service, DB) | X | X | X |
| 8.2.7 | Access control checks performed server-side (not client-only) | X | X | X |
| 8.2.8 | Authorization logic centralized (single enforcement point) | | X | X |

**Checklist:**
- [ ] New users/roles start with no permissions
- [ ] Routes without explicit permission rules return 403
- [ ] Every API endpoint checks user role/permissions
- [ ] Data queries filter by user/tenant ownership
- [ ] Sensitive fields (SSN, salary) filtered by role
- [ ] Same authorization logic applied at API and service layer
- [ ] No client-side-only access control (hidden buttons not enough)
- [ ] Authorization middleware/decorator pattern used consistently

### V8.3 -- Operation Level Authorization

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 8.3.1 | Permissions checked in real-time (not cached/stale) | X | X | X |
| 8.3.2 | No stale authorization data used for access decisions | X | X | X |
| 8.3.3 | Permission changes take effect immediately (no delayed revocation) | X | X | X |
| 8.3.4 | Batch/bulk operations enforce same authorization as individual operations | | X | X |

**Checklist:**
- [ ] Permissions fetched from source of truth on each request
- [ ] No long-lived permission caches without invalidation
- [ ] Role/permission revocation effective immediately
- [ ] Bulk endpoints (DELETE /users?ids=1,2,3) check auth per item

### V8.4 -- Other Authorization Considerations

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 8.4.1 | Admin interfaces protected by additional controls (MFA, VPN, IP allowlist) | X | X | X |
| 8.4.2 | Multi-tenant data isolation enforced at all layers | X | X | X |
| 8.4.3 | Horizontal privilege escalation prevented (user A cannot access user B's data) | X | X | X |
| 8.4.4 | Vertical privilege escalation prevented (regular user cannot perform admin actions) | X | X | X |
| 8.4.5 | Directory traversal / path manipulation prevented in resource access | X | X | X |
| 8.4.6 | Rate limiting on authorization-sensitive operations | | X | X |

**Checklist:**
- [ ] Admin panel requires additional authentication factor or VPN
- [ ] Tenant ID enforced in all database queries (WHERE tenant_id = ?)
- [ ] Object ownership verified before access (user.id === resource.ownerId)
- [ ] Role check prevents non-admin from accessing admin endpoints
- [ ] Path parameters sanitized (no ../../../etc/passwd)
- [ ] Enumeration attacks mitigated (rate limiting on resource access)

## Code Review Patterns

Use these search patterns to locate authorization-related code for review.

### Missing Authorization Checks

```bash
# Find route definitions without middleware/decorators
grep -rn "app.get\|app.post\|app.put\|app.delete\|app.patch\|router.get\|router.post" --include="*.{ts,js}" | grep -v "auth\|permission\|role\|guard\|middleware\|protect"

# Find Django views without permission decorators
grep -rn "def get\|def post\|def put\|def delete\|def patch" --include="*.py" | grep -v "permission\|login_required\|IsAuthenticated\|has_perm"

# Find Spring controllers without authorization annotations
grep -rn "@GetMapping\|@PostMapping\|@PutMapping\|@DeleteMapping" --include="*.java" | grep -v "@PreAuthorize\|@Secured\|@RolesAllowed"
```

### IDOR Vulnerabilities

```bash
# Find direct use of request parameters in database queries
grep -rn "params.id\|params.userId\|req.params\.\|request.args\.\|@PathVariable" --include="*.{ts,js,py,java,rb,go}"

# Find database queries without ownership filters
grep -rn "findById\|find_by_id\|get(pk=\|findOne\|SELECT.*WHERE.*id\s*=" --include="*.{ts,js,py,java,rb,go}"

# Find missing tenant isolation
grep -rn "findAll\|find_all\|objects.all\|SELECT \*" --include="*.{ts,js,py,java,rb,go}" | grep -v "tenant\|organization\|org_id\|company"
```

### Client-Side Authorization (Anti-Pattern)

```bash
# Find client-side role checks without server enforcement
grep -rn "v-if.*admin\|v-if.*role\|isAdmin\|hasRole\|canAccess\|v-show.*permission" --include="*.{vue,tsx,jsx,html}"

# Find hidden UI elements as sole access control
grep -rn "display.*none.*admin\|hidden.*role\|ng-if.*permission\|*ngIf.*role" --include="*.{html,vue,tsx,jsx}"
```

### Admin Interface Access

```bash
# Find admin routes and their protection
grep -rn "admin\|/dashboard\|/manage\|/internal\|/backoffice" --include="*.{ts,js,py,java,rb,go}" | grep -i "route\|path\|url\|endpoint"

# Find admin panel middleware
grep -rn "isAdmin\|requireAdmin\|admin_required\|AdminOnly\|ROLE_ADMIN\|staff_member_required" --include="*.{ts,js,py,java,rb,go}"
```

### Privilege Escalation Vectors

```bash
# Find role assignment endpoints
grep -rn "role.*=\|setRole\|assignRole\|update.*role\|change.*role\|promote" --include="*.{ts,js,py,java,rb,go}"

# Find permission modification
grep -rn "addPermission\|grant\|elevate\|privilege\|setAdmin\|makeAdmin" --include="*.{ts,js,py,java,rb,go}"

# Find user update endpoints that may include role fields
grep -rn "update.*user\|user.*update\|PATCH.*user\|PUT.*user" --include="*.{ts,js,py,java,rb,go}"
```

### Multi-Tenant Isolation

```bash
# Find tenant/org context
grep -rn "tenant_id\|tenantId\|org_id\|orgId\|organization_id\|company_id" --include="*.{ts,js,py,java,rb,go}"

# Find queries that may lack tenant filtering
grep -rn "findMany\|findAll\|objects.filter\|WHERE\b" --include="*.{ts,js,py,java,rb,go}" | grep -v "tenant\|org"
```

## Remediation Guidance

### Centralized Authorization Middleware (Express.js)

```javascript
// middleware/authorize.js
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Usage -- deny by default, explicit grant required
app.get('/api/users', authorize('admin', 'manager'), listUsers);
app.delete('/api/users/:id', authorize('admin'), deleteUser);

// Catch-all: deny by default for undefined routes
app.use('/api/*', (req, res) => {
  res.status(403).json({ error: 'Access denied' });
});
```

### IDOR Prevention -- Ownership Check

```javascript
// WRONG -- direct ID from URL, no ownership check
app.get('/api/documents/:id', async (req, res) => {
  const doc = await Document.findById(req.params.id);
  res.json(doc); // Any user can access any document!
});

// CORRECT -- ownership verified
app.get('/api/documents/:id', authorize('user', 'admin'), async (req, res) => {
  const doc = await Document.findOne({
    _id: req.params.id,
    ownerId: req.user.id,  // Enforce ownership
  });

  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});
```

### Multi-Tenant Data Isolation

```javascript
// Middleware to inject tenant context
function tenantScope(req, res, next) {
  if (!req.user?.tenantId) {
    return res.status(403).json({ error: 'Tenant context required' });
  }
  // Attach tenant filter to all subsequent queries
  req.tenantFilter = { tenantId: req.user.tenantId };
  next();
}

// Usage in data access layer
app.get('/api/projects', tenantScope, async (req, res) => {
  const projects = await Project.find({
    ...req.tenantFilter,  // Always include tenant filter
  });
  res.json(projects);
});
```

### Field-Level Access Control

```javascript
function filterFields(data, role) {
  const publicFields = ['id', 'name', 'email', 'department'];
  const managerFields = [...publicFields, 'salary', 'performance_rating'];
  const adminFields = [...managerFields, 'ssn', 'bank_account'];

  const allowedFields = {
    user: publicFields,
    manager: managerFields,
    admin: adminFields,
  };

  const fields = allowedFields[role] || publicFields;
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => fields.includes(key))
  );
}

app.get('/api/employees/:id', authorize('user', 'manager', 'admin'), async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  res.json(filterFields(employee.toJSON(), req.user.role));
});
```

### Real-Time Permission Check (No Stale Cache)

```javascript
// WRONG -- permissions cached at login, stale for hours
app.use((req, res, next) => {
  if (req.session.permissions.includes('admin')) next(); // Stale!
});

// CORRECT -- permissions fetched fresh on each request
async function checkPermission(permission) {
  return async (req, res, next) => {
    const userPerms = await PermissionService.getPermissions(req.user.id);
    if (!userPerms.includes(permission)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
}

app.delete('/api/users/:id', await checkPermission('user:delete'), deleteUser);
```

### Admin Interface Protection

```javascript
// Require additional controls for admin routes
const adminProtection = [
  requireAuth,                          // Must be authenticated
  authorize('admin'),                   // Must have admin role
  requireMFA,                           // Must have completed MFA
  ipAllowlist(['10.0.0.0/8']),         // Must be on internal network
  rateLimit({ windowMs: 60000, max: 30 }), // Rate limited
];

app.use('/admin/*', ...adminProtection);
```

### Django Authorization Decorators

```python
from django.contrib.auth.decorators import login_required, permission_required
from django.http import HttpResponseForbidden

# Function-level access control
@login_required
@permission_required('app.view_report', raise_exception=True)
def view_report(request, report_id):
    # Data-level access control -- ownership check
    report = Report.objects.filter(
        id=report_id,
        organization=request.user.organization  # Tenant isolation
    ).first()

    if not report:
        return HttpResponseForbidden()

    return render(request, 'report.html', {'report': report})
```

## ASVS Level Reference

| Level | Description | Authorization Requirements |
|-------|-------------|---------------------------|
| L1 | Baseline | Deny-by-default, function-level and data-level controls, IDOR prevention, server-side enforcement, admin protection |
| L2 | Standard | All L1 + field-level controls, centralized enforcement, real-time checks, batch authorization, concurrent session limits |
| L3 | Advanced | All L2 + environmental context (IP, time, device), comprehensive audit trail, formal access control model verification |

## IDOR Testing Methodology

When testing for IDOR vulnerabilities, follow this systematic approach:

1. **Identify all endpoints** that accept resource identifiers (IDs, slugs, filenames)
2. **Map access patterns**: which users should access which resources
3. **Test horizontal escalation**: authenticate as User A, try to access User B's resources
4. **Test vertical escalation**: authenticate as regular user, try admin endpoints
5. **Test indirect references**: check if sequential IDs allow enumeration
6. **Test batch operations**: verify per-item auth in bulk endpoints
7. **Test GraphQL/nested**: check authorization on nested resolvers

```bash
# Quick IDOR test pattern
# 1. Login as User A, get session token
# 2. List User A's resources, note IDs
# 3. Login as User B, get session token
# 4. Try accessing User A's resources with User B's token
curl -H "Authorization: Bearer $USER_B_TOKEN" /api/documents/$USER_A_DOC_ID
# Expected: 403 or 404
# Vulnerability: 200 with User A's data
```

## References

- [OWASP ASVS v5.0 -- V8 Authorization](https://github.com/OWASP/ASVS/blob/v5.0/5.0/en/0x16-V8-Authorization.md)
- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
- [OWASP IDOR Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)
- [OWASP Testing Guide -- Authorization Testing](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/)
- [OWASP Top 10 2021 -- A01 Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [NIST SP 800-162 -- Attribute Based Access Control](https://csrc.nist.gov/publications/detail/sp/800-162/final)
