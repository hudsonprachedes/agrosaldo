#!/bin/bash

# Script para executar testes E2E do Agrosaldo
# Uso: ./scripts/run-e2e-tests.sh [opcao]

set -e

echo "🚀 Agrosaldo - E2E Test Runner"
echo "================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para exibir menu
show_menu() {
    echo ""
    echo "Selecione uma opção:"
    echo "1) Executar teste completo (complete-flow.spec.ts)"
    echo "2) Executar todos os testes E2E"
    echo "3) Executar teste completo em modo headed (com interface)"
    echo "4) Executar teste completo em modo debug"
    echo "5) Executar teste de lançamentos"
    echo "6) Executar teste de autenticação"
    echo "7) Executar teste de extrato"
    echo "8) Executar teste de navegação"
    echo "9) Executar teste de seleção de propriedade"
    echo "10) Executar teste de aprovação de admin"
    echo "11) Executar todos os testes com relatório"
    echo "0) Sair"
    echo ""
}

# Função para verificar se servidor está rodando
check_server() {
    echo "🔍 Verificando se servidor está rodando..."
    if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Servidor não está rodando em http://localhost:8080${NC}"
        echo "Iniciando servidor..."
        npm run dev:all &
        SERVER_PID=$!
        sleep 5
        echo -e "${GREEN}✅ Servidor iniciado (PID: $SERVER_PID)${NC}"
    else
        echo -e "${GREEN}✅ Servidor já está rodando${NC}"
    fi
}

# Função para executar teste
run_test() {
    local test_file=$1
    local options=$2
    
    echo ""
    echo -e "${YELLOW}▶️  Executando: npm run test:e2e -- $test_file $options${NC}"
    echo ""
    
    npm run test:e2e -- "$test_file" $options
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Teste passou com sucesso!${NC}"
    else
        echo -e "${RED}❌ Teste falhou!${NC}"
        exit 1
    fi
}

# Menu principal
if [ $# -eq 0 ]; then
    show_menu
    read -p "Digite sua escolha (0-11): " choice
else
    choice=$1
fi

case $choice in
    1)
        check_server
        run_test "complete-flow.spec.ts"
        ;;
    2)
        check_server
        echo -e "${YELLOW}▶️  Executando todos os testes E2E${NC}"
        npm run test:e2e
        ;;
    3)
        check_server
        run_test "complete-flow.spec.ts" "--headed"
        ;;
    4)
        check_server
        run_test "complete-flow.spec.ts" "--debug"
        ;;
    5)
        check_server
        run_test "lancamento.spec.ts"
        ;;
    6)
        check_server
        run_test "auth.spec.ts"
        ;;
    7)
        check_server
        run_test "extrato-filters.spec.ts"
        ;;
    8)
        check_server
        run_test "navigation.spec.ts"
        ;;
    9)
        check_server
        run_test "property-selection.spec.ts"
        ;;
    10)
        check_server
        run_test "admin-approval.spec.ts"
        ;;
    11)
        check_server
        echo -e "${YELLOW}▶️  Executando todos os testes com relatório${NC}"
        npm run test:e2e -- --reporter=html
        echo ""
        echo -e "${GREEN}📊 Relatório gerado em: playwright-report/index.html${NC}"
        ;;
    0)
        echo "Saindo..."
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Opção inválida!${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Concluído!${NC}"
