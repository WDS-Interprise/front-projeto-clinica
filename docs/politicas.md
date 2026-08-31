# Politicas ClinMax (rascunho interno)

**Ultima revisao:** 31/08/2026

Textos-base para Termos de Uso, Politica de Privacidade, LGPD, Seguranca e Cookies. Destinam-se a virar paginas publicas (`/termos`, `/privacidade`, `/lgpd`, `/seguranca`) e a ligar o checkbox do checkout.

**Este arquivo nao e contrato oficial.** Nao trata a documentacao como juridicamente aprovada. Falta: (1) razao social e Encarregado, (2) revisao por advogado, (3) rotas e links reais para os textos. CNPJ e endereco ja constam no codigo. Estado do rodape e do checkout: `docs/clinica-e-legal.md`.

Fonte unica no produto: `src/lib/company-legal.ts` (front) e `src/lib/company-legal.ts` (back). Nao copiar CNPJ/endereco soltos em outras telas.

---

## Como usar este documento

| Papel | O que fazer |
|-------|-------------|
| Produto / juridico | Completar pendencias da secao 0 e revisar o restante. Nao tratar como aprovado |
| Front | Copiar os textos para paginas publicas e apontar o rodape e o checkout |
| Operacao | Nao tratar este MD como aceite valido enquanto as paginas nao existirem |

Identificacao da empresa (o que ja pode ir a texto publico vs o que continua pendente):

| Campo | Valor | Status |
|-------|--------|--------|
| Marca / nome fantasia | ClinMax | Confirmado |
| Razao social | `[RAZAO_SOCIAL]` | PENDENTE DE CONFIRMACAO. Nao inferir pelo nome ClinMax |
| CNPJ (exibicao) | 50.763.678/0001-02 | Confirmado |
| CNPJ (normalizado) | 50763678000102 | Confirmado |
| Endereco | Rua 72, nº 223, Jardim Goiás, Goiânia - GO, CEP 74805-480 | Confirmado |
| Site | https://clinmax.com.br | Confirmado |
| Contato geral | contato@clinmax.com.br | Confirmado |
| Encarregado (DPO) | `[ENCARREGADO_NOME]` | PENDENTE DE CONFIRMACAO |
| E-mail do Encarregado | `[ENCARREGADO_EMAIL]` | PENDENTE DE CONFIRMACAO. Ate la, canal geral: contato@clinmax.com.br |
| Foro / comarca | `[COMARCA]` | PENDENTE DE CONFIRMACAO |
| Provedor de nuvem | `[PROVEDOR_CLOUD]` | PENDENTE DE CONFIRMACAO |
| Pais de armazenamento | PENDENTE DE CONFIRMACAO | Nao afirmar |

Dois controladores distintos. Nao misturar.

| Dado | Controlador | Operador |
|------|-------------|----------|
| Conta da clinica, faturamento SaaS, uso do software | ClinMax (CNPJ 50.763.678/0001-02). Razao social: `[RAZAO_SOCIAL]` (pendente) | ClinMax e subprocessadores (ex.: Asaas) |
| Pacientes, prontuario, prescricao, agenda, WhatsApp da clinica | A **clinica cliente** | ClinMax (hospeda e processa sob instrucao da clinica) |

ClinMax **nao e** uma clinica fisica. E software SaaS que a clinica assina.

---

## Indice

0. [Dados da empresa](#0-dados-da-empresa)
1. [Termos de Uso](#1-termos-de-uso)
2. [Politica de Privacidade](#2-politica-de-privacidade)
3. [Aviso LGPD e direitos do titular](#3-aviso-lgpd-e-direitos-do-titular)
4. [Seguranca](#4-seguranca)
5. [Politica de cookies](#5-politica-de-cookies)
6. [Assinatura digital e documentos clinicos](#6-assinatura-digital-e-documentos-clinicos)
7. [Subprocessadores](#7-subprocessadores)
8. [O que o produto ainda nao cumpre neste texto](#8-o-que-o-produto-ainda-nao-cumpre-neste-texto)
9. [Checklist para publicar](#9-checklist-para-publicar)

---

## 0. Dados da empresa

Bloco para alimentar Termos, Privacidade, LGPD, rodape, checkout, faturas e documentos gerados. Implementacao: `COMPANY_LEGAL` em `src/lib/company-legal.ts`.

### 0.1 Identidade (publico)

| Uso | Valor |
|-----|--------|
| Marca / nome fantasia | ClinMax |
| CNPJ (usuario) | 50.763.678/0001-02 |
| CNPJ (banco / API) | 50763678000102 |
| Endereco (usuario) | Rua 72, nº 223, Jardim Goiás, Goiânia - GO, CEP 74805-480 |
| Endereco (partes) | Rua 72; nº 223; sem complemento; Jardim Goiás; Goiânia; Goiás; GO; Brasil; CEP 74805-480 (74805480 no armazenamento) |
| Site | https://clinmax.com.br |
| Contato geral | contato@clinmax.com.br |

Copyright publico **enquanto a razao social nao estiver confirmada** (nao imprimir `[RAZAO_SOCIAL]` na tela):

> © 2026 ClinMax. CNPJ 50.763.678/0001-02. Todos os direitos reservados.

Quando `[RAZAO_SOCIAL]` for preenchido no codigo (`legalName`):

> © 2026 ClinMax. [RAZAO_SOCIAL]. CNPJ 50.763.678/0001-02. Todos os direitos reservados.

### 0.2 Ainda pendente (nao inventar)

| Campo no codigo | Placeholder | Por que falta |
|-----------------|-------------|----------------|
| `legalName` | `[RAZAO_SOCIAL]` | Nao ha razao social confirmada |
| `dpoName` | `[ENCARREGADO_NOME]` | Encarregado nao nomeado |
| `dpoEmail` | `[ENCARREGADO_EMAIL]` | Sem e-mail especifico de LGPD |
| `venue` | `[COMARCA]` | Foro nao definido |
| `cloudProvider` | `[PROVEDOR_CLOUD]` | Contrato de nuvem nao documentado aqui |
| `dataResidencyCountry` | PENDENTE DE CONFIRMACAO | Pais do servidor nao confirmado |

Inscricao estadual, IM e certificacoes (ISO, SOC 2): nao constam. Nao publicar.

### 0.3 Onde o produto consome este bloco

| Superficie | O que usa |
|------------|-----------|
| Landing (rodape) | Copyright + endereco formatados |
| Backoffice (rodape) | Copyright |
| Checkout (aceite) | CNPJ formatado sob os termos |
| E-mails da plataforma | Copyright / CNPJ no rodape |
| Esta docs e `docs/clinica-e-legal.md` | Mesmos valores |

---

## 1. Termos de Uso

### 1.1 Objeto

Estes Termos regulam o uso da plataforma ClinMax: software de gestao clinica na nuvem (agenda, prontuario eletronico, prescricoes, comunicacao, financeiro da operacao e recursos conforme o plano).

Ao criar conta, marcar o aceite no checkout ou usar o sistema, a clinica concorda com estes Termos e com a Politica de Privacidade.

### 1.2 Conta e elegibilidade

- A conta e da **clinica** (consultorio, equipe ou estabelecimento de saude), nao de um paciente como consumidor final do SaaS.
- Quem se cadastra declara ter poderes para vincular a clinica a estes Termos.
- Cada usuario interno (admin, profissional, recepcionista) acessa conforme cargo e permissao definidos pela clinica.
- A clinica e responsavel por senhas, convites, revogacao de acesso e pelo que seus usuarios fizerem no sistema.

### 1.3 Planos, precos e pagamento

O catalogo vivo vem de `GET /api/public/plans`. Valores de marketing da landing (fallback) nao substituem o preco cobrado.

Cadastro novo entra no plano **Essencial**, com fatura da primeira competencia. Planos superiores entram apos pagamento, um degrau por vez (self-serve).

| Tema | Regra do produto hoje |
|------|------------------------|
| Fidelidade | Sem prazo minimo contratual no site. "Cancele quando quiser." |
| Meios | Pix ou cartao no checkout (Asaas) |
| Recorrencia | Nasce no primeiro pagamento confirmado |
| Atraso | Fatura em atraso: `PAST_DUE`, carencia de 3 dias, depois `SUSPENDED` |
| Suspensao | Nucleo clinico permanece acessivel na regra atual de suspensao. Confirmar no juridico se isso e o desejado no contrato |
| Clinicas antigas | Plano interno Legacy (gratis, sem cobranca SaaS), se aplicavel |

A mensalidade do software **nao** mistura com o livro-caixa da clinica (receitas e despesas de atendimento). Detalhe operacional: `docs/financeiro.md`.

Estornos, contestacao de cartao e falha de Pix seguem as regras do meio de pagamento e da instituicao. ClinMax pode reter acesso ou reverter upgrade se o pagamento nao se confirmar.

### 1.4 O que a clinica pode e nao pode

Pode: usar o software para a operacao de saude da propria clinica, dentro do plano e das leis aplicaveis.

Nao pode:

- Revender o acesso, sublicenciar ou explorar o ClinMax como se fosse o dono do software
- Tentar acessar dados de outra clinica (multi-tenant)
- Burlar limites do plano, engenharia reversa com fim ilegal, ou sobrecarregar de proposito a infraestrutura
- Usar o sistema para atividade ilegal, inclusive fraude, spam ou tratamento de dados sem base legal
- Apresentar receita ou PDF de **simulacao** de assinatura como se fosse ICP-Brasil

### 1.5 Responsabilidade clinica (da clinica, nao do ClinMax)

A clinica, os profissionais e o estabelecimento sao os unicos responsaveis por:

- Registro em conselho, CRM/CRO/etc. e etica profissional
- Conteudo do prontuario, CID, prescricao, atestado e conduta clinica
- Consentimento e informacao ao paciente, quando a lei exigir
- Guarda legal do prontuario (incluindo Lei 13.787/2018, guarda minima de 20 anos a partir do ultimo registro, quando aplicavel)
- Relacao com convenios, TISS e faturamento de saude
- Uso do WhatsApp da clinica (numero, mensagens, opt-in)

ClinMax fornece ferramenta. Nao exerce medicina, nao e hospital, nao substitui julgamento clinico e nao e arquivo publico de saude.

### 1.6 Disponibilidade e suporte

O site fala em "ambiente seguro e 100% em nuvem". Nao ha SLA percentual publicado, pagina de status nem central de ajuda real. Ate haver compromisso escrito, a disponibilidade e "melhor esforco".

Manutencao, incidentes e limites de plano podem reduzir funcionalidades. Backup e restore sao expectativa operacional (ver secao 4), nao garantia automatica neste texto.

Contato: `contato@clinmax.com.br`.

### 1.7 Propriedade intelectual

Marca ClinMax, interface, codigo e documentacao do produto pertencem a pessoa juridica titular do CNPJ 50.763.678/0001-02 (razao social `[RAZAO_SOCIAL]`, PENDENTE DE CONFIRMACAO) ou a quem ela licenciar. A clinica permanece dona dos dados que inserir (cadastros, evolucoes, arquivos), no limite da lei e destes Termos.

### 1.8 Encerramento

A clinica pode pedir o cancelamento da assinatura a qualquer momento (promessa atual do site). Efeitos praticos a redigir com o juridico:

- Fim da cobranca recorrente apos o pedido (imediato vs fim do ciclo pago)
- Prazo para exportar dados
- Retencao legal de logs e de prontuario (a clinica pode ter dever de guarda mesmo apos cancelar o SaaS)
- Conta suspensa ou encerrada por inadimplencia, abuso ou ordem legal

### 1.9 Limitacao de responsabilidade (rascunho)

Na medida permitida pela lei brasileira, ClinMax nao responde por dano indireto, lucro cessante, erro clinico, interpretacao de exame, atraso de WhatsApp de terceiro, indisponibilidade do Asaas, ou uso indevido por usuario da clinica.

Cap de indenizacao contratual (sugerido para o advogado definir): o valor pago pela clinica a ClinMax nos 12 meses anteriores ao evento, salvo dolo ou culpa grave.

CDC pode aplicar-se em relacao clinica-consumidor. A relacao ClinMax-clinica e, em regra, B2B (prestacao de software a estabelecimento).

### 1.10 Alteracoes

ClinMax pode atualizar estes Termos. Alteracao relevante deve ser comunicada (e-mail da conta ou aviso no app) com antecedencia razoavel. Uso continuo apos a data de vigencia conta como aceite, salvo direito de cancelar.

### 1.11 Lei e foro

Lei brasileira. Foro: `[COMARCA]` (PENDENTE DE CONFIRMACAO), com ressalva de foros inderrogaveis.

---

## 2. Politica de Privacidade

### 2.1 Quem trata o que

**ClinMax como controlador** (dados da relacao comercial e da conta):

- Nome, e-mail, telefone, CPF ou CNPJ de faturamento, CEP
- Dados da clinica (nome, configuracoes, plano)
- Usuarios da conta (login, cargo, permissoes)
- Pagamentos da assinatura (status, identificadores Asaas, nao o numero completo do cartao no nosso banco, na medida do fluxo atual)
- Logs tecnicos de acesso a API (sem senha, sem corpo de evolucao)

**Clinica como controladora** e **ClinMax como operador** (dados de saude e de pacientes da clinica):

- Cadastro de paciente
- Agenda e status de consulta
- Prontuario, evolucao, CID, prescricoes, anexos clinicos
- Financeiro da operacao (receitas, despesas, Pix de consulta ClinMax Pay)
- Mensagens WhatsApp enviadas pela clinica via o produto
- Trilha de auditoria clinica (eventos, metadados minimizados)

Titular paciente que quiser acessar, corrigir ou excluir dado clinico deve, em primeiro lugar, **pedir a clinica**. ClinMax apoia a clinica-operadora na medida do contrato e da lei, e nao responde consultas de titular pulando o controlador, salvo ordem legal ou falha propria.

### 2.2 Finalidades e bases legais (LGPD)

| Finalidade | Dados (exemplos) | Base legal tipica |
|------------|------------------|-------------------|
| Criar e autenticar a conta | E-mail, senha (hash), sessao | Execucao de contrato (art. 7, V) |
| Cobrar a assinatura | CPF/CNPJ, e-mail, telefone, CEP, fatura | Execucao de contrato; obrigacao legal fiscal |
| Prestar o software a clinica | Dados operacionais da conta | Execucao de contrato |
| Melhorar estabilidade e seguranca | Logs tecnicos, `requestId` | Legitimo interesse (art. 7, IX), com teste de proporcionalidade |
| Marketing do site (se houver no futuro) | E-mail de contato | Consentimento ou legitimo interesse, conforme o caso |
| Prontuario e atendimento | Dados de saude | A clinica define a base (em geral tutela da saude, art. 11, II, f, e/ou consentimento). ClinMax trata como operador |
| Pix de consulta (ClinMax Pay) | Valor, identificadores de cobranca, chave Pix da clinica | Execucao do servico pedido pela clinica; operador de pagamento (Asaas) |
| Auditoria clinica | Eventos, IDs, hash chain | Obrigacao de seguranca e boa-fe; apoio a clinica em rastreabilidade. Sem queixa/diagnostico no metadata |

Dados de saude sao **sensiveis** (LGPD art. 5, II e art. 11). ClinMax nao usa prontuario para anuncio de terceiros.

### 2.3 Compartilhamento

ClinMax compartilha dados somente quando necessario para:

- Processar pagamento (Asaas)
- Infraestrutura de nuvem e banco (provedor de hospedagem, quando contratado)
- Cumprir ordem judicial, ANPD ou autoridade sanitaria
- Prestadores sob contrato de confidencialidade e instrucao (operadores)

Nao vendemos lista de pacientes.

WhatsApp: a clinica conecta o proprio numero. Conteudo da mensagem pode transitar pela infraestrutura do WhatsApp/Meta segundo os termos deles. Isso e canal da clinica, nao um "modulo de sigilo absoluto" so porque o site diz "seguro".

### 2.4 Transferencia internacional

Se servidores, backup ou subprocessador ficarem fora do Brasil, aplicar LGPD arts. 33-36 (clausulas, pais adequado ou outra hipotese). **Preencher** o pais real de hospedagem antes de publicar.

### 2.5 Retencao

| Tipo | Orientacao |
|------|------------|
| Conta e faturamento SaaS | Enquanto a conta existir e pelos prazos fiscais/consumidor (em geral ate 5 anos, a confirmar com contabil) |
| Prontuario eletronico | Guarda minima de **20 anos** a contar do ultimo registro (Lei 13.787/2018), responsabilidade primaria da clinica. O operador deve ter backup alinhado a isso se a clinica usar o ClinMax como arquivo |
| AuditLog | Append-only. Nao ha API de apagar evento. Retencao longa, alinhada a disputa e a saude |
| Logs tecnicos | Prazo curto operacional (definir: ex. 90 dias), sem evolucao clinica |
| Cookies de sessao | Ate logout ou expiracao do token |

Pedido de exclusao de titular **nao apaga** o que a lei manda guardar. A clinica deve recusar exclusao incompatível com prontuario e com obrigacao legal, e documentar o motivo.

### 2.6 Direitos do titular (resumo)

Acesso, correcao, anonimizacao, portabilidade, informacao sobre compartilhamentos, revogacao de consentimento (quando a base for consentimento), oposicao a tratamento em legitimo interesse, peticao a ANPD.

Canal: `[ENCARREGADO_EMAIL]` (PENDENTE DE CONFIRMACAO) ou, ate a nomeacao, `contato@clinmax.com.br`, identificando a clinica e o tipo de dado (conta vs paciente).

### 2.7 Criancas e adolescentes

O SaaS pode cadastrar pacientes menores porque a clinica atende. A clinica observa o Estatuto da Crianca e do Adolescente, consentimento dos responsaveis e regras de prontuario. ClinMax nao dirige o produto a crianca como usuario da conta SaaS.

### 2.8 Alteracoes desta politica

Mesma logica da secao 1.10. Data de vigencia no topo da pagina publicada.

---

## 3. Aviso LGPD e direitos do titular

Texto curto para a pagina `/lgpd` (a coluna Legal do rodape hoje aponta para `#contato` sem pagina).

### 3.1 Papel do ClinMax

Somos operador dos dados de saude que a clinica deposita no sistema, e controlador dos dados da assinatura e da conta. Tratamos no Brasil sob a Lei 13.709/2018 (LGPD) e, no que couber, o Marco Civil da Internet.

### 3.2 Como exercer direitos

1. **Paciente / titular de dado clinico:** solicite a clinica onde foi atendido. Ela e a controladora.
2. **Usuario da conta ClinMax (e-mail de login, faturamento):** escreva para `[ENCARREGADO_EMAIL]` ou, enquanto estiver pendente, `contato@clinmax.com.br`.
3. Resposta em prazo razoavel (meta interna sugerida: 15 dias, alinhada a boa pratica; o advogado confirma o prazo legal aplicavel).
4. ANPD: o titular pode peticionar a autoridade se entender violacao.

### 3.3 Incidentes

Suspeita de vazamento: a clinica e o ClinMax devem avaliar comunicacao a ANPD e aos titulares, conforme art. 48 da LGPD. Procedimento interno ainda precisa ser escrito (playbook). Nao fingir que ja existe CSIRT publicado.

### 3.4 Encarregado

PENDENTE DE CONFIRMACAO:

- Nome: `[ENCARREGADO_NOME]`
- E-mail: `[ENCARREGADO_EMAIL]`

O texto publico **nao** deve inventar DPO. Ate a nomeacao, usar so `contato@clinmax.com.br`. Identificacao da empresa no aviso: ClinMax, CNPJ 50.763.678/0001-02, Rua 72, nº 223, Jardim Goiás, Goiânia - GO, CEP 74805-480.

---

## 4. Seguranca

Texto para `/seguranca`. Distinguir o que o codigo faz hoje do que e meta operacional.

### 4.1 Controles ja descritos no produto (codigo)

| Controle | O que significa |
|----------|-----------------|
| Multi-tenant | Clinica vem da sessao (JWT + vinculo ativo). Recurso de outra clinica: 404 |
| RBAC | Permissao no backend. A UI so esconde botao |
| Medico | So escreve atendimento/receita do proprio profissional |
| Auditoria | `AuditLog` append-only, metadata sem queixa/diagnostico/CPF/evolucao, hash chain HMAC-SHA-256 |
| Prontuario concluido | Encounter `COMPLETED` imutavel; correcao por adendo |
| Assinatura demo | PDF deixa claro: sem validade juridica, nao e ICP-Brasil |
| Saude da API | `/api/health` e `/api/ready` |

Detalhe tecnico: `docs/security/authorization.md`, `docs/security/audit.md`, ADR 002 na raiz do mono-repo.

### 4.2 O que ainda nao e promessa publica

Nao afirmar no site, ate existir:

- Criptografia em repouso com detalhes auditaveis (alem do padrao do provedor)
- MFA obrigatorio
- Certificacao ISO 27001 / SOC 2
- Pentest recente publicado
- SLA de uptime
- Pagina de status
- ICP-Brasil / PAdES em producao

Textos de marketing atuais ("com seguranca", "100% em nuvem") sao genericos. A pagina de Seguranca deve ser mais honesta e curta do que a landing.

### 4.3 Backup e prontuario (operacao)

Expectativa documentada internamente (nao garantida neste rascunho ate o runbook existir):

- RPO alvo: backup diario do PostgreSQL de producao (ate 24h)
- RTO: definir com a operacao (exemplo interno 4-8h)
- Teste de restore periodico
- Retencao alinhada a 20 anos + eventual litigio
- Segredos fora do codigo; logs sem senha, token, PIN ou evolucao completa

### 4.4 Boas praticas da clinica

- Cargos minimos (nao dar `records:write` a quem so agenda)
- Revogar usuario que sair
- Nao compartilhar login
- Conferir o numero de WhatsApp conectado
- Nao tratar PDF de simulacao como receita assinada

---

## 5. Politica de cookies

Hoje **nao ha** banner nem politica de cookies no app.

Rascunho para quando houver:

| Tipo | Exemplo | Base / nota |
|------|---------|-------------|
| Estritamente necessarios | Sessao, CSRF, preferencia de tema (`clinichub_theme` no `localStorage`) | Nao exigem banner na pratica usual, mas devem ser listados |
| Analytics | (se instalar no futuro) | Consentimento, se nao forem anonimos |
| Marketing | (se instalar no futuro) | Consentimento |

O tema claro/escuro no `localStorage` e preferencia de interface, nao perfilamento de saude.

Ate existir ferramenta de terceiros (ex.: pixel, Google Analytics), a pagina pode dizer: usamos armazenamento local para sessao e preferencia de tema. Sem cookies de publicidade.

---

## 6. Assinatura digital e documentos clinicos

Unica frase juridica explicita hoje no produto (PDF de prescricao em modo stub):

- Com simulacao: **Sem validade juridica. Nao e assinatura ICP-Brasil.**
- Sem assinatura: **Nao assinada digitalmente.**

Politica recomendada nos Termos e na pagina de Seguranca:

- Receita, exame, vacina e texto livre saem do modulo de prescricao. Atestado como documento proprio **nao** esta implementado. Nao prometer atestado no juridico se o modulo nao existir.
- Validade de receita segue CFM/CFF e normas de digitalizacao. Sem PAdES ICP-Brasil, o PDF nao deve ser vendido como "receita digital com validade de certificado ICP".
- A clinica nao pode omitir o aviso de simulacao.

Alvo futuro (nao vigente): PAdES ICP-Brasil (DOC-ICP-15.03), validavel no VALIDAR/ITI. Ver `docs/signature/digital-signature.md` na raiz.

---

## 7. Subprocessadores

Lista para anexar a privacidade. Atualizar quando o contrato de nuvem estiver fechado.

| Quem | Papel | Dado tipico |
|------|--------|-------------|
| `[PROVEDOR_CLOUD]` / PostgreSQL | Hospedagem da API e do banco | Base completa do tenant |
| Asaas | Cobranca da assinatura e Pix ClinMax Pay | Dados de pagamento, cobrancas, webhooks |
| Infra WhatsApp (Baileys / servidores proprios) | Sessao do numero da clinica | Mensagens que a clinica mandar pelo produto |
| E-mail transacional `[a definir]` | Fatura, convite, reset de senha | E-mail e nome |

ClinMax Pay: paciente paga consulta via Pix; taxa e repasse seguem a configuracao do produto. Isso e processamento de pagamento a pedido da clinica, nao "venda de dado clinico".

---

## 8. O que o produto ainda nao cumpre neste texto

Este rascunho assume paginas e processos que **ainda nao existem** no codigo. Nao publicar como se ja estivessem no ar.

- Rotas `/termos`, `/privacidade`, `/lgpd`, `/seguranca`
- Links no rodape (hoje vao para `#contato`)
- Checkbox do checkout **com link** para os textos
- Termos no cadastro (`/register`)
- Banner de cookies
- Encarregado e razao social no rodape (CNPJ e endereco ja entram pelo `company-legal`)
- Contrato SaaS em PDF
- Texto de consentimento especifico para dado de saude (se o juridico exigir alem do papel da clinica)
- Playbook de incidente LGPD
- Exportacao self-serve de prontuario para o titular
- Endpoint de exclusao de titular (e conflito com guarda de 20 anos)

Publicar o texto sem esses itens reabre o problema descrito em `docs/clinica-e-legal.md`: aceite vazio.

---

## 9. Checklist para publicar

1. Preencher o que ainda esta pendente na secao 0 (razao social, foro, Encarregado, nuvem). CNPJ e endereco ja estao no codigo.
2. Advogado revisar secoes 1, 2 e 3 (limites de responsabilidade, bases legais, 20 anos, CDC vs B2B).
3. Confirmar pais do servidor e lista da secao 7.
4. Alinhar cancelamento, carencia de 3 dias e suspensao com o que o codigo faz (`docs/financeiro.md`).
5. Criar paginas publicas e trocar o rodape e o checkout.
6. Registrar versao e data no rodape de cada pagina ("Vigente a partir de AAAA-MM-DD").
7. Guardar PDF ou snapshot da versao aceita (prova de o que o usuario viu).
8. Atualizar `docs/clinica-e-legal.md` secoes 2 e 4 quando as rotas existirem.

---

## Apendice A. Texto curto do checkbox (checkout)

Substituir o aceite cego por:

> Li e concordo com os [Termos de Uso](/termos) e a [Politica de Privacidade](/privacidade).

Toast atual se nao marcar: "Aceite os termos para continuar". Pode permanecer.

---

## Apendice B. Mini-versao para o rodape

Coluna **Legal**:

- Termos de uso → `/termos`
- Politica de privacidade → `/privacidade`
- LGPD → `/lgpd`
- Seguranca → `/seguranca`

Copyright atual (razao social pendente, nao exibir o placeholder):

> © 2026 ClinMax. CNPJ 50.763.678/0001-02. Todos os direitos reservados.

Quando `legalName` for preenchido:

> © 2026 ClinMax. [RAZAO_SOCIAL]. CNPJ 50.763.678/0001-02. Todos os direitos reservados.

---

*Rascunho interno. CNPJ e endereco ja podem identificar a empresa no produto. Termos, Privacidade e LGPD continuam sujeitos a revisao por advogado. Nao tratar este MD como politica publicada.*
