# Plan: Implementar 100% do AgroSaldo - Análise + Checklist

**TL;DR:** O sistema está 65% pronto no frontend mas com falhas críticas em regras de negócio (evolução automática de faixas etárias e validação de matrizes não existem). Este plano organiza tudo em 4 fases: (1) Correções críticas, (2) Offline-first, (3) Backend integration, (4) Completar website. Total: 47 tarefas.

---

## **Fase 1: EMERGÊNCIA - Correções Críticas (P0)**
**Prazo: Imediato | Impacto: Bloqueia produção**

### 1. Sincronizar preços de planos entre PRD e mocks
- [ ] PRD: porteira R$ 29.90 → Atualizar mocks de R$ 49.90
- [ ] Atualizar AdminDashboard e AdminFinanceiro com novos preços
- **Arquivos**: `src/mocks/mock-auth.ts` (L73-78), `src/pages/admin/AdminFinanceiro.tsx` (L26-31)

### 2. Implementar evolução automática de faixas etárias (CORE BUSINESS)
- [ ] Adicionar `birthDate: Date` em `src/mocks/mock-bovinos.ts` modelo `Movement`
- [ ] Criar função `calculateAgeGroup(birthDate: Date): string` em `src/lib/utils.ts`
- [ ] Criar job automático que recalcula faixa etária diariamente
- [ ] Movimentar animais automaticamente entre categorias ao atingir marcos (0-4m → 5-12m → 13-24m → 25-36m → 36m+)
- [ ] Testar transições de faixa com dados históricos
- **Regra PRD**: Animal nascido em 01/01 deve estar em 0-4m até 01/05, depois 5-12m, etc
- **Impacto**: Relatórios e dados ficarão incorretos sem isso

### 3. Implementar validação de nascimentos ≤ matrizes (CORE BUSINESS)
- [ ] Adicionar validação em `src/pages/LaunchForm.tsx` no `handleSubmit()`
- [ ] If (nascimentos > totalFêmeasAdultas) → bloquear com mensagem clara
- [ ] Exibir badge com "Matrizes: X disponíveis" no formulário
- [ ] Testar com casos extremos (0 matrizes, múltiplos nascimentos)
- **Mensagem recomendada**: "Quantidade de nascimentos maior que o número de matrizes disponíveis. Verifique o saldo antes de continuar."
- **Impacto**: Permite dados fraudulentos ou errados sem isso

### 4. Integrar câmera para captura de fotos (morte natural)
- [ ] Adicionar expo-camera ou react-camera no `package.json`
- [ ] Criar componente `CameraCapture.tsx` em `src/components/`
- [ ] Integrar em `src/pages/LaunchForm.tsx` tipo='mortalidade'
- [ ] Salvar foto em estado local antes de persistir
- [ ] Validar: foto obrigatória para morte, opcional para consumo interno
- **Impacto**: Sem câmera, usuário fica bloqueado ao registrar morte natural

---

## **Fase 2: OFFLINE-FIRST - Banco Local + Sincronização (P1)**
**Prazo: Semana 1 | Impacto: Operação em campo sem internet**

### 5. Configurar IndexedDB para banco de dados local
- [ ] Criar `src/lib/db.ts` com schema IndexedDB
- [ ] Definir stores: users, properties, movements, photos, sync_queue
- [ ] Implementar CRUD helpers (create, read, update, delete, query)
- [ ] Testar com dados reais do mock
- **Schema exemplo**:
  ```typescript
  {
    stores: {
      movements: '++id, propertyId, type, date',
      photos: '++id, movementId',
      sync_queue: '++id, propertyId, status, createdAt',
      users: '++id, email',
      properties: '++id, userId'
    }
  }
  ```

### 6. Implementar Service Worker para sincronização automática
- [ ] Criar `public/service-worker.ts`
- [ ] Registrar em `src/main.tsx`
- [ ] Implementar sync quando internet retorna
- [ ] Queue de requisições offline com retry exponencial
- [ ] Detectar mudança de conexão com `navigator.onLine` + `online`/`offline` events

### 7. Adicionar barra de status de sincronização
- [ ] Criar hook `useSyncStatus()` em `src/hooks/useSyncStatus.ts`
- [ ] Integrar em `src/components/layout/AppLayout.tsx` header
- [ ] Estados: Verde (sincronizado), Amarelo (sincronizando), Vermelho (erro)
- [ ] Botão de sincronização manual
- **Visual**: Badge com ícone + tooltip explicativo

### 8. Armazenar fotos localmente com compressão
- [ ] Adicionar biblioteca de compressão (sharp, pica ou canvas)
- [ ] Criar função `compressImage(file: File): Promise<Blob>`
- [ ] Salvar em IndexedDB como Blob
- [ ] Enviar para backend após sincronizar
- [ ] Validar tamanho antes/depois (ex: de 5MB para 500KB)
- **Compressão**: Reduzir para máx 1MB antes de enviar

### 9. Persistir lançamentos localmente antes de enviar
- [ ] Modificar `src/pages/LaunchForm.tsx` `handleSubmit()` para salvar em IndexedDB
- [ ] Marcar como "pendente_sync" até enviar para servidor
- [ ] Exibir "⏳ Pendente sincronização" no Extrato
- [ ] Implementar validações offline (ex: matrizes) com dados locais
- [ ] Strategy: Tenta enviar ao servidor, se falhar salva localmente para sync depois

---

## **Fase 3: INTEGRAÇÕES CRÍTICAS (P1-P2)**
**Prazo: Semana 2 | Impacto: Funcionalidades essenciais**

### 10. Implementar relatórios em PDF
- [ ] Adicionar pdfkit ou html2pdf no `package.json`
- [ ] Criar componente `PDFReport.tsx` em `src/components/`
- [ ] Implementar em `src/pages/Dashboard.tsx` e `src/pages/Analytics.tsx`
- [ ] Gerar "Espelho Oficial do Rebanho" conforme PRD
- [ ] Testar com múltiplos planos (500 a ilimitado cabeças)
- **Conteúdo PDF**: Número de cabeças por faixa etária, data de geração, empresa

### 11. Integrar compartilhamento WhatsApp
- [ ] Criar função `shareViaWhatsApp(data: ReportData): string` 
- [ ] Formatter de texto com números formatados
- [ ] Adicionar botão em `src/pages/Dashboard.tsx` "Compartilhar"
- [ ] Validar encode de caracteres especiais
- **Formato WhatsApp**: 
  ```
  🐄 *Espelho do Rebanho*
  Data: DD/MM/YYYY
  
  Bezerros: 150 cabeças
  ...
  
  Total: 1000 cabeças
  ```

### 12. Implementar filtros avançados em Extrato
- [ ] Adicionar DatePicker para período em `src/pages/Extrato.tsx`
- [ ] Filtro por tipo de lançamento (nascimento, mortalidade, venda, vacina)
- [ ] Filtro por faixa etária afetada
- [ ] Paginação para tabelas > 50 linhas
- **UI**: Filters na top, com botão "Limpar filtros"

### 13. Exibir GTA em relatórios
- [ ] Mostrar coluna "GTA" em `src/pages/Extrato.tsx` quando presente
- [ ] Validar GTA conforme regras por estado em `src/pages/admin/AdminRegras.tsx`
- [ ] Marcar como "GTA obrigatório não preenchido" se necessário
- **Impacto**: Compliance para vendas oficiais

---

## **Fase 4: PERSISTÊNCIA + ADMIN (P2)**
**Prazo: Semana 3 | Impacto: Admin consegue gerenciar planos e clientes**

### 14. Persistência real em AdminPlanos
- [ ] Implementar CRUD em `src/pages/admin/AdminPlanos.tsx`
- [ ] Salvar em IndexedDB ou preparar endpoint POST /api/planos
- [ ] Validar: nome, preço, limite de cabeças
- [ ] Feedback: toast de sucesso/erro real, não simulado
- [ ] Endpoints esperados: POST /api/planos, PUT /api/planos/:id, DELETE /api/planos/:id

### 15. Persistência real em AdminClientes
- [ ] Implementar edição de status em `src/pages/admin/AdminClientes.tsx`
- [ ] Salvar mudanças de bloqueio/ativação
- [ ] Resetar senha (guardar temporária, requer email backend)
- [ ] Impersonate: logar como cliente em contexto separado
- [ ] Endpoints esperados: PATCH /api/usuarios/:id, POST /api/usuarios/:id/reset-password

### 16. Persistência em AdminSolicitacoes
- [ ] Aprovação/rejeição atualizar status real
- [ ] Salvar motivo de rejeição
- [ ] Enviar email ao cliente (mock por enquanto)
- [ ] Remover solicitação da lista após processar
- [ ] Endpoints esperados: PATCH /api/solicitacoes/:id/aprovar, PATCH /api/solicitacoes/:id/rejeitar

### 17. Persistência em AdminRegras
- [ ] Editar configurações por estado (INDEA, IAGRO, ADAPAR)
- [ ] Salvar obrigatoriedade de GTA, relatórios, documentos
- [ ] Validar em lançamentos conforme estado da propriedade
- [ ] Estados: MS, MT, GO, SP, MG, RS, etc
- [ ] Endpoints esperados: PUT /api/regras/:estado

---

## **Fase 5: SITE INSTITUCIONAL (P3)**
**Prazo: Semana 4 | Impacto: Lead generation**

### 18. Completar LandingPage com seções do PRD
- [ ] Adicionar seção "Sobre Nós" (empresa, missão, visão, 200 palavras)
- [ ] Adicionar seção "Como Funciona" com fluxo visual (5 passos)
- [ ] Adicionar FAQ expansível com 8-10 perguntas comuns
- [ ] Adicionar links de social media (LinkedIn, Instagram, WhatsApp)
- **Conteúdo**: Missão: "Simplificar gestão pecuária", Visão: "SaaS referência em agropecuária"

### 19. Implementar Blog (estrutura)
- [ ] Criar página `/blog` que lista posts
- [ ] Criar `src/pages/Blog.tsx` e `src/pages/BlogPost.tsx`
- [ ] Adicionar mock data: 3-5 posts de exemplo
- [ ] Links em LandingPage para artigos
- **Posts exemplo**: "Como registrar nascimentos offline", "Compliance sanitária para pecuaristas"

### 20. Newsletter signup
- [ ] Adicionar form de email em footer
- [ ] Salvar em IndexedDB ou mock de "leads"
- [ ] Mensagem de confirmação
- [ ] Exibir contador de inscritos (mock)
- **CTA**: "Receba dicas de gestão pecuária"

### 21. Página de contato funcional
- [ ] Criar `src/pages/Contact.tsx`
- [ ] Formulário com: nome, email, telefone, mensagem
- [ ] Validação Zod
- [ ] Links para WhatsApp direto (botão flutuante)
- [ ] Email mock para salvar contatos em IndexedDB
- **WhatsApp link**: `https://wa.me/55XXXXX?text=...`

### 22. Case studies / Depoimentos estendidos
- [ ] Criar 5-8 depoimentos com foto de clientes
- [ ] Adicionar métricas: "aumentou X% produtividade"
- [ ] Seção em LandingPage com mais depoimentos
- **Exemplo**: "Pequeno produtor em MG aumentou produtividade 40% usando AgroSaldo"

---

## **Fase 6: DOCUMENTAÇÃO + TESTES (P3)**
**Prazo: Semana 5 | Impacto: Código mantível**

### 24. Documentar endpoints REST esperados
- [ ] Criar `src/lib/api-routes.ts` com todas as rotas esperadas
- [ ] Comentar request/response shapes esperados
- [ ] Usar como template para backend NestJS
- **Rotas principais**:
  ```typescript
  POST   /api/lancamentos/nascimento
  POST   /api/lancamentos/mortalidade
  POST   /api/lancamentos/venda
  POST   /api/lancamentos/vacina
  GET    /api/rebanho/:propertyId
  GET    /api/rebanho/:propertyId/historico
  PATCH  /api/usuarios/:id
  GET    /api/swagger
  ```

### 25. Implementar testes Jest para regras críticas
- [ ] Teste: `calculateAgeGroup()` com várias datas de nascimento
- [ ] Teste: validação matrizes (births ≤ females)
- [ ] Teste: compressão de imagem retorna blob menor
- [ ] Teste: sincronização offline marca como "pending"
- **Target**: 80%+ cobertura em utils, hooks, regras de negócio

### 26. Implementar testes E2E com Playwright
- [ ] Fluxo completo: Login → Selecionar propriedade → Lançar nascimento → Validar evolução faixa → Logout
- [ ] Teste offline: Modo avião → Lançar movimento → Voltar online → Sincronizar
- [ ] Teste admin: Aprovar/rejeitar solicitação → Validar no Dashboard
- **Target**: 5-10 testes críticos

---

## **Fase 7: PREPARAÇÃO PARA BACKEND (P2)**
**Prazo: Contínuo | Impacto: Integração com NestJS**

### 27. Criar tipos TypeScript compatíveis com backend
- [ ] Definir DTOs em `src/types/`
- [ ] CreateMovementDTO, PropertyDTO, UserDTO, PlansDTO, etc
- [ ] Usar em formulários com validação Zod
- **Exemplo DTO**:
  ```typescript
  interface CreateMovementDTO {
    type: 'nascimento' | 'mortalidade' | 'venda' | 'vacina';
    date: Date;
    quantity: number;
    details?: Record<string, any>;
  }
  ```

### 28. Implementar client HTTP com axios
- [ ] Criar `src/lib/api-client.ts` com baseURL para backend
- [ ] Interceptors para JWT refresh tokens
- [ ] Error handling global
- [ ] Retry logic para requisições falhadas
- **Base URL**: `process.env.VITE_API_URL || 'http://localhost:3000/api'`

### 29. Substituir mocks por chamadas reais (estratégia)
- criar o schema do banco de dados
- mapear todos os mocks e criar o backend real
- criar os endpoints no NestJS
- integrar o frontend com os novos endpoints
- testar todas as funcionalidades com o backend real



---

## **Further Considerations**

### Ordem de Execução
1. **Fases 1-2**: Bloqueantes (correções + offline). Devem terminar ANTES de qualquer integração backend
2. **Fases 3-4**: Podem rodar em paralelo com fase 2
3. **Fases 5-7**: Paralelos aos anteriores

### Dependências Críticas
- Fase 1 deve terminar antes de qualquer integração com backend
- Fase 2 (offline) libera operação em campo
- Fase 3 libera relatórios para usuário final
- Fase 7 prepara integração com NestJS

### Recursos Humanos Recomendados
- 1 dev para Fases 1-2 (regras + offline) = 2 semanas
- 1 dev para Fases 3-4 (integrações) = 2 semanas
- 1 dev para Fases 5-6 (site + testes) = 2 semanas paralelo
- 1 dev backend iniciando NestJS durante Fases 1-2

### MVP vs Completo
- **MVP** (fase 1+2): ~1 semana. Resultado: App funcional offline com lançamentos corretos
- **Completo** (todas fases): ~3-4 semanas. Resultado: Sistema pronto para produção com relatórios, admin, site

### Stack de Bibliotecas Necessárias
```json
{
  "novos_packages": {
    "offline": [
      "dexie",
      "idb",
      "localforage"
    ],
    "camera": [
      "react-camera-pro",
      "expo-camera"
    ],
    "compressao": [
      "pica",
      "browser-image-compression"
    ],
    "pdf": [
      "pdfkit",
      "html2pdf.js",
      "jspdf"
    ],
    "http": [
      "axios",
      "msw"
    ],
    "testes": [
      "@testing-library/react",
      "@testing-library/jest-dom",
      "jest",
      "@playwright/test"
    ]
  }
}
```

### Checkpoints de Validação
- **Após Fase 1**: Regras de negócio implementadas, matrizes validadas, faixas etárias automáticas
- **Após Fase 2**: App funciona offline, sincroniza quando retorna internet, fotos comprimidas
- **Após Fase 3**: Relatórios em PDF + WhatsApp compartilhado, filtros funcionais
- **Após Fase 4**: Admin consegue gerenciar clientes e planos com persistência
- **Após Fase 5**: Site institucional completo para conversão de leads
- **Após Fase 6**: Código testado e documentado para integração backend
- **Após Fase 7**: Frontend pronto para conectar ao NestJS

---

## **Problemas Conhecidos a Corrigir**

1. **Preços de planos incorretos** - R$ 49.90 deve ser R$ 29.90 (porteira)
2. **Evolução de faixas estática** - Animais não mudam de categoria automaticamente
3. **Validação de nascimentos ausente** - Pode registrar mais que matrizes
4. **App não funciona sem internet** - Sem IndexedDB ou Service Worker
5. **Foto obrigatória sem câmera** - Usuário fica bloqueado
6. **Admin edita mas não salva** - Apenas UI, sem persistência
7. **Site sem lead gen** - LandingPage incompleta
8. **Sem relatórios PDF** - Usuário não consegue gerar espelho
9. **Sem sincronização WhatsApp** - Dados não saem do app
10. **Sem testes automatizados** - Código não testável

---

## **Métricas de Sucesso**

- [ ] 100% das regras críticas (evolução + matrizes) funcionando
- [ ] App funciona offline + sincroniza corretamente
- [ ] Relatórios em PDF + WhatsApp gerados com sucesso
- [ ] Admin consegue gerenciar clientes sem erros
- [ ] Site gera leads (newsletter, contato)
- [ ] 80%+ cobertura de testes
- [ ] Documentação de APIs completa para backend

---

**Status**: Pronto para execução. Estimativa total: 3-4 semanas com 4 devs em paralelo, ou 6-8 semanas com 1 dev sequencial.
