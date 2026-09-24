-- Atomic worker queue claiming for Corretor Social.
-- Only service_role may execute these functions.

create or replace function public.claim_jobs(
  p_worker_id text,
  p_limit integer default 1
)
returns setof public.jobs
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with candidates as (
    select j.id
    from public.jobs as j
    where j.status in (
      'queued'::public.job_status,
      'retrying'::public.job_status
    )
      and j.run_after <= now()
      and j.attempts < j.max_attempts
    order by j.priority asc, j.created_at asc
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 1), 10))
  )
  update public.jobs as j
  set
    status = 'processing'::public.job_status,
    attempts = j.attempts + 1,
    locked_at = now(),
    locked_by = p_worker_id,
    updated_at = now()
  from candidates as c
  where j.id = c.id
  returning j.*;
end;
$$;

revoke all on function public.claim_jobs(text, integer) from public;
grant execute on function public.claim_jobs(text, integer) to service_role;

create or replace function public.requeue_stale_jobs(
  p_stale_minutes integer default 15
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  update public.jobs as j
  set
    status = case
      when j.attempts >= j.max_attempts
        then 'failed'::public.job_status
      else 'retrying'::public.job_status
    end,
    run_after = case
      when j.attempts >= j.max_attempts
        then j.run_after
      else now() + interval '1 minute'
    end,
    locked_at = null,
    locked_by = null,
    last_error = coalesce(j.last_error, 'Worker lock expired before completion.'),
    updated_at = now()
  where j.status = 'processing'::public.job_status
    and j.locked_at is not null
    and j.locked_at < now() - make_interval(
      mins => greatest(1, least(coalesce(p_stale_minutes, 15), 1440))
    );

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.requeue_stale_jobs(integer) from public;
grant execute on function public.requeue_stale_jobs(integer) to service_role;
