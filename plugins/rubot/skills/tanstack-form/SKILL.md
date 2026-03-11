---
name: tanstack-form
version: 1.1.0
description: |
  Implements TanStack Form (@tanstack/react-form) for type-safe, headless form management in React. ACTIVATE THIS SKILL when the user wants to: build forms with useForm, use form.Field with children render prop, add Zod validation via zodValidator adapter, create dynamic field arrays with pushValue/removeValue, build multi-step wizard forms with per-step validation, add async validation with onChangeAsyncDebounceMs, display field errors via field.state.meta.errors, disable submit with form.Subscribe watching form.state.canSubmit, convert manual useState-based forms to TanStack Form, wire forms to TanStack Query useMutation, fix field.handleChange not triggering re-renders, fix TypeScript errors on nested field names like 'address.city', fix double submission (missing e.preventDefault), or fix missing validatorAdapter: zodValidator().

  Trigger on: "useForm", "form.Field", "zodValidator", "field.handleChange", "form.Subscribe", "field array", "multi-step form", "wizard form", "async validation on blur", "TanStack Form", "form state management", "form error display".

  DO NOT trigger for: React Hook Form, Formik, Zod-only schemas, Typebox/Elysia validation, vanilla HTML forms, TanStack Table, or search bar debouncing.
agents:
  - tanstack
  - shadcn-ui-designer
---

# TanStack Form Skill

> Type-safe, headless form management with granular reactivity and deep validation integration

## When to Use

- Building any form that needs validation (login, registration, settings, checkout)
- Implementing multi-step or wizard forms with per-step validation
- Managing dynamic form fields or field arrays (add/remove items)
- Integrating Zod schemas for compile-time safe form validation
- Handling async validation (e.g., checking email uniqueness on blur)
- Building forms with complex state (dirty tracking, touched fields, submission status)
- Connecting forms to TanStack Query mutations for API submission
- Replacing manual useState-based form management with a structured approach

## Quick Reference

| Concept | Description |
|---------|-------------|
| **useForm** | Hook that creates a form instance with typed state and submission |
| **form.Field** | Render-prop component binding a single field to form state |
| **FieldApi** | Programmatic access to field value, errors, and meta |
| **Validator Adapter** | Bridges external schemas (Zod, Valibot) to TanStack Form |
| **Field Array** | Dynamic list of fields with push, remove, and swap operations |
| **form.Subscribe** | Subscribes to specific form state slices for conditional rendering |
| **form.state** | Centralized state object (values, errors, isSubmitting, isDirty) |

## Core Principles

1. **Headless Form Management over Controlled Inputs** -- TanStack Form separates form logic from UI rendering, so you can pair it with any component library (shadcn/ui, Radix, custom). This avoids coupling validation and state to specific input components, making forms portable and testable.

2. **Field-Level Validation Improves UX** -- Validating each field independently (onChange, onBlur) gives users immediate feedback without waiting for form submission. This reduces form abandonment and makes errors discoverable at the moment the user can fix them.

3. **Zod Integration Provides Compile-Time Safety** -- Using `zodValidator()` as the adapter means your runtime validation schema and your TypeScript types stay in sync. Schema changes that break field contracts surface as type errors during development, not as silent bugs in production.

4. **Granular Subscriptions Prevent Wasted Renders** -- Each `form.Field` only re-renders when its own state changes, not when any field in the form changes. This keeps large forms performant without manual memoization.

5. **Single Source of Truth for Form State** -- All values, errors, touched status, and submission state live inside `useForm`. No parallel `useState` calls means no sync bugs and a predictable data flow.

## Implementation Guides

For detailed implementation, see:

- [FUNDAMENTALS.md](FUNDAMENTALS.md) - Form setup, fields, state management
- [VALIDATION.md](VALIDATION.md) - Sync/async validation, Zod integration
- [PATTERNS.md](PATTERNS.md) - Field arrays, dynamic fields, nested forms
- [INTEGRATION.md](INTEGRATION.md) - React, Query, shadcn/ui integration

## Quick Start

A minimal form using `useForm` with typed fields and submit handling:

```typescript
import { useForm } from '@tanstack/react-form';

interface LoginForm {
  email: string;
  password: string;
}

function LoginPage() {
  const form = useForm<LoginForm>({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      await loginUser(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="email"
        children={(field) => (
          <div>
            <Label htmlFor={field.name}>Email</Label>
            <Input
              id={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.length > 0 && (
              <span className="text-destructive text-sm">
                {field.state.meta.errors.join(', ')}
              </span>
            )}
          </div>
        )}
      />

      <form.Field
        name="password"
        children={(field) => (
          <div>
            <Label htmlFor={field.name}>Password</Label>
            <Input
              id={field.name}
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      />

      <Button type="submit" disabled={form.state.isSubmitting}>
        {form.state.isSubmitting ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}
```

## Common Patterns

### Zod Validation

Attach `zodValidator()` as the adapter and pass Zod schemas at form or field level. Supports sync onChange/onBlur and async validation with debounce. For detailed examples including async email checks, password validation, and cross-field validation, see [VALIDATION.md](VALIDATION.md).

```typescript
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';

const form = useForm<UserForm>({
  defaultValues: { name: '', email: '' },
  validatorAdapter: zodValidator(),
  validators: { onSubmit: userSchema },
  onSubmit: async ({ value }) => { /* ... */ },
});

// Field-level validation
<form.Field
  name="name"
  validators={{ onChange: z.string().min(2, 'Too short') }}
  children={(field) => (/* ... */)}
/>
```

### Field Arrays

Use `mode="array"` on a field to manage dynamic lists with `pushValue()`, `removeValue()`, and index-based sub-fields. For complete examples including validated arrays, reorderable lists, and computed totals, see [PATTERNS.md](PATTERNS.md).

### TanStack Query Integration

Combine `useForm` with `useMutation` for create/update flows and `useQuery` for edit forms with initial data loading. Invalidate query cache on success. For full mutation, edit form, and async validation examples, see [INTEGRATION.md](INTEGRATION.md).

### Multi-Step and Dynamic Forms

Build wizard forms with per-step Zod schema validation, conditional field rendering via `form.Subscribe`, and dynamic field generation from config objects. For complete multi-step, accordion, and dynamic field examples, see [PATTERNS.md](PATTERNS.md).

## Form State Quick Reference

```typescript
// Form state
form.state.values        // Current form values
form.state.canSubmit      // Valid and not submitting
form.state.isSubmitting   // Submit in progress
form.state.isDirty        // Values changed from defaults
form.state.errors         // Form-level errors

// Field state (inside field.children callback)
field.state.value              // Current value
field.state.meta.errors        // Validation errors array
field.state.meta.isTouched     // Field was blurred
field.state.meta.isValidating  // Async validation running
field.handleChange(value)      // Update value
field.handleBlur()             // Mark as touched
```

For complete form state properties, field methods, form options, input type patterns, nested fields, conditional fields, and error handling, see [FUNDAMENTALS.md](FUNDAMENTALS.md).

## Integration with Rubot Agents

### Required Agent Consultation

| Task | Primary Agent | Supporting Agents |
|------|---------------|-------------------|
| Form implementation | tanstack | shadcn-ui-designer |
| Form validation | tanstack | backend-master |
| Form with API | tanstack | backend-master |
| Form styling | shadcn-ui-designer | tanstack |
| Form accessibility | shadcn-ui-designer | responsive-master |
| Form performance | debug-master | tanstack |

### Multi-Domain Patterns

```
"Add form validation" → tanstack, shadcn-ui-designer
"Create user form" → tanstack, shadcn-ui-designer, backend-master
"Form with file upload" → tanstack, backend-master, cloudflare
"Multi-step form" → tanstack, shadcn-ui-designer
"Form with data loading" → tanstack, backend-master
```

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Form not re-rendering on field change | Field subscription not set up | Ensure you use `form.Field` with the `children` render prop; do not read `form.state.values` directly in the parent component |
| Zod errors not showing on fields | Validator adapter missing or misconfigured | Pass `validatorAdapter: zodValidator()` to `useForm` and import from `@tanstack/zod-form-adapter` |
| Field array resets when adding items | Missing or duplicate key prop on mapped items | Use a stable key (e.g., field index or unique ID) on each rendered array item; avoid using `Math.random()` |
| Async validation fires too often | No debounce configured | Add `asyncDebounceMs` to the field's `validators` config (e.g., `validators: { onChangeAsync: schema, onChangeAsyncDebounceMs: 500 }`) |
| Submit handler not called | Missing `e.preventDefault()` on form element | Always call `e.preventDefault()` and `e.stopPropagation()` in the native `onSubmit` before `form.handleSubmit()` |
| TypeScript errors on field names | Form type not inferred correctly | Pass an explicit generic to `useForm<MyFormType>()` and ensure `defaultValues` matches the type |
| Stale values after programmatic reset | Using cached reference to old form state | Call `form.reset()` and let the render cycle update; do not cache `form.state.values` in a variable |
| Validation runs but field shows no error | Displaying errors in wrong location | Read errors from `field.state.meta.errors` inside the `form.Field` children callback, not from a parent component |
| Form values lost on component remount | Form instance recreated on each mount | Define `useForm` at the appropriate component level; avoid creating forms inside conditionally rendered branches |

## Constraints

- **No uncontrolled inputs** -- Always bind `value` to `field.state.value` and changes to `field.handleChange`
- **No manual useState for form data** -- All form values must live inside `useForm`; parallel state causes sync bugs
- **Always use validator adapter** -- Pass `zodValidator()` to `useForm` when using Zod schemas; raw Zod `.parse()` calls bypass form error propagation
- **Headless architecture** -- TanStack Form provides logic only; pair with shadcn/ui or another component library for rendering
- **Type your forms** -- Always provide a TypeScript interface to `useForm<T>()` for full inference across fields
- **Prevent default on submit** -- Native form `onSubmit` must call `e.preventDefault()` before `form.handleSubmit()`
- **Never mutate field state directly** -- Use `field.handleChange()`, `field.handleBlur()`, and `form.reset()` instead of direct assignment

## Verification Checklist

- [ ] Form uses `useForm` hook with explicit type parameter
- [ ] All fields use `form.Field` component with `children` render prop
- [ ] Validation uses `zodValidator()` adapter with Zod schemas
- [ ] `e.preventDefault()` and `e.stopPropagation()` called in form `onSubmit`
- [ ] Submit button shows loading state via `form.state.isSubmitting`
- [ ] Validation errors display below each field from `field.state.meta.errors`
- [ ] Async validators include `asyncDebounceMs` to prevent excessive requests
- [ ] No `useState` calls used for form field values
- [ ] Field arrays use stable keys on mapped items
- [ ] Form resets on successful submit when appropriate (`form.reset()`)
- [ ] Multi-step forms validate per-step before advancing

## References

- [TanStack Form Documentation](https://tanstack.com/form/latest)
- [TanStack Zod Form Adapter](https://tanstack.com/form/latest/docs/framework/react/guides/validation#adapter-based-validation-zod-yup-valibot)
- [Zod Documentation](https://zod.dev)
- [FUNDAMENTALS.md](FUNDAMENTALS.md) -- Form setup and field management
- [VALIDATION.md](VALIDATION.md) -- Sync/async validation and Zod integration
- [PATTERNS.md](PATTERNS.md) -- Field arrays, dynamic fields, multi-step forms
- [INTEGRATION.md](INTEGRATION.md) -- React, TanStack Query, shadcn/ui integration
- [TanStack Form Examples](https://tanstack.com/form/latest/docs/framework/react/examples/simple)
- [shadcn/ui Form Components](https://ui.shadcn.com/docs/components/form)
