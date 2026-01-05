# Advanced Patterns

This document covers advanced TanStack Form patterns including field arrays, dynamic fields, multi-step forms, and complex form architectures.

## Field Arrays

### Basic Field Array

```typescript
import { useForm } from '@tanstack/react-form';

interface OrderForm {
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

function OrderForm() {
  const form = useForm<OrderForm>({
    defaultValues: {
      customerName: '',
      items: [{ name: '', quantity: 1, price: 0 }],
    },
    onSubmit: async ({ value }) => {
      await createOrder(value);
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field
        name="customerName"
        children={(field) => (
          <div>
            <Label>Customer Name</Label>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      />

      <form.Field
        name="items"
        mode="array"
        children={(field) => (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Order Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => field.pushValue({ name: '', quantity: 1, price: 0 })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            {field.state.value.map((_, index) => (
              <div key={index} className="flex gap-2 items-end">
                <form.Field
                  name={`items[${index}].name`}
                  children={(subField) => (
                    <div className="flex-1">
                      <Label>Item Name</Label>
                      <Input
                        value={subField.state.value}
                        onChange={(e) => subField.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                />

                <form.Field
                  name={`items[${index}].quantity`}
                  children={(subField) => (
                    <div className="w-24">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        min={1}
                        value={subField.state.value}
                        onChange={(e) => subField.handleChange(Number(e.target.value))}
                      />
                    </div>
                  )}
                />

                <form.Field
                  name={`items[${index}].price`}
                  children={(subField) => (
                    <div className="w-28">
                      <Label>Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={subField.state.value}
                        onChange={(e) => subField.handleChange(Number(e.target.value))}
                      />
                    </div>
                  )}
                />

                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => field.removeValue(index)}
                  disabled={field.state.value.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      />

      {/* Order total */}
      <form.Subscribe
        selector={(state) => state.values.items}
        children={(items) => {
          const total = items.reduce(
            (sum, item) => sum + item.quantity * item.price,
            0
          );
          return (
            <div className="text-lg font-semibold">
              Total: ${total.toFixed(2)}
            </div>
          );
        }}
      />

      <Button type="submit">Place Order</Button>
    </form>
  );
}
```

### Field Array with Validation

```typescript
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';

const orderItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0.01, 'Price must be positive'),
});

const orderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, 'At least one item is required')
    .max(10, 'Maximum 10 items allowed'),
});

function ValidatedOrderForm() {
  const form = useForm<z.infer<typeof orderSchema>>({
    defaultValues: {
      items: [{ name: '', quantity: 1, price: 0 }],
    },
    validatorAdapter: zodValidator(),
    validators: {
      onSubmit: orderSchema,
    },
    onSubmit: async ({ value }) => { /* ... */ },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field
        name="items"
        mode="array"
        validators={{
          onChange: z.array(orderItemSchema).min(1).max(10),
        }}
        children={(field) => (
          <div>
            {/* Array-level errors */}
            {field.state.meta.errors.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                {field.state.meta.errors.join(', ')}
              </Alert>
            )}

            {field.state.value.map((_, index) => (
              <div key={index} className="border p-4 rounded mb-2">
                <form.Field
                  name={`items[${index}].name`}
                  validators={{
                    onChange: z.string().min(1, 'Required'),
                  }}
                  children={(subField) => (
                    <div>
                      <Input
                        value={subField.state.value}
                        onChange={(e) => subField.handleChange(e.target.value)}
                      />
                      <FieldError field={subField} />
                    </div>
                  )}
                />
                {/* Other fields */}
              </div>
            ))}

            <Button
              type="button"
              onClick={() => field.pushValue({ name: '', quantity: 1, price: 0 })}
              disabled={field.state.value.length >= 10}
            >
              Add Item
            </Button>
          </div>
        )}
      />
    </form>
  );
}
```

### Reorderable Field Array

```typescript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
}

function SortableTaskItem({
  index,
  form,
  onRemove,
}: {
  index: number;
  form: FormApi<{ tasks: Task[] }>;
  onRemove: () => void;
}) {
  const task = form.getFieldValue(`tasks[${index}]`);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 items-center p-2 border rounded">
      <button type="button" {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-4 w-4" />
      </button>

      <form.Field
        name={`tasks[${index}].title`}
        children={(field) => (
          <Input
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            className="flex-1"
          />
        )}
      />

      <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ReorderableTaskForm() {
  const form = useForm<{ tasks: Task[] }>({
    defaultValues: {
      tasks: [
        { id: '1', title: 'Task 1', priority: 'medium' },
        { id: '2', title: 'Task 2', priority: 'low' },
      ],
    },
    onSubmit: async ({ value }) => { /* ... */ },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const tasks = form.getFieldValue('tasks');
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);

    const newTasks = arrayMove(tasks, oldIndex, newIndex);
    form.setFieldValue('tasks', newTasks);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field
        name="tasks"
        mode="array"
        children={(field) => (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={field.state.value.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {field.state.value.map((_, index) => (
                <SortableTaskItem
                  key={field.state.value[index].id}
                  index={index}
                  form={form}
                  onRemove={() => field.removeValue(index)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      />

      <Button type="submit">Save Tasks</Button>
    </form>
  );
}
```

## Dynamic Fields

### Conditional Fields Based on Selection

```typescript
interface ApplicationForm {
  applicationType: 'individual' | 'business';
  // Individual fields
  firstName?: string;
  lastName?: string;
  ssn?: string;
  // Business fields
  businessName?: string;
  ein?: string;
  numberOfEmployees?: number;
}

function ApplicationForm() {
  const form = useForm<ApplicationForm>({
    defaultValues: {
      applicationType: 'individual',
    },
    onSubmit: async ({ value }) => { /* ... */ },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field
        name="applicationType"
        children={(field) => (
          <RadioGroup
            value={field.state.value}
            onValueChange={(value) => {
              field.handleChange(value as 'individual' | 'business');
              // Clear other fields when type changes
              if (value === 'individual') {
                form.setFieldValue('businessName', undefined);
                form.setFieldValue('ein', undefined);
              } else {
                form.setFieldValue('firstName', undefined);
                form.setFieldValue('lastName', undefined);
              }
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="individual" id="individual" />
              <Label htmlFor="individual">Individual</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="business" id="business" />
              <Label htmlFor="business">Business</Label>
            </div>
          </RadioGroup>
        )}
      />

      <form.Subscribe
        selector={(state) => state.values.applicationType}
        children={(type) =>
          type === 'individual' ? (
            <IndividualFields form={form} />
          ) : (
            <BusinessFields form={form} />
          )
        }
      />

      <Button type="submit">Submit Application</Button>
    </form>
  );
}

function IndividualFields({ form }: { form: FormApi<ApplicationForm> }) {
  return (
    <div className="space-y-4">
      <form.Field
        name="firstName"
        validators={{ onChange: z.string().min(1, 'Required') }}
        children={(field) => (
          <div>
            <Label>First Name</Label>
            <Input
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError field={field} />
          </div>
        )}
      />

      <form.Field
        name="lastName"
        validators={{ onChange: z.string().min(1, 'Required') }}
        children={(field) => (
          <div>
            <Label>Last Name</Label>
            <Input
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError field={field} />
          </div>
        )}
      />
    </div>
  );
}

function BusinessFields({ form }: { form: FormApi<ApplicationForm> }) {
  return (
    <div className="space-y-4">
      <form.Field
        name="businessName"
        validators={{ onChange: z.string().min(1, 'Required') }}
        children={(field) => (
          <div>
            <Label>Business Name</Label>
            <Input
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError field={field} />
          </div>
        )}
      />

      <form.Field
        name="ein"
        validators={{
          onChange: z.string().regex(/^\d{2}-\d{7}$/, 'Format: XX-XXXXXXX'),
        }}
        children={(field) => (
          <div>
            <Label>EIN</Label>
            <Input
              placeholder="XX-XXXXXXX"
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError field={field} />
          </div>
        )}
      />
    </div>
  );
}
```

### Dynamic Field Generation from Schema

```typescript
interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'select' | 'checkbox';
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: z.ZodType<any>;
}

function DynamicForm({ fields, onSubmit }: {
  fields: FieldConfig[];
  onSubmit: (values: Record<string, any>) => Promise<void>;
}) {
  const defaultValues = fields.reduce((acc, field) => {
    acc[field.name] = field.type === 'checkbox' ? false : '';
    return acc;
  }, {} as Record<string, any>);

  const form = useForm({
    defaultValues,
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      {fields.map((fieldConfig) => (
        <form.Field
          key={fieldConfig.name}
          name={fieldConfig.name}
          validators={
            fieldConfig.validation
              ? { onChange: fieldConfig.validation }
              : undefined
          }
          children={(field) => (
            <DynamicFieldRenderer
              config={fieldConfig}
              field={field}
            />
          )}
        />
      ))}

      <Button type="submit">Submit</Button>
    </form>
  );
}

function DynamicFieldRenderer({
  config,
  field,
}: {
  config: FieldConfig;
  field: FieldApi<any, any, any, any>;
}) {
  const { label, type, required, options } = config;

  return (
    <div className="mb-4">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>

      {type === 'text' || type === 'email' ? (
        <Input
          type={type}
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      ) : type === 'number' ? (
        <Input
          type="number"
          value={field.state.value}
          onChange={(e) => field.handleChange(Number(e.target.value))}
        />
      ) : type === 'select' ? (
        <Select value={field.state.value} onValueChange={field.handleChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${label}`} />
          </SelectTrigger>
          <SelectContent>
            {options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : type === 'checkbox' ? (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={field.state.value}
            onCheckedChange={(checked) => field.handleChange(!!checked)}
          />
        </div>
      ) : null}

      <FieldError field={field} />
    </div>
  );
}
```

## Multi-Step Forms

### Wizard Form Pattern

```typescript
interface WizardForm {
  // Step 1: Personal Info
  firstName: string;
  lastName: string;
  email: string;
  // Step 2: Address
  street: string;
  city: string;
  country: string;
  // Step 3: Preferences
  newsletter: boolean;
  theme: 'light' | 'dark';
}

const stepSchemas = [
  z.object({
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    email: z.string().email('Invalid email'),
  }),
  z.object({
    street: z.string().min(1, 'Required'),
    city: z.string().min(1, 'Required'),
    country: z.string().min(1, 'Required'),
  }),
  z.object({
    newsletter: z.boolean(),
    theme: z.enum(['light', 'dark']),
  }),
];

function WizardForm() {
  const [step, setStep] = useState(0);

  const form = useForm<WizardForm>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      street: '',
      city: '',
      country: '',
      newsletter: false,
      theme: 'light',
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      await submitRegistration(value);
    },
  });

  const validateCurrentStep = async () => {
    const schema = stepSchemas[step];
    const values = form.state.values;

    try {
      schema.parse(values);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Trigger validation on relevant fields
        await form.validate('change');
      }
      return false;
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && step < 2) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateCurrentStep();
    if (isValid) {
      form.handleSubmit();
    }
  };

  return (
    <div>
      {/* Progress indicator */}
      <div className="flex gap-2 mb-6">
        {['Personal', 'Address', 'Preferences'].map((label, i) => (
          <div
            key={label}
            className={cn(
              'flex-1 h-2 rounded',
              i <= step ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Personal Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            <form.Field
              name="firstName"
              validators={{ onChange: z.string().min(1, 'Required') }}
              children={(field) => (
                <div>
                  <Label>First Name</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldError field={field} />
                </div>
              )}
            />
            {/* lastName and email fields */}
          </div>
        )}

        {/* Step 2: Address */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Address</h2>
            {/* street, city, country fields */}
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Preferences</h2>
            {/* newsletter, theme fields */}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={step === 0}
          >
            Previous
          </Button>

          {step < 2 ? (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <form.Subscribe
              selector={(s) => s.isSubmitting}
              children={(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Complete'}
                </Button>
              )}
            />
          )}
        </div>
      </form>
    </div>
  );
}
```

### Accordion Multi-Section Form

```typescript
function AccordionForm() {
  const [openSections, setOpenSections] = useState<string[]>(['personal']);

  const form = useForm<ProfileForm>({
    defaultValues: {
      personal: { name: '', bio: '' },
      contact: { email: '', phone: '' },
      social: { twitter: '', linkedin: '' },
    },
    onSubmit: async ({ value }) => { /* ... */ },
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <Accordion type="multiple" value={openSections}>
        <AccordionItem value="personal">
          <AccordionTrigger onClick={() => toggleSection('personal')}>
            Personal Information
            <SectionStatus form={form} prefix="personal" />
          </AccordionTrigger>
          <AccordionContent>
            <form.Field
              name="personal.name"
              children={(field) => (
                <div>
                  <Label>Name</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
            {/* More fields */}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="contact">
          <AccordionTrigger onClick={() => toggleSection('contact')}>
            Contact Details
            <SectionStatus form={form} prefix="contact" />
          </AccordionTrigger>
          <AccordionContent>
            {/* Contact fields */}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="social">
          <AccordionTrigger onClick={() => toggleSection('social')}>
            Social Links
            <SectionStatus form={form} prefix="social" />
          </AccordionTrigger>
          <AccordionContent>
            {/* Social fields */}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button type="submit" className="mt-4">
        Save Profile
      </Button>
    </form>
  );
}

// Shows completion status for a section
function SectionStatus({ form, prefix }: { form: FormApi<any>; prefix: string }) {
  return (
    <form.Subscribe
      selector={(state) => {
        const sectionMeta = Object.entries(state.fieldMeta)
          .filter(([key]) => key.startsWith(prefix))
          .map(([_, meta]) => meta);

        const hasErrors = sectionMeta.some((m) => m.errors.length > 0);
        const isTouched = sectionMeta.some((m) => m.isTouched);

        return { hasErrors, isTouched };
      }}
      children={({ hasErrors, isTouched }) => (
        <span className="ml-2">
          {hasErrors ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : isTouched ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : null}
        </span>
      )}
    />
  );
}
```

## Form Composition

### Reusable Field Components

```typescript
// Composable form field wrapper
interface FormFieldProps<TName extends string> {
  form: FormApi<any>;
  name: TName;
  label: string;
  description?: string;
  validators?: FieldValidators<any, TName>;
  children: (field: FieldApi<any, TName, any, any>) => React.ReactNode;
}

function FormField<TName extends string>({
  form,
  name,
  label,
  description,
  validators,
  children,
}: FormFieldProps<TName>) {
  return (
    <form.Field
      name={name}
      validators={validators}
      children={(field) => (
        <div className="space-y-2">
          <Label htmlFor={name}>
            {label}
            {validators?.onChange && (
              <span className="text-destructive"> *</span>
            )}
          </Label>
          {children(field)}
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
          <FieldError field={field} />
        </div>
      )}
    />
  );
}

// Usage
function UserForm() {
  const form = useForm({ /* ... */ });

  return (
    <form>
      <FormField
        form={form}
        name="email"
        label="Email Address"
        description="We'll never share your email"
        validators={{ onChange: z.string().email() }}
      >
        {(field) => (
          <Input
            type="email"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </FormField>
    </form>
  );
}
```

### Form Sections as Components

```typescript
// Reusable address section
function AddressSection({
  form,
  prefix,
  title,
}: {
  form: FormApi<any>;
  prefix: string;
  title: string;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">{title}</h3>

      <form.Field
        name={`${prefix}.street`}
        validators={{ onChange: z.string().min(1, 'Required') }}
        children={(field) => (
          <div>
            <Label>Street Address</Label>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError field={field} />
          </div>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name={`${prefix}.city`}
          validators={{ onChange: z.string().min(1, 'Required') }}
          children={(field) => (
            <div>
              <Label>City</Label>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError field={field} />
            </div>
          )}
        />

        <form.Field
          name={`${prefix}.zip`}
          validators={{ onChange: z.string().regex(/^\d{5}$/, 'Invalid ZIP') }}
          children={(field) => (
            <div>
              <Label>ZIP Code</Label>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError field={field} />
            </div>
          )}
        />
      </div>
    </div>
  );
}

// Usage in checkout form
function CheckoutForm() {
  const form = useForm({
    defaultValues: {
      billing: { street: '', city: '', zip: '' },
      shipping: { street: '', city: '', zip: '' },
    },
    onSubmit: async ({ value }) => { /* ... */ },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <AddressSection form={form} prefix="billing" title="Billing Address" />
      <AddressSection form={form} prefix="shipping" title="Shipping Address" />
      <Button type="submit">Place Order</Button>
    </form>
  );
}
```

## Performance Optimization

### Selective Re-rendering

```typescript
// Only re-render when specific fields change
function OptimizedForm() {
  const form = useForm<LargeForm>({
    defaultValues: { /* many fields */ },
    onSubmit: async ({ value }) => { /* ... */ },
  });

  return (
    <form>
      {/* This component only re-renders when 'name' changes */}
      <form.Field
        name="name"
        children={(field) => (
          <MemoizedInput field={field} />
        )}
      />

      {/* Subscribe to minimal state */}
      <form.Subscribe
        selector={(s) => s.isSubmitting}
        children={(isSubmitting) => (
          <Button disabled={isSubmitting}>Submit</Button>
        )}
      />
    </form>
  );
}

// Memoized field component
const MemoizedInput = React.memo(function MemoizedInput({
  field,
}: {
  field: FieldApi<any, any, any, any>;
}) {
  return (
    <Input
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
    />
  );
});
```

## Best Practices

### Do's

```typescript
// ✅ Use mode="array" for field arrays
<form.Field name="items" mode="array" children={/* ... */} />

// ✅ Provide unique keys for array items
{field.state.value.map((item, index) => (
  <div key={item.id || index}>
))}

// ✅ Validate arrays at both levels
validators={{
  onChange: z.array(itemSchema).min(1), // Array level
}}
// And individual item fields

// ✅ Use form.Subscribe for derived values
<form.Subscribe
  selector={(s) => s.values.items.reduce((sum, i) => sum + i.price, 0)}
  children={(total) => <span>${total}</span>}
/>
```

### Don'ts

```typescript
// ❌ Don't use array index as only key when reordering
{items.map((_, i) => <div key={i} />)} // Breaks on reorder

// ❌ Don't forget to remove array items
field.pushValue(item); // But never removeValue

// ❌ Don't mutate array directly
field.state.value.push(item); // Wrong
field.pushValue(item); // Correct
```

## Agent Collaboration

- **tanstack**: Primary agent for form patterns
- **shadcn-ui-designer**: Complex form UI layouts
- **debug-master**: Form performance issues
- **responsive-master**: Multi-step form layouts
