-- Split campaign variant write policies to avoid duplicate SELECT policies
drop policy if exists campaign_variants_write_own on public.campaign_variants;

create policy campaign_variants_insert_own
on public.campaign_variants for insert
with check (
  exists (
    select 1 from public.campaigns c
    where c.id = campaign_variants.campaign_id
      and c.user_id = (select auth.uid())
  )
);

create policy campaign_variants_update_own
on public.campaign_variants for update
using (
  exists (
    select 1 from public.campaigns c
    where c.id = campaign_variants.campaign_id
      and c.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.campaigns c
    where c.id = campaign_variants.campaign_id
      and c.user_id = (select auth.uid())
  )
);

create policy campaign_variants_delete_own
on public.campaign_variants for delete
using (
  exists (
    select 1 from public.campaigns c
    where c.id = campaign_variants.campaign_id
      and c.user_id = (select auth.uid())
  )
);
