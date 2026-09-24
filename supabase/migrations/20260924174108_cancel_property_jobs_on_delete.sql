create or replace function public.cancel_property_jobs_on_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.jobs
  set
    status = 'cancelled'::public.job_status,
    locked_at = null,
    locked_by = null,
    last_error = coalesce(last_error, 'Property was deleted before job completion.'),
    updated_at = now()
  where user_id = old.user_id
    and payload ->> 'property_id' = old.id::text
    and status in (
      'queued'::public.job_status,
      'processing'::public.job_status,
      'retrying'::public.job_status
    );

  return old;
end;
$$;

drop trigger if exists properties_cancel_jobs_before_delete on public.properties;

create trigger properties_cancel_jobs_before_delete
before delete on public.properties
for each row execute function public.cancel_property_jobs_on_delete();
