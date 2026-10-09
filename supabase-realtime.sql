-- Включить мгновенную синхронизацию (Realtime) для таблицы.
-- Вставь целиком в Supabase: SQL Editor -> New query -> Run.
-- Запускать один раз. Если написано "already member of publication" -- всё уже включено.

do $$
begin
  alter publication supabase_realtime add table public.timecon_state;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
