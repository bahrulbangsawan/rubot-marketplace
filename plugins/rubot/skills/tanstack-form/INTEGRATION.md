# Integration Patterns

This document covers TanStack Form integration with React, TanStack Query, shadcn/ui components, TanStack Router, and server actions.

## shadcn/ui Integration

### Form Component Wrapper

```typescript
// src/components/ui/form-field.tsx
import { FieldApi } from '@tanstack/react-form';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  field: FieldApi<any, any, any, any>;
  label?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  field,
  label,
  description,
  required,
  children,
  className,
}: FormFieldProps) {
  const hasError = field.state.meta.isTouched && field.state.meta.errors.length > 0;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label
          htmlFor={field.name}
          className={cn(hasError && 'text-destructive')}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {description && !hasError && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      {hasError && (
        <p className="text-destructive text-sm" role="alert">
          {field.state.meta.errors.join(', ')}
        </p>
      )}
    </div>
  );
}
```

### Input Field Component

```typescript
// src/components/form/text-field.tsx
import { useForm } from '@tanstack/react-form';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { FieldValidators } from '@tanstack/react-form';

interface TextFieldProps {
  form: ReturnType<typeof useForm<any>>;
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'url';
  validators?: FieldValidators<any, any>;
  required?: boolean;
}

export function TextField({
  form,
  name,
  label,
  description,
  placeholder,
  type = 'text',
  validators,
  required,
}: TextFieldProps) {
  return (
    <form.Field
      name={name}
      validators={validators}
      children={(field) => (
        <FormField
          field={field}
          label={label}
          description={description}
          required={required}
        >
          <Input
            id={field.name}
            type={type}
            placeholder={placeholder}
            value={field.state.value ?? ''}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            aria-invalid={field.state.meta.errors.length > 0}
          />
        </FormField>
      )}
    />
  );
}
```

### Select Field Component

```typescript
// src/components/form/select-field.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectFieldProps {
  form: ReturnType<typeof useForm<any>>;
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  options: SelectOption[];
  validators?: FieldValidators<any, any>;
  required?: boolean;
}

export function SelectField({
  form,
  name,
  label,
  description,
  placeholder,
  options,
  validators,
  required,
}: SelectFieldProps) {
  return (
    <form.Field
      name={name}
      validators={validators}
      children={(field) => (
        <FormField
          field={field}
          label={label}
          description={description}
          required={required}
        >
          <Select
            value={field.state.value}
            onValueChange={field.handleChange}
          >
            <SelectTrigger id={field.name}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}
    />
  );
}
```

### Checkbox Field Component

```typescript
// src/components/form/checkbox-field.tsx
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CheckboxFieldProps {
  form: ReturnType<typeof useForm<any>>;
  name: string;
  label: string;
  description?: string;
  validators?: FieldValidators<any, any>;
}

export function CheckboxField({
  form,
  name,
  label,
  description,
  validators,
}: CheckboxFieldProps) {
  return (
    <form.Field
      name={name}
      validators={validators}
      children={(field) => (
        <div className="flex items-start space-x-3">
          <Checkbox
            id={field.name}
            checked={field.state.value}
            onCheckedChange={(checked) => field.handleChange(!!checked)}
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor={field.name} className="cursor-pointer">
              {label}
            </Label>
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}
          </div>
        </div>
      )}
    />
  );
}
```

### Textarea Field Component

```typescript
// src/components/form/textarea-field.tsx
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';

interface TextareaFieldProps {
  form: ReturnType<typeof useForm<any>>;
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  rows?: number;
  validators?: FieldValidators<any, any>;
  required?: boolean;
}

export function TextareaField({
  form,
  name,
  label,
  description,
  placeholder,
  rows = 4,
  validators,
  required,
}: TextareaFieldProps) {
  return (
    <form.Field
      name={name}
      validators={validators}
      children={(field) => (
        <FormField
          field={field}
          label={label}
          description={description}
          required={required}
        >
          <Textarea
            id={field.name}
            placeholder={placeholder}
            rows={rows}
            value={field.state.value ?? ''}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
        </FormField>
      )}
    />
  );
}
```

### Complete Form Example with shadcn/ui

```typescript
// src/components/user-form.tsx
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { TextField, SelectField, CheckboxField, TextareaField } from '@/components/form';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'user', 'guest']),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  notifications: z.boolean(),
});

type UserFormValues = z.infer<typeof userSchema>;

export function UserForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm<UserFormValues>({
    defaultValues: {
      name: '',
      email: '',
      role: 'user',
      bio: '',
      notifications: true,
    },
    validatorAdapter: zodValidator(),
    validators: {
      onSubmit: userSchema,
    },
    onSubmit: async ({ value }) => {
      await saveUser(value);
      onSuccess?.();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <CardContent className="space-y-4">
          <TextField
            form={form}
            name="name"
            label="Full Name"
            placeholder="John Doe"
            validators={{ onChange: z.string().min(2) }}
            required
          />

          <TextField
            form={form}
            name="email"
            label="Email Address"
            type="email"
            placeholder="john@example.com"
            validators={{ onChange: z.string().email() }}
            required
          />

          <SelectField
            form={form}
            name="role"
            label="Role"
            placeholder="Select a role"
            options={[
              { value: 'admin', label: 'Administrator' },
              { value: 'user', label: 'User' },
              { value: 'guest', label: 'Guest' },
            ]}
            required
          />

          <TextareaField
            form={form}
            name="bio"
            label="Bio"
            description="Tell us about yourself (max 500 characters)"
            placeholder="A short bio..."
            validators={{ onChange: z.string().max(500) }}
          />

          <CheckboxField
            form={form}
            name="notifications"
            label="Email Notifications"
            description="Receive email updates about your account"
          />
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            Reset
          </Button>

          <form.Subscribe
            selector={(s) => [s.canSubmit, s.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Profile'}
              </Button>
            )}
          />
        </CardFooter>
      </form>
    </Card>
  );
}
```

## TanStack Query Integration

### Form with Mutation

```typescript
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodValidator } from '@tanstack/zod-form-adapter';

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
});

type CreateProductInput = z.infer<typeof createProductSchema>;

export function CreateProductForm({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate products query to refetch list
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onSuccess?.();
    },
  });

  const form = useForm<CreateProductInput>({
    defaultValues: {
      name: '',
      price: 0,
      category: '',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onSubmit: createProductSchema,
    },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync(value);
      form.reset();
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      {/* Form fields */}

      {/* Show mutation error */}
      {createMutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {createMutation.error.message}
          </AlertDescription>
        </Alert>
      )}

      <form.Subscribe
        selector={(s) => [s.canSubmit, s.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting || createMutation.isPending}
          >
            {isSubmitting || createMutation.isPending
              ? 'Creating...'
              : 'Create Product'}
          </Button>
        )}
      />
    </form>
  );
}
```

### Edit Form with Query Data

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { useEffect } from 'react';

export function EditProductForm({ productId }: { productId: string }) {
  const queryClient = useQueryClient();

  // Fetch existing product
  const { data: product, isLoading } = useQuery({
    queryKey: ['products', productId],
    queryFn: () => fetchProduct(productId),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: ProductInput) => updateProduct(productId, data),
    onSuccess: (updatedProduct) => {
      // Update cache with new data
      queryClient.setQueryData(['products', productId], updatedProduct);
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['products', 'list'] });
    },
  });

  const form = useForm<ProductInput>({
    defaultValues: {
      name: '',
      price: 0,
      category: '',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onSubmit: productSchema,
    },
    onSubmit: async ({ value }) => {
      await updateMutation.mutateAsync(value);
    },
  });

  // Reset form when product data loads
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        price: product.price,
        category: product.category,
      });
    }
  }, [product]);

  if (isLoading) {
    return <FormSkeleton />;
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      {/* Form fields */}

      <div className="flex gap-2">
        <form.Subscribe
          selector={(s) => s.isDirty}
          children={(isDirty) =>
            isDirty && (
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset({
                  name: product?.name ?? '',
                  price: product?.price ?? 0,
                  category: product?.category ?? '',
                })}
              >
                Discard Changes
              </Button>
            )
          }
        />

        <form.Subscribe
          selector={(s) => [s.canSubmit, s.isSubmitting, s.isDirty]}
          children={([canSubmit, isSubmitting, isDirty]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting || !isDirty}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        />
      </div>
    </form>
  );
}
```

### Async Validation with Query

```typescript
import { useQueryClient } from '@tanstack/react-query';

function UsernameField({ form }: { form: FormApi<any> }) {
  const queryClient = useQueryClient();

  return (
    <form.Field
      name="username"
      validators={{
        onChange: z.string()
          .min(3, 'Username must be at least 3 characters')
          .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, underscores'),

        onChangeAsyncDebounceMs: 500,
        onChangeAsync: async ({ value }) => {
          if (value.length < 3) return undefined;

          // Check query cache first
          const cached = queryClient.getQueryData(['username-check', value]);
          if (cached !== undefined) {
            return cached ? undefined : 'Username is taken';
          }

          // Fetch from server
          const response = await fetch(`/api/check-username?username=${value}`);
          const { available } = await response.json();

          // Cache the result
          queryClient.setQueryData(['username-check', value], available);

          return available ? undefined : 'Username is taken';
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
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
            )}
          </div>
          <FieldError field={field} />
        </div>
      )}
    />
  );
}
```

## TanStack Router Integration

### Form in Route Component

```typescript
// src/routes/products.new.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';

export const Route = createFileRoute('/products/new')({
  component: NewProductPage,
});

function NewProductPage() {
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (product) => {
      // Navigate to new product page
      navigate({
        to: '/products/$productId',
        params: { productId: product.id },
      });
    },
  });

  const form = useForm<ProductInput>({
    defaultValues: { name: '', price: 0 },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync(value);
    },
  });

  return (
    <div>
      <h1>Create New Product</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
        {/* Form fields */}
      </form>
    </div>
  );
}
```

### Form with Search Params

```typescript
// src/routes/products.search.tsx
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().default(''),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
});

export const Route = createFileRoute('/products/search')({
  validateSearch: searchSchema,
  component: ProductSearchPage,
});

function ProductSearchPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const form = useForm({
    defaultValues: {
      query: search.query,
      category: search.category ?? '',
      minPrice: search.minPrice ?? 0,
      maxPrice: search.maxPrice ?? 1000,
    },
    onSubmit: async ({ value }) => {
      // Update URL search params
      navigate({
        search: {
          query: value.query || undefined,
          category: value.category || undefined,
          minPrice: value.minPrice || undefined,
          maxPrice: value.maxPrice || undefined,
        },
      });
    },
  });

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
        <form.Field
          name="query"
          children={(field) => (
            <Input
              placeholder="Search products..."
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        />

        {/* Other filter fields */}

        <Button type="submit">Search</Button>
      </form>

      {/* Search results using search params */}
      <ProductResults filters={search} />
    </div>
  );
}
```

## Server Actions Integration

### Form with Server Function

```typescript
// src/lib/actions/products.ts
import { createServerFn } from '@tanstack/start';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

export const createProduct = createServerFn({ method: 'POST' })
  .validator(productSchema)
  .handler(async ({ data }) => {
    // Server-side: direct database access
    const product = await db
      .insert(products)
      .values(data)
      .returning();

    return product[0];
  });

export const validateProductName = createServerFn({ method: 'GET' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    const existing = await db.query.products.findFirst({
      where: eq(products.name, data.name),
    });

    return { available: !existing };
  });
```

```typescript
// src/components/product-form.tsx
import { useForm } from '@tanstack/react-form';
import { createProduct, validateProductName } from '@/lib/actions/products';

function ProductForm() {
  const form = useForm<ProductInput>({
    defaultValues: { name: '', price: 0 },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      // Call server function directly
      const product = await createProduct({ data: value });
      console.log('Created:', product);
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field
        name="name"
        validators={{
          onChange: z.string().min(1),
          onChangeAsyncDebounceMs: 500,
          onChangeAsync: async ({ value }) => {
            const { available } = await validateProductName({
              data: { name: value },
            });
            return available ? undefined : 'Name already exists';
          },
        }}
        children={(field) => (/* ... */)}
      />

      {/* Other fields */}
    </form>
  );
}
```

## Dialog/Modal Forms

### Form in Dialog

```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function CreateUserDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<UserInput>({
    defaultValues: { name: '', email: '' },
    onSubmit: async ({ value }) => {
      await createUser(value);
      form.reset();
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create User</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
          <div className="space-y-4">
            <TextField form={form} name="name" label="Name" required />
            <TextField form={form} name="email" label="Email" type="email" required />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(s) => [s.canSubmit, s.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create'}
                </Button>
              )}
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Confirmation Before Close

```typescript
function EditUserDialog({ user }: { user: User }) {
  const [open, setOpen] = useState(false);

  const form = useForm<UserInput>({
    defaultValues: {
      name: user.name,
      email: user.email,
    },
    onSubmit: async ({ value }) => {
      await updateUser(user.id, value);
      setOpen(false);
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && form.state.isDirty) {
      // Confirm before closing with unsaved changes
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmed) return;
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Dialog content */}
    </Dialog>
  );
}
```

## Best Practices

### Do's

```typescript
// ✅ Create reusable field components
<TextField form={form} name="email" label="Email" required />

// ✅ Use form.Subscribe for button state
<form.Subscribe
  selector={(s) => [s.canSubmit, s.isSubmitting]}
  children={([canSubmit, isSubmitting]) => (
    <Button disabled={!canSubmit || isSubmitting}>Submit</Button>
  )}
/>

// ✅ Integrate with React Query for mutations
const mutation = useMutation({ mutationFn: createUser });
onSubmit: ({ value }) => mutation.mutateAsync(value)

// ✅ Reset form after successful submit
onSubmit: async ({ value }) => {
  await save(value);
  form.reset();
}
```

### Don'ts

```typescript
// ❌ Don't forget to prevent default
<form onSubmit={form.handleSubmit}> // Missing e.preventDefault()

// ❌ Don't duplicate form state with React Query
const [isLoading, setIsLoading] = useState(false); // Use form.state.isSubmitting

// ❌ Don't mutate form values directly in event handlers
onChange={(e) => {
  form.state.values.name = e.target.value; // Wrong
}}
```

## Agent Collaboration

- **tanstack**: Primary agent for form integration
- **shadcn-ui-designer**: UI component styling
- **backend-master**: Server actions and API endpoints
- **debug-master**: Form submission debugging
