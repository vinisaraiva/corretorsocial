alter table public.properties
add column if not exists cover_manually_selected boolean not null default false;

create or replace function public.set_property_cover(
  p_property_id uuid,
  p_media_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.properties p
    where p.id = p_property_id
      and p.user_id = auth.uid()
  ) then
    raise exception 'property_not_found';
  end if;

  if not exists (
    select 1
    from public.property_media pm
    where pm.id = p_media_id
      and pm.property_id = p_property_id
  ) then
    raise exception 'media_not_found';
  end if;

  update public.property_media
  set is_cover = (id = p_media_id)
  where property_id = p_property_id;

  update public.properties
  set cover_manually_selected = true
  where id = p_property_id
    and user_id = auth.uid();
end;
$$;

revoke all on function public.set_property_cover(uuid, uuid) from public;
grant execute on function public.set_property_cover(uuid, uuid) to authenticated;

create or replace function public.remove_property_media(
  p_property_id uuid,
  p_media_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_storage_path text;
  v_was_cover boolean;
begin
  if not exists (
    select 1
    from public.properties p
    where p.id = p_property_id
      and p.user_id = auth.uid()
  ) then
    raise exception 'property_not_found';
  end if;

  delete from public.property_media pm
  where pm.id = p_media_id
    and pm.property_id = p_property_id
  returning pm.storage_path, pm.is_cover
  into v_storage_path, v_was_cover;

  if not found then
    raise exception 'media_not_found';
  end if;

  if v_was_cover then
    update public.property_media pm
    set is_cover = true
    where pm.id = (
      select next_media.id
      from public.property_media next_media
      where next_media.property_id = p_property_id
      order by next_media.sort_order asc, next_media.created_at asc
      limit 1
    );

    update public.properties
    set cover_manually_selected = false
    where id = p_property_id
      and user_id = auth.uid();
  end if;

  return v_storage_path;
end;
$$;

revoke all on function public.remove_property_media(uuid, uuid) from public;
grant execute on function public.remove_property_media(uuid, uuid) to authenticated;
