# BuffetHub

Plataforma web que conecta clientes que estão organizando um evento a buffets.
Projeto da disciplina Engenharia de Software e Arquitetura de Sistemas (FECAP) – Grupo CTRL+ALT+DEL:
Yuri Oliveira Santana, Mauricio Suster, Kaio Inglez e Bruno Nóbrega.

## Tecnologias

- **Next.js 16** (React) hospedado na **Vercel** – telas (View) e rotas de servidor (Controller)
- **Supabase** – banco PostgreSQL, autenticação, armazenamento de fotos e tempo real (Model)
- Pagamento **simulado** (Pix, cartão e boleto) feito por uma função do banco

## O que já está pronto

- Banco completo em `supabase/migrations`: 14 tabelas do DER, regras de negócio dos casos de uso
  (orçamento, proposta, contrato, assinatura, pagamento simulado, avaliação, calendário, mensagens),
  segurança com RLS e dados de demonstração em `supabase/seed.sql`
- **T4.0 Busca de buffets** com filtros (nome, cidade, tipo de evento, nº de convidados, preço e culinária)
- **T5.0 Perfil do buffet** com fotos, cardápio e preços, avaliações e datas indisponíveis

## Em desenvolvimento

Cadastro e login (T1.0–T3.0), solicitar orçamento (T5.1), painel do cliente (T7.x), checkout (T6.0),
painel do anfitrião (T8.x), mensagens e mapa. As regras desses casos de uso já estão no banco.

## Como rodar no computador

1. `npm install`
2. Copie `.env.example` para `.env.local` e preencha com a URL e a chave **publishable** do Supabase
   (Supabase > Project Settings > API Keys)
3. `npm run dev` e abra http://localhost:3000

## Como criar o banco num projeto Supabase novo

No Supabase, abra **SQL Editor** e rode, nesta ordem, os arquivos de `supabase/migrations/` e depois
`supabase/seed.sql` (dados de demonstração).

Contas de demonstração (senha `BuffetHub@2026`): cliente `ana@buffethub.test`;
buffets `buffet1@buffethub.test` a `buffet7@buffethub.test`.

## Como publicar na Vercel

1. Suba esta pasta para um repositório no GitHub
2. Na Vercel: **Add New > Project**, importe o repositório (framework Next.js é detectado sozinho)
3. Em **Environment Variables**, cadastre `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Clique em **Deploy**
