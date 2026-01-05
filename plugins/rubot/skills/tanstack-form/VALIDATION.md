# Validation Patterns

This document covers TanStack Form validation including Zod integration, async validation, field-level validation, and cross-field validation patterns.

## Validation Adapters

### Zod Adapter Setup

```typescript
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';

// Define schema
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be 18 or older').max(120, 'Invalid age'),
});

type UserForm = z.infer<typeof userSchema>;

function UserForm() {
  const form = useForm<UserForm>({
    defaultValues: {
      name: '',
      email: '',
      age: 0,
    },
    // Attach validator adapter
    validatorAdapter: zodValidator(),
    // Form-level validation on submit
    validators: {
      onSubmit: userSchema,
    },
    onSubmit: async ({ value }) => {
      // value is validated
      await saveUser(value);
    },
  });

  return (/* Form JSX */);
}
```

### Valibot Adapter

```typescript
import { valibotValidator } from '@tanstack/valibot-form-adapter';
import * as v from 'valibot';

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(2, 'Name too short')),
  email: v.pipe(v.string(), v.email('Invalid email')),
});

const form = useForm({
  defaultValues: { name: '', email: '' },
  validatorAdapter: valibotValidator(),
  validators: {
    onSubmit: schema,
  },
  onSubmit: async ({ value }) => { /* ... */ },
});
```

## Validation Timing

### Validation Events

```typescript
const form = useForm<MyForm>({
  defaultValues: { email: '' },
  validatorAdapter: zodValidator(),
  validators: {
    // Validate entire form on submit
    onSubmit: formSchema,

    // Validate entire form on any change
    onChange: formSchema,

    // Validate entire form on any blur
    onBlur: formSchema,

    // Async form-level validation
    onSubmitAsync: async ({ value }) => {
      const errors = await validateOnServer(value);
      if (errors.length > 0) {
        return errors.join(', ');
      }
      return undefined;
    },
  },
  onSubmit: async ({ value }) => { /* ... */ },
});
```

### Field-Level Validation Timing

```typescript
<form.Field
  name="email"
  validators={{
    // Sync validation on change
    onChange: z.string().email('Invalid email'),

    // Sync validation on blur
    onBlur: z.string().min(1, 'Email is required'),

    // Sync validation on submit
    onSubmit: z.string().email(),

    // Async validation on change (with debounce)
    onChangeAsyncDebounceMs: 500,
    onChangeAsync: async ({ value }) => {
      if (!value) return undefined;
      const exists = await checkEmailExists(value);
      if (exists) return 'Email already registered';
      return undefined;
    },

    // Async validation on blur
    onBlurAsync: async ({ value }) => {
      const valid = await validateEmailDomain(value);
      if (!valid) return 'Email domain not allowed';
      return undefined;
    },
  }}
  children={(field) => (/* Field UI */)}
/>
```

## Field Validation Patterns

### Required Fields

```typescript
<form.Field
  name="name"
  validators={{
    onChange: z.string().min(1, 'Name is required'),
  }}
  children={(field) => (
    <div>
      <Label>
        Name <span className="text-destructive">*</span>
      </Label>
      <Input
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />
      <FieldError field={field} />
    </div>
  )}
/>
```

### Email Validation

```typescript
<form.Field
  name="email"
  validators={{
    onChange: z.string().email('Please enter a valid email'),
    onChangeAsyncDebounceMs: 500,
    onChangeAsync: async ({ value }) => {
      if (!value || !value.includes('@')) return undefined;

      // Check if email is available
      const response = await fetch(`/api/check-email?email=${value}`);
      const { available } = await response.json();

      if (!available) {
        return 'This email is already registered';
      }
      return undefined;
    },
  }}
  children={(field) => (
    <div>
      <Label>Email</Label>
      <div className="relative">
        <Input
          type="email"
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
        />
        {field.state.meta.isValidating && (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
        )}
      </div>
      <FieldError field={field} />
    </div>
  )}
/>
```

### Password Validation

```typescript
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^A-Za-z0-9]/, 'Must contain special character');

<form.Field
  name="password"
  validators={{
    onChange: passwordSchema,
  }}
  children={(field) => (
    <div>
      <Label>Password</Label>
      <Input
        type="password"
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />
      <PasswordStrength password={field.state.value} />
      <FieldError field={field} />
    </div>
  )}
/>

// Password strength indicator
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', valid: password.length >= 8 },
    { label: 'Uppercase', valid: /[A-Z]/.test(password) },
    { label: 'Lowercase', valid: /[a-z]/.test(password) },
    { label: 'Number', valid: /[0-9]/.test(password) },
    { label: 'Special char', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="mt-2 space-y-1">
      {checks.map((check) => (
        <div
          key={check.label}
          className={cn(
            'text-sm flex items-center gap-1',
            check.valid ? 'text-green-600' : 'text-muted-foreground'
          )}
        >
          {check.valid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {check.label}
        </div>
      ))}
    </div>
  );
}
```

### Number Range Validation

```typescript
<form.Field
  name="age"
  validators={{
    onChange: z
      .number({ invalid_type_error: 'Age must be a number' })
      .min(18, 'Must be at least 18')
      .max(120, 'Invalid age'),
  }}
  children={(field) => (
    <div>
      <Label>Age</Label>
      <Input
        type="number"
        min={0}
        max={120}
        value={field.state.value}
        onChange={(e) => {
          const value = e.target.value === '' ? 0 : Number(e.target.value);
          field.handleChange(value);
        }}
        onBlur={field.handleBlur}
      />
      <FieldError field={field} />
    </div>
  )}
/>
```

### URL Validation

```typescript
<form.Field
  name="website"
  validators={{
    onChange: z
      .string()
      .url('Please enter a valid URL')
      .optional()
      .or(z.literal('')),
    onChangeAsyncDebounceMs: 1000,
    onChangeAsync: async ({ value }) => {
      if (!value) return undefined;

      try {
        const response = await fetch(value, { method: 'HEAD' });
        if (!response.ok) {
          return 'Website is not accessible';
        }
      } catch {
        return 'Could not verify website';
      }
      return undefined;
    },
  }}
  children={(field) => (
    <div>
      <Label>Website (optional)</Label>
      <Input
        type="url"
        placeholder="https://example.com"
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />
      <FieldError field={field} />
    </div>
  )}
/>
```

## Cross-Field Validation

### Password Confirmation

```typescript
interface PasswordForm {
  password: string;
  confirmPassword: string;
}

function PasswordForm() {
  const form = useForm<PasswordForm>({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => { /* ... */ },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field
        name="password"
        validators={{
          onChange: z.string().min(8, 'Password must be at least 8 characters'),
        }}
        children={(field) => (
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError field={field} />
          </div>
        )}
      />

      <form.Field
        name="confirmPassword"
        validators={{
          onChangeListenTo: ['password'], // Re-validate when password changes
          onChange: ({ value, fieldApi }) => {
            const password = fieldApi.form.getFieldValue('password');
            if (value !== password) {
              return 'Passwords do not match';
            }
            return undefined;
          },
        }}
        children={(field) => (
          <div>
            <Label>Confirm Password</Label>
            <Input
              type="password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError field={field} />
          </div>
        )}
      />

      <Button type="submit">Set Password</Button>
    </form>
  );
}
```

### Date Range Validation

```typescript
interface DateRangeForm {
  startDate: Date | null;
  endDate: Date | null;
}

function DateRangeForm() {
  const form = useForm<DateRangeForm>({
    defaultValues: {
      startDate: null,
      endDate: null,
    },
    onSubmit: async ({ value }) => { /* ... */ },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field
        name="startDate"
        validators={{
          onChange: ({ value }) => {
            if (!value) return 'Start date is required';
            if (value < new Date()) return 'Start date must be in the future';
            return undefined;
          },
        }}
        children={(field) => (
          <div>
            <Label>Start Date</Label>
            <DatePicker
              value={field.state.value}
              onChange={field.handleChange}
            />
            <FieldError field={field} />
          </div>
        )}
      />

      <form.Field
        name="endDate"
        validators={{
          onChangeListenTo: ['startDate'],
          onChange: ({ value, fieldApi }) => {
            if (!value) return 'End date is required';

            const startDate = fieldApi.form.getFieldValue('startDate');
            if (startDate && value <= startDate) {
              return 'End date must be after start date';
            }
            return undefined;
          },
        }}
        children={(field) => (
          <div>
            <Label>End Date</Label>
            <DatePicker
              value={field.state.value}
              onChange={field.handleChange}
            />
            <FieldError field={field} />
          </div>
        )}
      />
    </form>
  );
}
```

### Conditional Required Fields

```typescript
interface ShippingForm {
  deliveryMethod: 'pickup' | 'delivery';
  address: string;
  city: string;
}

<form.Field
  name="address"
  validators={{
    onChangeListenTo: ['deliveryMethod'],
    onChange: ({ value, fieldApi }) => {
      const method = fieldApi.form.getFieldValue('deliveryMethod');
      if (method === 'delivery' && !value) {
        return 'Address is required for delivery';
      }
      return undefined;
    },
  }}
  children={(field) => (
    <form.Subscribe
      selector={(state) => state.values.deliveryMethod}
      children={(method) =>
        method === 'delivery' && (
          <div>
            <Label>Address *</Label>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError field={field} />
          </div>
        )
      }
    />
  )}
/>
```

## Async Validation

### Debounced Async Validation

```typescript
<form.Field
  name="username"
  validators={{
    // Sync validation first (fast feedback)
    onChange: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),

    // Async validation with debounce
    onChangeAsyncDebounceMs: 500,
    onChangeAsync: async ({ value, signal }) => {
      // Skip if sync validation would fail
      if (value.length < 3) return undefined;

      const response = await fetch(
        `/api/check-username?username=${encodeURIComponent(value)}`,
        { signal }
      );

      if (!response.ok) {
        return 'Error checking username availability';
      }

      const { available } = await response.json();
      if (!available) {
        return 'Username is already taken';
      }

      return undefined;
    },
  }}
  children={(field) => (
    <div>
      <Label>Username</Label>
      <div className="relative">
        <Input
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value.toLowerCase())}
          onBlur={field.handleBlur}
        />
        {field.state.meta.isValidating && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!field.state.meta.isValidating &&
          field.state.meta.errors.length === 0 &&
          field.state.value.length >= 3 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Check className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>
      <FieldError field={field} />
    </div>
  )}
/>
```

### Server-Side Validation on Submit

```typescript
const form = useForm<RegistrationForm>({
  defaultValues: { email: '', username: '' },
  validatorAdapter: zodValidator(),
  validators: {
    onSubmitAsync: async ({ value }) => {
      // Validate entire form on server
      const response = await fetch('/api/validate-registration', {
        method: 'POST',
        body: JSON.stringify(value),
      });

      if (!response.ok) {
        const errors = await response.json();
        // Return form-level error
        return errors.message;
      }

      return undefined;
    },
  },
  onSubmit: async ({ value }) => {
    await registerUser(value);
  },
});
```

## Form-Level Validation

### Schema Validation

```typescript
const formSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  budget: z.number().positive(),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
).refine(
  (data) => {
    const days = (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24);
    return data.budget >= days * 100; // Minimum $100/day
  },
  {
    message: 'Budget is insufficient for the selected duration',
    path: ['budget'],
  }
);

const form = useForm<ProjectForm>({
  defaultValues: {
    startDate: new Date(),
    endDate: new Date(),
    budget: 0,
  },
  validatorAdapter: zodValidator(),
  validators: {
    onSubmit: formSchema,
  },
  onSubmit: async ({ value }) => { /* ... */ },
});
```

### Custom Form Validation

```typescript
const form = useForm<CheckoutForm>({
  defaultValues: {
    items: [],
    couponCode: '',
    paymentMethod: 'card',
  },
  validators: {
    onSubmit: ({ value }) => {
      const errors: string[] = [];

      if (value.items.length === 0) {
        errors.push('Cart is empty');
      }

      const total = value.items.reduce((sum, item) => sum + item.price, 0);
      if (total > 10000 && value.paymentMethod === 'cash') {
        errors.push('Orders over $10,000 require card payment');
      }

      return errors.length > 0 ? errors.join('. ') : undefined;
    },
  },
  onSubmit: async ({ value }) => { /* ... */ },
});
```

## Error Display Components

### Reusable FieldError Component

```typescript
import type { FieldApi } from '@tanstack/react-form';

interface FieldErrorProps {
  field: FieldApi<any, any, any, any>;
  showOnlyAfterTouch?: boolean;
}

export function FieldError({
  field,
  showOnlyAfterTouch = true,
}: FieldErrorProps) {
  const hasErrors = field.state.meta.errors.length > 0;
  const shouldShow = showOnlyAfterTouch
    ? field.state.meta.isTouched && hasErrors
    : hasErrors;

  if (!shouldShow) return null;

  return (
    <p className="text-destructive text-sm mt-1" role="alert">
      {field.state.meta.errors.join(', ')}
    </p>
  );
}
```

### Form Error Summary

```typescript
function FormErrorSummary({ form }: { form: FormApi<any> }) {
  return (
    <form.Subscribe
      selector={(state) => ({
        errors: state.errors,
        fieldErrors: Object.entries(state.fieldMeta)
          .filter(([_, meta]) => meta.errors.length > 0)
          .map(([name, meta]) => ({ name, errors: meta.errors })),
      })}
      children={({ errors, fieldErrors }) => {
        const hasErrors = errors.length > 0 || fieldErrors.length > 0;

        if (!hasErrors) return null;

        return (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Please fix the following errors:</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
                {fieldErrors.map(({ name, errors }) => (
                  <li key={name}>
                    <strong>{name}:</strong> {errors.join(', ')}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        );
      }}
    />
  );
}
```

## Best Practices

### Do's

```typescript
// ✅ Use Zod adapter for schema validation
validatorAdapter: zodValidator(),
validators: { onSubmit: schema },

// ✅ Debounce async validation
onChangeAsyncDebounceMs: 500,

// ✅ Show validation state
{field.state.meta.isValidating && <Spinner />}

// ✅ Use onChangeListenTo for cross-field validation
validators: {
  onChangeListenTo: ['password'],
  onChange: ({ value, fieldApi }) => { /* ... */ },
}

// ✅ Validate on appropriate events
validators: {
  onChange: quickSyncValidation,
  onBlur: expensiveSyncValidation,
  onChangeAsync: serverValidation,
}
```

### Don'ts

```typescript
// ❌ Don't validate synchronously what needs async
onChange: async ({ value }) => { // Will cause issues
  await checkServer(value);
}

// ❌ Don't skip debounce for async validation
onChangeAsync: async ({ value }) => {
  // Called on every keystroke!
}

// ❌ Don't show errors before user interaction
{field.state.meta.errors.length > 0 && <Error />} // Shows immediately

// ❌ Don't forget to handle validation state
<Input disabled={field.state.meta.isValidating} /> // User can't type!
```

## Agent Collaboration

- **tanstack**: Primary agent for form validation patterns
- **backend-master**: Server-side validation endpoints
- **shadcn-ui-designer**: Error display components
- **debug-master**: Validation debugging
