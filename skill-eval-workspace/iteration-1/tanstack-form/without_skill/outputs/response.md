# Patient Registration Multi-Step Form

Here is the implementation for `src/features/patients/components/registration-form.tsx` -- a three-step patient registration form with Zod validation and final POST to `/api/patients`.

## Implementation

```tsx
// src/features/patients/components/registration-form.tsx

import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Zod schemas per step
// ---------------------------------------------------------------------------

const step1Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  phone: z.string().min(7, 'Phone number is required'),
});

const step2Schema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  policyNumber: z.string().min(1, 'Policy number is required'),
  groupNumber: z.string().min(1, 'Group number is required'),
});

const step3Schema = z.object({
  allergies: z.string(),
  currentMedications: z.string(),
});

const schemas = [step1Schema, step2Schema, step3Schema];

// ---------------------------------------------------------------------------
// Form values type
// ---------------------------------------------------------------------------

interface FormValues {
  name: string;
  dob: string;
  phone: string;
  provider: string;
  policyNumber: string;
  groupNumber: string;
  allergies: string;
  currentMedications: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PatientRegistrationForm() {
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<FormValues>({
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
      setSubmitError(null);
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSubmitError(body.message || 'Registration failed');
        return;
      }
      form.reset();
      setStep(0);
    },
  });

  const goNext = async () => {
    const schema = schemas[step];
    const result = schema.safeParse(form.state.values);
    if (!result.success) {
      await form.validate('change');
      return;
    }
    setStep((s) => s + 1);
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <h2>Patient Registration</h2>
      <p>Step {step + 1} of 3</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        {step === 0 && (
          <div>
            <h3>Personal Information</h3>

            <form.Field
              name="name"
              validators={{ onChange: z.string().min(1, 'Name is required') }}
              children={(field) => (
                <div>
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span style={{ color: 'red' }}>{field.state.meta.errors.join(', ')}</span>
                  )}
                </div>
              )}
            />

            <form.Field
              name="dob"
              validators={{ onChange: z.string().min(1, 'Date of birth is required') }}
              children={(field) => (
                <div>
                  <label htmlFor="dob">Date of Birth</label>
                  <input
                    id="dob"
                    type="date"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span style={{ color: 'red' }}>{field.state.meta.errors.join(', ')}</span>
                  )}
                </div>
              )}
            />

            <form.Field
              name="phone"
              validators={{ onChange: z.string().min(7, 'Phone number is required') }}
              children={(field) => (
                <div>
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span style={{ color: 'red' }}>{field.state.meta.errors.join(', ')}</span>
                  )}
                </div>
              )}
            />
          </div>
        )}

        {step === 1 && (
          <div>
            <h3>Insurance Details</h3>

            <form.Field
              name="provider"
              validators={{ onChange: z.string().min(1, 'Provider is required') }}
              children={(field) => (
                <div>
                  <label htmlFor="provider">Insurance Provider</label>
                  <input
                    id="provider"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span style={{ color: 'red' }}>{field.state.meta.errors.join(', ')}</span>
                  )}
                </div>
              )}
            />

            <form.Field
              name="policyNumber"
              validators={{ onChange: z.string().min(1, 'Policy number is required') }}
              children={(field) => (
                <div>
                  <label htmlFor="policyNumber">Policy Number</label>
                  <input
                    id="policyNumber"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span style={{ color: 'red' }}>{field.state.meta.errors.join(', ')}</span>
                  )}
                </div>
              )}
            />

            <form.Field
              name="groupNumber"
              validators={{ onChange: z.string().min(1, 'Group number is required') }}
              children={(field) => (
                <div>
                  <label htmlFor="groupNumber">Group Number</label>
                  <input
                    id="groupNumber"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span style={{ color: 'red' }}>{field.state.meta.errors.join(', ')}</span>
                  )}
                </div>
              )}
            />
          </div>
        )}

        {step === 2 && (
          <div>
            <h3>Medical History</h3>

            <form.Field
              name="allergies"
              children={(field) => (
                <div>
                  <label htmlFor="allergies">Allergies</label>
                  <textarea
                    id="allergies"
                    rows={3}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            />

            <form.Field
              name="currentMedications"
              children={(field) => (
                <div>
                  <label htmlFor="currentMedications">Current Medications</label>
                  <textarea
                    id="currentMedications"
                    rows={3}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            />
          </div>
        )}

        {submitError && <p style={{ color: 'red' }}>{submitError}</p>}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <button type="button" onClick={goBack} disabled={step === 0}>
            Back
          </button>

          {step < 2 ? (
            <button type="button" onClick={goNext}>
              Next
            </button>
          ) : (
            <button type="submit" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? 'Submitting...' : 'Register'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
```

## Notes

- The form uses `useForm` from `@tanstack/react-form` with `zodValidator()` from `@tanstack/zod-form-adapter`.
- Each step has its own Zod schema. Before advancing to the next step, `safeParse` checks the current step's fields. If validation fails, `form.validate('change')` is called to display per-field errors.
- Step 3 fields (allergies, current medications) are optional text areas.
- On final submit, the form POSTs to `/api/patients`. If the response is not OK it displays an error. On success the form resets back to step 0.
- The submit button is disabled while `form.state.isSubmitting` is true.
