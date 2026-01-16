# 🚀 Quick Start - Testes E2E Completos

## Resumo Rápido

Um **fluxo e2e completo** foi criado para validar toda a jornada do usuário no Agrosaldo, desde o login até as configurações.

## 📁 Arquivos Criados

1. **`tests/complete-flow.spec.ts`** - Teste principal com 14 steps
2. **`E2E_TEST_GUIDE.md`** - Documentação completa
3. **`scripts/run-e2e-tests.sh`** - Script para Linux/Mac
4. **`scripts/run-e2e-tests.bat`** - Script para Windows

## ⚡ Execução Rápida

### Opção 1: Comando Direto (Recomendado)
```bash
npm run test:e2e -- complete-flow.spec.ts
```

### Opção 2: Com Interface Gráfica
```bash
npm run test:e2e -- complete-flow.spec.ts --headed
```

### Opção 3: Modo Debug
```bash
npm run test:e2e -- complete-flow.spec.ts --debug
```

### Opção 4: Script Windows
```bash
scripts\run-e2e-tests.bat
# Selecione opção 1 para teste completo
```

### Opção 5: Script Linux/Mac
```bash
chmod +x scripts/run-e2e-tests.sh
./scripts/run-e2e-tests.sh
# Selecione opção 1 para teste completo
```

## 📋 O que o Teste Valida

### ✅ 14 Steps Sequenciais

1. **Login** - Autenticação com CPF/Senha
2. **Seleção de Propriedade** - Escolher propriedade
3. **Onboarding** - Configuração inicial (3 steps)
4. **Nascimento** - Registrar novos bezerros
5. **Mortalidade** - Registrar mortes
6. **Venda** - Registrar vendas
7. **Outras Espécies** - Registrar equinos, muares, etc
8. **Vacinação** - Registrar campanhas de vacina
9. **Extrato** - Visualizar movimentações
10. **Rebanho** - Ver composição do rebanho
11. **Análises** - Visualizar gráficos
12. **Configurações** - Acessar Minha Fazenda
13. **Validação** - Integridade da sessão
14. **Logout** - Sair do sistema

### 🔗 Testes Adicionais

- **Integração Backend**: Monitora requisições de API
- **Sincronização de Dados**: Valida dados entre páginas

## 🔐 Credenciais de Teste

```
CPF: 123.456.789-00
Senha: 123456
```

## ⚙️ Pré-requisitos

1. **Servidor rodando**:
   ```bash
   npm run dev:all
   ```

2. **Banco de dados com dados de teste**:
   - Usuário com CPF `123.456.789-00`
   - Pelo menos uma propriedade associada

3. **Dependências instaladas**:
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

## 📊 Validações Implementadas

### Frontend ✅
- Navegação entre páginas
- Preenchimento de formulários
- Validação de campos
- Mensagens de sucesso/erro
- Redirecionamentos

### Backend ✅
- Autenticação
- Criação de lançamentos
- Atualização de saldos
- Sincronização de dados

### Integração ✅
- Dados aparecem em múltiplas páginas
- Saldos atualizados após lançamentos
- Filtros funcionam
- Gráficos carregam dados

## 🎯 Métricas de Sucesso

Um teste bem-sucedido deve:
- ✅ Completar todos os 14 steps
- ✅ Sem erros de console críticos
- ✅ Validar integração frontend-backend
- ✅ Confirmar sincronização de dados
- ✅ Executar em menos de 5 minutos

## 🐛 Troubleshooting Rápido

### Teste falha no login
```bash
# Verificar se servidor está rodando
npm run dev:all

# Executar seed do banco
cd backend && npm run seed && cd ..
```

### Teste falha no onboarding
- Verificar se página está renderizando
- Validar que campos estão visíveis
- Confirmar botões "Próximo" e "Concluir"

### Timeout
- Aumentar timeout em `playwright.config.ts`
- Verificar performance do servidor
- Validar resposta do banco de dados

## 📈 Próximos Passos

- [ ] Executar teste completo
- [ ] Verificar relatório em `test-results/`
- [ ] Adicionar testes de performance
- [ ] Implementar testes de acessibilidade
- [ ] Validar modo offline completo

## 📚 Documentação Completa

Para mais detalhes, consulte: **`E2E_TEST_GUIDE.md`**

## 🔄 Todos os Testes Disponíveis

```bash
# Teste completo (novo)
npm run test:e2e -- complete-flow.spec.ts

# Testes existentes
npm run test:e2e -- auth.spec.ts              # Autenticação
npm run test:e2e -- lancamento.spec.ts        # Lançamentos
npm run test:e2e -- extrato-filters.spec.ts   # Extrato
npm run test:e2e -- navigation.spec.ts        # Navegação
npm run test:e2e -- property-selection.spec.ts # Propriedade
npm run test:e2e -- admin-approval.spec.ts    # Admin

# Todos os testes
npm run test:e2e

# Com relatório HTML
npm run test:e2e -- --reporter=html
```

## 💡 Dicas

1. Use `--headed` para ver o navegador durante execução
2. Use `--debug` para pausar e inspecionar
3. Verifique `test-results/` para screenshots de falhas
4. Consulte logs em `playwright-report/` para detalhes

---

**Versão**: 1.0  
**Data**: Janeiro 2026  
**Status**: ✅ Pronto para Uso
