-- Keep anonymous-first auth working even if Supabase changes anonymous user
-- metadata shape. The previous trigger could derive NULL for is_anonymous.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider text := coalesce(new.raw_app_meta_data->>'provider', '');
  metadata_is_anonymous text := new.raw_app_meta_data->>'is_anonymous';
  providers jsonb := coalesce(new.raw_app_meta_data->'providers', '[]'::jsonb);
begin
  insert into public.profiles (
    id,
    display_name,
    preferred_language,
    is_anonymous
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', '')
    ),
    coalesce(nullif(new.raw_user_meta_data->>'preferred_language', ''), 'zh-Hant'),
    case
      when metadata_is_anonymous in ('true', 'false') then metadata_is_anonymous::boolean
      else provider = 'anonymous' or providers ? 'anonymous'
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
