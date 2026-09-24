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
end;
$$;

revoke all on function public.set_property_cover(uuid, uuid) from public;
grant execute on function public.set_property_cover(uuid, uuid) to authenticated;

create or replace function public.reorder_property_media(
  p_property_id uuid,
  p_media_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total integer;
begin
  if not exists (
    select 1
    from public.properties p
    where p.id = p_property_id
      and p.user_id = auth.uid()
  ) then
    raise exception 'property_not_found';
  end if;

  select count(*)
  into v_total
  from public.property_media pm
  where pm.property_id = p_property_id;

  if coalesce(array_length(p_media_ids, 1), 0) <> v_total then
    raise exception 'invalid_media_order';
  end if;

  if exists (
    select 1
    from unnest(p_media_ids) as requested(id)
    left join public.property_media pm
      on pm.id = requested.id
     and pm.property_id = p_property_id
    where pm.id is null
  ) then
    raise exception 'invalid_media_order';
  end if;

  if (
    select count(distinct id)
    from unnest(p_media_ids) as requested(id)
  ) <> v_total then
    raise exception 'invalid_media_order';
  end if;

  update public.property_media pm
  set sort_order = ordered.position - 1
  from (
    select id, ordinality::integer as position
    from unnest(p_media_ids) with ordinality as requested(id, ordinality)
  ) as ordered
  where pm.id = ordered.id
    and pm.property_id = p_property_id;
end;
$$;

revoke all on function public.reorder_property_media(uuid, uuid[]) from public;
grant execute on function public.reorder_property_media(uuid, uuid[]) to authenticated;

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
  end if;

  return v_storage_path;
end;
$$;

revoke all on function public.remove_property_media(uuid, uuid) from public;
grant execute on function public.remove_property_media(uuid, uuid) to authenticated;
