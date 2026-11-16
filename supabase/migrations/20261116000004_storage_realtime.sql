-- BuffetHub: fotos do portfólio (Supabase Storage) e mensagens em tempo real (Supabase Realtime)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Cada buffet só grava e apaga dentro da pasta com o próprio id: portfolio/<id do buffet>/arquivo.jpg
create policy "portfolio: buffet envia na própria pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "portfolio: buffet apaga da própria pasta" on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter publication supabase_realtime add table public.mensagem, public.notificacao;
