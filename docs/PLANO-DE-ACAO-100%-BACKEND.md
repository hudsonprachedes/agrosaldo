# AgroSaldo — Plano de Ação (Checklist) para 100% Backend

> Objetivo: remover *qualquer* dado hardcoded/mockado do frontend e garantir que **web**, **mobile** e **/admin** renderizem **somente dados reais** vindos do backend.

---

## Critério de “100%” (aceite)

- [ ] **Nenhuma tela** usa números fixos para KPI/series/gráficos (ex.: `data: [..]`, `series = [...]`, `overallCompliance = 100`, etc.).
- [ ] **Nenhuma ação** altera estado local “fingindo” persistência (ex.: bloquear, alterar plano, reset senha, aprovar/rejeitar) sem chamar backend.
- [ ] **Todos os gráficos ApexCharts** usam dados do backend (ou endpoints agregados dedicados).
- [ ] **Zero mocks** em runtime (somente fixtures nos testes, se necessário).
- [ ] **Multi-tenant/property isolation**: todas as rotas que dependem de propriedade usam `X-Property-ID` e/ou `:propertyId` conforme contrato.
- [ ] `npm run lint` e `npm run build` passam.

---

## A) Produtor/Gestor — Web + Mobile

### A1) Dashboard (`/dashboard`)
- [ ] Trocar `GET /rebanho` (inconsistente) por **backend correto**: `GET /rebanho/:propertyId`.
- [ ] Série "Evolução do rebanho" usa **`GET /rebanho/:propertyId/historico`**.
- [ ] Série "Nascimentos vs Mortes" usa **`GET /lancamentos/historico`** (filtrado por `type` e agrupado por mês).
- [ ] Distribuição por faixa etária usa **`GET /rebanho/:propertyId`** (`livestock` agrupado por faixa).
- [ ] Remover compliance hardcoded:
  - [ ] Backend: criar módulo/entidades/endpoints de sanidade (vacinas/exames) **ou** remover card/gráfico até existir dado real.

### A2) Rebanho (`/rebanho`)
- [x] `GET /rebanho/:propertyId` (já integrado)
- [ ] Histórico real no gráfico/tabela (se existir na UI): `GET /rebanho/:propertyId/historico`

### A3) Lançamentos (`/lancamentos` + formulários)
- [ ] Remover estatísticas hardcoded (Hoje/Semana/Mês) e substituir por agregação de `GET /lancamentos/historico`.
- [ ] Substituir placeholders de formulários por formulários reais integrados:
  - [ ] Nascimento: `POST /lancamentos/nascimento`
  - [ ] Mortalidade: `POST /lancamentos/mortalidade`
  - [ ] Venda: `POST /lancamentos/venda`
  - [ ] Vacina: `POST /lancamentos/vacina`
  - [ ] Outras: endpoint definido (confirmar tipo/rota)

### A4) Financeiro Produtor (`/financeiro`)
- [ ] Remover `financialData` hardcoded.
- [ ] Backend: implementar endpoints agregados (ou derivar de movimentos):
  - [ ] Receita por período
  - [ ] Quantidade vendida por período
  - [ ] Preço médio por cabeça
- [ ] UI: gráficos ApexCharts consumindo dados reais.

### A5) Analytics Produtor (`/analises`)
- [ ] Remover séries hardcoded.
- [ ] Backend: implementar endpoints agregados (conforme `API_ROUTES.ANALYTICS.*`):
  - [ ] `GET /analytics/dashboard/:propertyId`
  - [ ] `GET /analytics/periodo/:propertyId`
  - [ ] `GET /analytics/mortalidade/:propertyId`
  - [ ] `GET /analytics/receita/:propertyId`
- [ ] UI: ApexCharts consumindo esses endpoints.

### A6) Minha Fazenda (`/minha-fazenda`)
- [ ] Atualizar produtor (user): criar/usar `PATCH /usuarios/:id`.
- [ ] Trocar senha: usar `POST /auth/change-password`.
- [x] Atualizar propriedade: `PATCH /propriedades/:id` (já integrado).

---

## B) Admin (`/admin`)

### B1) AdminDashboard
- [x] KPIs: `GET /admin/dashboard/stats`.
- [ ] Gráfico MRR (últimos 12 meses): backend endpoint agregado.
- [ ] Atividade recente: usar `GET /admin/auditoria` (últimos N) ou endpoint dedicado.

### B2) AdminAnalises
- [ ] Remover séries hardcoded e consumir backend.
- [ ] Backend: endpoints agregados para:
  - [ ] crescimento de clientes
  - [ ] distribuição por plano
  - [ ] evolução MRR
  - [ ] conversão (pendente/aprovado/rejeitado)

### B3) AdminCadastros
- [x] Carregar pendências: `GET /admin/pendencias`.
- [x] Aprovar: `PATCH /admin/usuarios/:id/aprovar`.
- [ ] Rejeitar: criar endpoint backend (ex.: `PATCH /admin/usuarios/:id/rejeitar`) e integrar.
- [ ] Ajustar DTOs para a UI não precisar de casts (`as unknown as`).

### B4) AdminClientes
- [x] Listar tenants: `GET /admin/tenants`.
- [ ] Reset senha: backend `POST /usuarios/:id/reset-password`.
- [ ] Bloquear/desbloquear: backend `PATCH /usuarios/:id` (status) ou endpoint dedicado.
- [ ] Alterar plano: backend `PATCH /propriedades/:id` ou endpoint de assinatura/tenant.
- [ ] Editar dados: backend `PATCH /usuarios/:id`.
- [ ] Impersonate: backend `POST /usuarios/:id/impersonate`.
- [ ] Histórico por tenant: backend via auditoria filtrada.

### B5) AdminFinanceiro
- [x] Pagamentos: `GET /admin/financeiro/pagamentos`.
- [x] Pix config: `GET/POST /admin/financeiro/pix-config`.
- [ ] Confirmar/reverter pagamento: backend `PATCH /admin/financeiro/pagamentos/:id` (criar) e integrar.
- [ ] Upload QR: endpoint de upload (ou armazenamento/URL).

### B6) AdminRegulamentacoes
- [x] Listar: `GET /admin/regulamentacoes`.
- [x] Criar/Atualizar/Deletar: `POST/PATCH/DELETE /admin/regulamentacoes`.
- [ ] Alinhar DTOs (frontend não deve enviar `id/updatedAt/updatedBy` se o backend calcula).

### B7) AdminAuditoria
- [x] `GET /admin/auditoria`.
- [ ] Exportar: endpoint backend (csv/xlsx) ou geração client-side com dados reais.

### B8) AdminSolicitacoes
- [ ] Definir fonte real:
  - [ ] usar `GET /admin/solicitacoes` (backend) e integrar
  - [ ] aprovar/rejeitar via `PATCH /admin/solicitacoes/:id/aprovar|rejeitar`

### B9) AdminPlanos / AdminComunicacao / AdminIndicacao
- [ ] Mapear endpoints reais e integrar (evitar dados estáticos).

---

## C) Infra/Qualidade
- [ ] Remover arquivos não usados em `src/mocks/` (manual `git rm`) após confirmar zero imports.
- [ ] Contratos: adicionar validação (Zod) para respostas críticas.
- [ ] Testes E2E: garantir rotas críticas cobertas.
- [ ] `npm run lint` / `npm run build` / `npm run test`.

---

## Status do documento
- Data: 2026-01-16
- Responsável: execução guiada por checklist até 100%
