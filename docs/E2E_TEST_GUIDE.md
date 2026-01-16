# Guia de Testes E2E Completo - Agrosaldo

## 📋 Visão Geral

Este documento descreve o fluxo de testes e2e completo que valida toda a jornada do usuário no Agrosaldo, desde o login até as configurações.

## 🎯 Cobertura do Teste

O teste `complete-flow.spec.ts` cobre os seguintes cenários:

### 1. **Login** ✅
- Autenticação com CPF e senha válidos
- Redirecionamento para seleção de propriedade
- Validação de credenciais

### 2. **Seleção de Propriedade** ✅
- Seleção de propriedade disponível
- Redirecionamento para onboarding ou dashboard

### 3. **Onboarding** ✅
- Step 1: Bem-vindo
- Step 2: Escolha de espécies (Bovino/Bubalino)
- Step 3: Preenchimento de estoque inicial
- Conclusão e redirecionamento para dashboard

### 4. **Lançamentos** ✅
- **Nascimento**: Registrar novos bezerros
- **Mortalidade**: Registrar mortes
- **Venda**: Registrar vendas com preço
- **Outras Espécies**: Registrar equinos, muares, ovinos
- **Vacinação**: Registrar campanhas de vacina

### 5. **Extrato** ✅
- Visualizar todos os lançamentos
- Filtrar por tipo de movimento
- Validar sincronização de dados

### 6. **Rebanho** ✅
- Visualizar composição do rebanho
- Verificar saldo total
- Validar atualização após lançamentos

### 7. **Análises** ✅
- Visualizar gráficos de produtividade
- Testar seletor de período
- Validar dados apresentados

### 8. **Configurações** ✅
- Acessar página de Minha Fazenda
- Validar abas de configuração
- Verificar opções disponíveis

### 9. **Logout** ✅
- Fazer logout corretamente
- Validar redirecionamento para login
- Verificar limpeza de sessão

## 🚀 Como Executar os Testes

### Pré-requisitos
```bash
# Instalar dependências
npm install

# Instalar dependências do backend
cd backend
npm install
cd ..
```

### Executar Todos os Testes E2E
```bash
npm run test:e2e
```

### Executar Apenas o Teste Completo
```bash
npm run test:e2e -- complete-flow.spec.ts
```

### Executar com Interface Gráfica (Headed Mode)
```bash
npm run test:e2e -- complete-flow.spec.ts --headed
```

### Executar em Modo Debug
```bash
npm run test:e2e -- complete-flow.spec.ts --debug
```

### Executar em Navegador Específico
```bash
# Chrome
npm run test:e2e -- complete-flow.spec.ts --project=chromium

# Firefox
npm run test:e2e -- complete-flow.spec.ts --project=firefox

# Safari
npm run test:e2e -- complete-flow.spec.ts --project=webkit
```

## 🔧 Configuração do Ambiente

### Credenciais de Teste
- **CPF**: `123.456.789-00`
- **Senha**: `123456`

### URLs
- **Base URL**: `http://localhost:8080`
- **Login**: `http://localhost:8080/login`
- **Dashboard**: `http://localhost:8080/dashboard`

### Banco de Dados de Teste
Certifique-se de que o banco de dados contém:
- Um usuário com CPF `123.456.789-00` e senha `123456`
- Pelo menos uma propriedade associada ao usuário
- Dados iniciais para testes

## 📊 Estrutura dos Testes

### Teste Principal: `complete-flow.spec.ts`

```typescript
test('deve completar jornada completa do usuário', async ({ page, context }) => {
  // 14 steps sequenciais que cobrem toda a jornada
})
```

**Steps Inclusos:**
1. Login com credenciais válidas
2. Seleção de propriedade
3. Completar onboarding
4. Registrar nascimento
5. Registrar morte
6. Registrar venda
7. Registrar outras espécies
8. Registrar vacinação
9. Visualizar extrato
10. Visualizar rebanho
11. Visualizar análises
12. Acessar configurações
13. Validar navegação e integridade
14. Fazer logout

### Testes Adicionais

#### `deve validar integração backend em lançamentos`
- Monitora requisições de API
- Valida respostas do backend
- Verifica sincronização de dados

#### `deve validar sincronização de dados entre páginas`
- Registra lançamento
- Verifica aparição em Extrato
- Valida atualização de saldo em Rebanho

## ✅ Validações Implementadas

### Frontend
- ✅ Navegação entre páginas
- ✅ Preenchimento de formulários
- ✅ Validação de campos obrigatórios
- ✅ Mensagens de sucesso/erro
- ✅ Redirecionamentos corretos
- ✅ Persistência de dados

### Backend
- ✅ Autenticação e autorização
- ✅ Criação de lançamentos
- ✅ Atualização de saldos
- ✅ Sincronização de dados
- ✅ Respostas de API

### Integração
- ✅ Dados aparecem corretamente em múltiplas páginas
- ✅ Saldos são atualizados após lançamentos
- ✅ Filtros funcionam corretamente
- ✅ Gráficos carregam dados

## 🐛 Troubleshooting

### Teste Falha no Login
```bash
# Verificar se o servidor está rodando
npm run dev:all

# Verificar credenciais no banco de dados
# Executar seed se necessário
cd backend
npm run seed
cd ..
```

### Teste Falha no Onboarding
- Verificar se a página de onboarding está renderizando
- Validar que os campos de entrada estão visíveis
- Confirmar que os botões "Próximo" e "Concluir" existem

### Teste Falha em Lançamentos
- Verificar se os formulários estão sendo renderizados
- Validar que os campos de entrada têm os nomes corretos
- Confirmar que as mensagens de sucesso aparecem

### Timeout em Esperas
- Aumentar o timeout em `playwright.config.ts`
- Verificar performance do servidor
- Validar que o banco de dados está respondendo

## 📈 Métricas de Sucesso

Um teste bem-sucedido deve:
- ✅ Completar todos os 14 steps sem erros
- ✅ Não gerar erros de console críticos
- ✅ Validar integração frontend-backend
- ✅ Confirmar sincronização de dados
- ✅ Executar em menos de 5 minutos

## 🔄 Integração Contínua

Para adicionar aos testes CI/CD:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run dev:all &
      - run: npm run test:e2e
```

## 📝 Notas Importantes

1. **Dados de Teste**: Os testes usam dados reais do banco de dados. Certifique-se de que o usuário de teste existe.

2. **Timing**: Os testes incluem `waitForTimeout` para sincronização. Ajuste se necessário.

3. **Seletores**: Os seletores usam múltiplas estratégias (text, aria-label, name) para compatibilidade.

4. **Modo Offline**: O teste `lancamento.spec.ts` inclui validação de modo offline com IndexedDB.

5. **Capturas de Tela**: Falhas geram screenshots em `test-results/`.

## 🎓 Próximos Passos

- [ ] Adicionar testes de performance
- [ ] Adicionar testes de acessibilidade
- [ ] Implementar testes de modo offline completo
- [ ] Adicionar validação de PDFs gerados
- [ ] Testar integração com WhatsApp
- [ ] Validar sincronização em tempo real

## 📞 Suporte

Para problemas ou dúvidas:
1. Verificar logs do Playwright em `test-results/`
2. Executar teste em modo debug: `--debug`
3. Verificar console do navegador: `page.on('console', ...)`
4. Validar estado do banco de dados

---

**Última atualização**: Janeiro 2026
**Versão**: 1.0
