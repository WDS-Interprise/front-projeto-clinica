# Bulas e CID: guia completo (ClinMax)

Documentação ponta a ponta dos módulos **Bulas** (consulta de medicamentos) e **CID** (CID-10, CID-11 e INSS) no ClinMax: onde aparecem na UI, permissões, APIs, banco de dados, cache e como usar no front e no back.

---

## 1. Visão geral

| Módulo | O que faz | Onde fica na UI |
|--------|-----------|-----------------|
| **Bulas** | Busca medicamentos e exibe bula estruturada (posologia, contraindicações etc.) | `/outros/bulas` |
| **CID-10** | Classificação Internacional de Doenças, 10ª revisão | `/outros/cid-10` |
| **CID-11** | CID da OMS, 11ª revisão | `/outros/cid-11` |
| **INSS** | Metadados previdenciários por código CID | Painel CID-10 (ao selecionar um código) |
| **Busca CID no atendimento** | Autocomplete de diagnóstico no prontuário | `/atendimento/:id` |

**Permissão principal:** `clinical_tools:view`

Alguns endpoints de CID exigem também `records:write` (profissional que registra atendimento).

**Auditoria:** buscas de bulas e CID geram log em `AuditLog` (módulos `Bulas`, `CID10`, `CID11`).

---

## 2. Navegação e rotas (frontend)

Definição do menu: `front-projeto-clinica/src/lib/outros-nav.ts`

| Rota | Página | Descrição |
|------|--------|-----------|
| `/outros/bulas` | `BulasPage.tsx` | Lista e busca de medicamentos |
| `/outros/bulas/:bulaId` | `BulaDetailPage.tsx` | Detalhe da bula |
| `/outros/cid-10` | `Cid10Page.tsx` | Consulta CID-10 + INSS |
| `/outros/cid-11` | `Cid11Page.tsx` | Consulta CID-11 |

O acordeão **Outros** aparece na sidebar de Configurações para quem tem permissão.

**Atendimento:** `CidSearchField.tsx` usa `api.cid10.search` ou `api.cid11.search` (limite 8 resultados) em `AtendimentoPage.tsx`.

---

## 3. Autenticação nas APIs

Todas as rotas abaixo exigem header:

```http
Authorization: Bearer {token_jwt}
```

Base URL local: `http://localhost:3001/api`  
No front (Vite): proxy `/api` ou `VITE_API_BASE`.

---

## 4. Módulo de Bulas

### 4.1. Arquitetura (backend)

```
outros.controller.ts  →  bulas.service.ts  →  fontes externas + cache
                                              ↓
                                         bula-cache.service.ts (Prisma: BulaCache)
                                              ↓
                                         bula-sections.ts (parser de seções)
```

**Arquivos principais**

| Arquivo | Função |
|---------|--------|
| `back-projeto-clinica/src/routes/outros.routes.ts` | Rotas `/api/outros/bulas/*` |
| `back-projeto-clinica/src/services/bulas.service.ts` | Orquestra busca e detalhe |
| `back-projeto-clinica/src/services/bula-cache.service.ts` | Cache SQLite/Postgres |
| `back-projeto-clinica/src/lib/bula-sections.ts` | Quebra texto em seções clínicas |
| `back-projeto-clinica/src/lib/anvisa.client.ts` | Bulário Anvisa |
| `back-projeto-clinica/src/lib/bulapi.client.ts` | Bulapi |
| `back-projeto-clinica/src/lib/consultaremedios.client.ts` | Consulta Remédios |
| `back-projeto-clinica/src/lib/pharmadb.client.ts` | PharmaDB (opcional) |

### 4.2. Fontes e fallback

Ordem aproximada ao buscar **detalhe** da bula:

1. **Cache local** (`BulaCache`) se ainda válido
2. **Anvisa / Bulapi**
3. **Consulta Remédios**
4. **PharmaDB** (se `PHARMADB_API_KEY` configurada)

A **busca paginada** (`search`) usa principalmente Anvisa/Bulapi para listar princípios ativos e produtos.

### 4.3. Seções extraídas da bula

| Chave | Conteúdo |
|-------|----------|
| `indicacao` | Indicações |
| `contraindicacoes` | Contraindicações |
| `posologia` | Como usar (comprimido, gotas, xarope etc.) |
| `efeitos_colaterais` | Reações adversas |
| `advertencias_precaucoes` | Advertências |
| `interacoes_medicamentosas` | Interações |
| `superdosagem` | Superdosagem |
| `armazenamento` | Conservação |
| `informacoes_legais`, `laboratorio`, `registro_ms` | Metadados regulatórios |

### 4.4. Cache

- Tabela Prisma: `BulaCache`
- TTL: `BULA_CACHE_TTL_DAYS` (padrão **7 dias**)
- Chave: `externalId` do medicamento na fonte

### 4.5. APIs de Bulas

#### `GET /api/outros/bulas/search`

**Permissão:** `clinical_tools:view`

| Query | Tipo | Descrição |
|-------|------|-----------|
| `q` | string | Termo (princípio ativo ou nome comercial) |
| `page` | number | Página (padrão 1) |
| `limit` | number | Itens por página (padrão 20) |

**Exemplo**

```http
GET /api/outros/bulas/search?q=dipirona&page=1&limit=20
Authorization: Bearer eyJ...
```

**Resposta (resumo)**

```json
{
  "source": "anvisa",
  "items": [
    {
      "id": "dipirona-sodica-500mg",
      "name": "Dipirona Sódica 500mg",
      "substanceName": "Dipirona Sódica",
      "manufacturerName": "Laboratório X",
      "regulatoryCategory": "Genérico",
      "variantCount": 12
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 45,
  "totalPages": 3
}
```

#### `GET /api/outros/bulas/:id`

**Permissão:** `clinical_tools:view`

Retorna `BulaDetailPayload` com `secoes`, `classes`, `fonte`, `url_pdf`, etc.

**Erros comuns**

| HTTP | Motivo |
|------|--------|
| 404 | Medicamento não encontrado |
| 502 | Fonte externa indisponível (`BulaFetchError`) |

### 4.6. Uso no frontend

Cliente: `front-projeto-clinica/src/services/api.ts`

```typescript
// Buscar
const result = await api.outros.searchBulas({ q: "dipirona", page: 1, limit: 20 })

// Detalhe
const bula = await api.outros.getBulaDetail("dipirona-sodica-500mg")
```

**Importante:** prescrições usam **`api.medicamentos.search`** (`GET /api/medicamentos/search`), não a API de bulas. Bulas são consulta clínica de referência em **Outros**.

---

## 5. Módulo CID-10

### 5.1. Banco de dados

Tabela Prisma: `Cid10`  
Campos principais: `codigo`, `descricao`, `capitulo`, `grupo`, `categoria`, `tipo`, `searchText`.

### 5.2. Importação da base

Script: `back-projeto-clinica/src/scripts/import-cid.ts`

Fontes públicas (cid.api.br):

- `https://cid.api.br/cid10.json`
- `https://cid.api.br/cid11.json`
- `https://cid.api.br/inss.json`

```bash
cd back-projeto-clinica
npx tsx src/scripts/import-cid.ts
```

Também existem seeds auxiliares: `prisma/seed-cid10.ts`, `seed-cid11.ts`, `seed-cid-inss.ts`.

### 5.3. APIs CID-10

Prefixo: **`/api/cid10`**  
**Permissão:** `clinical_tools:view` **ou** `records:write`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/cid10/capitulos` | Lista capítulos |
| GET | `/api/cid10/grupos?capitulo={c}` | Grupos de um capítulo |
| GET | `/api/cid10?search=&capitulo=&grupo=&tipo=&page=&limit=` | Busca paginada |
| GET | `/api/cid10/:codigo` | Detalhe por código (ex.: `J06.9`) |

**Exemplo de busca**

```http
GET /api/cid10?search=gripe&page=1&limit=20
Authorization: Bearer eyJ...
```

**Resposta**

```json
{
  "data": [
    {
      "id": "...",
      "codigo": "J11.1",
      "descricao": "Influenza com outras manifestações respiratórias",
      "capitulo": "X",
      "capituloDesc": "...",
      "grupo": "J09-J18",
      "grupoDesc": "...",
      "categoria": "...",
      "categoriaDesc": "...",
      "tipo": "subcategoria"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### 5.4. Uso no frontend

```typescript
const caps = await api.cid10.capitulos()
const grupos = await api.cid10.grupos("X")
const { data, totalPages } = await api.cid10.search({
  search: "gripe",
  capitulo: "X",
  page: 1,
  limit: 20,
})
const item = await api.cid10.getByCodigo("J11.1")
```

---

## 6. Módulo CID-11

### 6.1. APIs

Prefixo: **`/api/cid11`**  
Mesma regra de permissão do CID-10.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/cid11/capitulos` | Capítulos |
| GET | `/api/cid11/blocos?capitulo={c}` | Blocos do capítulo |
| GET | `/api/cid11?search=&capitulo=&bloco=&tipo=&page=&limit=` | Busca paginada |
| GET | `/api/cid11/:codigo` | Detalhe (inclui `cid10Equivalente` quando houver) |

### 6.2. Uso no frontend

```typescript
const { data } = await api.cid11.search({ search: "diabetes", limit: 8 })
```

---

## 7. INSS por código CID

### 7.1. Banco

Tabela: `CidInss`  
Campos: `temCarencia`, `temIrpf`, `temNtep`, `cnaesJson`, fontes, `versao`.

### 7.2. API

```http
GET /api/cid/inss/J06.9
Authorization: Bearer eyJ...
```

**Permissão:** `clinical_tools:view` ou `records:write`

**Resposta**

```json
{
  "codigo": "J06.9",
  "temCarencia": true,
  "fonteCarencia": "...",
  "temIrpf": false,
  "fonteIrpf": null,
  "temNtep": false,
  "fonteNtep": null,
  "cnaes": [],
  "versao": "2024"
}
```

### 7.3. Uso no frontend

Na `Cid10Page`, ao selecionar um código:

```typescript
const inss = await api.cid.inss(selected.codigo)
// Passado para <CidDetailCard inss={inss} />
```

---

## 8. Busca CID no atendimento

Componente: `src/components/cid/CidSearchField.tsx`

```typescript
<CidSearchField
  version="CID-10"   // ou "CID-11"
  value={cidCode}
  onChange={(code, label) => { ... }}
/>
```

Internamente chama `api.cid10.search({ search: query, limit: 8 })` ou equivalente CID-11.

---

## 9. Rotas legadas em `/api/outros` (CID)

Ainda existem endpoints antigos de CID em `outros.routes.ts`:

| Rota | Status |
|------|--------|
| `GET /api/outros/cid10/chapters` | Legado |
| `GET /api/outros/cid10/search?q=` | Legado |
| `GET /api/outros/cid10/code/:code` | Legado |

O frontend **ativo** usa **`/api/cid10`** e **`/api/cid11`**. Os métodos `api.outros.searchCid10`, `getCid10`, `cid10Chapters` em `api.ts` estão deprecated e sem consumidores.

---

## 10. Relatório de CID (gestão)

Não confundir com consulta CID clínica.

```http
GET /api/reports/cid?dateFrom=2026-01-01&dateTo=2026-12-31
```

Agrega atendimentos/prontuários por código CID registrado.  
UI: `RelatoriosPage.tsx`, aba pacientes por CID.

---

## 11. Variáveis de ambiente (bulas)

| Variável | Descrição |
|----------|-----------|
| `BULA_CACHE_TTL_DAYS` | Dias de validade do cache (padrão 7) |
| `PHARMADB_API_KEY` | Chave opcional PharmaDB |

Demais integrações Anvisa/Bulapi usam endpoints públicos configurados nos clients em `src/lib/`.

---

## 12. Fluxo resumido

```
UI (BulasPage)     → api.outros.searchBulas / getBulaDetail
                   → GET /api/outros/bulas/*
                   → bulas.service → cache + Anvisa/Bulapi/CR/PharmaDB

UI (Cid10Page)     → api.cid10.*
                   → GET /api/cid10/*
                   → cid10.service → tabela Cid10 (SQLite/Postgres)

UI (Cid11Page)     → api.cid11.*
                   → GET /api/cid11/*
                   → cid11.service → tabela Cid11

UI (Atendimento)   → CidSearchField → api.cid10.search (limit 8)

Cid10 + INSS       → api.cid.inss → GET /api/cid/inss/:codigo → CidInss
```

---

## 13. Checklist para ambiente novo

1. Subir backend com Prisma migrado (`npm run db:push` ou migrate)
2. Importar bases CID: `npx tsx src/scripts/import-cid.ts`
3. Garantir usuário com `clinical_tools:view` (médico/admin clínico)
4. Testar:
   - `/outros/bulas?q=paracetamol`
   - `/outros/cid-10` com busca
   - Atendimento com campo CID
5. (Opcional) Configurar `PHARMADB_API_KEY` se Anvisa bloquear rede

---

## 14. Tabela rápida de APIs

| Recurso | Método | Rota | Permissão |
|---------|--------|------|-----------|
| Buscar bulas | GET | `/api/outros/bulas/search` | `clinical_tools:view` |
| Detalhe bula | GET | `/api/outros/bulas/:id` | `clinical_tools:view` |
| Capítulos CID-10 | GET | `/api/cid10/capitulos` | `clinical_tools:view` ou `records:write` |
| Grupos CID-10 | GET | `/api/cid10/grupos` | idem |
| Busca CID-10 | GET | `/api/cid10` | idem |
| Código CID-10 | GET | `/api/cid10/:codigo` | idem |
| Capítulos CID-11 | GET | `/api/cid11/capitulos` | idem |
| Blocos CID-11 | GET | `/api/cid11/blocos` | idem |
| Busca CID-11 | GET | `/api/cid11` | idem |
| Código CID-11 | GET | `/api/cid11/:codigo` | idem |
| INSS | GET | `/api/cid/inss/:codigo` | idem |
| Relatório CID | GET | `/api/reports/cid` | permissões de relatório |

---

## 15. Arquivos de referência

**Backend**

- `src/routes/outros.routes.ts`
- `src/routes/cid10.routes.ts`
- `src/routes/cid11.routes.ts`
- `src/routes/cid.routes.ts`
- `src/controllers/outros.controller.ts`
- `src/controllers/cid.controller.ts`
- `src/services/bulas.service.ts`
- `src/services/cid10.service.ts`
- `src/services/cid11.service.ts`
- `src/services/cid-inss.service.ts`

**Frontend**

- `src/services/api.ts` (`outros`, `cid10`, `cid11`, `cid`)
- `src/pages/outros/BulasPage.tsx`
- `src/pages/outros/BulaDetailPage.tsx`
- `src/pages/outros/Cid10Page.tsx`
- `src/pages/outros/Cid11Page.tsx`
- `src/components/cid/CidSearchField.tsx`
- `src/components/cid/CidDetailCard.tsx`
- `src/lib/outros-nav.ts`
