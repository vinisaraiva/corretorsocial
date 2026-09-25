-- Repair legacy scheduled campaigns created before publication-plan lifecycle jobs existed.
-- Only past, calendar-only schedules without an active job are reset to ready.

update public.campaigns as c
set
  status = 'ready'::public.campaign_status,
  scheduled_for = null,
  updated_at = now()
where c.status = 'scheduled'::public.campaign_status
  and c.scheduled_for is not null
  and c.scheduled_for < now()
  and coalesce(jsonb_array_length(c.generation_metadata -> 'publish_providers'), 0) = 0
  and not exists (
    select 1
    from public.jobs as j
    where j.user_id = c.user_id
      and j.payload ->> 'campaign_id' = c.id::text
      and j.status in (
        'queued'::public.job_status,
        'processing'::public.job_status,
        'retrying'::public.job_status
      )
  );
