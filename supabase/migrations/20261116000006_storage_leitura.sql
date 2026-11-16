-- BuffetHub: o Storage precisa de permissão de leitura para apagar arquivos (storage.remove)
create policy "portfolio: buffet lê a própria pasta" on storage.objects for select to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid())::text);
