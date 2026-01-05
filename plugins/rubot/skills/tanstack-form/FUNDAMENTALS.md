# Form Fundamentals

This document covers TanStack Form's core concepts, form setup, field management, and state handling.

## Form Setup

### Basic useForm Hook

```typescript
import { useForm } from '@tanstack/react-form';

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

function ContactPage() {
  const form = useForm<ContactForm>({
    // Initial values (required for type inference)
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      message: '',
    },

    // Called when form.handleSubmit() is invoked
    onSubmit: async ({ value, formApi }) => {
      console.log('Form values:', value);
      // value is fully typed as ContactForm
      await submitContactForm(value);
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
      {/* Form fields */}
    </form>
  );
}
```

### Form Options

```typescript
const form = useForm<MyForm>({
  // Required: Initial values
  defaultValues: {
    name: '',
    email: '',
  },

  // Submit handler
  onSubmit: async ({ value }) => {
    await saveData(value);
  },

  // Validation adapter (Zod, Valibot, etc.)
  validatorAdapter: zodValidator(),

  // Form-level validators
  validators: {
    onSubmit: formSchema,
    onChange: formSchema,
    onBlur: formSchema,
  },

  // Called when submit starts
  onSubmitInvalid: ({ value, formApi }) => {
    console.log('Form is invalid', formApi.state.errors);
  },

  // Transform values before submit
  transform: {
    onSubmit: (value) => ({
      ...value,
      email: value.email.toLowerCase(),
    }),
  },

  // Async debounce for form-level validation
  asyncDebounceMs: 500,

  // Reset behavior after successful submit
  resetOnSubmit: false,
});
```

### Form Methods

```typescript
const form = useForm<MyForm>({ /* ... */ });

// Submit the form
form.handleSubmit();

// Reset to default values
form.reset();

// Reset to specific values
form.reset({ name: 'New Name', email: 'new@email.com' });

// Set a single field value
form.setFieldValue('name', 'John');

// Set multiple field values
form.setFieldValues({ name: 'John', email: 'john@example.com' });

// Get current field value
const name = form.getFieldValue('name');

// Validate entire form
await form.validate('submit');

// Check if form can submit
const canSubmit = form.state.canSubmit;
```

## Field Component

### Basic Field Usage

```typescript
<form.Field
  name="email"
  children={(field) => (
    <div>
      <Label htmlFor={field.name}>Email</Label>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <span className="text-destructive text-sm">
          {field.state.meta.errors.join(', ')}
        </span>
      )}
    </div>
  )}
/>
```

### Field with All Props

```typescript
<form.Field
  // Field name (supports dot notation for nested)
  name="user.profile.name"

  // Validation mode
  mode="value" // 'value' | 'array'

  // Field-level validators
  validators={{
    onChange: z.string().min(1),
    onBlur: z.string().min(2),
    onSubmit: z.string().min(3),
    onChangeAsync: async ({ value }) => {
      // Return undefined if valid, string if error
      if (await checkExists(value)) {
        return 'Already exists';
      }
      return undefined;
    },
    onChangeAsyncDebounceMs: 500,
  }}

  // Preserve value when unmounted
  preserveValue={false}

  // Default value for this field
  defaultValue=""

  // Render function
  children={(field) => (
    // Field UI
  )}
/>
```

### Field State

```typescript
<form.Field
  name="username"
  children={(field) => {
    // Value
    const value = field.state.value;

    // Metadata
    const {
      errors,       // string[] - validation errors
      isTouched,    // boolean - field was blurred
      isDirty,      // boolean - value differs from default
      isValidating, // boolean - async validation running
      isPristine,   // boolean - value equals default
    } = field.state.meta;

    // Methods
    field.handleChange(newValue);  // Update value + trigger onChange validation
    field.handleBlur();            // Mark touched + trigger onBlur validation
    field.setValue(newValue);      // Set value without triggering validation
    field.validate('change');      // Manually trigger validation
    field.reset();                 // Reset to default value

    return (/* UI */);
  }}
/>
```

## Input Type Patterns

### Text Input

```typescript
<form.Field
  name="name"
  children={(field) => (
    <Input
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
    />
  )}
/>
```

### Number Input

```typescript
<form.Field
  name="age"
  children={(field) => (
    <Input
      type="number"
      value={field.state.value}
      onChange={(e) => field.handleChange(Number(e.target.value) || 0)}
      onBlur={field.handleBlur}
    />
  )}
/>
```

### Checkbox

```typescript
<form.Field
  name="acceptTerms"
  children={(field) => (
    <div className="flex items-center gap-2">
      <Checkbox
        id={field.name}
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(!!checked)}
      />
      <Label htmlFor={field.name}>I accept the terms</Label>
    </div>
  )}
/>
```

### Radio Group

```typescript
<form.Field
  name="plan"
  children={(field) => (
    <RadioGroup
      value={field.state.value}
      onValueChange={field.handleChange}
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="basic" id="basic" />
        <Label htmlFor="basic">Basic</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="pro" id="pro" />
        <Label htmlFor="pro">Pro</Label>
      </div>
    </RadioGroup>
  )}
/>
```

### Select

```typescript
<form.Field
  name="country"
  children={(field) => (
    <Select
      value={field.state.value}
      onValueChange={field.handleChange}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select country" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="us">United States</SelectItem>
        <SelectItem value="uk">United Kingdom</SelectItem>
        <SelectItem value="ca">Canada</SelectItem>
      </SelectContent>
    </Select>
  )}
/>
```

### Textarea

```typescript
<form.Field
  name="bio"
  children={(field) => (
    <Textarea
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
      rows={4}
    />
  )}
/>
```

### Date Picker

```typescript
<form.Field
  name="birthDate"
  children={(field) => (
    <DatePicker
      value={field.state.value}
      onChange={(date) => field.handleChange(date)}
    />
  )}
/>
```

### File Input

```typescript
<form.Field
  name="avatar"
  children={(field) => (
    <Input
      type="file"
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files?.[0];
        field.handleChange(file ?? null);
      }}
    />
  )}
/>
```

## Nested Fields

### Object Fields

```typescript
interface ProfileForm {
  user: {
    personal: {
      firstName: string;
      lastName: string;
    };
    contact: {
      email: string;
      phone: string;
    };
  };
}

function ProfileForm() {
  const form = useForm<ProfileForm>({
    defaultValues: {
      user: {
        personal: { firstName: '', lastName: '' },
        contact: { email: '', phone: '' },
      },
    },
    onSubmit: async ({ value }) => { /* ... */ },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      {/* Nested field access with dot notation */}
      <form.Field
        name="user.personal.firstName"
        children={(field) => (
          <Input
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      />

      <form.Field
        name="user.contact.email"
        children={(field) => (
          <Input
            type="email"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      />
    </form>
  );
}
```

### Grouped Field Components

```typescript
// Reusable field group component
function PersonalInfoFields({ form }: { form: FormApi<ProfileForm> }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Personal Information</h3>

      <form.Field
        name="user.personal.firstName"
        children={(field) => (
          <FormField label="First Name" field={field}>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </FormField>
        )}
      />

      <form.Field
        name="user.personal.lastName"
        children={(field) => (
          <FormField label="Last Name" field={field}>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </FormField>
        )}
      />
    </div>
  );
}

// Wrapper component for consistent field styling
function FormField({
  label,
  field,
  children,
}: {
  label: string;
  field: FieldApi<any, any, any, any>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{label}</Label>
      {children}
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <p className="text-destructive text-sm">
          {field.state.meta.errors.join(', ')}
        </p>
      )}
    </div>
  );
}
```

## Form Subscribe

### Subscribing to Form State

```typescript
// Subscribe to specific state changes for optimized re-renders
<form.Subscribe
  selector={(state) => state.isSubmitting}
  children={(isSubmitting) => (
    <Button disabled={isSubmitting}>
      {isSubmitting ? 'Saving...' : 'Save'}
    </Button>
  )}
/>

// Multiple values
<form.Subscribe
  selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}
  children={([canSubmit, isSubmitting, isDirty]) => (
    <div className="flex gap-2">
      <Button
        type="submit"
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
      {isDirty && (
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Discard Changes
        </Button>
      )}
    </div>
  )}
/>
```

### Watching Field Values

```typescript
// Watch a specific field value
<form.Subscribe
  selector={(state) => state.values.country}
  children={(country) => (
    <div>
      {country === 'us' && <USSpecificFields form={form} />}
      {country === 'uk' && <UKSpecificFields form={form} />}
    </div>
  )}
/>

// Computed values
<form.Subscribe
  selector={(state) => ({
    subtotal: state.values.items.reduce((sum, i) => sum + i.price, 0),
    itemCount: state.values.items.length,
  })}
  children={({ subtotal, itemCount }) => (
    <div className="text-lg font-semibold">
      {itemCount} items - ${subtotal.toFixed(2)}
    </div>
  )}
/>
```

## Form Reset

### Reset Patterns

```typescript
function EditUserForm({ user }: { user: User }) {
  const form = useForm<UserForm>({
    defaultValues: {
      name: user.name,
      email: user.email,
    },
    onSubmit: async ({ value }) => {
      await updateUser(value);
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      {/* Fields */}

      <div className="flex gap-2">
        <Button type="submit">Save</Button>

        {/* Reset to initial default values */}
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset()}
        >
          Reset
        </Button>

        {/* Reset to new values */}
        <Button
          type="button"
          variant="ghost"
          onClick={() => form.reset({
            name: user.name,
            email: user.email,
          })}
        >
          Revert to Original
        </Button>
      </div>
    </form>
  );
}
```

### Reset After Submit

```typescript
const form = useForm<ContactForm>({
  defaultValues: { name: '', email: '', message: '' },
  onSubmit: async ({ value }) => {
    await sendMessage(value);
    // Reset form after successful submit
    form.reset();
  },
});
```

## Conditional Fields

### Show/Hide Based on Value

```typescript
function ShippingForm() {
  const form = useForm<ShippingForm>({
    defaultValues: {
      sameAsBilling: true,
      billingAddress: { street: '', city: '' },
      shippingAddress: { street: '', city: '' },
    },
    onSubmit: async ({ value }) => { /* ... */ },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <AddressFields form={form} prefix="billingAddress" label="Billing" />

      <form.Field
        name="sameAsBilling"
        children={(field) => (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={field.state.value}
              onCheckedChange={(checked) => field.handleChange(!!checked)}
            />
            <Label>Shipping same as billing</Label>
          </div>
        )}
      />

      {/* Conditional rendering with Subscribe */}
      <form.Subscribe
        selector={(state) => state.values.sameAsBilling}
        children={(sameAsBilling) =>
          !sameAsBilling && (
            <AddressFields form={form} prefix="shippingAddress" label="Shipping" />
          )
        }
      />

      <Button type="submit">Continue</Button>
    </form>
  );
}
```

## Error Handling

### Display Field Errors

```typescript
function FieldWithError({ field }: { field: FieldApi<any, any, any, any> }) {
  const showError = field.state.meta.isTouched && field.state.meta.errors.length > 0;

  return (
    <div className="space-y-1">
      <Input
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        className={showError ? 'border-destructive' : ''}
      />
      {showError && (
        <p className="text-destructive text-sm">
          {field.state.meta.errors[0]}
        </p>
      )}
    </div>
  );
}
```

### Form-Level Errors

```typescript
function FormWithErrors() {
  const form = useForm<MyForm>({
    defaultValues: { /* ... */ },
    onSubmit: async ({ value }) => {
      try {
        await submitForm(value);
      } catch (error) {
        // Set form-level error
        form.setErrorMap({
          onSubmit: error.message,
        });
      }
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      {/* Fields */}

      {/* Display form-level errors */}
      <form.Subscribe
        selector={(state) => state.errors}
        children={(errors) =>
          errors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>{errors.join(', ')}</AlertDescription>
            </Alert>
          )
        }
      />

      <Button type="submit">Submit</Button>
    </form>
  );
}
```

## Best Practices

### Do's

```typescript
// ✅ Use typed form interface
interface MyForm {
  name: string;
  email: string;
}
const form = useForm<MyForm>({ /* ... */ });

// ✅ Use field.handleChange for controlled inputs
onChange={(e) => field.handleChange(e.target.value)}

// ✅ Use form.Subscribe for conditional rendering
<form.Subscribe
  selector={(state) => state.values.showExtra}
  children={(show) => show && <ExtraFields />}
/>

// ✅ Show errors only after touch
{field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
  <ErrorMessage>{field.state.meta.errors[0]}</ErrorMessage>
)}

// ✅ Disable submit when invalid or submitting
<form.Subscribe
  selector={(s) => [s.canSubmit, s.isSubmitting]}
  children={([can, submitting]) => (
    <Button disabled={!can || submitting}>Submit</Button>
  )}
/>
```

### Don'ts

```typescript
// ❌ Don't use useState for form values
const [name, setName] = useState('');

// ❌ Don't use uncontrolled inputs
<input defaultValue={field.state.value} />

// ❌ Don't forget to prevent default on submit
<form onSubmit={form.handleSubmit}> // Missing e.preventDefault()

// ❌ Don't show errors before field is touched
{field.state.meta.errors.length > 0 && <Error />} // Shows immediately

// ❌ Don't mutate field value directly
field.state.value = 'new value'; // Wrong
```

## Agent Collaboration

- **tanstack**: Primary agent for form implementation
- **shadcn-ui-designer**: UI components and styling
- **backend-master**: Form submission endpoints
- **debug-master**: Form validation issues
