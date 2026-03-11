# Patient Registration Multi-Step Form

Here is the complete implementation for `src/features/patients/components/registration-form.tsx`. It uses TanStack Form with the Zod validator adapter, per-step Zod schemas, and shadcn/ui components.

## Implementation

```tsx
// src/features/patients/components/registration-form.tsx

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Zod schemas -- one per step
// ---------------------------------------------------------------------------

const personalInfoSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[\d\s\-().]{7,}$/, 'Enter a valid phone number'),
});

const insuranceSchema = z.object({
  provider: z.string().min(1, 'Insurance provider is required'),
  policyNumber: z.string().min(1, 'Policy number is required'),
  groupNumber: z.string().min(1, 'Group number is required'),
});

const medicalHistorySchema = z.object({
  allergies: z.string(), // free-text list, optional
  currentMedications: z.string(), // free-text list, optional
});

const stepSchemas = [personalInfoSchema, insuranceSchema, medicalHistorySchema];

// ---------------------------------------------------------------------------
// Combined form type
// ---------------------------------------------------------------------------

interface PatientRegistrationForm {
  // Step 1 -- Personal Info
  name: string;
  dob: string;
  phone: string;
  // Step 2 -- Insurance Details
  provider: string;
  policyNumber: string;
  groupNumber: string;
  // Step 3 -- Medical History
  allergies: string;
  currentMedications: string;
}

// ---------------------------------------------------------------------------
// Reusable FieldError component
// ---------------------------------------------------------------------------

function FieldError({ field }: { field: { state: { meta: { isTouched: boolean; errors: string[] } } } }) {
  if (!field.state.meta.isTouched || field.state.meta.errors.length === 0) return null;
  return (
    <p className="text-destructive text-sm mt-1" role="alert">
      {field.state.meta.errors.join(', ')}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Step labels for progress indicator
// ---------------------------------------------------------------------------

const STEP_LABELS = ['Personal Info', 'Insurance Details', 'Medical History'];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PatientRegistrationForm() {
  const [step, setStep] = useState(0);

  const form = useForm<PatientRegistrationForm>({
    defaultValues: {
      name: '',
      dob: '',
      phone: '',
      provider: '',
      policyNumber: '',
      groupNumber: '',
      allergies: '',
      currentMedications: '',
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? 'Failed to register patient');
      }

      form.reset();
      setStep(0);
    },
  });

  // ---------- Per-step validation ----------

  const validateCurrentStep = async (): Promise<boolean> => {
    const schema = stepSchemas[step];
    const values = form.state.values;

    try {
      schema.parse(values);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Trigger field-level validation so errors render
        await form.validate('change');
      }
      return false;
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && step < STEP_LABELS.length - 1) {
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
    e.stopPropagation();
    const isValid = await validateCurrentStep();
    if (isValid) {
      form.handleSubmit();
    }
  };

  // ---------- Render ----------

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Patient Registration</CardTitle>
        <CardDescription>
          Step {step + 1} of {STEP_LABELS.length} &mdash; {STEP_LABELS[step]}
        </CardDescription>

        {/* Progress bar */}
        <div className="flex gap-2 pt-2">
          {STEP_LABELS.map((label, i) => (
            <div
              key={label}
              className={cn(
                'flex-1 h-2 rounded',
                i <= step ? 'bg-primary' : 'bg-muted',
              )}
            />
          ))}
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* -------- Step 1: Personal Info -------- */}
          {step === 0 && (
            <>
              <form.Field
                name="name"
                validators={{ onChange: z.string().min(1, 'Full name is required') }}
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Jane Doe"
                    />
                    <FieldError field={field} />
                  </div>
                )}
              />

              <form.Field
                name="dob"
                validators={{ onChange: z.string().min(1, 'Date of birth is required') }}
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Date of Birth <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <FieldError field={field} />
                  </div>
                )}
              />

              <form.Field
                name="phone"
                validators={{
                  onChange: z
                    .string()
                    .min(1, 'Phone number is required')
                    .regex(/^\+?[\d\s\-().]{7,}$/, 'Enter a valid phone number'),
                }}
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={field.name}
                      type="tel"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="+1 (555) 123-4567"
                    />
                    <FieldError field={field} />
                  </div>
                )}
              />
            </>
          )}

          {/* -------- Step 2: Insurance Details -------- */}
          {step === 1 && (
            <>
              <form.Field
                name="provider"
                validators={{ onChange: z.string().min(1, 'Insurance provider is required') }}
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Insurance Provider <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Aetna, Blue Cross, etc."
                    />
                    <FieldError field={field} />
                  </div>
                )}
              />

              <form.Field
                name="policyNumber"
                validators={{ onChange: z.string().min(1, 'Policy number is required') }}
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Policy Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="POL-123456"
                    />
                    <FieldError field={field} />
                  </div>
                )}
              />

              <form.Field
                name="groupNumber"
                validators={{ onChange: z.string().min(1, 'Group number is required') }}
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Group Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="GRP-7890"
                    />
                    <FieldError field={field} />
                  </div>
                )}
              />
            </>
          )}

          {/* -------- Step 3: Medical History -------- */}
          {step === 2 && (
            <>
              <form.Field
                name="allergies"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Known Allergies</Label>
                    <Textarea
                      id={field.name}
                      rows={3}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="List any known allergies, one per line"
                    />
                    <p className="text-muted-foreground text-sm">
                      Leave blank if none
                    </p>
                  </div>
                )}
              />

              <form.Field
                name="currentMedications"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Current Medications</Label>
                    <Textarea
                      id={field.name}
                      rows={3}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="List current medications, one per line"
                    />
                    <p className="text-muted-foreground text-sm">
                      Leave blank if none
                    </p>
                  </div>
                )}
              />
            </>
          )}
        </CardContent>

        {/* -------- Navigation -------- */}
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={step === 0}
          >
            Previous
          </Button>

          {step < STEP_LABELS.length - 1 ? (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <form.Subscribe
              selector={(s) => s.isSubmitting}
              children={(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Registering...' : 'Register Patient'}
                </Button>
              )}
            />
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
```

## Key Design Decisions

1. **Single `useForm` with per-step validation** -- All fields live in one `useForm<PatientRegistrationForm>()` instance. Each step has its own Zod schema in the `stepSchemas` array. Before advancing, `validateCurrentStep()` parses only the current step's fields, and on failure triggers `form.validate('change')` so field-level errors render.

2. **`zodValidator()` adapter** -- Attached via `validatorAdapter: zodValidator()` so both form-level and field-level validators can use raw Zod schemas. Each `form.Field` also carries its own `validators.onChange` Zod schema for immediate per-keystroke feedback.

3. **No `useState` for form data** -- All values are managed inside `useForm`. Only the `step` index uses `useState`, keeping form state as a single source of truth and avoiding sync bugs.

4. **`e.preventDefault()` + `e.stopPropagation()`** -- Called in the native `onSubmit` handler before `form.handleSubmit()` to prevent the browser from reloading the page.

5. **Submit button loading state** -- `form.Subscribe` subscribes to `isSubmitting` so only the button re-renders during submission, keeping the rest of the form performant.

6. **POST to `/api/patients`** -- The `onSubmit` handler sends the full form payload as JSON. On failure it throws so TanStack Form can surface the error. On success it resets the form and returns to step 0.

7. **Reusable `FieldError` component** -- Reads `field.state.meta.isTouched` and `field.state.meta.errors` to show errors only after the user has interacted with the field, following the skill's recommended pattern.

8. **Progress indicator** -- A simple bar built from `STEP_LABELS` highlights completed and current steps using `bg-primary` vs `bg-muted`, matching the wizard pattern from the skill documentation.

## Verification Checklist

- [x] Form uses `useForm` hook with explicit `PatientRegistrationForm` type parameter
- [x] All fields use `form.Field` component with `children` render prop
- [x] Validation uses `zodValidator()` adapter with Zod schemas
- [x] `e.preventDefault()` and `e.stopPropagation()` called in form `onSubmit`
- [x] Submit button shows loading state via `form.state.isSubmitting`
- [x] Validation errors display below each field from `field.state.meta.errors`
- [x] No `useState` calls used for form field values
- [x] Multi-step form validates per-step before advancing
- [x] Form resets on successful submit
