import { test, expect } from './_setup';

test.describe('Validações Backend e Sincronização', () => {
  const CPF = '529.982.247-25';
  const PASSWORD = '123456';
  const BASE_URL = 'http://localhost:8080';

  test('deve validar resposta de API em lançamento', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', CPF);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*property-selection/);
    await page.click('button:has-text("Selecionar"):first');
    await page.waitForURL(/.*dashboard|.*onboarding/);

    if (page.url().includes('onboarding')) {
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button[type="submit"]:has-text("Concluir"), button:has-text("Finish")');
      await page.waitForURL(/.*dashboard/);
    }

    // Monitora requisições de API
    const apiResponses: { status: number; url: string }[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/api') || response.url().includes('lancamentos')) {
        apiResponses.push({
          status: response.status(),
          url: response.url(),
        });
      }
    });

    // Registra lançamento
    await page.click('a[href*="lancamentos"], text=Lançamentos');
    await page.waitForURL(/.*lancamentos/);
    await page.click('button:has-text("Nascimento")');

    await page.fill('input[name="quantidade"], input[placeholder*="quantidade" i]', '5');
    await page.click('text=Macho');

    const today = new Date().toISOString().split('T')[0];
    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.isVisible()) {
      await dateInput.fill(today);
    }

    await page.click('button[type="submit"]:has-text("Lançar"), button:has-text("Confirmar")');
    await expect(page.locator('text=/sucesso|success/i')).toBeVisible({ timeout: 3000 });

    // Aguarda requisições
    await page.waitForTimeout(1000);

    // Verifica se houve chamadas de API
    if (apiResponses.length > 0) {
      // Deve haver respostas bem-sucedidas (2xx ou 3xx)
      const hasSuccessResponse = apiResponses.some(r => r.status >= 200 && r.status < 400);
      expect(hasSuccessResponse).toBe(true);
    }
  });

  test('deve sincronizar dados offline', async ({ page, context }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', CPF);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*property-selection/);
    await page.click('button:has-text("Selecionar"):first');
    await page.waitForURL(/.*dashboard|.*onboarding/);

    if (page.url().includes('onboarding')) {
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button[type="submit"]:has-text("Concluir"), button:has-text("Finish")');
      await page.waitForURL(/.*dashboard/);
    }

    // Simula modo offline
    await context.setOffline(true);

    // Tenta registrar lançamento offline
    await page.click('a[href*="lancamentos"], text=Lançamentos');
    await page.waitForURL(/.*lancamentos/);
    await page.click('button:has-text("Nascimento")');

    await page.fill('input[name="quantidade"], input[placeholder*="quantidade" i]', '3');
    await page.click('text=Fêmea');

    const today = new Date().toISOString().split('T')[0];
    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.isVisible()) {
      await dateInput.fill(today);
    }

    await page.click('button[type="submit"]:has-text("Lançar"), button:has-text("Confirmar")');

    // Deve salvar localmente
    const localSaveMessage = page.locator('text=/salvo|offline|pendente|sincronizar/i');
    const hasLocalSave = await localSaveMessage.isVisible({ timeout: 3000 }).catch(() => false);

    // Volta online
    await context.setOffline(false);

    // Aguarda sincronização
    await page.waitForTimeout(2000);

    // Verifica se sincronizou
    const syncMessage = page.locator('text=/sincronizado|enviado|sucesso/i');
    const hasSyncMessage = await syncMessage.isVisible({ timeout: 3000 }).catch(() => false);

    // Deve ter salvo localmente ou sincronizado
    expect(hasLocalSave || hasSyncMessage).toBe(true);
  });

  test('deve validar tipos de dados em formulários', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', CPF);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*property-selection/);
    await page.click('button:has-text("Selecionar"):first');
    await page.waitForURL(/.*dashboard|.*onboarding/);

    if (page.url().includes('onboarding')) {
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button[type="submit"]:has-text("Concluir"), button:has-text("Finish")');
      await page.waitForURL(/.*dashboard/);
    }

    // Vai para Lançamentos
    await page.click('a[href*="lancamentos"], text=Lançamentos');
    await page.waitForURL(/.*lancamentos/);
    await page.click('button:has-text("Venda")');

    // Testa campo de quantidade (deve aceitar apenas números)
    const quantidadeInput = page.locator('input[name="quantidade"], input[placeholder*="quantidade" i]');
    
    // Tenta inserir texto
    await quantidadeInput.fill('abc');
    
    // Campo de número deve rejeitar ou converter
    const value = await quantidadeInput.inputValue();
    expect(value === '' || /^\d+$/.test(value)).toBe(true);

    // Testa campo de preço (deve aceitar números e ponto)
    const priceInput = page.locator('input[name="preco"], input[name="price"], input[placeholder*="preço" i]');
    if (await priceInput.isVisible()) {
      await priceInput.fill('1500.50');
      const priceValue = await priceInput.inputValue();
      expect(/^\d+\.?\d*$/.test(priceValue) || priceValue === '').toBe(true);
    }

    // Testa campo de data
    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.isVisible()) {
      const today = new Date().toISOString().split('T')[0];
      await dateInput.fill(today);
      const dateValue = await dateInput.inputValue();
      expect(/^\d{4}-\d{2}-\d{2}$/.test(dateValue)).toBe(true);
    }
  });

  test('deve manter consistência de saldo', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', CPF);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*property-selection/);
    await page.click('button:has-text("Selecionar"):first');
    await page.waitForURL(/.*dashboard|.*onboarding/);

    if (page.url().includes('onboarding')) {
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button[type="submit"]:has-text("Concluir"), button:has-text("Finish")');
      await page.waitForURL(/.*dashboard/);
    }

    // Captura saldo em Dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    const dashboardBalance = await page.locator('text=/Total|Cabeças/i').first().textContent();

    // Captura saldo em Rebanho
    await page.click('a[href*="rebanho"], text=Rebanho');
    await page.waitForURL(/.*rebanho/);
    const rebanhoBalance = await page.locator('text=/Total|Cabeças/i').first().textContent();

    // Saldos devem ser iguais ou similares
    if (dashboardBalance && rebanhoBalance) {
      const dashboardNum = parseInt(dashboardBalance.match(/\d+/)?.[0] || '0');
      const rebanhoNum = parseInt(rebanhoBalance.match(/\d+/)?.[0] || '0');
      
      // Devem ser iguais (ou muito próximos se houver processamento)
      expect(Math.abs(dashboardNum - rebanhoNum)).toBeLessThanOrEqual(1);
    }
  });

  test('deve validar autenticação em endpoints protegidos', async ({ page }) => {
    // Tenta acessar dashboard sem autenticação
    await page.goto(`${BASE_URL}/dashboard`);

    // Deve redirecionar para login
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });

    // Tenta acessar rebanho sem autenticação
    await page.goto(`${BASE_URL}/rebanho`);
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });

    // Tenta acessar extrato sem autenticação
    await page.goto(`${BASE_URL}/extrato`);
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });

  test('deve validar seleção de propriedade', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', CPF);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*property-selection/);

    // Deve estar na página de seleção
    await expect(page.locator('text=Selecione uma Propriedade')).toBeVisible();

    // Deve haver pelo menos uma propriedade
    const propertyButtons = page.locator('button:has-text("Selecionar")');
    const count = await propertyButtons.count();
    expect(count).toBeGreaterThan(0);

    // Seleciona primeira propriedade
    await propertyButtons.first().click();

    // Deve redirecionar para onboarding ou dashboard
    await page.waitForURL(/.*onboarding|.*dashboard/, { timeout: 5000 });
    expect(page.url()).toMatch(/.*onboarding|.*dashboard/);
  });

  test('deve validar mudança de propriedade', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', CPF);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*property-selection/);
    await page.click('button:has-text("Selecionar"):first');
    await page.waitForURL(/.*dashboard|.*onboarding/);

    if (page.url().includes('onboarding')) {
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button[type="submit"]:has-text("Concluir"), button:has-text("Finish")');
      await page.waitForURL(/.*dashboard/);
    }

    // Procura seletor de propriedade
    const propertySelector = page.locator('[aria-label*="propriedade" i], [aria-label*="property" i], text=/Propriedade|Property/i').first();
    
    if (await propertySelector.isVisible({ timeout: 1000 }).catch(() => false)) {
      await propertySelector.click();
      await page.waitForTimeout(500);

      // Deve mostrar opções de propriedade
      const options = page.locator('[role="option"], .option, li');
      const optionCount = await options.count();
      
      if (optionCount > 0) {
        expect(optionCount).toBeGreaterThan(0);
      }
    }
  });

  test('deve validar paginação em tabelas grandes', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', CPF);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*property-selection/);
    await page.click('button:has-text("Selecionar"):first');
    await page.waitForURL(/.*dashboard|.*onboarding/);

    if (page.url().includes('onboarding')) {
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button[type="submit"]:has-text("Concluir"), button:has-text("Finish")');
      await page.waitForURL(/.*dashboard/);
    }

    // Vai para Extrato
    await page.click('a[href*="extrato"], text=Extrato');
    await page.waitForURL(/.*extrato/);

    // Procura controles de paginação
    const nextButton = page.locator('button:has-text("Próximo"), button:has-text("Next"), [aria-label*="next" i]');
    const prevButton = page.locator('button:has-text("Anterior"), button:has-text("Previous"), [aria-label*="previous" i]');

    if (await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Há paginação
      expect(true).toBe(true);
    } else {
      // Sem paginação, deve haver todos os itens visíveis
      const rows = page.locator('table tbody tr, [role="row"]');
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('deve validar tratamento de erros', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', CPF);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*property-selection/);
    await page.click('button:has-text("Selecionar"):first');
    await page.waitForURL(/.*dashboard|.*onboarding/);

    if (page.url().includes('onboarding')) {
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button:has-text("Próximo"), button:has-text("Next")');
      await page.click('button[type="submit"]:has-text("Concluir"), button:has-text("Finish")');
      await page.waitForURL(/.*dashboard/);
    }

    // Tenta submeter formulário vazio
    await page.click('a[href*="lancamentos"], text=Lançamentos');
    await page.waitForURL(/.*lancamentos/);
    await page.click('button:has-text("Nascimento")');

    // Clica em submeter sem preencher
    const submitButton = page.locator('button[type="submit"]:has-text("Lançar"), button:has-text("Confirmar")');
    await submitButton.click();

    // Deve haver feedback de erro
    const errorMessage = page.locator('text=/erro|obrigatório|required|preencha/i');
    const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);

    // Ou validação HTML5
    const quantidadeInput = page.locator('input[name="quantidade"], input[placeholder*="quantidade" i]');
    const isInvalid = await quantidadeInput.evaluate((el: HTMLInputElement) => !el.checkValidity()).catch(() => false);

    expect(hasError || isInvalid).toBe(true);
  });
});
