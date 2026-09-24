-- Claim a specific queued job atomically for on-demand processors.
create or replace function public.claim_job_by_id(
  p_job_id uuid,
  p_user_id uuid,
  p_worker_id text
)
returns setof public.jobs
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.jobs as j
  set
    status = 'processing'::public.job_status,
    attempts = j.attempts + 1,
    locked_at = now(),
    locked_by = p_worker_id,
    updated_at = now()
  where j.id = p_job_id
    and j.user_id = p_user_id
    and j.status in (
      'queued'::public.job_status,
      'retrying'::public.job_status
    )
    and j.run_after <= now()
    and j.attempts < j.max_attempts
  returning j.*;
end;
$$;

revoke all on function public.claim_job_by_id(uuid, uuid, text) from public;
grant execute on function public.claim_job_by_id(uuid, uuid, text) to service_role;
