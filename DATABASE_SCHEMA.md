# Database Schema Draft

This document describes the initial Supabase Postgres schema direction for Service Scheduler.

The schema should support one initial company while keeping future multi-company use possible.

## 1. General Conventions

- Primary keys should use UUIDs.
- Tables should include `created_at` where useful.
- Mutable business entities should include `updated_at`.
- Multi-tenant tables should include `organization_id`.
- Use English names for tables, columns, enums, and code.
- Store timestamps as `timestamptz`.
- Use `America/Argentina/Buenos_Aires` as the initial organization timezone.

## 2. Enum Drafts

### User Role

```sql
admin
supervisor
technician
```

### Appointment Status

```sql
pending
confirmed
reschedule_requested
cancel_requested
cancelled
completed
```

### Appointment Event Type

```sql
created
confirmed
cancel_requested
cancelled
reschedule_requested
rescheduled
technician_assigned
technician_removed
duration_updated
completed
note_added
```

## 3. Tables

## `organizations`

Represents companies using the platform. In the technical model, each company is stored as an organization.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `name` | `text` | Organization display name |
| `slug` | `text` | Unique URL-friendly identifier |
| `timezone` | `text` | Example: `America/Argentina/Buenos_Aires` |
| `default_locale` | `text` | Example: `es` |
| `created_at` | `timestamptz` | Creation time |
| `updated_at` | `timestamptz` | Last update time |

Recommended indexes:

- Unique index on `slug`.

## `organization_members`

Connects Supabase Auth users to organizations and roles.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `organization_id` | `uuid` | Foreign key to `organizations.id` |
| `user_id` | `uuid` | Foreign key to Supabase Auth user |
| `role` | `text` or enum | `admin`, `supervisor`, `technician` |
| `created_at` | `timestamptz` | Creation time |
| `updated_at` | `timestamptz` | Last update time |

Recommended indexes:

- Unique index on `organization_id, user_id`.
- Index on `user_id`.
- Index on `organization_id, role`.

## `technicians`

Represents technicians who can be assigned to appointments.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `organization_id` | `uuid` | Foreign key to `organizations.id` |
| `user_id` | `uuid` | Nullable link to Supabase Auth user |
| `name` | `text` | Technician display name |
| `phone` | `text` | Technician phone |
| `active` | `boolean` | Whether technician can be assigned |
| `created_at` | `timestamptz` | Creation time |
| `updated_at` | `timestamptz` | Last update time |

Recommended indexes:

- Index on `organization_id`.
- Index on `organization_id, active`.
- Unique partial index on `organization_id, user_id` where `user_id is not null`.

## `clients`

Represents clients created from public bookings or manual internal entry.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `organization_id` | `uuid` | Foreign key to `organizations.id` |
| `name` | `text` | Client name |
| `phone` | `text` | Required |
| `email` | `text` | Required for MVP email confirmations |
| `address` | `text` | Service location |
| `city` | `text` | City/neighborhood |
| `created_at` | `timestamptz` | Creation time |
| `updated_at` | `timestamptz` | Last update time |

Recommended indexes:

- Index on `organization_id`.
- Index on `organization_id, phone`.
- Index on `organization_id, email`.

## `services`

Represents service types offered by an organization.

Initial service examples:

- Repair
- Maintenance
- Installation
- Quotation/inspection
- Emergency visit

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `organization_id` | `uuid` | Foreign key to `organizations.id` |
| `name` | `text` | Display name |
| `slug` | `text` | Stable identifier |
| `default_duration_minutes` | `integer` | Example: 60 for inspection |
| `is_emergency` | `boolean` | True for emergency service |
| `active` | `boolean` | Whether visible/selectable |
| `created_at` | `timestamptz` | Creation time |
| `updated_at` | `timestamptz` | Last update time |

Recommended indexes:

- Unique index on `organization_id, slug`.
- Index on `organization_id, active`.

## `appointments`

Represents appointment requests and confirmed jobs.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `organization_id` | `uuid` | Foreign key to `organizations.id` |
| `client_id` | `uuid` | Foreign key to `clients.id` |
| `service_id` | `uuid` | Foreign key to `services.id` |
| `status` | `text` or enum | Appointment status |
| `requested_start_at` | `timestamptz` | Client-requested start time |
| `confirmed_start_at` | `timestamptz` | Supervisor-confirmed start time |
| `confirmed_end_at` | `timestamptz` | Includes duration plus travel buffer |
| `estimated_duration_minutes` | `integer` | Supervisor-estimated job duration |
| `travel_buffer_minutes` | `integer` | Default 60 |
| `address` | `text` | Service address snapshot |
| `city` | `text` | City/neighborhood snapshot |
| `equipment_type` | `text` | Required |
| `brand_model` | `text` | Optional |
| `problem_description` | `text` | Required |
| `client_notes` | `text` | Optional |
| `secure_token_hash` | `text` | Hash of client access token |
| `created_at` | `timestamptz` | Creation time |
| `updated_at` | `timestamptz` | Last update time |

Notes:

- Store a hash of the secure token instead of the raw token if practical.
- `requested_start_at` is required when the client submits.
- `confirmed_start_at` and `confirmed_end_at` are set when the supervisor confirms.
- Pending requests do not block technician availability.

Recommended indexes:

- Index on `organization_id, status`.
- Index on `organization_id, requested_start_at`.
- Index on `organization_id, confirmed_start_at`.
- Index on `organization_id, confirmed_start_at, confirmed_end_at`.
- Index on `client_id`.
- Unique index on `secure_token_hash`.

## `appointment_technicians`

Many-to-many table between appointments and technicians.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `appointment_id` | `uuid` | Foreign key to `appointments.id` |
| `technician_id` | `uuid` | Foreign key to `technicians.id` |
| `created_at` | `timestamptz` | Creation time |

Recommended indexes:

- Unique index on `appointment_id, technician_id`.
- Index on `technician_id`.

Scheduling conflict checks should use this table joined with confirmed appointments.

## `appointment_events`

Audit/history log for appointment changes.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `appointment_id` | `uuid` | Foreign key to `appointments.id` |
| `actor_user_id` | `uuid` | Nullable Supabase Auth user id |
| `event_type` | `text` or enum | Event type |
| `metadata` | `jsonb` | Additional structured details |
| `created_at` | `timestamptz` | Creation time |

Recommended indexes:

- Index on `appointment_id, created_at`.
- Index on `actor_user_id`.

## `company_settings`

Stores organization-level configuration.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `organization_id` | `uuid` | Foreign key to `organizations.id` |
| `working_hours` | `jsonb` | Weekly working hours |
| `created_at` | `timestamptz` | Creation time |
| `updated_at` | `timestamptz` | Last update time |

Recommended indexes:

- Unique index on `organization_id`.

Example `working_hours`:

```json
{
  "monday": [{ "start": "08:00", "end": "18:00" }],
  "tuesday": [{ "start": "08:00", "end": "18:00" }],
  "wednesday": [{ "start": "08:00", "end": "18:00" }],
  "thursday": [{ "start": "08:00", "end": "18:00" }],
  "friday": [{ "start": "08:00", "end": "18:00" }],
  "saturday": [{ "start": "09:00", "end": "16:00" }],
  "sunday": []
}
```

## 4. Relationship Summary

- An organization has many organization members.
- An organization has many technicians.
- An organization has many clients.
- An organization has many services.
- An organization has many appointments.
- A client has many appointments.
- A service has many appointments.
- An appointment has many assigned technicians through `appointment_technicians`.
- An appointment has many events.

## 5. Availability Query Concept

To determine whether a slot is available:

1. Get active technicians for the organization.
2. Get confirmed appointments overlapping the candidate slot.
3. Join confirmed appointments to assigned technicians.
4. Count blocked technicians.
5. Slot is available if active technician count is greater than blocked technician count.

Pending appointments are ignored for availability.

Overlap condition concept:

```sql
confirmed_start_at < candidate_end
and confirmed_end_at > candidate_start
```

## 6. Row Level Security Notes

Recommended RLS direction:

- Enable RLS on all business tables.
- Internal users can read organization rows where they are members.
- Technicians can read appointments in their organization.
- Supervisors and admins can manage appointments in their organization.
- Admins can manage settings and members in their organization.
- Public booking should use server-side endpoints, not direct broad table writes from the browser.
- Public appointment-token access should be validated server-side.

## 7. MVP Seed Data

Initial organization example:

- Name: configured from `SEED_ORGANIZATION_NAME`
- Slug: configured from `SEED_ORGANIZATION_SLUG`
- Timezone: `America/Argentina/Buenos_Aires`
- Default locale: `es`

Initial services:

- Repair
- Maintenance
- Installation
- Quotation/inspection
- Emergency visit

Initial settings:

- Working hours as defined above

