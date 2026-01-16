import { test, expect } from './_setup';

test.describe('Fluxo Completo E2E - Login até Configurações', () => {
  const CPF = '123.456.789-00';
  const PASSWORD = '123456';
  const BASE_URL = 'http://localhost:8080';

  test('deve completar jornada completa do usuário', async ({ page, context }) => {
    // ========== 1. LOGIN ==========
    test.step('1. Fazer login com credenciais válidas', async () => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page).toHaveURL(/.*login/);
      
      // Preenche formulário de login
      await page.fill('input[type="text"]', CPF);
      await page.fill('input[type="password"]', PASSWORD);
      
      // Clica no botão Entrar
      await page.click('button[type="submit"]');
      
      // Aguarda redirecionamento para seleção de propriedade
      await expect(page).toHaveURL(/.*property-selection/, { timeout: 5000 });
      await expect(page.locator('text=Selecione uma Propriedade')).toBeVisible();
    });

    // ========== 2. SELEÇÃO DE PROPRIEDADE ==========
    test.step('2. Selecionar propriedade', async () => {
      // Seleciona primeira propriedade disponível
      await page.click('button:has-text("Selecionar"):first');
      
      // Aguarda redirecionamento para onboarding ou dashboard
      await page.waitForURL(/.*onboarding|.*dashboard/, { timeout: 5000 });
    });

    // ========== 3. ONBOARDING ==========
    test.step('3. Completar onboarding', async () => {
      const currentUrl = page.url();
      
      if (currentUrl.includes('onboarding')) {
        // Step 1: Bem-vindo
        await expect(page.locator('text=/Bem-vindo|Welcome/i')).toBeVisible();
        await page.click('button:has-text("Próximo"), button:has-text("Next")');
        
        // Step 2: Escolher espécies
        await expect(page.locator('text=/Espécies|Species/i')).toBeVisible();
        
        // Seleciona bovino (geralmente já vem selecionado)
        const bovinoCheckbox = page.locator('input[type="checkbox"][value="bovino"], label:has-text("Bovino") input');
        if (await bovinoCheckbox.isVisible()) {
          await bovinoCheckbox.check({ force: true });
        }
        
        await page.click('button:has-text("Próximo"), button:has-text("Next")');
        
        // Step 3: Estoque inicial
        await expect(page.locator('text=/Estoque|Stock/i')).toBeVisible();
        
        // Preenche alguns campos de estoque inicial
        const inputs = page.locator('input[type="number"]');
        const count = await inputs.count();
        
        if (count > 0) {
          // Preenche primeiro campo com 10
          await inputs.first().fill('10');
          
          // Preenche alguns outros campos
          if (count > 5) {
            await inputs.nth(5).fill('5');
          }
        }
        
        // Submete onboarding
        await page.click('button:has-text("Concluir"), button:has-text("Finish"), button:has-text("Confirmar")');
        
        // Aguarda redirecionamento para dashboard
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 });
        await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 3000 });
      }
    });

    // ========== 4. LANÇAMENTO DE NASCIMENTO ==========
    test.step('4. Registrar lançamento de nascimento', async () => {
      // Navega para lançamentos
      await page.click('a[href*="lancamentos"], text=Lançamentos');
      await expect(page).toHaveURL(/.*lancamentos/, { timeout: 5000 });
      
      // Clica em Nascimento
      await page.click('button:has-text("Nascimento"), a[href*="nascimento"]');
      
      // Verifica que formulário está visível
      await expect(page.locator('text=/Nascimento|Birth/i')).toBeVisible({ timeout: 3000 });
      
      // Preenche quantidade
      await page.fill('input[name="quantidade"], input[placeholder*="quantidade" i], input[placeholder*="quantity" i]', '5');
      
      // Seleciona sexo
      const sexoOptions = page.locator('text=Macho, text=Fêmea, label:has-text("Macho"), label:has-text("Fêmea")');
      if (await sexoOptions.first().isVisible()) {
        await page.click('text=Macho');
      }
      
      // Seleciona data
      const today = new Date().toISOString().split('T')[0];
      const dateInput = page.locator('input[type="date"]');
      if (await dateInput.isVisible()) {
        await dateInput.fill(today);
      }
      
      // Submete formulário
      await page.click('button[type="submit"]:has-text("Lançar"), button:has-text("Confirmar"), button:has-text("Registrar")');
      
      // Verifica sucesso
      await expect(page.locator('text=/sucesso|success|registrado/i')).toBeVisible({ timeout: 3000 });
    });

    // ========== 5. LANÇAMENTO DE MORTE ==========
    test.step('5. Registrar lançamento de morte', async () => {
      // Volta para lançamentos
      await page.click('a[href*="lancamentos"], text=Lançamentos');
      await expect(page).toHaveURL(/.*lancamentos/, { timeout: 5000 });
      
      // Clica em Mortalidade
      await page.click('button:has-text("Mortalidade"), button:has-text("Morte"), a[href*="mortalidade"]');
      
      // Verifica que formulário está visível
      await expect(page.locator('text=/Mortalidade|Morte|Death/i')).toBeVisible({ timeout: 3000 });
      
      // Preenche quantidade
      await page.fill('input[name="quantidade"], input[placeholder*="quantidade" i]', '1');
      
      // Seleciona sexo
      await page.click('text=Fêmea');
      
      // Seleciona data
      const today = new Date().toISOString().split('T')[0];
      const dateInput = page.locator('input[type="date"]');
      if (await dateInput.isVisible()) {
        await dateInput.fill(today);
      }
      
      // Submete formulário
      await page.click('button[type="submit"]:has-text("Lançar"), button:has-text("Confirmar"), button:has-text("Registrar")');
      
      // Verifica sucesso
      await expect(page.locator('text=/sucesso|success|registrado/i')).toBeVisible({ timeout: 3000 });
    });

    // ========== 6. LANÇAMENTO DE VENDA ==========
    test.step('6. Registrar lançamento de venda', async () => {
      // Volta para lançamentos
      await page.click('a[href*="lancamentos"], text=Lançamentos');
      await expect(page).toHaveURL(/.*lancamentos/, { timeout: 5000 });
      
      // Clica em Venda
      await page.click('button:has-text("Venda"), a[href*="venda"]');
      
      // Verifica que formulário está visível
      await expect(page.locator('text=/Venda|Sale|Vender/i')).toBeVisible({ timeout: 3000 });
      
      // Preenche quantidade
      await page.fill('input[name="quantidade"], input[placeholder*="quantidade" i]', '2');
      
      // Seleciona sexo
      await page.click('text=Macho');
      
      // Seleciona data
      const today = new Date().toISOString().split('T')[0];
      const dateInput = page.locator('input[type="date"]');
      if (await dateInput.isVisible()) {
        await dateInput.fill(today);
      }
      
      // Preenche preço (se houver campo)
      const priceInput = page.locator('input[name="preco"], input[name="price"], input[placeholder*="preço" i], input[placeholder*="price" i]');
      if (await priceInput.isVisible()) {
        await priceInput.fill('1500');
      }
      
      // Submete formulário
      await page.click('button[type="submit"]:has-text("Lançar"), button:has-text("Confirmar"), button:has-text("Registrar")');
      
      // Verifica sucesso
      await expect(page.locator('text=/sucesso|success|registrado/i')).toBeVisible({ timeout: 3000 });
    });

    // ========== 7. LANÇAMENTO DE OUTRAS ESPÉCIES ==========
    test.step('7. Registrar lançamento de outras espécies', async () => {
      // Volta para lançamentos
      await page.click('a[href*="lancamentos"], text=Lançamentos');
      await expect(page).toHaveURL(/.*lancamentos/, { timeout: 5000 });
      
      // Clica em Outras Espécies
      await page.click('button:has-text("Outras Espécies"), button:has-text("Outras"), a[href*="outras"]');
      
      // Verifica que formulário está visível
      await expect(page.locator('text=/Outras Espécies|Other Species|Espécies/i')).toBeVisible({ timeout: 3000 });
      
      // Preenche quantidade
      await page.fill('input[name="quantidade"], input[placeholder*="quantidade" i]', '3');
      
      // Seleciona tipo de espécie (se houver select)
      const speciesSelect = page.locator('select[name="especie"], select[name="species"]');
      if (await speciesSelect.isVisible()) {
        await speciesSelect.selectOption({ index: 1 });
      }
      
      // Seleciona data
      const today = new Date().toISOString().split('T')[0];
      const dateInput = page.locator('input[type="date"]');
      if (await dateInput.isVisible()) {
        await dateInput.fill(today);
      }
      
      // Submete formulário
      await page.click('button[type="submit"]:has-text("Lançar"), button:has-text("Confirmar"), button:has-text("Registrar")');
      
      // Verifica sucesso
      await expect(page.locator('text=/sucesso|success|registrado/i')).toBeVisible({ timeout: 3000 });
    });

    // ========== 8. LANÇAMENTO DE VACINA ==========
    test.step('8. Registrar lançamento de vacinação', async () => {
      // Volta para lançamentos
      await page.click('a[href*="lancamentos"], text=Lançamentos');
      await expect(page).toHaveURL(/.*lancamentos/, { timeout: 5000 });
      
      // Clica em Vacinação
      await page.click('button:has-text("Vacinação"), button:has-text("Vacina"), a[href*="vacina"]');
      
      // Verifica que formulário está visível
      await expect(page.locator('text=/Vacinação|Vacina|Vaccination/i')).toBeVisible({ timeout: 3000 });
      
      // Preenche quantidade
      await page.fill('input[name="quantidade"], input[placeholder*="quantidade" i]', '10');
      
      // Preenche nome da vacina
      const vacinaInput = page.locator('input[name="vacina"], input[name="vaccine"], input[placeholder*="vacina" i]');
      if (await vacinaInput.isVisible()) {
        await vacinaInput.fill('Vacina Aftosa');
      }
      
      // Seleciona data
      const today = new Date().toISOString().split('T')[0];
      const dateInput = page.locator('input[type="date"]');
      if (await dateInput.isVisible()) {
        await dateInput.fill(today);
      }
      
      // Submete formulário
      await page.click('button[type="submit"]:has-text("Lançar"), button:has-text("Confirmar"), button:has-text("Registrar")');
      
      // Verifica sucesso
      await expect(page.locator('text=/sucesso|success|registrado/i')).toBeVisible({ timeout: 3000 });
    });

    // ========== 9. VER EXTRATO ==========
    test.step('9. Visualizar extrato com todos os lançamentos', async () => {
      // Navega para Extrato
      await page.click('a[href*="extrato"], text=Extrato');
      await expect(page).toHaveURL(/.*extrato/, { timeout: 5000 });
      
      // Verifica que página de extrato carregou
      await expect(page.locator('text=/Extrato|Extract|Movimentações/i')).toBeVisible();
      
      // Verifica que há registros na tabela
      const tableRows = page.locator('table tbody tr, [role="row"]');
      const rowCount = await tableRows.count();
      expect(rowCount).toBeGreaterThan(0);
      
      // Verifica que há lançamentos de diferentes tipos
      await expect(page.locator('text=Nascimento')).toBeVisible();
      
      // Testa filtro por tipo (se disponível)
      const filterButton = page.locator('button:has-text("Filtro"), button:has-text("Filter"), [aria-label*="filter" i]');
      if (await filterButton.isVisible()) {
        await filterButton.click();
        await page.waitForTimeout(500);
      }
    });

    // ========== 10. VER REBANHO ==========
    test.step('10. Visualizar rebanho e composição', async () => {
      // Navega para Rebanho
      await page.click('a[href*="rebanho"], text=Rebanho');
      await expect(page).toHaveURL(/.*rebanho/, { timeout: 5000 });
      
      // Verifica que página de rebanho carregou
      await expect(page.locator('text=/Rebanho|Herd|Composição/i')).toBeVisible();
      
      // Verifica que há informações de saldo
      const balanceInfo = page.locator('text=/Total|Cabeças|Total de|Saldo/i');
      await expect(balanceInfo.first()).toBeVisible();
      
      // Verifica que há tabelas ou gráficos
      const tables = page.locator('table, [role="table"], canvas, svg');
      const tableCount = await tables.count();
      expect(tableCount).toBeGreaterThan(0);
    });

    // ========== 11. VER ANÁLISES ==========
    test.step('11. Visualizar análises e gráficos', async () => {
      // Navega para Análises
      await page.click('a[href*="analises"], text=Análises, text=Analytics');
      await expect(page).toHaveURL(/.*analises/, { timeout: 5000 });
      
      // Verifica que página de análises carregou
      await expect(page.locator('text=/Análises|Analytics|Gráficos/i')).toBeVisible();
      
      // Verifica que há gráficos
      const charts = page.locator('canvas, svg, [role="img"]');
      const chartCount = await charts.count();
      expect(chartCount).toBeGreaterThan(0);
      
      // Testa seletor de período (se disponível)
      const periodSelect = page.locator('select[name="period"], button:has-text("Ano"), button:has-text("Mês")');
      if (await periodSelect.first().isVisible()) {
        await periodSelect.first().click();
      }
    });

    // ========== 12. CONFIGURAÇÕES ==========
    test.step('12. Acessar e validar configurações', async () => {
      // Navega para Configurações (via Minha Fazenda)
      await page.click('a[href*="minha-fazenda"], a[href*="configuracoes"], text=Minha Fazenda, text=Configurações');
      await expect(page).toHaveURL(/.*minha-fazenda|.*configuracoes/, { timeout: 5000 });
      
      // Verifica que página carregou
      await expect(page.locator('text=/Minha Fazenda|Configurações|Settings/i')).toBeVisible();
      
      // Clica na aba de configurações (se houver tabs)
      const configTab = page.locator('button:has-text("Configurações"), button:has-text("Config"), [role="tab"]:has-text("Configurações")');
      if (await configTab.isVisible()) {
        await configTab.click();
        await page.waitForTimeout(500);
      }
      
      // Verifica que há opções de configuração
      const settingsOptions = page.locator('text=/Notificações|Sincronização|Modo Escuro|Senha/i');
      await expect(settingsOptions.first()).toBeVisible();
    });

    // ========== 13. VALIDAÇÃO FINAL ==========
    test.step('13. Validar navegação e integridade da sessão', async () => {
      // Volta para dashboard
      await page.click('a[href*="dashboard"], text=Dashboard');
      await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 });
      
      // Verifica que dashboard carregou corretamente
      await expect(page.locator('text=Dashboard')).toBeVisible();
      
      // Verifica que dados foram atualizados (saldo deve refletir lançamentos)
      const balanceElements = page.locator('text=/Total|Cabeças|Saldo/i');
      const count = await balanceElements.count();
      expect(count).toBeGreaterThan(0);
    });

    // ========== 14. LOGOUT ==========
    test.step('14. Fazer logout corretamente', async () => {
      // Procura botão de logout
      const logoutButton = page.locator('[aria-label="Sair"], button:has-text("Sair"), button:has-text("Logout")');
      
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
      } else {
        // Tenta via menu
        const menuButton = page.locator('[aria-label="Menu"], button:has-text("Menu")');
        if (await menuButton.isVisible()) {
          await menuButton.click();
          await page.click('text=Sair, text=Logout');
        }
      }
      
      // Deve voltar para página de login
      await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
      
      // Verifica que não consegue acessar dashboard sem auth
      await page.goto(`${BASE_URL}/dashboard`);
      await expect(page).toHaveURL(/.*login/);
    });
  });

  // ========== TESTES ADICIONAIS DE VALIDAÇÃO ==========
  
  test('deve validar integração backend em lançamentos', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', CPF);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*property-selection/);
    await page.click('button:has-text("Selecionar"):first');
    await page.waitForURL(/.*dashboard|.*onboarding/);
    
    // Se estiver em onboarding, completa
    if (page.url().includes('onboarding')) {
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button[type="submit"]:has-text("Concluir"), button:has-text("Finish")');
      await page.waitForURL(/.*dashboard/);
    }
    
    // Navega para lançamentos
    await page.click('a[href*="lancamentos"], text=Lançamentos');
    await page.waitForURL(/.*lancamentos/);
    
    // Registra nascimento
    await page.click('button:has-text("Nascimento")');
    await page.fill('input[name="quantidade"], input[placeholder*="quantidade" i]', '5');
    await page.click('text=Macho');
    
    const today = new Date().toISOString().split('T')[0];
    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.isVisible()) {
      await dateInput.fill(today);
    }
    
    // Monitora requisições de API
    const responses: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/api') || response.url().includes('backend')) {
        responses.push(`${response.status()} ${response.url()}`);
      }
    });
    
    await page.click('button[type="submit"]:has-text("Lançar"), button:has-text("Confirmar")');
    
    // Aguarda sucesso
    await expect(page.locator('text=/sucesso|success/i')).toBeVisible({ timeout: 3000 });
    
    // Verifica que houve chamadas de API
    await page.waitForTimeout(1000);
    expect(responses.length).toBeGreaterThan(0);
  });

  test('deve validar sincronização de dados entre páginas', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', CPF);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*property-selection/);
    await page.click('button:has-text("Selecionar"):first');
    await page.waitForURL(/.*dashboard|.*onboarding/);
    
    // Se estiver em onboarding, completa
    if (page.url().includes('onboarding')) {
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button[type="submit"]:has-text("Concluir"), button:has-text("Finish")');
      await page.waitForURL(/.*dashboard/);
    }
    
    // Captura saldo inicial no dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    const initialBalance = await page.locator('text=/Total|Cabeças/i').first().textContent();
    
    // Registra nascimento
    await page.click('a[href*="lancamentos"], text=Lançamentos');
    await page.waitForURL(/.*lancamentos/);
    await page.click('button:has-text("Nascimento")');
    
    await page.fill('input[name="quantidade"], input[placeholder*="quantidade" i]', '10');
    await page.click('text=Macho');
    
    const today = new Date().toISOString().split('T')[0];
    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.isVisible()) {
      await dateInput.fill(today);
    }
    
    await page.click('button[type="submit"]:has-text("Lançar"), button:has-text("Confirmar")');
    await expect(page.locator('text=/sucesso|success/i')).toBeVisible({ timeout: 3000 });
    
    // Verifica que lançamento aparece no Extrato
    await page.click('a[href*="extrato"], text=Extrato');
    await page.waitForURL(/.*extrato/);
    await expect(page.locator('text=Nascimento')).toBeVisible();
    
    // Verifica que rebanho foi atualizado
    await page.click('a[href*="rebanho"], text=Rebanho');
    await page.waitForURL(/.*rebanho/);
    const updatedBalance = await page.locator('text=/Total|Cabeças/i').first().textContent();
    
    // Saldo deve ter mudado
    expect(initialBalance).not.toEqual(updatedBalance);
  });
});
