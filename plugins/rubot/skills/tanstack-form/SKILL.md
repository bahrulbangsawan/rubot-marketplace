---
name: tanstack-form
description: |
  Implements TanStack Form for type-safe, headless form management in React applications. Use when building forms with complex validation, async validation, dynamic fields, field arrays, or integrating with Zod schemas. Covers form state, field management, validation patterns, and shadcn/ui integration.
version: 1.0.0
agents:
  - tanstack
  - shadcn-ui-designer
---

# TanStack Form Skill

This skill provides comprehensive guidance for implementing TanStack Form for type-safe, performant form management with headless architecture and deep validation integration.

## Documentation Verification (MANDATORY)

Before implementing any form pattern from this skill:

1. **Use Context7 MCP** to verify current TanStack Form API:
   - `mcp__context7__resolve-library-id` with libraryName: "tanstack-form"
   - `mcp__context7__query-docs` for specific patterns (validation, field arrays)

2. **Use Exa MCP** for latest integration patterns:
   - `mcp__exa__web_search_exa` for "TanStack Form Zod validation 2024"
   - `mcp__exa__get_code_context_exa` for shadcn/ui form examples

3. **Use AskUserQuestion** when requirements are unclear:
   - Validation requirements
   - Form submission handling
   - Dynamic field needs

## Quick Reference

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Form** | Top-level form state container |
| **Field** | Individual input state and validation |
| **FieldApi** | Programmatic access to field state |
| **Validator** | Sync/async validation adapters |
| **Field Array** | Dynamic list of fields |
| **Form State** | Centralized state (values, errors, touched) |

### Key Principles

1. **Headless**: No UI opinions, works with any component library
2. **Type-Safe**: Full TypeScript inference for form values
3. **Granular Subscriptions**: Only re-render what changed
4. **Validation Adapters**: Zod, Valibot, Yup, ArkType support
5. **Framework Agnostic**: Core logic shared across React, Vue, etc.

## Implementation Guides

For detailed implementation, see:

- [FUNDAMENTALS.md](FUNDAMENTALS.md) - Form setup, fields, state management
- [VALIDATION.md](VALIDATION.md) - Sync/async validation, Zod integration
- [PATTERNS.md](PATTERNS.md) - Field arrays, dynamic fields, nested forms
- [INTEGRATION.md](INTEGRATION.md) - React, Query, shadcn/ui integration

## Quick Start Patterns

### 1. Basic Form Setup

```typescript
import { useForm } from '@tanstack/react-form';

interface LoginForm {
  email: string;
  password: string;
}

function LoginPage() {
  const form = useForm<LoginForm>({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      // Handle form submission
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

### 2. Form with Zod Validation

```typescript
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be 18 or older'),
});

type UserForm = z.infer<typeof userSchema>;

function CreateUserForm() {
  const form = useForm<UserForm>({
    defaultValues: {
      name: '',
      email: '',
      age: 0,
    },
    validatorAdapter: zodValidator(),
    validators: {
      // Form-level validation on submit
      onSubmit: userSchema,
    },
    onSubmit: async ({ value }) => {
      await createUser(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="name"
        validators={{
          onChange: z.string().min(2, 'Name must be at least 2 characters'),
        }}
        children={(field) => (
          <div>
            <Label>Name</Label>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            <FieldError field={field} />
          </div>
        )}
      />

      <form.Field
        name="email"
        validators={{
          onChange: z.string().email('Invalid email'),
          onChangeAsyncDebounceMs: 500,
          onChangeAsync: async ({ value }) => {
            // Async validation - check if email exists
            const exists = await checkEmailExists(value);
            if (exists) return 'Email already registered';
            return undefined;
          },
        }}
        children={(field) => (
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            <FieldError field={field} />
            {field.state.meta.isValidating && (
              <span className="text-muted-foreground text-sm">
                Checking availability...
              </span>
            )}
          </div>
        )}
      />

      <form.Field
        name="age"
        validators={{
          onChange: z.number().min(18, 'Must be 18 or older'),
        }}
        children={(field) => (
          <div>
            <Label>Age</Label>
            <Input
              type="number"
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
              onBlur={field.handleBlur}
            />
            <FieldError field={field} />
          </div>
        )}
      />

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create User'}
          </Button>
        )}
      />
    </form>
  );
}

// Reusable error display component
function FieldError({ field }: { field: FieldApi<any, any, any, any> }) {
  return field.state.meta.errors.length > 0 ? (
    <p className="text-destructive text-sm mt-1">
      {field.state.meta.errors.join(', ')}
    </p>
  ) : null;
}
```

### 3. Field Arrays (Dynamic Fields)

```typescript
import { useForm } from '@tanstack/react-form';

interface TeamForm {
  teamName: string;
  members: Array<{ name: string; role: string }>;
}

function TeamForm() {
  const form = useForm<TeamForm>({
    defaultValues: {
      teamName: '',
      members: [{ name: '', role: '' }],
    },
    onSubmit: async ({ value }) => {
      await createTeam(value);
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field
        name="teamName"
        children={(field) => (
          <div>
            <Label>Team Name</Label>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      />

      <form.Field
        name="members"
        mode="array"
        children={(field) => (
          <div className="space-y-4">
            <Label>Team Members</Label>

            {field.state.value.map((_, index) => (
              <div key={index} className="flex gap-2">
                <form.Field
                  name={`members[${index}].name`}
                  children={(subField) => (
                    <Input
                      placeholder="Name"
                      value={subField.state.value}
                      onChange={(e) => subField.handleChange(e.target.value)}
                    />
                  )}
                />

                <form.Field
                  name={`members[${index}].role`}
                  children={(subField) => (
                    <Input
                      placeholder="Role"
                      value={subField.state.value}
                      onChange={(e) => subField.handleChange(e.target.value)}
                    />
                  )}
                />

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => field.removeValue(index)}
                >
                  Remove
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => field.pushValue({ name: '', role: '' })}
            >
              Add Member
            </Button>
          </div>
        )}
      />

      <Button type="submit">Create Team</Button>
    </form>
  );
}
```

### 4. Form with TanStack Query Mutation

```typescript
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodValidator } from '@tanstack/zod-form-adapter';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
  description: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

function CreateProductForm({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: ProductForm) =>
      fetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onSuccess?.();
    },
  });

  const form = useForm<ProductForm>({
    defaultValues: {
      name: '',
      price: 0,
      description: '',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onSubmit: productSchema,
    },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync(value);
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field
        name="name"
        children={(field) => (
          <div>
            <Label>Product Name</Label>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError field={field} />
          </div>
        )}
      />

      <form.Field
        name="price"
        children={(field) => (
          <div>
            <Label>Price</Label>
            <Input
              type="number"
              step="0.01"
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
            />
            <FieldError field={field} />
          </div>
        )}
      />

      <form.Field
        name="description"
        children={(field) => (
          <div>
            <Label>Description</Label>
            <Textarea
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      />

      {createMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {createMutation.error.message}
          </AlertDescription>
        </Alert>
      )}

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </Button>
        )}
      />
    </form>
  );
}
```

### 5. Edit Form with Initial Data

```typescript
import { useForm } from '@tanstack/react-form';
import { useQuery, useMutation } from '@tanstack/react-query';

function EditUserForm({ userId }: { userId: string }) {
  // Fetch existing data
  const { data: user, isLoading } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UserForm) => updateUser(userId, data),
  });

  const form = useForm<UserForm>({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
    },
    onSubmit: async ({ value }) => {
      await updateMutation.mutateAsync(value);
    },
  });

  // Reset form when data loads
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
      });
    }
  }, [user]);

  if (isLoading) return <FormSkeleton />;

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      {/* Form fields */}
    </form>
  );
}
```

## Form State Reference

### Form State Properties

```typescript
const form = useForm({ /* ... */ });

// Access form state
form.state.values;        // Current form values
form.state.errors;        // Form-level errors
form.state.isValid;       // No errors present
form.state.isValidating;  // Async validation in progress
form.state.isSubmitting;  // Submit in progress
form.state.isSubmitted;   // Form was submitted
form.state.canSubmit;     // Valid and not submitting
form.state.isDirty;       // Values changed from defaults
form.state.isTouched;     // Any field was touched
```

### Field State Properties

```typescript
<form.Field
  name="email"
  children={(field) => {
    // Access field state
    field.state.value;           // Current value
    field.state.meta.errors;     // Field errors array
    field.state.meta.isTouched;  // Field was blurred
    field.state.meta.isDirty;    // Value changed
    field.state.meta.isValidating; // Async validation running

    // Field methods
    field.handleChange(value);   // Update value
    field.handleBlur();          // Mark as touched
    field.setValue(value);       // Set value programmatically
    field.validate();            // Trigger validation
  }}
/>
```

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

## Constraints

- **No uncontrolled inputs** - Always use field.state.value
- **No manual state** - Don't use useState for form values
- **Type inference** - Define form type for type safety
- **Validation adapters** - Use zodValidator() for Zod schemas
- **Headless design** - Form provides logic, shadcn/ui provides UI

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Correct Approach |
|--------------|---------|------------------|
| `useState` for form | Duplicate state, sync issues | Use `useForm` |
| Manual validation | Type-unsafe, verbose | Use Zod adapter |
| Inline onChange | No touched/dirty tracking | Use `field.handleChange` |
| Submit without prevent | Page reload | `e.preventDefault()` |
| No error display | Poor UX | Show `field.state.meta.errors` |

## Verification Checklist

- [ ] Form uses `useForm` hook
- [ ] All fields use `form.Field` component
- [ ] Validation uses Zod adapter
- [ ] Submit button shows loading state
- [ ] Errors display below fields
- [ ] Form resets on successful submit (if needed)
- [ ] Async validation has debounce
- [ ] No useState for form values
