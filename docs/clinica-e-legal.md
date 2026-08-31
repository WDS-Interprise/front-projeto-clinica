# ClinMax no site: o que é a clínica e a parte legal hoje

**Última revisão:** 31/08/2026

Este texto descreve o que o **site público** (landing) e as telas web ligadas a ele dizem hoje sobre a clínica e sobre a área jurídica. Não inventa páginas, contrato nem política que ainda não existem no código. CNPJ e endereço da plataforma vêm de `src/lib/company-legal.ts`.

Fontes no front: `src/pages/LandingPage.tsx`, `src/lib/landing-content.ts`, `src/lib/brand.ts`, `src/lib/company-legal.ts`, `src/pages/checkout/CheckoutPage.tsx`. Rascunho das políticas: `docs/politicas.md`.

---

## 1. O que é a clínica no site

A **clínica** no ClinMax é o cliente do software: um consultório ou equipe de saúde que cria conta, configura agenda e usa o sistema para atender pacientes.

O ClinMax **não é** uma clínica física. É a plataforma SaaS (software na nuvem) que a clínica assina.

| Nome | Onde aparece | Significado |
|------|--------------|-------------|
| ClinMax | Logo, rodapé, copyright | Marca do produto |
| Gestão clínica | Tagline | Categoria do software |
| Gestão Clínica e Prontuário Eletrônico | Alt do logo | Frase de posicionamento |
| 50.763.678/0001-02 | Rodapé, checkout | CNPJ da plataforma (não da clínica cliente) |
| Rua 72, nº 223, Jardim Goiás, Goiânia - GO, CEP 74805-480 | Rodapé da landing | Endereço cadastral da plataforma |
| clinmax.com.br | Marca / e-mail | Domínio da marca |
| contato@clinmax.com.br | Botão "Falar com especialista" | Contato público no site |

### 1.1 Frase principal (hero)

Título: **Gestão clínica completa, do agendamento ao prontuário.**

Subtítulo:

> Agenda, prontuário eletrônico, prescrições, WhatsApp e finanças em um só lugar, para clínicas, consultórios e equipes que querem mais tempo para o que importa: cuidar de pessoas.

### 1.2 O que o site promete à clínica

Na seção **Recursos** ("Tudo o que sua clínica precisa, em um só lugar"):

| Recurso | Texto no site hoje |
|---------|---------------------|
| Agendamento online | Pacientes agendam 24h por dia e você reduz faltas com lembretes automáticos. |
| Prontuário eletrônico | Histórico clínico completo, acessível de qualquer lugar com segurança. |
| Receitas e exames | Emita receitas, solicitação de exames e atestados de forma rápida e digital. |
| Financeiro integrado | Controle de recebimentos, despesas e relatórios financeiros em tempo real. |
| WhatsApp integrado | Comunique-se com seus pacientes de forma prática e segura. |
| Relatórios e indicadores | Acompanhe o desempenho da sua clínica com dashboards intuitivos. |

Na seção **Como funciona**:

1. Cadastre sua clínica
2. Configure sua agenda
3. Atenda e registre
4. Acompanhe e cresça

Confiança no hero: "Sem cartão para testar", "Multi-usuários", "WhatsApp integrado".

Prova social no carrossel (ilustrativa, não são parceiros reais no código): Clínica Vitalis, Instituto Bem Estar, Clínica Harmonia, Clínica Pró-Saúde, Saúde & Cuidado, Clínica Vida.

Rodapé da marca:

> Gestão clínica e prontuário eletrônico para consultórios e equipes que querem mais tempo para cuidar de pessoas.

### 1.3 Planos que a clínica assina (texto comercial da landing)

O cadastro novo começa no **Essencial**. Profissional e Premium só entram depois do pagamento, um degrau por vez.

| Plano | Preço mensal (fallback da landing) | Preço anual | Papel no site |
|-------|-------------------------------------|-------------|---------------|
| Essencial | R$ 99/mês | R$ 990/ano | Plano inicial. Agenda, prontuário, pacientes, prescrições, bulas e CID, 1 profissional. |
| Profissional | R$ 199/mês | R$ 1.990/ano | Primeiro upgrade pago. Financeiro, WhatsApp, relatórios, pesquisa de satisfação, até 3 profissionais, assistente com IA. |
| Premium | R$ 349/mês | R$ 3.490/ano | Segundo upgrade. WhatsApp com IA, automações, indicadores avançados, até 3 WhatsApps, maior capacidade de IA. |

Textos de confiança junto aos planos:

- Sem fidelidade. Cancele quando quiser.
- Ambiente seguro e 100% em nuvem.

CTA: "Criar conta da clínica", "Começar grátis", "Assinar [plano]", "Falar com especialista".

O catálogo vivo vem de `GET /api/public/plans`. Se a API falhar, a landing usa o fallback acima.

Detalhe dos limites reais (não só o marketing da landing): `docs/planos.md`.

---

## 2. Parte legal no site hoje

Resumo: **existem rótulos jurídicos no rodapé, CNPJ e endereço da plataforma, e um checkbox no checkout. Não existem páginas de Termos, Privacidade, LGPD ou Segurança. Razão social e Encarregado continuam pendentes.**

### 2.1 Coluna Legal do rodapé (landing)

Definida em `LANDING_FOOTER_COLUMNS`, título **Legal**:

| Link no site | Destino real hoje |
|--------------|-------------------|
| Política de privacidade | `#contato` (mesmo rodapé, sem página) |
| Termos de uso | `#contato` |
| LGPD | `#contato` |
| Segurança | `#contato` |

Os quatro itens levam à âncora do rodapé (`id="contato"`). Não há rota `/privacidade`, `/termos`, `/lgpd` nem `/seguranca`. Não há documento HTML/MD dessas políticas no app.

Outras colunas do rodapé também apontam em grande parte para âncoras, não para páginas reais:

| Coluna | Itens | Destino típico |
|--------|-------|----------------|
| Produto | Funcionalidades, Como funciona, Planos, Integrações | âncoras da landing |
| Empresa | Sobre nós, Blog, Carreiras, Contato | `#funcionalidades` ou `#contato` |
| Suporte | Central de ajuda, Tutoriais, Status do sistema, Suporte | `#contato` ou `#como-funciona` |

Não há página "Sobre nós", blog, carreiras, central de ajuda nem status do sistema.

### 2.2 Copyright e identificação

No rodapé da landing (via `formatCompanyCopyright` e `formatCompanyAddress`):

> © 2026 ClinMax. CNPJ 50.763.678/0001-02. Todos os direitos reservados.
> Rua 72, nº 223, Jardim Goiás, Goiânia - GO, CEP 74805-480

Não há razão social, inscrição estadual nem dados de Encarregado (DPO) na tela. O placeholder `[RAZAO_SOCIAL]` **não** é exibido ao usuário.

### 2.3 Checkout: aceite de termos

Em `/checkout` o usuário precisa marcar:

> Li e concordo com os Termos de Uso e a Política de Privacidade.

Se não marcar, o toast é: "Aceite os termos para continuar".

O checkbox **não abre** Termos nem Política. Não há link para documento. O aceite é só um boolean local (`terms`) exigido para confirmar a assinatura SaaS. Abaixo do texto há a identificação `ClinMax. CNPJ 50.763.678/0001-02.`

Dados que o checkout pede (relevantes para contrato/cobrança): e-mail, CPF ou CNPJ, telefone, CEP, forma de pagamento (Pix ou cartão). Isso é dado de faturamento, não texto jurídico.

### 2.4 Afirmações de segurança e cancelamento (marketing, não política)

Texto visível na landing, sem detalhe jurídico:

- Prontuário "com segurança"
- WhatsApp "de forma prática e segura"
- "Ambiente seguro e 100% em nuvem"
- "Sem fidelidade. Cancele quando quiser"

Não há descrição de criptografia, retenção de dados, base legal LGPD, cookies, subprocessadores nem procedimento de exclusão.

### 2.5 O que o site **não** tem hoje

- Página de Termos de Uso
- Página de Política de Privacidade
- Página de LGPD (aviso de tratamento, direitos do titular, DPO)
- Página de Segurança
- Contrato de assinatura SaaS em PDF
- Razão social da pessoa jurídica dona do ClinMax
- Nome e e-mail do Encarregado
- Política de cookies / banner
- Texto de consentimento específico para dados de saúde
- Termos no cadastro (`/register`) além do checkout
- Links legais nas telas internas do app (painel, configurações)

---

## 3. Parte jurídica no produto (fora da landing)

Não está no rodapé do site, mas aparece no software e tem efeito legal se alguém usar o documento gerado.

### 3.1 Assinatura digital da receita

A prescrição pode gerar PDF com bloco de assinatura. No estado atual:

- O stub grava simulação (`SIMULATED`), não assinatura ICP-Brasil.
- O PDF de simulação diz: **Sem validade juridica. Nao e assinatura ICP-Brasil**.
- Sem assinatura: **Nao assinada digitalmente**.
- `ICP_PADES` só entra com evidência criptográfica real (ainda não há provedor).

Ou seja: a única frase jurídica explícita no produto é o aviso de que a assinatura demo **não tem validade jurídica**.

### 3.2 Atestados

A landing lista "atestados" em Receitas e exames. No código, emissão de atestado médico como documento próprio **não** está implementada como módulo. Prescrição cobre receita, exame, vacina e texto livre.

### 3.3 CID e dados clínicos

Bulas e CID entram no plano Essencial (ferramenta clínica). Não há módulo de perícia, laudo judicial, INSS ou medicina legal no site.

### 3.4 LGPD no código (não no site)

Há regras de tenant, auditoria e dados de saúde na API (ver `docs/` da raiz do mono-repo: autorização e auditoria). Isso **não** aparece como texto jurídico na landing.

---

## 4. Mapa rápido: o que o visitante vê vs o que existe

```txt
Landing (/)
  Hero, recursos, como funciona, planos, CTA, rodapé
  Coluna Legal: 4 nomes, 0 páginas

Checkout (/checkout)
  Checkbox Termos + Privacidade, sem link para texto
  CNPJ da plataforma visível

Cadastro / login
  Sem termos, sem LGPD

App interno
  Aviso de "sem validade jurídica" no PDF de receita (stub)

Páginas jurídicas reais
  Nenhuma (rascunho em docs/politicas.md)
```

---

## 5. Lacuna para fechar a parte legal

Para a coluna Legal deixar de ser âncora vazia, o produto ainda precisa de:

1. Textos oficiais (Termos de Uso, Política de Privacidade, aviso LGPD, resumo de Segurança).
2. Rotas públicas (ex.: `/termos`, `/privacidade`, `/lgpd`, `/seguranca`).
3. Links reais no rodapé e no checkbox do checkout.
4. Razão social e e-mail do Encarregado quando existirem (CNPJ e endereço já estão no `company-legal`).
5. Revisão jurídica profissional. Os MDs **não** são contrato nem política oficial.

---

*Documento interno do estado atual do site. Se as páginas legais forem publicadas, atualize as seções 2 e 4.*
