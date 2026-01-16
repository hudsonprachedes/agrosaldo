# Progresso de Integração Frontend-Backend

## Status: Em Progresso

### Páginas a Integrar

#### Admin Pages
- [ ] AdminDashboard - INICIADO (carregando stats do backend)
- [ ] AdminClientes - INICIADO (carregando tenants do backend)
- [ ] AdminFinanceiro - Pendente
- [ ] AdminRegulamentacoes - Pendente
- [ ] AdminSolicitacoes - Pendente
- [ ] AdminAuditoria - Pendente
- [ ] AdminAnalises - Pendente
- [ ] AdminCadastros - Pendente
- [ ] AdminPlanos - Pendente

#### Main Pages
- [ ] Dashboard - Já integrado com API
- [ ] Rebanho - Já integrado com API
- [ ] Extrato - Já integrado com API
- [ ] MinhaFazenda-integrado - Já integrado com API
- [ ] Cadastro-integrado - Já integrado com API

#### Pages a Remover (Mockadas)
- [ ] MinhaFazenda.tsx - Remover
- [ ] Rebanho.tsx - Remover
- [ ] Extrato.tsx - Remover
- [ ] Cadastro.tsx - Remover
- [ ] LaunchForm.tsx - Remover
- [ ] MobileHome.tsx - Remover
- [ ] PropertySelection.tsx - Remover
- [ ] LandingPage.tsx - Remover

### Mocks a Remover
- [ ] src/mocks/mock-auth.ts
- [ ] src/mocks/mock-bovinos.ts
- [ ] src/mocks/mock-analytics.ts
- [ ] src/mocks/mock-admin.ts
- [ ] src/mocks/mock-outras-especies.ts
- [ ] src/mocks/__tests__/

### Endpoints Backend Necessários
✅ POST /auth/login
✅ POST /auth/register
✅ GET /auth/me
✅ GET /propriedades
✅ POST /propriedades
✅ PATCH /propriedades/:id
✅ GET /rebanho
✅ POST /rebanho
✅ GET /lancamentos
✅ POST /lancamentos/nascimento
✅ POST /lancamentos/mortalidade
✅ POST /lancamentos/venda
✅ POST /lancamentos/vacina
✅ GET /admin/dashboard/stats
✅ GET /admin/pendencias
✅ GET /admin/tenants
✅ GET /admin/regulamentacoes
✅ GET /admin/financeiro/pagamentos
✅ GET /admin/auditoria

### Próximos Passos
1. Corrigir AdminClientes (remover referências a Tenant e plans)
2. Integrar AdminFinanceiro com adminService
3. Integrar AdminRegulamentacoes com adminService
4. Remover todas as páginas mockadas
5. Remover diretório src/mocks/
6. Testar integração completa
