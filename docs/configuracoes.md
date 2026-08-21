# Aba Configurações

Layout: sidebar esquerda (`SettingsSidebar`) + conteúdo. Quem não tem a permissão do item **não vê** o link. Abrir a URL na mão redireciona para a home do cargo.

Entrada: ícone de engrenagem na navbar (quem tem `clinics:manage`) ou **Minha conta / Aparência** no menu do usuário (qualquer logado).

`/configuracoes` sozinho redireciona (rota legada). `/settings` manda para Dados da clínica.

---

## Como a sidebar está organizada

Cabeçalho: título Configurações + nome da clínica.

Grupos (só aparecem se houver item visível):

1. Clínica
2. Equipe
3. Integrações
4. Conta e plano
5. Preferências

Abaixo, acordeão **Bulas e CID** (só se o cargo tiver `clinical_tools:view`).

Rodapé:

- Aviso de plataforma: o admin da clínica gerencia o plano em **Plano e assinatura**. O dono da plataforma opera faturas no **backoffice**.
- Menu do usuário: Minha conta, Aparência, Sair da conta.

---

## Quem vê o quê

| Item | Rota | Permissão | Quem vê |
|---|---|---|---|
| Dados da clínica | `/configuracoes/clinicas` | `clinics:manage` | Admin, Consultor |
| Horários da agenda | `/configuracoes/agenda` | `clinics:manage` | Admin, Consultor |
| Financeiro (cadastros) | `/configuracoes/financeiro` | `clinics:manage` | Admin, Consultor |
| Convites | `/configuracoes/convites` | `invites:manage` | Só Admin |
| Usuários da clínica | `/configuracoes/usuarios` | `users:manage` | Só Admin |
| WhatsApp | `/configuracoes/whatsapp` | `clinics:manage` | Admin, Consultor |
| Plano e assinatura | `/configuracoes/plano` | `clinics:manage` | Admin, Consultor |
| Aparência | `/configuracoes/aparencia` | livre | Qualquer logado |
| Minha conta | `/configuracoes/conta` | livre | Qualquer logado (menu do usuário, não é item da lista principal) |
| Bulas / CID-10 / CID-11 | `/outros/...` | `clinical_tools:view` | Profissional; Admin + perfil clínico |

Consultor configura clínica, horários, financeiro da operação e WhatsApp. Não gera convite e não gerencia usuários.

---

## Clínica

### Dados da clínica (`/configuracoes/clinicas`)

Layout em cards, alinhado ao mock de Configurações.

- Título + botão Ver histórico de alterações (ainda sem histórico no backend)
- Informações principais (2 colunas): nome, telefone, e-mail institucional, CNPJ, endereço, cidade/estado, CEP, site
- Logo da clínica (preview, alterar, remover)
- Documento padrão (cabeçalho de receitas e atestados)
- Observações (até 300 caracteres)
- Cancelar e Salvar alterações

Sidebar: Convites fica em Equipe. WhatsApp fica em Integrações. Minha conta e Sair da conta no rodapé.

### Horários da agenda (`/configuracoes/agenda`)

Define o expediente exibido na grade da Agenda.

- Início e fim do expediente
- Início e fim do almoço
- Intervalo entre horários (minutos, 15 a 120, passo 15)
- Salvar alterações

Consultas não entram no almoço. Bloqueios manuais podem cair em qualquer horário.

### Financeiro (`/configuracoes/financeiro`)

Cadastros e padrões usados em Gestão. Não é o extrato nem o fluxo de caixa.

**Padrões**

- Conta padrão
- Centro de custo padrão
- Forma de pagamento padrão
- Checkbox: gerar receita automaticamente ao concluir atendimento
- Salvar padrões

**Listas para criar itens**

- Contas bancárias (nome + adicionar)
- Categorias (nome + tipo Receita ou Despesa + adicionar)
- Centros de custo
- Formas de pagamento

### Convites (`/configuracoes/convites`)

Só Admin.

**Código da clínica**

- Código em destaque
- Copiar código
- Gerar novo código
- Cargo deste código:
  - sem cargo: a pessoa pede acesso e o admin define o papel na aprovação
  - com cargo: o pedido já vem com aquele papel (ainda precisa de aprovação)
- Papéis possíveis no código: Profissional, Recepcionista, Administrador, Financeiro, Consultor

**Convidar por e-mail**

- E-mail do convidado
- Papel
- Enviar convite (entra na hora ao aceitar o link; precisa de SMTP no backend)

**Solicitações de entrada**

Pedidos feitos com o código. Recusar ou Aprovar. Se o código não tinha cargo, o admin escolhe o papel antes de aprovar.

**Convites enviados**

Lista e-mail, papel, status, validade. Convite pendente pode ser cancelado.

---

## Equipe

### Usuários da clínica (`/configuracoes/usuarios`)

Só Admin.

- Bloco **Aguardando aprovação**: pedidos do código, com link para revisar em Convites
- Tabela **Equipe com acesso**: nome, e-mail, cargo, ativo, Desativar/Ativar
- Clique no nome abre a ficha (`/configuracoes/usuarios/:id`)
- Botões:
  - Adicionar profissional → `/configuracoes/usuarios/profissional/novo`
  - Adicionar recepcionista → `/configuracoes/usuarios/novo`

### Novo profissional (`/configuracoes/usuarios/profissional/novo`)

Cria usuário `DOCTOR`.

- Nome, e-mail, telefone, CPF, CRM/registro, especialidade
- Agenda própria (switch)
- Administrador da clínica (switch)
- Senha e confirmar senha

### Recepcionista / editar usuário (`/configuracoes/usuarios/novo` e `/:id`)

Criação é papel Recepcionista. Edição vale para o usuário clicado na lista.

- Tipo (recepcionista, só leitura na criação)
- E-mail, nome, telefone
- Na edição: usuário ativo
- Senha só na criação
- Switch administrador da clínica
- **Profissionais que atende**: liga a recepção a agendas de profissionais (lista com switch)

---

## Integrações

### WhatsApp (`/configuracoes/whatsapp`)

Três abas. Query `?tab=templates` abre Templates.

**Conexões**

- Nova conexão (nome, método QR Code ou código de pareamento)
- Lista de conexões com status (aguardando QR, conectado, desconectado, erro, etc.)
- Modal de QR (WhatsApp → Aparelhos conectados → escanear)
- Modal de pareamento (código no celular)
- Desconectar / remover conexão
- Cada conexão fica vinculada ao usuário que criou

**Templates**

- Novo template: nome, categoria (Manual, Lembrete de consulta, Confirmação), texto com placeholders (`{{nome}}`, `{{data}}`, `{{hora}}`)
- Lista e exclusão

**Lembretes** (e assistente)

- Assistente IA (OpenRouter): habilitar na clínica; responder automaticamente mensagens recebidas. Precisa de `OPENROUTER_API_KEY` no servidor.
- Lembretes automáticos: ligar/desligar
- Conexão padrão (ou primeira conectada)
- Horas antes da consulta (ex.: `24, 2`)
- Usa o template "Lembrete de consulta"

---

## Conta e plano

### Plano e assinatura (`/configuracoes/plano`)

Admin e Consultor (`clinics:manage`). Detalhe completo em `docs/financeiro.md` seção 9.

- Plano atual, trial, preço, ciclo
- Uso vs limites e recursos do plano
- Histórico de cobranças com Copiar Pix
- Troca de plano (não gera fatura sozinha)

---

## Preferências

### Aparência (`/configuracoes/aparencia`)

Qualquer logado.

Hoje só informa que o modo escuro está desativado e a plataforma fica no tema claro. Não há toggle nesta tela.

### Minha conta (`/configuracoes/conta`)

Qualquer logado. Acesso pelo menu do usuário na sidebar (ou no header do app).

- Foto de perfil (upload)
- Nome, e-mail, telefone, gênero
- Perfil no sistema (somente leitura)
- Alterar senha (atual, nova, confirmar; mínimo 8 caracteres com maiúscula, minúscula, número e especial)
- Salvar alterações

---

## Referências clínicas (acordeão na sidebar)

Não são configuração da clínica. Atalho para Outros, só quem tem `clinical_tools:view`:

- Bulas
- CID 10
- CID 11

Contatos e logs de agenda **não** entram neste acordeão (ficam no dropdown Outros da navbar).

---

## O que não está em Configurações

- Finanças do dia a dia (extrato, despesas, fluxo): Gestão
- Gerar fatura da mensalidade ClinMax: backoffice (a clínica só paga o Pix já gerado)
- Tema claro/escuro global: a tela de Aparência não controla mais o toggle (se existir, fica no header)

Arquivos: `src/components/layout/SettingsSidebar.tsx`, `src/pages/configuracoes/*`, rotas em `src/App.tsx`.
