insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'campaign-assets',
  'campaign-assets',
  false,
  15728640,
  array['image/png','image/jpeg','image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "campaign_assets_select_own" on storage.objects;
drop policy if exists "campaign_assets_insert_own" on storage.objects;
drop policy if exists "campaign_assets_update_own" on storage.objects;
drop policy if exists "campaign_assets_delete_own" on storage.objects;

create policy "campaign_assets_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'campaign-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "campaign_assets_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'campaign-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "campaign_assets_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'campaign-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'campaign-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "campaign_assets_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'campaign-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
