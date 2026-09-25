-- One tracking link per user/campaign/provider.
-- Existing public short_code uniqueness remains the external identifier.

create unique index if not exists tracking_links_campaign_provider_uidx
on public.tracking_links(user_id, campaign_id, provider)
where campaign_id is not null and provider is not null;
