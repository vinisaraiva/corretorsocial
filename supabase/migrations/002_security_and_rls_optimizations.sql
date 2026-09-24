-- Security and RLS optimizations
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create index if not exists jobs_user_id_idx on public.jobs(user_id);
create index if not exists publications_campaign_variant_id_idx on public.publications(campaign_variant_id);
create index if not exists publications_social_connection_id_idx on public.publications(social_connection_id);
create index if not exists tracking_links_campaign_id_idx on public.tracking_links(campaign_id);
create index if not exists tracking_links_property_id_idx on public.tracking_links(property_id);

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select_own on public.profiles
for select using ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists connections_select_own on public.social_connections;
drop policy if exists connections_insert_own on public.social_connections;
drop policy if exists connections_update_own on public.social_connections;
drop policy if exists connections_delete_own on public.social_connections;
create policy connections_select_own on public.social_connections
for select using ((select auth.uid()) = user_id);
create policy connections_insert_own on public.social_connections
for insert with check ((select auth.uid()) = user_id);
create policy connections_update_own on public.social_connections
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy connections_delete_own on public.social_connections
for delete using ((select auth.uid()) = user_id);

drop policy if exists properties_select_own on public.properties;
drop policy if exists properties_insert_own on public.properties;
drop policy if exists properties_update_own on public.properties;
drop policy if exists properties_delete_own on public.properties;
create policy properties_select_own on public.properties
for select using ((select auth.uid()) = user_id);
create policy properties_insert_own on public.properties
for insert with check ((select auth.uid()) = user_id);
create policy properties_update_own on public.properties
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy properties_delete_own on public.properties
for delete using ((select auth.uid()) = user_id);

drop policy if exists property_media_select_own on public.property_media;
drop policy if exists property_media_insert_own on public.property_media;
drop policy if exists property_media_update_own on public.property_media;
drop policy if exists property_media_delete_own on public.property_media;

create policy property_media_select_own on public.property_media
for select using (
  exists (
    select 1 from public.properties p
    where p.id = property_media.property_id
      and p.user_id = (select auth.uid())
  )
);
create policy property_media_insert_own on public.property_media
for insert with check (
  exists (
    select 1 from public.properties p
    where p.id = property_media.property_id
      and p.user_id = (select auth.uid())
  )
);
create policy property_media_update_own on public.property_media
for update using (
  exists (
    select 1 from public.properties p
    where p.id = property_media.property_id
      and p.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_media.property_id
      and p.user_id = (select auth.uid())
  )
);
create policy property_media_delete_own on public.property_media
for delete using (
  exists (
    select 1 from public.properties p
    where p.id = property_media.property_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists campaigns_select_own on public.campaigns;
drop policy if exists campaigns_insert_own on public.campaigns;
drop policy if exists campaigns_update_own on public.campaigns;
drop policy if exists campaigns_delete_own on public.campaigns;
create policy campaigns_select_own on public.campaigns
for select using ((select auth.uid()) = user_id);
create policy campaigns_insert_own on public.campaigns
for insert with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.properties p
    where p.id = campaigns.property_id
      and p.user_id = (select auth.uid())
  )
);
create policy campaigns_update_own on public.campaigns
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy campaigns_delete_own on public.campaigns
for delete using ((select auth.uid()) = user_id);

drop policy if exists campaign_variants_select_own on public.campaign_variants;
drop policy if exists campaign_variants_write_own on public.campaign_variants;
create policy campaign_variants_select_own on public.campaign_variants
for select using (
  exists (
    select 1 from public.campaigns c
    where c.id = campaign_variants.campaign_id
      and c.user_id = (select auth.uid())
  )
);

drop policy if exists publications_select_own on public.publications;
create policy publications_select_own on public.publications
for select using (
  exists (
    select 1
    from public.campaign_variants v
    join public.campaigns c on c.id = v.campaign_id
    where v.id = publications.campaign_variant_id
      and c.user_id = (select auth.uid())
  )
);

drop policy if exists tracking_links_select_own on public.tracking_links;
drop policy if exists tracking_links_insert_own on public.tracking_links;
create policy tracking_links_select_own on public.tracking_links
for select using ((select auth.uid()) = user_id);
create policy tracking_links_insert_own on public.tracking_links
for insert with check ((select auth.uid()) = user_id);

drop policy if exists jobs_select_own on public.jobs;
drop policy if exists jobs_insert_own on public.jobs;
create policy jobs_select_own on public.jobs
for select using ((select auth.uid()) = user_id);
create policy jobs_insert_own on public.jobs
for insert with check ((select auth.uid()) = user_id);

drop policy if exists ai_credit_ledger_select_own on public.ai_credit_ledger;
create policy ai_credit_ledger_select_own on public.ai_credit_ledger
for select using ((select auth.uid()) = user_id);
