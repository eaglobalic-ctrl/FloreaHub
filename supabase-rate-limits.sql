-- Basic self-hosted rate limiting — no external service/account needed.
-- Fixed-window counter per (bucket, ip), reset atomically inside the UPDATE
-- itself so concurrent requests from the same IP can't race past the limit
-- the way a read-then-write check would.
create table if not exists rate_limits (
  key text primary key,
  count integer not null default 1,
  window_start timestamptz not null default now()
);

create or replace function check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
as $$
declare
  current_count integer;
begin
  insert into rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
      when rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
        then 1
      else rate_limits.count + 1
    end,
    window_start = case
      when rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
        then now()
      else rate_limits.window_start
    end
  returning count into current_count;

  return current_count <= p_limit;
end;
$$;

-- Old rows never get cleaned up otherwise — this keeps the table from
-- growing forever. Cheap to run since it's keyed on the primary index.
create index if not exists idx_rate_limits_window_start on rate_limits(window_start);
