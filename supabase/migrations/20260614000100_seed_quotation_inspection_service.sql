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
  'Quotation/inspection',
  'quotation-inspection',
  60,
  false,
  true
from demo_organization
on conflict (organization_id, slug) do update
set
  name = excluded.name,
  default_duration_minutes = excluded.default_duration_minutes,
  is_emergency = excluded.is_emergency,
  active = excluded.active,
  updated_at = now();
