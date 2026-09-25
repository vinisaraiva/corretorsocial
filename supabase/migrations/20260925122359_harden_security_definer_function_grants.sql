-- Harden SECURITY DEFINER function grants.
-- Internal/worker functions are service-role only.
-- Authenticated media-management RPCs remain available to signed-in users,
-- with ownership checks enforced inside each function.

revoke execute on function public.claim_jobs(text, integer)
  from public, anon, authenticated;
revoke execute on function public.claim_job_by_id(uuid, uuid, text)
  from public, anon, authenticated;
revoke execute on function public.requeue_stale_jobs(integer)
  from public, anon, authenticated;
revoke execute on function public.increment_tracking_link_click(text)
  from public, anon, authenticated;
revoke execute on function public.cancel_property_jobs_on_delete()
  from public, anon, authenticated;

grant execute on function public.claim_jobs(text, integer)
  to service_role;
grant execute on function public.claim_job_by_id(uuid, uuid, text)
  to service_role;
grant execute on function public.requeue_stale_jobs(integer)
  to service_role;
grant execute on function public.increment_tracking_link_click(text)
  to service_role;

revoke execute on function public.set_property_cover(uuid, uuid)
  from public, anon;
revoke execute on function public.reorder_property_media(uuid, uuid[])
  from public, anon;
revoke execute on function public.remove_property_media(uuid, uuid)
  from public, anon;

grant execute on function public.set_property_cover(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.reorder_property_media(uuid, uuid[])
  to authenticated, service_role;
grant execute on function public.remove_property_media(uuid, uuid)
  to authenticated, service_role;
