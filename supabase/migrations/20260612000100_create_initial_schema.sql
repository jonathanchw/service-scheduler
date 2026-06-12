create extension if not exists pgcrypto;

create type user_role as enum (
  'admin',
  'supervisor',
  'technician'
);

create type appointment_status as enum (
  'pending',
  'confirmed',
  'reschedule_requested',
  'cancel_requested',
  'cancelled',
  'completed'
);

create type appointment_event_type as enum (
  'created',
  'confirmed',
  'cancel_requested',
  'cancelled',
  'reschedule_requested',
  'rescheduled',
  'technician_assigned',
  'technician_removed',
  'duration_updated',
  'completed',
  'note_added'
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  default_locale text not null default 'es',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_slug_key unique (slug)
);

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role user_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_organization_id_user_id_key unique (
    organization_id,
    user_id
  )
);

create table technicians (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  phone text not null,
  email text not null,
  address text not null,
  city text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  default_duration_minutes integer not null default 60,
  is_emergency boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_organization_id_slug_key unique (organization_id, slug),
  constraint services_default_duration_minutes_positive check (
    default_duration_minutes > 0
  )
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid not null references clients(id) on delete restrict,
  service_id uuid not null references services(id) on delete restrict,
  status appointment_status not null default 'pending',
  requested_start_at timestamptz not null,
  confirmed_start_at timestamptz,
  confirmed_end_at timestamptz,
  estimated_duration_minutes integer,
  travel_buffer_minutes integer not null default 60,
  address text not null,
  city text not null,
  equipment_type text not null,
  brand_model text,
  problem_description text not null,
  client_notes text,
  secure_token_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_estimated_duration_minutes_positive check (
    estimated_duration_minutes is null
    or estimated_duration_minutes > 0
  ),
  constraint appointments_travel_buffer_minutes_non_negative check (
    travel_buffer_minutes >= 0
  ),
  constraint appointments_confirmed_range_valid check (
    confirmed_start_at is null
    or confirmed_end_at is null
    or confirmed_start_at < confirmed_end_at
  ),
  constraint appointments_secure_token_hash_key unique (secure_token_hash)
);

create table appointment_technicians (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  technician_id uuid not null references technicians(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint appointment_technicians_appointment_id_technician_id_key unique (
    appointment_id,
    technician_id
  )
);

create table appointment_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type appointment_event_type not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table company_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  working_hours jsonb not null default '{}'::jsonb,
  enabled_locales text[] not null default array['es', 'en', 'pt'],
  status_tracking_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_settings_organization_id_key unique (organization_id)
);

create index organization_members_user_id_idx on organization_members(user_id);
create index organization_members_organization_id_role_idx on organization_members(
  organization_id,
  role
);

create index technicians_organization_id_idx on technicians(organization_id);
create index technicians_organization_id_active_idx on technicians(
  organization_id,
  active
);
create unique index technicians_organization_id_user_id_key on technicians(
  organization_id,
  user_id
)
where
  user_id is not null;

create index clients_organization_id_idx on clients(organization_id);
create index clients_organization_id_phone_idx on clients(organization_id, phone);
create index clients_organization_id_email_idx on clients(organization_id, email);

create index services_organization_id_active_idx on services(
  organization_id,
  active
);

create index appointments_organization_id_status_idx on appointments(
  organization_id,
  status
);
create index appointments_organization_id_requested_start_at_idx on appointments(
  organization_id,
  requested_start_at
);
create index appointments_organization_id_confirmed_start_at_idx on appointments(
  organization_id,
  confirmed_start_at
);
create index appointments_organization_id_confirmed_range_idx on appointments(
  organization_id,
  confirmed_start_at,
  confirmed_end_at
);
create index appointments_client_id_idx on appointments(client_id);

create index appointment_technicians_technician_id_idx on appointment_technicians(
  technician_id
);

create index appointment_events_appointment_id_created_at_idx on appointment_events(
  appointment_id,
  created_at
);
create index appointment_events_actor_user_id_idx on appointment_events(
  actor_user_id
);
