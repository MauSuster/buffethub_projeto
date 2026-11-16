# Arquitetura do BuffetHub (MVC com Next.js + Supabase)

## Camadas

| Camada MVC | Onde fica | O que faz |
|---|---|---|
| **Model** | `supabase/migrations/` (tabelas, regras de negócio em funções SQL, segurança RLS) e `src/models/` (consultas em TypeScript) | Guarda os dados e as regras: só aceita proposta pendente, só avalia depois do evento, pagamento reserva a data etc. |
| **Controller** | `src/controllers/` (Server Actions `"use server"`) e `src/app/**/route.ts` | Recebe o formulário da tela, valida, chama o Model e decide para onde a tela vai depois |
| **View** | `src/app/**/page.tsx` (telas) e `src/components/` (pedaços de tela) | Mostra os dados e os formulários; roda no navegador do usuário |

Hospedagem: o Next.js (View + Controller) roda na **Vercel**; o banco, a autenticação, as fotos e o tempo real
ficam no **Supabase**. O pagamento é **simulado** pela função `pagar_contrato` do banco.

## Telas (códigos da documentação)

| Código | Rota | Caso de uso |
|---|---|---|
| T1.0 Cadastro | `/cadastro` | UC01 |
| T2.0 Login | `/login` | UC02 |
| T3.0 Recuperação de senha | `/recuperar-senha` → e-mail → `/redefinir-senha` | UC02 (A1) |
| T4.0 Home / Busca | `/` | UC04, UC05 |
| T4.1 Comparar | `/comparar?ids=a,b,c` | UC06 |
| T5.0 Detalhes do buffet | `/buffet/[id]` | UC07 |
| T5.1 Solicitar orçamento | `/buffet/[id]/orcamento` | UC08 + UC09 |
| T6.0 Checkout / Pagamento | `/pagamento/[contratoId]` | UC14 |
| T7.0 Painel do cliente | `/cliente` | — |
| T7.1 Solicitações e propostas | `/cliente/solicitacoes` | UC10, UC11 |
| T7.2 Meus contratos | `/cliente/contratos` e `/cliente/contratos/[id]` | UC12, UC13 |
| T7.3 Minhas reservas | `/cliente/reservas` | UC15 |
| T7.4 Mensagens | `/cliente/mensagens?com=<id>` | UC03 |
| T7.5 Meu perfil | `/cliente/perfil` | UC16 |
| T8.0 Painel do anfitrião | `/anfitriao` | — |
| T8.1 Dados do buffet | `/anfitriao/dados` | UC17 |
| T8.2 Cardápio e preços | `/anfitriao/cardapio` | UC18 |
| T8.3 Calendário | `/anfitriao/calendario` | UC19 |
| T8.4 Solicitações de orçamento | `/anfitriao/solicitacoes` | UC20 |
| T8.5 Mensagens | `/anfitriao/mensagens?com=<id>` | UC03 |

## Banco (resumo)

Tabelas: `usuario`, `cliente`, `buffet`, `midia_portfolio`, `pacote`, `disponibilidade`, `evento`,
`solicitacao_orcamento`, `proposta`, `contrato`, `pagamento`, `avaliacao`, `mensagem`, `notificacao`.
Views: `vw_buffet_busca` (busca pública), `vw_negociacao` (uma linha por solicitação com evento, proposta,
contrato, pagamento e avaliação — cada usuário só vê as suas).

Funções de regra de negócio (chame com `supabase.rpc("nome", { ...args })`):

| Função | Quem | O que faz |
|---|---|---|
| `cadastrar_evento(p_tipo_evento, p_data, p_local, p_num_convidados, p_servicos_desejados)` | cliente | UC09; devolve o id do evento |
| `solicitar_orcamento(p_buffet_id, p_evento_id, p_pacote_id, p_observacoes)` | cliente | UC08; confere data livre e capacidade |
| `cancelar_solicitacao(p_solicitacao_id)` | cliente | só pendente |
| `responder_solicitacao(p_solicitacao_id, p_valor_total, p_descricao, p_validade)` | buffet | UC20; cria a proposta |
| `aceitar_proposta(p_proposta_id)` / `recusar_proposta(p_proposta_id)` | cliente | UC11; aceitar gera o contrato e devolve o id dele |
| `assinar_contrato(p_contrato_id, p_nome)` | cliente | UC13; nome tem que ser igual ao do cadastro |
| `pagar_contrato(p_contrato_id, p_metodo, p_numero_cartao)` | cliente | UC14 simulado; cartão terminado em 0002 é recusado |
| `avaliar_buffet(p_contrato_id, p_nota, p_comentario)` | cliente | UC15; só contrato Concluído |
| `definir_disponibilidade(p_data, p_status)` | buffet | UC19; Livre ou Bloqueada |
| `marcar_mensagens_lidas(p_outro)` / `minhas_conversas()` | ambos | UC03 |
| `atualizar_status_por_data()` | ambos | vence propostas e conclui contratos cujo evento já passou |

Os erros dessas funções já vêm em português e podem ir direto para a tela.

Status usados: solicitação `Pendente → Respondida | Cancelada`; proposta `Pendente → Aceita | Recusada | Expirada`;
contrato `Aguardando assinatura → Assinado → Pago → Concluído`; pagamento `Aprovado | Recusado`;
data do calendário `Livre | Bloqueada | Reservada`.

## Regras de código

- Next.js 16: `params` e `searchParams` são `Promise` (use `await`); `cookies()` é assíncrono; a renovação de sessão
  está em `src/proxy.ts` (não existe mais `middleware.ts`).
- Supabase: `criarClienteServidor()` (com sessão) e `criarClientePublico()` em `src/lib/supabase/server.ts`;
  `criarClienteNavegador()` em `src/lib/supabase/client.ts` só para tempo real e upload de fotos.
  Nunca use a chave secreta. Não use `select` com relacionamento embutido (`select("*, buffet(*)")`): use as views
  ou consultas separadas.
- Sessão: `obterSessao()`, `exigirCliente()`, `exigirBuffet()` em `src/lib/auth.ts`.
- Formulários: componente `"use client"` com `useActionState(acao, estadoInicial)`; a Server Action devolve
  `EstadoAcao` (`src/lib/acoes.ts`) com `mensagem`, `erros` por campo e `valores`; use `traduzirErro()` e `BotaoEnviar`.
  Depois de gravar, chame `revalidatePath()` das telas afetadas.
- Visual: componentes de `src/components/ui` (`Botao`, `BotaoLink`, `BotaoEnviar`, `Entrada`, `Selecao`, `AreaTexto`,
  `Cartao`, `TituloPagina`, `Selo`, `SeloStatus`, `Alerta`, `MensagemAcao`, `Vazio`, `Estrelas`, `Avatar`, `Foto`),
  cores `brand-*` (azul) e `accent-*` (âmbar), utilitário `card`, cantos `rounded-xl/2xl`, ícones `lucide-react`.
  Telas públicas usam o contêiner `mx-auto max-w-7xl px-4 sm:px-6 py-8`; telas dos painéis já estão dentro do
  `LayoutPainel` e não precisam de contêiner. Tudo em português e responsivo (celular primeiro).
- Datas e valores: `moeda`, `data`, `dataHora`, `hojeISO` etc. em `src/lib/formatos.ts`.
