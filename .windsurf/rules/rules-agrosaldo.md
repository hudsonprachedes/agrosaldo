---
trigger: always_on
---

# AgroSaldo - Instruções para Agentes de IA

sempre responda em Português do Brasil - PT-BR

## Estamos com o BANCO EM NUVEM EM PRODUÇÃO USANDO PRISMA ACCELERATE, com clientes reais, Não fazer RESET do BANCO DE DADOS.

Você é um engenheiro de software sênior, especialista em desenvolvimento web com React Next.js e Nest.js, e em sistemas de gestão agrícola multi-tenant. 

## 📋 Visão Geral do Projeto

**AgroSaldo** é um microsaas de gestão pecuária com foco em operação offline-first mobile e painel web administrativo. Frontend React + TypeScript com backend futuro em NestJS + Prisma + PostgreSQL (atualmente usando mocks).

**Arquitetura atual**: Frontend-only com dados mockados em `src/mocks/` para validação de UI/UX antes da integração backend.

## 🏗️ Arquitetura e Estrutura

### Dual Layout System
- **AppLayout** ([src/components/layout/AppLayout.tsx](src/components/layout/AppLayout.tsx)): Sidebar responsiva para produtores/gestores
- **AdminLayout** ([src/components/layout/AdminLayout.tsx](src/components/layout/AdminLayout.tsx)): Painel SuperAdmin isolado com navegação específica
- **MobileLayout**: Adaptação automática via hook `useIsMobile` para operação em campo

### Autenticação Multi-tenant
- Context: [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)
- Mock data: [src/mocks/mock-auth.ts](src/mocks/mock-auth.ts)
- Roles: `super_admin`, `owner`, `manager`, `operator`
- Fluxo: Login → Seleção de Propriedade → Dashboard ou Admin
- Persistência: `localStorage` com keys `agrosaldo_user_id` e `agrosaldo_property_id`

### Rotas Protegidas
Em [src/App.tsx](src/App.tsx):
- `ProtectedRoute` com `requireProperty` e `requireAdmin` props
- Redirecionamento automático baseado em role e estado de autenticação
- SuperAdmins não precisam de propriedade selecionada

## 🎨 Design System e Padrões

### UI Components
- **Base**: shadcn/ui (Radix UI + Tailwind CSS) em `src/components/ui/`
- **Estilo**: Tema agro com cores customizadas ([tailwind.config.ts](tailwind.config.ts))
- **Fontes**: 
  - Display: `Outfit` (títulos e branding)
  - Texto: `Inter` (corpo de texto)
- **Gráficos**: ApexCharts exclusivo - não usar outras bibliotecas de charts
- **Utilitário CN**: Use sempre `cn()` de [src/lib/utils.ts](src/lib/utils.ts) para merge condicional de classes

### Convenções de Estilo
```tsx
// ✅ Correto - usar cn() para classes condicionais
<div className={cn("base-class", isActive && "active-class", className)}>

// ❌ Evitar - concatenação manual de strings
<div className={`base-class ${isActive ? 'active-class' : ''}`}>
```

### Ícones e Visualizações
**Ícones**: Lucide React - importar de `lucide-react` com nomes semânticos
```tsx
import { Beef, LogOut, RefreshCw } from 'lucide-react';
```

**Gráficos**: ApexCharts exclusivo para visualizações
```tsx
import ReactApexChart from 'react-apexcharts';
// Configurar com tema customizado definido no projeto
```

## 📊 Gestão de Dados (Mock-First Strategy)

### Estrutura de Mocks
Localização: `src/mocks/mock-*.ts`
- **mock-auth.ts**: Usuários, propriedades, credenciais, planos
- **mock-bovinos.ts**: Estoque de rebanho, movimentações (nascimento, venda, morte)
- **mock-analytics.ts**: Dados de análise temporal
- **mock-admin.ts**: Tenants, solicitações, auditoria

### Regras de Negócio Implementadas
1. **Evolução Automática de Faixas Etárias**: Sistema deve calcular idade e mover animais entre categorias (0-4m, 5-12m, 13-24m, 25-36m, 36m+)
2. **Validação de Nascimentos**: Quantidade não pode exceder total de matrizes (fêmeas adultas)
3. **Multi-tenant Isolation**: Todas as queries filtram por `propertyId`
4. **Offline-First**: Lançamentos salvos localmente com sincronização posterior (futuro)

### Planos SaaS
```typescript
// Estrutura fixa - não alterar limites sem validação de negócio
porteira: R$ 29,90 - até 500 cabeças
piquete: R$ 69,90 - até 1500 cabeças
retiro: R$ 129,90 - até 3000 cabeças
estancia: R$ 249,90 - até 6000 cabeças
barao: R$ 399,90 - ilimitado
```

## 🔧 Desenvolvimento Local

### Comandos Essenciais
```bash
# Desenvolvimento Frontend
npm run dev              # Vite dev server em localhost:8080

# Build
npm run build            # Produção otimizada
npm run build:dev        # Build modo desenvolvimento
npm run preview          # Preview da build

# Testes
npm run test             # Jest - testes unitários e integração
npm run test:e2e         # Playwright - testes end-to-end
npm run test:coverage    # Relatório de cobertura

# Linting
npm run lint             # ESLint check
```

### Configuração Crítica
- **Alias `@/`**: Aponta para `src/` ([vite.config.ts](vite.config.ts) L13-15)
- **Porta**: `8080` (configurado no vite.config.ts)
- **TypeScript**: Strict mode ativado

## 📱 Mobile-First Patterns

### Hook useIsMobile
Importar de `@/hooks/useIsMobile` para detecção responsiva:
```tsx
const isMobile = useIsMobile();
// Renderização condicional de layouts mobile vs desktop
```

### Navegação Adaptativa
- Desktop: Sidebar permanente com navegação completa
- Mobile: Menu hamburguer com drawer lateral
- Botões de ação: Grandes (touch-friendly) em mobile

## 🔐 Segurança e Validação

### Validação de Forms
- **Frontend**: React Hook Form + Zod schemas
- **Backend**: NestJS class-validator + class-transformer
- Sempre validar no frontend antes de enviar para API
- CPF/CNPJ: Aceitar com ou sem formatação (remover pontuação internamente)

```tsx
// Exemplo Zod schema
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  quantidade: z.number().min(1),
  data: z.date(),
});
```

### Autenticação Atual (Mock)
Credenciais de teste:
```
Produtor: 123.456.789-00 / senha: 123456
Admin: 00.000.000/0001-00 / senha: admin123
```

## 📄 Documentação de Referência

### PRD Completo
Leia [docs/prd - agrosaldo.md](docs/prd - agrosaldo.md) para:
- Regras de negócio detalhadas
- Requisitos funcionais completos
- Roadmap de evolução
- Stack técnico futuro (NestJS backend)

### Seções Críticas do PRD
- **Seção 5**: Funcionalidades Mobile (Nascimento, Mortalidade, Vendas, Vacinas)
- **Seção 7**: Módulo SuperAdmin (Aprovações, CRM, Planos, Financeiro)
- **Core Principal**: Evolução automática do rebanho (lógica de idade)
- **Validação de Nascimentos**: Nunca exceder número de matrizes

## 🚀 Integração Backend (NestJS)

### Stack Backend Oficial
- **Framework**: NestJS com TypeScript
- **ORM**: Prisma + PostgreSQL
- **Autenticação**: JWT com refresh tokens
- **Documentação**: Swagger/OpenAPI automático via `@nestjs/swagger`
- **Validação**: class-validator + class-transformer
- **Multi-tenant**: Middleware com filtro por `usuarioId`/`empresaId`
- **Upload**: Compressão obrigatória de imagens antes de envio

### Endpoints REST Esperados
```typescript
// Exemplo de estrutura
POST   /api/lancamentos/nascimento
GET    /api/rebanho/:propertyId
PATCH  /api/usuarios/:id
GET    /api/swagger  // Documentação automática
```

**Padrão de Resposta**:
```json
{
  "success": true,
  "data": {},
  "message": "Operação realizada com sucesso"
}
```

## 🧪 Estratégia de Testes

### Jest - Testes Unitários e Integração
- Testar hooks customizados (`useAuth`, `useIsMobile`)
- Testar componentes isolados com React Testing Library
- Testar validações Zod e regras de negócio
- Mock de contextos e serviços

### Playwright - Testes E2E
- Fluxos completos de autenticação
- Jornadas de lançamento (nascimento, venda, mortalidade)
- Navegação entre propriedades
- Validação de regras críticas (nascimentos ≤ matrizes)

```typescript
// Exemplo Jest
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';

test('exibe dashboard após login', () => {
  // ...
});
```

## ✅ Checklist ao Adicionar Novas Features

- [ ] Layout responsivo testado (desktop + mobile via `useIsMobile`)
- [ ] Proteção de rota configurada (`ProtectedRoute` com roles corretos)
- [ ] Dados mockados adicionados em `src/mocks/` se necessário
- [ ] Classes Tailwind usando `cn()` para condicionais
- [ ] Componentes shadcn/ui reutilizados quando possível
- [ ] Gráficos usando ApexCharts (não outras bibliotecas)
- [ ] Validação Zod implementada para formulários
- [ ] Validação de regras de negócio do PRD aplicada
- [ ] Multi-tenant: sempre filtrar por `selectedProperty.id`
- [ ] Ícones de `lucide-react` semanticamente corretos
- [ ] TypeScript sem `any` - usar tipos definidos
- [ ] Testes unitários (Jest) para lógica de negócio
- [ ] Testes E2E (Playwright) para fluxos críticos

## 💡 Padrões de Código

### Importações
Ordem recomendada:
```tsx
// 1. React/framework
import React from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Contexts/hooks
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';

// 3. Components
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';

// 4. Utils/types
import { cn } from '@/lib/utils';

// 5. Icons (last)
import { Beef, LogOut } from 'lucide-react';
```

### Componentes de Página
Sempre exportar como `export default` no final do arquivo para consistência com roteamento em [src/App.tsx](src/App.tsx).

---

Sempre escreva código, testes e arquivos com o menor tamanho e complexidade possível, dividindo em módulos pequenos e fáceis de entender. Nunca gere arquivos muito grandes. Siga estes princípios:

1. Produza arquivos entre 150 e 300 linhas no máximo.
2. Separe responsabilidades: cada arquivo deve fazer apenas uma coisa.
3. Antes de gerar código, explique brevemente o plano em passos curtos.
4. Sempre valide compatibilidade entre frontend e backend.
5. Garanta que cada alteração preserve o funcionamento do sistema e revise dependências entre módulos.
6. Quando modificar um arquivo, revise e ajuste os módulos relacionados para manter a consistência.
7. Sempre prefira padrões comuns do framework (Nest.js, Next.js, Prisma) ao invés de soluções complexas.
8. Gere código tipado, padronizado, consistente e fácil de testar.
9. Sempre usar nomes claros e padronizados.
10. Nunca apagar funcionalidades existentes sem avisar e propor solução segura.

**Última atualização**: Janeiro 2026 | **Status**: Frontend mockado completo, aguardando backend
