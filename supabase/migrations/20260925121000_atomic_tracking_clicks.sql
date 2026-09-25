-- Atomic click tracking for public WhatsApp redirects.
-- Only service_role can execute this function.

create or replace function public.increment_tracking_link_click(
  p_short_code text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  destination text;
begin
  update public.tracking_links
  set clicks = clicks + 1
  where short_code = p_short_code
  returning destination_url into destination;

  return destination;
end;
$$;

revoke all on function public.increment_tracking_link_click(text) from public;
grant execute on function public.increment_tracking_link_click(text) to service_role;
