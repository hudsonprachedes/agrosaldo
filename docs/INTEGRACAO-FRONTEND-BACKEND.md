# Guia de Integração Frontend-Backend

**Data**: 15 de janeiro de 2026  
**Status**: Backend 95% completo, pronto para integração

---

## 📋 Resumo

O backend NestJS está implementado e testado. Este documento orienta a integração com o frontend React.

---

## ✅ Backend Completo

### Infraestrutura
- ✅ NestJS v11 configurado
- ✅ Prisma v7 com PostgreSQL
- ✅ JWT Authentication
- ✅ Swagger/OpenAPI em `/swagger`
- ✅ CORS configurado para `http://localhost:5173`
- ✅ Validação global (class-validator)
- ✅ Exception filters
- ✅ Logging interceptor

### Módulos Implementados
- ✅ Auth (login, register, me, refresh)
- ✅ Users (CRUD completo)
- ✅ Properties (CRUD completo)
- ✅ Livestock (consultas e cálculos)
- ✅ Movements (todos os tipos)
- ✅ Admin (aprovações, tenants)

### Testes
- ✅ Unit tests configurados (Jest)
- ✅ E2E tests configurados (Jest + Supertest)
- ✅ E2E auth endpoints
- ✅ E2E movements endpoints
- ✅ Schemas Zod para validação de contratos

---

## 🔧 Configuração Necessária

### 1. Variáveis de Ambiente Frontend

Criar/atualizar `.env` no frontend:

```env
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT=30000
```

### 2. Iniciar Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run start:dev
```

Backend estará em `http://localhost:3000`  
Swagger em `http://localhost:3000/swagger`

### 3. Banco de Dados

Certifique-se que PostgreSQL está rodando e a `DATABASE_URL` está configurada em `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:senha@localhost:5432/agrosaldo?schema=public
```

---

## 🔄 Passos de Integração

### Passo 1: Remover Mocks

Arquivos a serem modificados/removidos:

1. **`src/mocks/mock-*.ts`** - Remover ou manter apenas para testes
2. **`src/contexts/AuthContext.tsx`** - Atualizar para usar API real
3. **`src/pages/*`** - Substituir dados mockados por chamadas API

### Passo 2: Atualizar AuthContext

O `AuthContext` já está preparado para usar `apiClient`. Verificar:

```typescript
// src/contexts/AuthContext.tsx
import { apiClient } from '@/lib/api-client';

const login = async (cpfCnpj: string, password: string) => {
  const response = await apiClient.post('/auth/login', { cpfCnpj, password });
  // Processar resposta
};
```

### Passo 3: Atualizar Páginas

#### Dashboard
```typescript
// Antes (mock)
import { mockBovinos } from '@/mocks/mock-bovinos';

// Depois (API real)
import { apiClient } from '@/lib/api-client';

const fetchLivestock = async () => {
  const data = await apiClient.get(`/rebanho/${propertyId}`);
  setLivestock(data);
};
```

#### Lançamentos
```typescript
// Antes (mock)
const handleSubmit = async (data) => {
  // Salvar em IndexedDB
};

// Depois (API real)
const handleSubmit = async (data) => {
  try {
    await apiClient.post('/lancamentos/nascimento', data);
    toast.success('Lançamento criado com sucesso');
  } catch (error) {
    // Fallback para IndexedDB se offline
    await saveToIndexedDB(data);
    toast.info('Salvo offline - será sincronizado');
  }
};
```

### Passo 4: Implementar Sincronização Offline

```typescript
// src/lib/sync-service.ts
import { apiClient } from './api-client';
import { db } from './db';

export async function syncPendingMovements() {
  const pending = await db.sync_queue.toArray();
  
  for (const item of pending) {
    try {
      await apiClient.post('/sync/movimentos', item.data);
      await db.sync_queue.delete(item.id);
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    }
  }
}
```

---

## 📡 Endpoints Principais

### Autenticação

```typescript
// Login
POST /auth/login
Body: { cpfCnpj: string, password: string }
Response: { access_token: string, user: UserDTO }

// Obter usuário atual
GET /auth/me
Headers: { Authorization: Bearer <token> }
Response: UserDTO

// Registro
POST /auth/register
Body: { name, email, cpfCnpj, password }
Response: UserDTO
```

### Propriedades

```typescript
// Listar propriedades do usuário
GET /propriedades
Headers: { Authorization: Bearer <token> }
Response: PropertyDTO[]

// Obter uma propriedade
GET /propriedades/:id
Response: PropertyDTO
```

### Movimentos/Lançamentos

```typescript
// Criar nascimento
POST /lancamentos/nascimento
Headers: { Authorization: Bearer <token>, X-Property-ID: <id> }
Body: { date, quantity, sex, ageGroup, description }
Response: MovementDTO

// Criar mortalidade
POST /lancamentos/mortalidade
Body: { date, quantity, sex, ageGroup, description, photoUrl, cause }
Response: MovementDTO

// Listar movimentos
GET /lancamentos
Query: { type?, startDate?, endDate?, limit?, offset? }
Response: PaginatedResponse<MovementDTO>
```

### Rebanho

```typescript
// Obter saldo do rebanho
GET /rebanho/:propertyId
Response: CattleReportDTO

// Histórico
GET /rebanho/:propertyId/historico
Query: { months?: number }
Response: HistoryDTO[]
```

---

## 🔐 Autenticação

O `apiClient` já está configurado para:

1. **Adicionar token automaticamente** em todas as requisições
2. **Renovar token** quando expirado (401)
3. **Retry** em caso de erro 5xx
4. **Rate limiting** com backoff

```typescript
// Token é adicionado automaticamente
const data = await apiClient.get('/lancamentos');

// Não precisa fazer:
// headers: { Authorization: `Bearer ${token}` }
```

---

## 🧪 Validação de Contratos

Schemas Zod estão em `backend/src/common/schemas/contract.schemas.ts`:

```typescript
import { LoginRequestSchema, MovementResponseSchema } from '@backend/common/schemas/contract.schemas';

// Validar request
const validated = LoginRequestSchema.parse(formData);

// Validar response
const movement = MovementResponseSchema.parse(apiResponse);
```

---

## 📊 Fluxo Completo: Criar Lançamento

```typescript
// 1. Usuário preenche formulário
const formData = {
  type: 'birth',
  date: new Date().toISOString(),
  quantity: 5,
  sex: 'female',
  ageGroup: 'calf',
  description: 'Nascimento de bezerras',
};

// 2. Validar com Zod (opcional)
const validated = CreateMovementRequestSchema.parse(formData);

// 3. Enviar para API
try {
  const movement = await apiClient.post('/lancamentos/nascimento', validated);
  toast.success('Lançamento criado com sucesso');
  
  // 4. Atualizar UI
  setMovements(prev => [...prev, movement]);
} catch (error) {
  // 5. Fallback offline
  if (!navigator.onLine) {
    await db.sync_queue.add({
      type: 'movement',
      data: validated,
      timestamp: Date.now(),
    });
    toast.info('Salvo offline - será sincronizado');
  } else {
    toast.error('Erro ao criar lançamento');
  }
}
```

---

## 🔄 Sincronização Offline

### Estratégia

1. **Online**: Enviar direto para API
2. **Offline**: Salvar em IndexedDB
3. **Reconexão**: Sincronizar automaticamente

### Implementação

```typescript
// src/hooks/useSync.ts
export function useSync() {
  const syncPending = async () => {
    if (!navigator.onLine) return;
    
    const pending = await db.sync_queue.toArray();
    
    for (const item of pending) {
      try {
        await apiClient.post('/sync/movimentos', item.data);
        await db.sync_queue.delete(item.id);
      } catch (error) {
        console.error('Sync error:', error);
      }
    }
  };
  
  useEffect(() => {
    window.addEventListener('online', syncPending);
    return () => window.removeEventListener('online', syncPending);
  }, []);
  
  return { syncPending };
}
```

---

## 🐛 Troubleshooting

### CORS Error

**Problema**: `Access-Control-Allow-Origin` error

**Solução**: Verificar `backend/src/main.ts`:

```typescript
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
```

### 401 Unauthorized

**Problema**: Token inválido ou expirado

**Solução**: O `apiClient` já renova automaticamente. Se persistir:

```typescript
// Limpar tokens e fazer login novamente
apiClient.clearAuth();
window.location.href = '/login';
```

### Connection Refused

**Problema**: Backend não está rodando

**Solução**:
```bash
cd backend
npm run start:dev
```

### Prisma Error

**Problema**: `PrismaClient needs datasourceUrl`

**Solução**: Verificar `backend/.env` tem `DATABASE_URL` configurada

---

## 📝 Checklist de Integração

- [ ] Backend rodando em `http://localhost:3000`
- [ ] PostgreSQL configurado e acessível
- [ ] Variáveis de ambiente configuradas
- [ ] `apiClient` testado com `/health` ou `/swagger`
- [ ] AuthContext atualizado para API real
- [ ] Páginas principais usando API (Dashboard, Lançamentos, Extrato)
- [ ] Sincronização offline implementada
- [ ] Tratamento de erros adequado
- [ ] Testes E2E passando
- [ ] Mocks removidos ou isolados

---

## 🚀 Próximos Passos

1. **Testar endpoints** via Swagger (`http://localhost:3000/swagger`)
2. **Atualizar AuthContext** para usar API real
3. **Migrar Dashboard** para buscar dados da API
4. **Migrar Lançamentos** para criar via API
5. **Implementar sync** automático
6. **Remover mocks** gradualmente
7. **Testar fluxo completo** end-to-end

---

**Última Atualização**: 15 de janeiro de 2026  
**Autor**: Sistema AgroSaldo  
**Status**: Backend pronto para integração
