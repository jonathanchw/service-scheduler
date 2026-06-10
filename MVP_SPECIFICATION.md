# Service Scheduler MVP Specification

## 1. Product Summary

Service Scheduler is a mobile-first scheduling and appointment management PWA for field-service companies. It is designed for businesses that send technicians to client locations, such as climatization, HVAC, refrigeration, appliance repair, maintenance, and installation companies.

The MVP should solve one main problem: let clients request service appointments easily while giving the company supervisor control over technician assignment, appointment confirmation, and daily operations.

The app should launch as a company-branded product, but the architecture should keep future multi-company support in mind.

## 2. MVP Goals

- Provide a simple public booking flow for clients without requiring client accounts.
- Let clients request exact appointment times within working hours.
- Let supervisors approve requests before appointments become confirmed.
- Let supervisors assign one or more technicians to each job.
- Let technicians view all company appointments from mobile.
- Prevent overbooking based on technician availability.
- Support Spanish-first UI with English and Portuguese translation structure.
- Keep the system low-cost, deployable, and practical for immediate real-world use.

## 3. Non-Goals For MVP

- Online payments.
- Public pricing.
- Invoices and formal quote generation.
- Client accounts.
- Map routing.
- Technician vacation or holiday management.
- Image/video upload.
- Full WhatsApp Business API automation.
- Full SaaS onboarding, billing, and company self-registration.

## 4. Target Users

### Client

A person who needs a technician visit at their location. The client should be able to request an appointment without creating an account.

### Technician

An internal company user who performs the service visit. Technicians can view appointments and assignment information, but cannot confirm or modify appointments in the MVP.

### Supervisor

The main operational user. The supervisor reviews requests, confirms appointments, assigns technicians, adjusts duration, and manages the daily agenda.

### Admin

An internal user with supervisor capabilities plus access to system/company settings.

## 5. Roles And Permissions

| Capability | Client | Technician | Supervisor | Admin |
| --- | --- | --- | --- | --- |
| Request appointment | Yes | No | Yes | Yes |
| View own appointment by secure link | Yes | No | No | No |
| Request cancel/reschedule | Yes | No | Yes | Yes |
| View company appointments | No | Yes | Yes | Yes |
| View all assigned technicians | No | Yes | Yes | Yes |
| Confirm appointment | No | No | Yes | Yes |
| Cancel/reschedule appointment | Request only | No | Yes | Yes |
| Assign technicians | No | No | Yes | Yes |
| Edit estimated duration | No | No | Yes | Yes |
| Manage settings | No | No | Limited/No | Yes |

## 6. Client Booking Flow

1. Client opens the public booking page.
2. UI defaults to Spanish, with language options for English and Portuguese.
3. Client selects service type:
   - Repair
   - Maintenance
   - Installation
   - Quotation/inspection
   - Emergency visit
4. Client selects an available date and exact time slot in 30-minute increments.
5. Client enters required information:
   - Name
   - Phone
   - Email
   - Address
   - Neighborhood/city
   - Equipment type
   - Problem description
6. Client may enter optional information:
   - Brand/model
   - Additional comments
7. Client submits the request.
8. Appointment is created with `pending` status.
9. Client sees a confirmation screen explaining that the request is pending supervisor approval.
10. Client receives an email with a secure appointment link.

## 7. Client Appointment Link

The client appointment link should use a long secure token. No login or separate code should be required.

From the link, the client can:

- View appointment request details.
- See current appointment status.
- Request cancellation.
- Request reschedule.

Any reschedule request must return the appointment to supervisor approval.

## 8. Supervisor Flow

1. Supervisor logs into the internal dashboard.
2. Supervisor sees:
   - Daily agenda.
   - Pending requests.
   - Emergency-tagged requests.
3. Supervisor opens a pending request.
4. Supervisor reviews client, address, service, equipment, and requested time.
5. Supervisor assigns one or more technicians.
6. Supervisor sets estimated duration.
7. Supervisor confirms, cancels, or asks the client for more information outside the app.
8. Once confirmed, the appointment blocks the assigned technicians' availability.
9. Client receives appointment confirmation by email.
10. Supervisor can use WhatsApp links to contact clients or technicians manually.

## 9. Technician Flow

1. Technician logs into the internal dashboard from mobile.
2. Technician can see all company appointments.
3. Technician can see which technicians are assigned to each appointment.
4. Technician can open appointment details:
   - Client name
   - Phone
   - Address
   - Service type
   - Equipment type
   - Problem description
   - Date and time
   - Assigned technicians
5. Technician cannot confirm, cancel, reschedule, or assign appointments in the MVP.

## 10. Scheduling Rules

### Location And Timezone

- Initial market: Buenos Aires, Argentina.
- Default timezone: `America/Argentina/Buenos_Aires`.

### Working Hours

- Monday to Friday: 08:00 to 18:00.
- Saturday: 09:00 to 16:00.
- Sunday: unavailable.
- Clients cannot request times outside working hours.

### Slot Size

- Clients choose exact time slots in 30-minute increments.

### Availability Model

- Each technician has their own blocked time.
- The client does not choose technicians.
- The public UI does not show technician names.
- Pending requests do not block technician availability.
- Confirmed appointments block only the assigned technicians.
- A time slot becomes unavailable to clients only when no technician capacity remains for that slot.
- Multiple clients can request the same time if enough technicians may be available.
- The supervisor makes the final assignment decision.

### Appointment Duration

- Inspection/quotation default duration: 1 hour.
- Repair, maintenance, installation, and emergency visits may vary.
- Supervisor sets final estimated duration when confirming.
- Add a 1-hour travel buffer internally when blocking technician availability.

## 11. Appointment Statuses

Recommended MVP statuses:

- `pending`
- `confirmed`
- `reschedule_requested`
- `cancel_requested`
- `cancelled`
- `completed`

Emergency should be modeled as a service type or tag, not as a separate status.

## 12. Notifications

### MVP

- Email confirmation when request is submitted.
- Email confirmation when supervisor confirms appointment.
- WhatsApp links using `wa.me` for manual messages.

### Later Phase

- Automated WhatsApp Business API notifications.
- Same-day reminders.
- Technician assignment notifications.
- Follow-up reminders after quotation/inspection.

## 13. Internationalization

- Code, components, variables, and internal naming should be in English.
- Spanish should be the default launch language.
- English and Portuguese should be supported by the translation structure.
- Recommended library: `next-intl` for a modern Next.js App Router project.

## 14. Recommended Technical Stack

- Framework: Next.js with TypeScript.
- App type: PWA-ready responsive web app.
- Hosting: Vercel.
- Database: Supabase Postgres.
- Authentication: Supabase Auth for internal users only.
- Authorization: Supabase Row Level Security.
- File storage: not needed for MVP; Supabase Storage can be added later.
- Email: Resend or another low-cost transactional email provider.
- Styling: Tailwind CSS or another lightweight component-friendly styling approach.

AWS can be considered later, but Vercel plus Supabase is the recommended MVP path because it is faster and lower-cost for immediate real business use.

## 15. Core Data Model Draft

### `organizations`

Represents each company using the app. In the database and code, one company is represented as one organization.

Key fields:

- `id`
- `name`
- `slug`
- `timezone`
- `default_locale`
- `created_at`

### `organization_members`

Connects internal users to organizations and roles.

Key fields:

- `id`
- `organization_id`
- `user_id`
- `role`
- `created_at`

Roles:

- `admin`
- `supervisor`
- `technician`

### `technicians`

Represents technician profiles. A technician may be linked to an auth user.

Key fields:

- `id`
- `organization_id`
- `user_id`
- `name`
- `phone`
- `active`
- `created_at`

### `clients`

Represents clients created from booking requests or manual internal entry.

Key fields:

- `id`
- `organization_id`
- `name`
- `phone`
- `email`
- `address`
- `city`
- `created_at`

### `services`

Configurable service types.

Key fields:

- `id`
- `organization_id`
- `name`
- `slug`
- `default_duration_minutes`
- `is_emergency`
- `active`

### `appointments`

Represents appointment requests and confirmed jobs.

Key fields:

- `id`
- `organization_id`
- `client_id`
- `service_id`
- `status`
- `requested_start_at`
- `confirmed_start_at`
- `confirmed_end_at`
- `estimated_duration_minutes`
- `travel_buffer_minutes`
- `address`
- `equipment_type`
- `brand_model`
- `problem_description`
- `client_notes`
- `secure_token`
- `created_at`
- `updated_at`

### `appointment_technicians`

Many-to-many table because one job can have more than one technician.

Key fields:

- `id`
- `appointment_id`
- `technician_id`
- `created_at`

### `appointment_events`

Optional but useful for audit/history.

Key fields:

- `id`
- `appointment_id`
- `actor_user_id`
- `event_type`
- `metadata`
- `created_at`

### `company_settings`

Stores organization-level configuration.

Key fields:

- `id`
- `organization_id`
- `working_hours`
- `enabled_locales`
- `status_tracking_enabled`
- `created_at`
- `updated_at`

## 16. Page List

### Public Pages

- `/`
  - Company-branded landing page.
- `/book`
  - Client booking form.
- `/appointment/[token]`
  - Client appointment view, cancel request, and reschedule request.

### Internal Pages

- `/login`
  - Internal user login.
- `/dashboard`
  - Mobile-first internal home.
- `/dashboard/agenda`
  - Daily agenda.
- `/dashboard/requests`
  - Pending requests.
- `/dashboard/appointments/[id]`
  - Appointment detail.
- `/dashboard/settings`
  - Admin settings.

## 17. Phase Roadmap

### Phase 1: MVP

- Public booking flow.
- Spanish default UI.
- Translation structure for Spanish, English, and Portuguese.
- Internal login.
- Daily agenda.
- Pending requests.
- Supervisor approval.
- Technician assignment.
- Per-technician calendar blocking.
- Secure appointment links.
- Email notifications.
- WhatsApp manual links.
- Mobile-first responsive UI.

### Phase 2: Operational Improvements

- Automated reminders.
- Google Calendar export.
- Technician assignment notifications.
- Client reschedule/cancel polish.
- Optional image uploads.
- Quotation follow-up reminders.

### Phase 3: Business Features

- Payment status.
- Quotes.
- Pricing.
- Invoices.
- Client and equipment history.
- Reporting.

### Phase 4: Multi-Company Platform

- Company onboarding.
- Company administration.
- Subscription billing.
- Branding per company.
- Advanced permissions.

## 18. Open Product Decisions

- Should pending requests ever expire automatically?
- Should emergency visits be allowed outside normal hours as supervisor-only manual entries?
- Should technicians eventually update job status?
- Should Google Calendar export be one-way export or full calendar sync?
- Which email provider should be used for production?
- Should the first release include a PWA install prompt?

