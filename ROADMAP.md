# Roadmap

This roadmap organizes Service Scheduler into practical phases. The first goal is to deliver a useful company-branded MVP for real daily operations before expanding into advanced business features or multi-company SaaS behavior.

## Phase 0: Project Foundation

Goal: initialize the app cleanly and prepare the technical base.

Deliverables:

- Initialize Next.js App Router project with TypeScript.
- Add Tailwind CSS.
- Add linting and formatting defaults.
- Add `next-intl` for internationalization.
- Create Spanish, English, and Portuguese message files.
- Configure Supabase client helpers.
- Add `.env.example`.
- Create initial app layout and routing structure.
- Add basic responsive design foundation.
- Prepare Vercel deployment.

Success criteria:

- App runs locally.
- App can be deployed to Vercel.
- Locale routing works.
- Supabase environment variables are documented.

## Phase 1: Company MVP

Goal: deliver the core booking and internal scheduling workflow.

### Public Client Flow

Deliverables:

- Public landing page.
- Booking form.
- Service type selection:
  - Repair
  - Maintenance
  - Installation
  - Quotation/inspection
  - Emergency visit
- 30-minute time slot selection.
- Working-hours validation.
- Client info fields:
  - Name
  - Phone
  - Email
  - Address
  - Neighborhood/city
  - Equipment type
  - Optional brand/model
  - Problem description
  - Optional comments
- Appointment request submission.
- Confirmation screen.
- Secure appointment token link.

### Internal Dashboard

Deliverables:

- Internal login.
- Role-aware dashboard shell.
- Daily agenda.
- Pending requests list.
- Appointment detail page.
- Supervisor confirmation flow.
- Assign one or more technicians.
- Set estimated duration.
- Cancel appointment.
- Reschedule appointment.
- Technician view of all company appointments.

### Scheduling

Deliverables:

- Company working hours.
- 30-minute slot generation.
- Per-technician availability.
- Confirmed appointment blocking.
- Multiple technicians per appointment.
- Capacity-based public slot availability.
- 1-hour travel buffer.

### Notifications

Deliverables:

- Email after appointment request.
- Email after supervisor confirmation.
- Manual WhatsApp links using `wa.me`.

Success criteria:

- A real client can request an appointment from mobile.
- Supervisor can confirm and assign technicians from mobile.
- Technicians can see appointments from mobile.
- The app prevents confirmed overbooking.
- The first company can use the app for real appointment management.

## Phase 2: Operations Improvements

Goal: improve day-to-day usability after MVP launch.

Potential deliverables:

- Same-day client reminders.
- Technician assignment notifications.
- Quotation follow-up reminders for supervisor.
- Google Calendar export.
- Better appointment history.
- Optional image uploads for equipment photos.
- Improved dashboard filters.
- More polished client reschedule/cancel flows.
- PWA install prompt.
- Basic analytics for appointment volume and service types.

Success criteria:

- Supervisor spends less time manually following up.
- Technicians receive clearer assignment communication.
- The company has better visibility into daily and weekly workload.

## Phase 3: Business Features

Goal: support more of the business process around appointments.

Potential deliverables:

- Payment status:
  - Unpaid
  - Partial
  - Paid
- Quote tracking.
- Internal price estimates.
- Invoice generation.
- Client history.
- Equipment history.
- Service notes.
- Parts/materials tracking.
- Reports by technician, service type, and period.

Success criteria:

- The company can track business outcomes, not only appointment scheduling.
- Supervisor can understand completed work, pending quotes, and payment state.

## Phase 4: Multi-Company Platform

Goal: evolve from a company-first tool into a reusable platform for other field-service companies.

Potential deliverables:

- Company onboarding.
- Company-level branding.
- Per-company service configuration.
- Per-company working hours.
- Company administration.
- Advanced role permissions.
- Subscription billing.
- Usage limits.
- Multi-company support in admin tooling.
- Organization switching for platform admins.

Success criteria:

- More than one company can use the app safely.
- Company data is isolated.
- Each company can configure its own services and settings.

## Explicitly Not In MVP

These features should not block the first useful release:

- Online payments.
- Public pricing.
- Invoices.
- Client accounts.
- Map routing.
- Video uploads.
- Full WhatsApp Business API integration.
- Full SaaS onboarding.
- Subscription billing.
- Technician vacation/holiday management.
- Advanced reporting.

## Recommended Build Order

1. Project setup.
2. Database schema and Supabase connection.
3. Internationalized app shell.
4. Public booking form UI.
5. Appointment request creation.
6. Internal auth.
7. Dashboard shell.
8. Pending requests list.
9. Appointment detail view.
10. Technician assignment.
11. Confirmation and scheduling conflict checks.
12. Client secure appointment view.
13. Email notifications.
14. Mobile polish.
15. Deploy and test with the first company.

## Product Principle

Build the smallest version that the first company can actually use with real clients and technicians. Keep future multi-company support in the data model and architecture, but do not build SaaS platform features until the first company workflow is working in production.

