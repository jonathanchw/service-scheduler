with demo_organization as (
  insert into organizations (name, slug, timezone, default_locale)
  values (
    'Demo Service Company',
    'demo-service-company',
    'America/Argentina/Buenos_Aires',
    'es'
  )
  on conflict (slug) do update
  set
    name = excluded.name,
    timezone = excluded.timezone,
    default_locale = excluded.default_locale,
    updated_at = now()
  returning id
)
insert into company_settings (organization_id, working_hours)
select
  demo_organization.id,
  '{
    "monday": [{"start": "08:00", "end": "18:00"}],
    "tuesday": [{"start": "08:00", "end": "18:00"}],
    "wednesday": [{"start": "08:00", "end": "18:00"}],
    "thursday": [{"start": "08:00", "end": "18:00"}],
    "friday": [{"start": "08:00", "end": "18:00"}],
    "saturday": [{"start": "09:00", "end": "16:00"}],
    "sunday": []
  }'::jsonb
from demo_organization
on conflict (organization_id) do update
set
  working_hours = excluded.working_hours,
  updated_at = now();

with demo_organization as (
  select id
  from organizations
  where slug = 'demo-service-company'
)
insert into services (
  organization_id,
  name,
  slug,
  default_duration_minutes,
  is_emergency,
  active
)
select
  demo_organization.id,
  seed_services.name,
  seed_services.slug,
  seed_services.default_duration_minutes,
  seed_services.is_emergency,
  true
from demo_organization
cross join (
  values
    ('Repair', 'repair', 90, false),
    ('Maintenance', 'maintenance', 60, false),
    ('Installation', 'installation', 120, false),
    ('Emergency Service', 'emergency-service', 60, true)
) as seed_services (
  name,
  slug,
  default_duration_minutes,
  is_emergency
)
on conflict (organization_id, slug) do update
set
  name = excluded.name,
  default_duration_minutes = excluded.default_duration_minutes,
  is_emergency = excluded.is_emergency,
  active = excluded.active,
  updated_at = now();

with demo_organization as (
  select id
  from organizations
  where slug = 'demo-service-company'
)
insert into technicians (organization_id, name, phone, active)
select
  demo_organization.id,
  seed_technicians.name,
  seed_technicians.phone,
  true
from demo_organization
cross join (
  values
    ('Alex Technician', '+5491100000001'),
    ('Sam Technician', '+5491100000002')
) as seed_technicians (name, phone)
where not exists (
  select 1
  from technicians
  where technicians.organization_id = demo_organization.id
    and technicians.name = seed_technicians.name
);
