@echo off
REM Script para executar testes E2E do Agrosaldo (Windows)
REM Uso: run-e2e-tests.bat [opcao]

setlocal enabledelayedexpansion

echo.
echo ========================================
echo 🚀 Agrosaldo - E2E Test Runner (Windows)
echo ========================================
echo.

REM Função para exibir menu
:show_menu
echo Selecione uma opcao:
echo.
echo 1) Executar teste completo (complete-flow.spec.ts)
echo 2) Executar todos os testes E2E
echo 3) Executar teste completo em modo headed (com interface)
echo 4) Executar teste completo em modo debug
echo 5) Executar teste de lancamentos
echo 6) Executar teste de autenticacao
echo 7) Executar teste de extrato
echo 8) Executar teste de navegacao
echo 9) Executar teste de selecao de propriedade
echo 10) Executar teste de aprovacao de admin
echo 11) Executar todos os testes com relatorio
echo 0) Sair
echo.

if "%1"=="" (
    set /p choice="Digite sua escolha (0-11): "
) else (
    set choice=%1
)

if "%choice%"=="1" (
    goto run_complete_flow
) else if "%choice%"=="2" (
    goto run_all_tests
) else if "%choice%"=="3" (
    goto run_complete_flow_headed
) else if "%choice%"=="4" (
    goto run_complete_flow_debug
) else if "%choice%"=="5" (
    goto run_lancamento
) else if "%choice%"=="6" (
    goto run_auth
) else if "%choice%"=="7" (
    goto run_extrato
) else if "%choice%"=="8" (
    goto run_navigation
) else if "%choice%"=="9" (
    goto run_property_selection
) else if "%choice%"=="10" (
    goto run_admin_approval
) else if "%choice%"=="11" (
    goto run_all_with_report
) else if "%choice%"=="0" (
    echo Saindo...
    exit /b 0
) else (
    echo ❌ Opcao invalida!
    exit /b 1
)

:run_complete_flow
echo.
echo ▶️  Executando: npm run test:e2e -- complete-flow.spec.ts
echo.
call npm run test:e2e -- complete-flow.spec.ts
if errorlevel 1 (
    echo ❌ Teste falhou!
    exit /b 1
)
echo ✅ Teste passou com sucesso!
goto end

:run_all_tests
echo.
echo ▶️  Executando todos os testes E2E
echo.
call npm run test:e2e
goto end

:run_complete_flow_headed
echo.
echo ▶️  Executando: npm run test:e2e -- complete-flow.spec.ts --headed
echo.
call npm run test:e2e -- complete-flow.spec.ts --headed
if errorlevel 1 (
    echo ❌ Teste falhou!
    exit /b 1
)
echo ✅ Teste passou com sucesso!
goto end

:run_complete_flow_debug
echo.
echo ▶️  Executando: npm run test:e2e -- complete-flow.spec.ts --debug
echo.
call npm run test:e2e -- complete-flow.spec.ts --debug
if errorlevel 1 (
    echo ❌ Teste falhou!
    exit /b 1
)
echo ✅ Teste passou com sucesso!
goto end

:run_lancamento
echo.
echo ▶️  Executando: npm run test:e2e -- lancamento.spec.ts
echo.
call npm run test:e2e -- lancamento.spec.ts
goto end

:run_auth
echo.
echo ▶️  Executando: npm run test:e2e -- auth.spec.ts
echo.
call npm run test:e2e -- auth.spec.ts
goto end

:run_extrato
echo.
echo ▶️  Executando: npm run test:e2e -- extrato-filters.spec.ts
echo.
call npm run test:e2e -- extrato-filters.spec.ts
goto end

:run_navigation
echo.
echo ▶️  Executando: npm run test:e2e -- navigation.spec.ts
echo.
call npm run test:e2e -- navigation.spec.ts
goto end

:run_property_selection
echo.
echo ▶️  Executando: npm run test:e2e -- property-selection.spec.ts
echo.
call npm run test:e2e -- property-selection.spec.ts
goto end

:run_admin_approval
echo.
echo ▶️  Executando: npm run test:e2e -- admin-approval.spec.ts
echo.
call npm run test:e2e -- admin-approval.spec.ts
goto end

:run_all_with_report
echo.
echo ▶️  Executando todos os testes com relatorio
echo.
call npm run test:e2e -- --reporter=html
echo.
echo 📊 Relatorio gerado em: playwright-report/index.html
goto end

:end
echo.
echo ✅ Concluido!
echo.
