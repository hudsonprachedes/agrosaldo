# 🏗️ Arquitetura do AgroSaldo

## Diagrama Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO (React)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    LAYOUT SYSTEM                            │ │
│  ├────────────┬────────────────┬──────────────────────────────┤ │
│  │ AppLayout  │  AdminLayout   │      MobileLayout            │ │
│  │ (Produtor) │  (SuperAdmin)  │  (Responsivo <768px)         │ │
│  └────────────┴────────────────┴──────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    PÁGINAS                                  │ │
│  ├─────────────┬──────────────┬──────────────┬───────────────┤ │
│  │ LandingPage │ Dashboard    │  Lancamentos │ Admin CRUD    │ │
│  │ Blog        │ Rebanho      │  Extrato     │ Solicitações  │ │
│  │ Contact     │ MinhaFazenda │  Relatórios  │ Planos        │ │
│  │ Login       │ PropertySel. │  WhatsApp    │ Clientes      │ │
│  └─────────────┴──────────────┴──────────────┴───────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    COMPONENTES REUTILIZÁVEIS               │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  • CameraCapture (fotos com validação)                      │ │
│  │  • 40+ shadcn/ui components (Button, Card, Form, etc)       │ │
│  │  • Custom hooks: useIsMobile, useSyncStatus, useAuth        │ │
│  │  • Navigation, Modals, Forms, Dialogs, Tabs, Sliders        │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE LÓGICA                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  CONTEXTOS & HOOKS                         │ │
│  ├────────────┬────────────────┬──────────────────────────────┤ │
│  │ AuthContext│ useSyncStatus  │      useIsMobile             │ │
│  │ (Auth)     │ (Sincronização)│  (Responsividade)            │ │
│  └────────────┴────────────────┴──────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              VALIDAÇÕES & REGRAS DE NEGÓCIO                │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  • getAvailableMatrizes() → Valida nascimentos            │ │
│  │  • validateGTA() → Guia de Trânsito Animal                │ │
│  │  • validateCPF() / validateCNPJ() → Docs                 │ │
│  │  • age-group-migration → Evolução automática diária      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE DADOS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────┬──────────────────────────────────┐ │
│  │   INDEXEDDB (LOCAL)      │    LOCALSTORAGE                  │ │
│  ├──────────────────────────┼──────────────────────────────────┤ │
│  │ Database: agrosaldo-db   │ Filter preferences               │ │
│  │ ├─ users                 │ Auth tokens (JWT)                │ │
│  │ ├─ properties            │ Selected property                │ │
│  │ ├─ movements (rebanho)   │ Newsletter status                │ │
│  │ ├─ photos (fotos)        │ Age migration date               │ │
│  │ ├─ sync_queue (fila)     │ Theme preference                 │ │
│  │ └─ analytics (dados)     │                                  │ │
│  │                          │                                  │ │
│  │ Database: agrosaldo-admin-db                                │ │
│  │ ├─ plans (planos)        │                                  │ │
│  │ ├─ clients (clientes)    │                                  │ │
│  │ └─ requests (aprovações) │                                  │ │
│  └──────────────────────────┴──────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────┬──────────────────────────────────┐ │
│  │   MOCK DATA              │    FUTURE: BACKEND API           │ │
│  ├──────────────────────────┼──────────────────────────────────┤ │
│  │ • mock-auth.ts          │ POST /api/usuarios/login         │ │
│  │ • mock-bovinos.ts       │ POST /api/lancamentos/...        │ │
│  │ • mock-analytics.ts     │ GET /api/rebanho/:id             │ │
│  │ • mock-admin.ts         │ PATCH /api/admin/...             │ │
│  │                          │ WebSocket sync events            │ │
│  └──────────────────────────┴──────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Dados

### 1. Autenticação (Multi-tenant)
```
┌─────────────┐
│   Login     │
│   Screen    │
└──────┬──────┘
       │ CPF/CNPJ + Senha
       ↓
┌──────────────────────┐
│  AuthContext         │
│  ├─ validateLogin()  │
│  ├─ setUser()        │
│  └─ setProperty()    │
└──────┬───────────────┘
       │ localStorage: agrosaldo_user_id
       │              agrosaldo_property_id
       ↓
┌──────────────────────┐
│   Dashboard          │
│   (Produtor)         │
│   ou                 │
│   AdminDashboard     │
│   (SuperAdmin)       │
└──────────────────────┘
```

### 2. Registrar Movimento (Nascimento/Morte/Venda)
```
┌──────────────────────┐
│  LaunchForm          │
│  ├─ Tipo             │
│  ├─ Quantidade       │
│  ├─ Data             │
│  ├─ Câmera (foto)    │
│  └─ Notas            │
└──────┬───────────────┘
       │ Zod validation
       ↓
┌──────────────────────────────┐
│  validadeMovement()          │
│  ├─ Quantidade > 0?          │
│  ├─ Nascimento ≤ matrizes?   │
│  ├─ Foto obrigatória?        │
│  └─ GTA válida?              │
└──────┬───────────────────────┘
       │ Se válido
       ↓
┌──────────────────────────────┐
│  saveMovement()              │
│  ├─ IndexedDB save           │
│  ├─ Add to sync_queue        │
│  └─ Auto-compress foto       │
└──────┬───────────────────────┘
       │ Se online
       ↓
┌──────────────────────────────┐
│  syncMovements()             │
│  ├─ POST /api/lancamentos/   │ (Futuro)
│  ├─ Remove from sync_queue   │
│  └─ Toast sucesso            │
└──────────────────────────────┘
```

### 3. Sincronização Offline
```
┌─────────────────────────────────┐
│  Online/Offline Detection       │
└──────┬──────────────────────────┘
       │
       ├─ navigator.onLine === false
       │  ├─ "Offline" toast
       │  └─ Save to IndexedDB + sync_queue
       │
       └─ navigator.onLine === true
          ├─ setupAutoSync() listener
          ├─ Retry failed items
          └─ syncAll() (movements + photos)
                │
                ├─ For each queued item:
                │  ├─ POST to API (simulado)
                │  ├─ Remove from queue se sucesso
                │  └─ Increment retries se falhar
                │
                └─ Toast com resultado
                   (Sincronizados: X movimentos)
```

### 4. Dashboard Analytics
```
┌──────────────────────────┐
│  getRebanhoData()        │
│  ├─ Current cattle count │
│  ├─ By age groups        │
│  ├─ Monthly births       │
│  └─ Monthly deaths       │
└──────┬───────────────────┘
       │
       ├─ ApexCharts visualization
       │  ├─ Bar chart (idades)
       │  ├─ Line chart (evolução)
       │  └─ Pie chart (distribuição)
       │
       └─ PDF Generation
          ├─ ReportData object
          ├─ HTML template
          ├─ html2pdf.js
          └─ Download: espelho-rebanho-{property}-{date}.pdf
```

---

## Estrutura de Pastas Detalhada

```
agrosaldo/
├── src/
│   ├── main.tsx                    ← Entry point + age migration init
│   ├── App.tsx                     ← Routing + Protected routes
│   ├── App.css                     ← Global styles
│   ├── index.css                   ← Tailwind + base styles
│   │
│   ├── lib/                        ← Core business logic
│   │   ├── admin-crud.ts           ← Generic CRUD para admin
│   │   ├── age-group-migration.ts  ← Evolução automática
│   │   ├── api-client.ts           ← API client (futuro)
│   │   ├── api-routes.ts           ← API endpoints (futuro)
│   │   ├── db.ts                   ← IndexedDB wrapper + sync
│   │   ├── gta-validation.ts       ← CPF, CNPJ, GTA validation
│   │   ├── image-compression.ts    ← Compressão de fotos
│   │   ├── indexeddb.ts            ← IndexedDB setup
│   │   ├── pdf-report.ts           ← PDF generation
│   │   ├── seo.ts                  ← Meta tags + schema
│   │   ├── sitemap.ts              ← Sitemap + robots.txt
│   │   ├── utils.ts                ← cn(), formatters, helpers
│   │   ├── whatsapp-share.ts       ← WhatsApp integration
│   │   └── __tests__/              ← Testes unitários
│   │       ├── validations.spec.ts
│   │       └── sync.spec.ts
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx         ← Multi-tenant auth
│   │
│   ├── hooks/
│   │   ├── useIsMobile.ts          ← Responsive breakpoint
│   │   ├── useSyncStatus.ts        ← Sync status monitoring
│   │   ├── use-toast.ts            ← Toast hook
│   │   ├── use-mobile.tsx          ← (deprecated)
│   │   └── __tests__/
│   │       └── useIsMobile.spec.ts
│   │
│   ├── types/
│   │   └── index.ts                ← TypeScript interfaces
│   │
│   ├── mocks/
│   │   ├── mock-admin.ts           ← Admin data (plans, clients)
│   │   ├── mock-analytics.ts       ← Analytics data
│   │   ├── mock-auth.ts            ← Users + properties
│   │   ├── mock-bovinos.ts         ← Cattle movements
│   │   └── __tests__/              ← Mock tests
│   │
│   ├── pages/                      ← Page components
│   │   ├── Analytics.tsx           ← Analytics page
│   │   ├── Blog.tsx                ← Blog listing
│   │   ├── Contact.tsx             ← Contact form
│   │   ├── Dashboard.tsx           ← Main dashboard (PDF gen)
│   │   ├── Extrato.tsx             ← Movement history (filters/pagination)
│   │   ├── Index.tsx               ← Redirect page
│   │   ├── Lancamentos.tsx         ← Movement launcher
│   │   ├── LaunchForm.tsx          ← Birth/death/sale/vaccine form
│   │   ├── LandingPage.tsx         ← Public landing page
│   │   ├── Login.tsx               ← Auth login
│   │   ├── MinhaFazenda.tsx        ← Property edit
│   │   ├── MobileHome.tsx          ← Mobile dashboard
│   │   ├── NotFound.tsx            ← 404 page
│   │   ├── PropertySelection.tsx   ← Multi-tenant switcher
│   │   ├── Rebanho.tsx             ← Cattle visualization
│   │   └── admin/                  ← Admin pages
│   │       ├── AdminAprovacoes.tsx
│   │       ├── AdminAuditoria.tsx
│   │       ├── AdminClientes.tsx
│   │       ├── AdminCRM.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminFinanceiro.tsx
│   │       ├── AdminPlanos.tsx     ← CRUD de planos
│   │       ├── AdminRegras.tsx
│   │       └── AdminSolicitacoes.tsx
│   │
│   ├── components/
│   │   ├── CameraCapture.tsx       ← Câmera integrada
│   │   ├── NavLink.tsx             ← Navigation link
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx     ← Admin panel layout
│   │   │   ├── AppLayout.tsx       ← Main app layout
│   │   │   └── MobileLayout.tsx    ← Mobile responsive
│   │   └── ui/                     ← 40+ shadcn/ui components
│   │       ├── accordion.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── dialog.tsx
│   │       ├── modal.tsx
│   │       └── ... (mais 30+ componentes)
│   │
│   ├── assets/                     ← Static assets
│   │   └── (images, icons, etc)
│   │
│   └── vite-env.d.ts              ← Vite types
│
├── tests/                          ← E2E tests (Playwright)
│   ├── auth.spec.ts
│   ├── lancamento.spec.ts
│   ├── extrato-filters.spec.ts
│   ├── admin-approval.spec.ts
│   └── property-selection.spec.ts
│
├── public/                         ← Static files
│   ├── robots.txt                 ← (gerado dinamicamente)
│   ├── favicon.png
│   ├── manifest.json              ← PWA manifest
│   ├── service-worker.js
│   └── service-worker.ts
│
├── docs/
│   ├── prd - agrosaldo.md         ← PRD completo (150+ páginas)
│   ├── CHECKLIST-IMPLEMENTACAO.md ← Status tracking
│   ├── IMPLEMENTACAO-COMPLETA.md  ← Fases 1-4 detalh
│   └── FASE-5-7-COMPLETA.md       ← Fases 5-6
│
├── Configuration Files
│   ├── vite.config.ts             ← Vite build config
│   ├── tsconfig.json              ← TypeScript config
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── jest.config.ts             ← Jest test config
│   ├── playwright.config.ts        ← Playwright E2E config
│   ├── tailwind.config.ts          ← Tailwind CSS config
│   ├── postcss.config.js           ← PostCSS config
│   ├── eslint.config.js            ← ESLint config
│   ├── components.json             ← shadcn/ui registry
│   ├── package.json
│   ├── bun.lockb
│   └── .gitignore
│
└── Root Files
    ├── index.html                 ← HTML com meta tags SEO
    ├── README.md
    ├── README-STATUS.md
    ├── setup.sh                   ← Quick start script
    └── FASE-5-7-COMPLETA.md
```

---

## Fluxo de Dados - StateManagement

```
┌─────────────────────────────────┐
│     React Component Tree        │
└──────────────┬──────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ↓             ↓
   ┌─────────┐   ┌──────────────┐
   │  Props  │   │  Local State │
   │         │   │  (useState)  │
   └─────────┘   └──────┬───────┘
                        │
                 ┌──────┴────────┐
                 │               │
                 ↓               ↓
            ┌──────────┐    ┌──────────┐
            │AuthCtx   │    │ localStorage
            │(JWT+User)│    │  (Filters)
            └──────────┘    └──────────┘

        ┌─ IndexedDB
        │  ├─ Users
        │  ├─ Movements (rebanho)
        │  ├─ Photos
        │  ├─ Sync Queue
        │  └─ Admin tables
        │
        └─ Cache Layer
           └─ Service Worker
              └─ Offline First

Data Flow Pattern:
Component → Validation (Zod) → Business Logic → IndexedDB → UI Update → Toast Feedback
```

---

## Performance & Optimization

```
Frontend Optimization:
├── Code Splitting
│   ├─ Route-based code splitting (React Router)
│   ├─ Component lazy loading
│   └─ Dynamic imports for heavy libs
│
├── Bundle Optimization
│   ├─ Tree-shaking (ES modules)
│   ├─ Minification (Vite)
│   ├─ Gzip compression
│   └─ Image compression (custom lib)
│
├── Caching Strategy
│   ├─ Service Worker (offline cache)
│   ├─ HTTP cache headers
│   └─ LocalStorage (filters, auth)
│
└── Database Optimization
    ├─ IndexedDB with proper indexes
    ├─ Query optimization
    └─ Lazy loading of data

Lighthouse Targets:
├─ Performance: 85+
├─ Accessibility: 90+
├─ Best Practices: 90+
└─ SEO: 95+
```

---

## Segurança em Camadas

```
Layer 1: Input Validation
├─ Frontend Zod schemas
├─ Type checking (TypeScript)
└─ Regex patterns for formats

Layer 2: Business Rules
├─ getAvailableMatrizes()
├─ validateGTA()
├─ validateCPF/CNPJ()
└─ Photo requirements

Layer 3: Data Storage
├─ IndexedDB (local only)
├─ localStorage encryption ready
└─ No sensitive data in memory

Layer 4: Transport
├─ HTTPS ready (backend)
├─ JWT tokens (future)
└─ CSRF tokens (future)

Layer 5: Authorization
├─ Role-based access (RBAC)
├─ Property-based filtering
├─ Admin isolation
└─ Audit logging
```

---

Isso conclui a arquitetura do AgroSaldo! 🎉
