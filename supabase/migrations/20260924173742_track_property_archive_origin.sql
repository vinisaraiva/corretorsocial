alter table public.properties
add column if not exists archived_from_status public.property_status;

alter table public.properties
drop constraint if exists properties_archived_from_status_check;

alter table public.properties
add constraint properties_archived_from_status_check
check (
  archived_from_status is null
  or archived_from_status <> 'archived'::public.property_status
);
