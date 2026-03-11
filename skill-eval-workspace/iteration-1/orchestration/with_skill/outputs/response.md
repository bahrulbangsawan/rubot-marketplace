# Orchestrated Plan: User Management Page

> Multi-domain task detected. Applying orchestration skill for domain classification, agent sequencing, and unified execution planning.

## Domain Classification

Analyzing the prompt against the Domain Classification Reference:

| Keyword/Pattern from Prompt | Primary Domain | Required Agent(s) |
|------------------------------|----------------|-------------------|
| "postgres table for roles and permissions" | Database + RBAC | **neon-master**, **backend-master** |
| "tRPC endpoints for CRUD" | Backend / API | **backend-master** |
| "data table with sorting and filtering" | Data Tables | **tanstack**, **shadcn-ui-designer** |
| "responsive on mobile" | Responsiveness | **responsive-master** |
| "roles and permissions" | Authorization | **backend-master**, **neon-master** |

**Multi-Domain Task Pattern Match**: This closely matches both "Add RBAC to app" (`neon-master, backend-master, tanstack, shadcn-ui-designer, qa-tester`) and "Implement role management" (`neon-master, backend-master, shadcn-ui-designer, debug-master`).

## Agent Selection

### Phase 1 -- Domain Analysis Agents (understand the problem)

| Order | Agent | Responsibility |
|-------|-------|----------------|
| 1 | **neon-master** | Design the PostgreSQL schema for `users`, `roles`, `permissions`, and junction tables. Define indexes, constraints, and migration strategy. |
| 2 | **backend-master** | Design tRPC procedures (CRUD) for user management, role assignment, and permission checks. Define Zod validation schemas. Input: neon-master's schema. |
| 3 | **tanstack** | Define TanStack Table column definitions, sorting/filtering models, TanStack Query patterns for data fetching, and mutation hooks. Input: backend-master's tRPC procedures. |

### Phase 2 -- Implementation Agents (define the solution)

| Order | Agent | Responsibility |
|-------|-------|----------------|
| 4 | **shadcn-ui-designer** (Frontend Owner) | Build the full user management UI: data table component, role/permission assignment dialogs, forms for CRUD operations. Coordinates sub-agents. |
| 5 | **responsive-master** (Sub-agent of shadcn-ui-designer) | Validate and apply mobile-first responsive layout. Ensure data table adapts to all 4 breakpoint tiers. |

### Phase 3 -- Verification Agents (validate the solution)

| Order | Agent | Responsibility |
|-------|-------|----------------|
| 6 | **debug-master** | Verify no TypeScript errors, Biome lint passes, type-safety across tRPC + Drizzle + UI. |
| 7 | **qa-tester** | Functional testing via agent-browser: CRUD operations work, sorting/filtering behaves correctly, responsive layout renders properly. |
| 8 | **plan-supervisor** | Update plan.md with completion status for each step. |

## Sequential Invocation Order Rationale

Context propagates forward:
1. **neon-master first** -- The database schema defines the shape of all data. Every downstream agent needs to know the table structure, column types, and relationships.
2. **backend-master second** -- tRPC procedures depend on the schema from neon-master. Zod validation schemas mirror the database constraints.
3. **tanstack third** -- TanStack Table column definitions, Query keys, and mutation hooks depend on the tRPC API contract from backend-master.
4. **shadcn-ui-designer fourth** -- The UI renders data shaped by tanstack's table models using components from shadcn/ui. Frontend ownership rule: all UI goes through this agent.
5. **responsive-master fifth** -- Validates the UI output from shadcn-ui-designer against mobile breakpoints. Operates as a sub-agent under shadcn-ui-designer's coordination.

## Unified Execution Plan

### Prerequisites

- [ ] **neon-master**: Verify NeonDB/PostgreSQL connection is configured
- [ ] **cloudflare**: Confirm `drizzle-orm` and `@neondatabase/serverless` are installed (if not, invoke cloudflare agent for package installation)
- [ ] **Documentation Verification**: Check current APIs for Drizzle ORM, tRPC, TanStack Table, and shadcn/ui DataTable via Context7 or WebSearch

### Implementation Steps

#### Step 1: Database Schema Design
- **Responsible Agent**: neon-master
- **Details**:
  - Create `users` table (id, name, email, created_at, updated_at)
  - Create `roles` table (id, name, description, created_at)
  - Create `permissions` table (id, name, action, resource, created_at)
  - Create `role_permissions` junction table (role_id, permission_id)
  - Create `user_roles` junction table (user_id, role_id)
  - Add proper indexes on foreign keys and frequently queried columns
  - Generate Drizzle migration file
- **Verification**: Migration runs without errors; `bun run db:push` succeeds

#### Step 2: tRPC Procedure Design
- **Responsible Agent**: backend-master
- **Details**:
  - Define Zod schemas: `createUserSchema`, `updateUserSchema`, `assignRoleSchema`
  - Create `userRouter` with procedures:
    - `users.list` -- paginated query with sorting/filtering support (input: page, pageSize, sortBy, sortOrder, filters)
    - `users.getById` -- single user with roles and permissions
    - `users.create` -- create user with initial role assignment
    - `users.update` -- update user details
    - `users.delete` -- soft delete or hard delete
    - `users.assignRole` -- assign a role to a user
    - `users.removeRole` -- remove a role from a user
  - Create `roleRouter` with procedures:
    - `roles.list` -- all roles with permission counts
    - `roles.create` -- create role
    - `roles.update` -- update role
    - `roles.delete` -- delete role (check for assigned users first)
    - `roles.assignPermission` / `roles.removePermission`
  - Implement server-side sorting, filtering, and pagination in `users.list`
- **Verification**: All procedures type-check; Zod schemas validate correctly

#### Step 3: TanStack Integration Layer
- **Responsible Agent**: tanstack
- **Details**:
  - Define TanStack Table column definitions for the users data table:
    - Columns: Name, Email, Roles (badge list), Created At, Actions
    - Enable `getSortedRowModel()`, `getFilteredRowModel()`, `getPaginationRowModel()`
  - Set up TanStack Query hooks:
    - `useQuery` for `users.list` with pagination/sort/filter params
    - `useMutation` for create, update, delete, assignRole, removeRole
    - Query key structure: `['users', { page, sort, filters }]`
    - Cache invalidation on mutations via `queryClient.invalidateQueries`
  - Server-side table pattern: manual sorting, manual filtering, manual pagination (pass state to tRPC input)
- **Verification**: Type inference flows from tRPC to table columns without manual type annotations

#### Step 4: UI Implementation
- **Responsible Agent**: shadcn-ui-designer (Frontend Owner)
- **Details**:
  - Build `UserManagementPage` with:
    - Page header with "Add User" button (opens dialog/sheet)
    - `DataTable` component using shadcn/ui Table + TanStack Table
    - Column headers with sort indicators (clickable to toggle sort)
    - Filter input (global search or per-column)
    - Pagination controls (page size selector, page navigation)
    - Row actions dropdown: Edit, Assign Roles, Delete
  - Build `CreateUserDialog` / `EditUserDialog` using TanStack Form + shadcn/ui form components
  - Build `AssignRolesDialog` with multi-select for roles
  - Role badges in table cells using shadcn/ui Badge component
  - Confirmation dialog for delete actions
  - Loading states (skeleton rows) and empty states
- **Verification**: All components render without console errors; forms validate correctly

#### Step 5: Responsive Layout Validation
- **Responsible Agent**: responsive-master (under shadcn-ui-designer coordination)
- **Details**:
  - Apply 4-tier breakpoint system:
    - **Mobile (< 640px)**: Stack layout, hide non-essential columns (show Name + Actions only), full-width cards or condensed rows, bottom sheet for forms instead of dialogs
    - **Tablet (640px - 1023px)**: Show Name, Email, Roles columns, side sheet for forms
    - **Desktop (1024px - 1279px)**: Show all columns, dialog for forms
    - **Wide (>= 1280px)**: Full table with expanded column widths
  - Use Tailwind responsive utilities (`sm:`, `md:`, `lg:`, `xl:`)
  - Ensure touch targets are at least 44x44px on mobile
  - Test horizontal scroll behavior for data table on small screens
- **Verification**: Layout renders correctly at all 4 breakpoint tiers

### Post-Implementation

- [ ] Run debug-master verification (`bun run validate`, `bunx biome check .`)
- [ ] Run qa-tester validation (CRUD operations, sorting, filtering, responsive behavior)
- [ ] Update plan.md via plan-supervisor

## Cross-Agent Risk Matrix

| Risk | Source Agent | Probability | Impact | Mitigation |
|------|-------------|-------------|--------|------------|
| N+1 query on user roles join | neon-master | Medium | High | Use Drizzle `with` relations or explicit JOIN in the list query |
| Data table performance with many users | tanstack | Medium | Medium | Implement server-side pagination from the start (not client-side) |
| Role deletion with assigned users | backend-master | High | High | Add check in `roles.delete` procedure; return error if role is assigned to users |
| Responsive table unreadable on mobile | responsive-master | Medium | Medium | Use column visibility toggling; hide low-priority columns on small screens |
| Form validation mismatch (client vs server) | backend-master, tanstack | Low | Medium | Share Zod schemas between tRPC input and TanStack Form validation |

## Potential Conflict: Schema Normalization vs. API Performance

```
## Conflict Detected
**Domain**: Schema vs API
**Agent A**: neon-master -- Position: Fully normalized schema with junction tables for role_permissions and user_roles -- Rationale: Data integrity, no update anomalies, proper foreign key constraints
**Agent B**: backend-master -- Position: May want denormalized role names on user records for faster list queries -- Rationale: The users.list endpoint would require JOINs across 4 tables (users, user_roles, roles, role_permissions) which could slow down with large datasets
**Options**:
1. Keep normalized schema, optimize with proper indexes and Drizzle relational queries
2. Add a denormalized `role_names` JSON column on users for fast reads, sync via triggers
3. Use a database VIEW that pre-joins the tables for read queries
**Recommendation**: Option 1 (normalized + indexes) is usually sufficient for user management volumes. Revisit if performance issues emerge.
```

**User decision needed**: Which option do you prefer? For most applications, Option 1 is the right starting point.

## Validation Checklist

### From debug-master
- [ ] `bun run validate` passes
- [ ] `bunx biome check .` passes
- [ ] No TypeScript errors across schema, tRPC procedures, and UI components
- [ ] Drizzle schema types propagate correctly to tRPC output types

### From qa-tester
- [ ] Create user works and appears in table
- [ ] Edit user updates correctly and table refreshes
- [ ] Delete user removes from table (with confirmation)
- [ ] Assign/remove roles updates user record
- [ ] Sorting by each column works correctly
- [ ] Filtering returns correct results
- [ ] Pagination navigates correctly with correct page counts
- [ ] Responsive: page is usable on mobile (< 640px)
- [ ] No console errors during all operations
- [ ] Network requests succeed (no 4xx/5xx errors)

### From plan-supervisor
- [ ] All tasks marked complete in plan.md
- [ ] No orphaned incomplete tasks

## Where to Start

**Start with Step 1 (neon-master)**: Design and migrate the database schema first. Everything else depends on knowing the exact table structure, column types, and relationships. Once the schema is committed and migrated, proceed to Step 2 (backend-master) to build the tRPC procedures that query those tables.

To kick off, invoke neon-master with this context:
> "Design a PostgreSQL schema for user management with RBAC. Need tables for users, roles, permissions, and their relationships (user_roles, role_permissions junction tables). Include proper indexes, timestamps, and foreign key constraints. Output as Drizzle ORM schema definitions with a migration file."
