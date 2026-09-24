-- Private Supabase Storage buckets for logos and property images.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'profile-assets',
    'profile-assets',
    false,
    5242880,
    array['image/jpeg','image/png','image/webp']
  ),
  (
    'property-media',
    'property-media',
    false,
    12582912,
    array['image/jpeg','image/png','image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile_assets_select_own" on storage.objects;
drop policy if exists "profile_assets_insert_own" on storage.objects;
drop policy if exists "profile_assets_update_own" on storage.objects;
drop policy if exists "profile_assets_delete_own" on storage.objects;

create policy "profile_assets_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'profile-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "profile_assets_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "profile_assets_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'profile-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "profile_assets_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "property_media_storage_select_own" on storage.objects;
drop policy if exists "property_media_storage_insert_own" on storage.objects;
drop policy if exists "property_media_storage_update_own" on storage.objects;
drop policy if exists "property_media_storage_delete_own" on storage.objects;

create policy "property_media_storage_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'property-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "property_media_storage_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'property-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "property_media_storage_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'property-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'property-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "property_media_storage_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'property-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
