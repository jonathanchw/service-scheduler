# Architecture

## 1. System Overview

Service Scheduler is a mobile-first web application for field-service companies. The first deployment can be branded for a specific company, but the system should be designed so other companies can use the same platform later.

The MVP architecture is:

- Next.js App Router application.
- PWA-ready responsive UI.
- Public client booking area.
- Authenticated internal dashboard.
- Supabase Postgres database.
- Supabase Auth for internal users.
- Supabase Row Level Security for organization and role boundaries.
- Vercel deployment.
- Email notifications through a transactional provider.
- WhatsApp manual links for MVP.

The application should prioritize fast delivery, low operational cost, and simple mobile workflows.

## 2. Application Areas

### Public Client Area

Unauthenticated client-facing pages:

- Landing page.
- Booking form.
- Secure appointment view by token.
- Reschedule/cancel request flows.

Clients do not create accounts. They receive a long secure token link by email after submitting a request.

### Internal Dashboard

Authenticated area for company users:

- Supervisor dashboard.
- Daily agenda.
- Pending requests.
- Appointment details.
- Technician views.
- Admin settings.

Internal users sign in with Supabase Auth.

## 3. Recommended Stack

### Frontend And Backend

- Next.js with App Router.
- TypeScript.
- React Server Components where useful.
- Server Actions or Route Handlers for backend mutations.
- Tailwind CSS for styling.
- PWA support added after the core flows are stable.

### Database And Auth

- Supabase Postgres.
- Supabase Auth for internal users only.
- Supabase Row Level Security.
- Supabase Storage later if image uploads are added.

### Deployment

- Vercel for the Next.js app.
- Supabase hosted project for database/auth.

### Internationalization

- `next-intl`.
- Spanish default locale: `es`.
- Supported locale structure from day one:
  - `es`
  - `en`
  - `pt`

Code, folder names, database names, and internal identifiers should be written in English.

## 4. Company And Organization Model

The user-facing product language should use "company." The technical code and database model should use "organization."

The initial UI can be company-branded, but the data model should include `organization_id` from the beginning.

This gives the project future multi-company support without requiring full SaaS features in the MVP.

MVP behavior:

- One organization exists for the initial company.
- Internal users belong to that organization.
- Public booking creates appointments for that organization.

Future behavior:

- Multiple organizations.
- Per-company branding.
- Per-company settings.
- Organization-level permissions.
- Company onboarding and billing.

## 5. Role Model

Internal roles:

- `admin`
- `supervisor`
- `technician`

Recommended permission model:

- Clients are anonymous and can only access appointment details by secure token.
- Technicians can view all company appointments.
- Technicians cannot confirm, cancel, reschedule, assign, or edit appointment duration in the MVP.
- Supervisors can manage appointments and assignments.
- Admins can manage settings and users.

## 6. Scheduling Architecture

Scheduling is based on technician capacity, but the client never sees technician names.

Core rules:

- Clients choose exact 30-minute time slots.
- Clients can only choose times inside company working hours.
- Pending requests do not block availability.
- Confirmed appointments block assigned technicians.
- A slot becomes unavailable only when no technician capacity remains.
- A single appointment can have multiple technicians.
- The supervisor makes the final assignment and duration decision.

Default working hours for the initial company:

- Monday to Friday: 08:00 to 18:00.
- Saturday: 09:00 to 16:00.
- Sunday: unavailable.

Default timezone:

- `America/Argentina/Buenos_Aires`.

Duration rules:

- Quotation/inspection default: 60 minutes.
- Other services default to supervisor estimation.
- Add 60 minutes of travel buffer internally when blocking assigned technicians.

## 7. Availability Calculation

The public booking form should ask the backend for available slots for a selected day.

The backend should:

1. Load company working hours.
2. Generate 30-minute slot candidates.
3. Exclude slots outside working hours.
4. Load confirmed appointments that overlap each slot.
5. Count blocked technicians per slot.
6. Return a slot as available if at least one active technician is not blocked.

Pending appointments should not count as blocked time.

When a supervisor confirms an appointment:

1. Validate that all assigned technicians are still available.
2. Calculate confirmed start and end time using estimated duration plus travel buffer.
3. Create appointment-technician assignments.
4. Set appointment status to `confirmed`.
5. Send client confirmation email.

## 8. Notifications

### MVP

- Email after client submits request.
- Email after supervisor confirms appointment.
- Manual WhatsApp links with prefilled text using `wa.me`.

### Later

- Automated WhatsApp Business API messages.
- Same-day reminders.
- Technician assignment messages.
- Quotation follow-up reminders.

## 9. Security Model

Security boundaries:

- Internal dashboard requires authentication.
- Public appointment views require secure token.
- Organization data must be isolated by `organization_id`.
- Service role keys must never be exposed to the browser.
- Public anon key can be exposed only for safe Supabase client operations.
- Mutations should be validated server-side.

Recommended Row Level Security:

- Internal users can only access rows for organizations where they are members.
- Technicians get read access to company appointments.
- Supervisors/admins get write access to appointment management tables.
- Public appointment-token flows should use server-side validation, not broad public table access.

## 10. Suggested Folder Direction

When the app is initialized, a practical structure would be:

```text
app/
  [locale]/
    page.tsx
    book/
    appointment/
    dashboard/
components/
  ui/
  booking/
  dashboard/
lib/
  auth/
  db/
  i18n/
  scheduling/
  notifications/
messages/
  es.json
  en.json
  pt.json
supabase/
  migrations/
```

This is a starting point, not a strict rule. The final structure should follow the framework setup and implementation needs.

## 11. Architecture Principles

- Keep the client booking experience simple.
- Put operational complexity in the supervisor dashboard.
- Do not expose technician choice to clients.
- Keep company branding at the UI level and organization data level.
- Keep reusable product logic generic.
- Prefer boring, low-cost infrastructure for the MVP.
- Avoid building SaaS platform features before the first company deployment is useful in production.

