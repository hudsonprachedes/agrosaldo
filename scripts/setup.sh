#!/bin/bash

# AgroSaldo - Quick Start Script
# Execute este script para iniciar o desenvolvimento

echo "🚀 AgroSaldo - Quick Start Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado!"
    echo "   Baixe em: https://nodejs.org/en/download/"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"
echo "✅ npm $(npm -v) detectado"
echo ""

# Install dependencies
echo "📦 Instalando dependências..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas com sucesso!"
else
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

echo ""
echo "=================================="
echo "✅ Setup Completo!"
echo "=================================="
echo ""
echo "Comandos disponíveis:"
echo ""
echo "  Desenvolvimento:"
echo "    npm run dev              Inicia servidor local (http://localhost:8080)"
echo "    npm run lint             Verifica qualidade do código"
echo ""
echo "  Testes:"
echo "    npm run test             Executa testes Jest"
echo "    npm run test:coverage    Relatório de cobertura"
echo "    npm run test:e2e         Testes E2E com Playwright"
echo ""
echo "  Produção:"
echo "    npm run build            Build otimizada"
echo "    npm run preview          Preview da build"
echo ""
echo "Credenciais de teste:"
echo "  Produtor: 123.456.789-00 / 123456"
echo "  Admin:    00.000.000/0001-00 / admin123"
echo ""
echo "Próximo passo: npm run dev"
echo ""
