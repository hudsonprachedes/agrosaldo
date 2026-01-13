import { test, expect } from '@playwright/test';

test.describe('Lançamento de Nascimento', () => {
  test.beforeEach(async ({ page }) => {
    // Faz login e seleciona propriedade
    await page.goto('http://localhost:8080/login');
    await page.fill('input[type="text"]', '123.456.789-00');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*property-selection/);
    await page.click('button:has-text("Selecionar"):first');
    await page.waitForURL(/.*dashboard/);
  });

  test('deve acessar formulário de nascimento', async ({ page }) => {
    // Navega para lançamentos
    await page.click('a[href*="lancamentos"], text=Lançamentos');
    await page.waitForURL(/.*lancamentos/);
    
    // Clica em Nascimento (pode ser botão ou tab)
    await page.click('button:has-text("Nascimento"), a[href*="nascimento"]');
    
    // Verifica que formulário está visível
    await expect(page.locator('text=Lançar Nascimento')).toBeVisible();
  });

  test('deve preencher e submeter nascimento com sucesso', async ({ page }) => {
    // Navega para formulário de nascimento
    await page.goto('http://localhost:8080/lancamentos');
    await page.click('button:has-text("Nascimento")');
    
    // Preenche quantidade
    await page.fill('input[name="quantidade"], input[placeholder*="quantidade" i]', '5');
    
    // Seleciona sexo (assume Radio ou Select)
    await page.click('text=Macho');
    
    // Seleciona data (usa input date)
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[type="date"]', today);
    
    // Pode ter campo raça
    await page.selectOption('select[name="breed"], select[name="raca"]', { index: 0 });
    
    // Observações opcionais
    await page.fill('textarea[name="observacoes"], textarea[name="notes"]', 'Nascimento programado');
    
    // Submete formulário
    await page.click('button[type="submit"]:has-text("Lançar"), button:has-text("Confirmar")');
    
    // Deve mostrar toast de sucesso
    await expect(page.locator('text=Nascimento registrado com sucesso')).toBeVisible({ timeout: 3000 });
  });

  test('deve validar quantidade de nascimentos vs matrizes', async ({ page }) => {
    await page.goto('http://localhost:8080/lancamentos');
    await page.click('button:has-text("Nascimento")');
    
    // Tenta lançar quantidade absurda que excede matrizes
    await page.fill('input[name="quantidade"], input[placeholder*="quantidade" i]', '99999');
    
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[type="date"]', today);
    
    await page.click('text=Macho');
    
    // Submete
    await page.click('button[type="submit"]:has-text("Lançar"), button:has-text("Confirmar")');
    
    // Deve mostrar erro de validação
    await expect(page.locator('text=/não pode exceder|matrizes disponíveis/i')).toBeVisible({ timeout: 3000 });
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    await page.goto('http://localhost:8080/lancamentos');
    await page.click('button:has-text("Nascimento")');
    
    // Tenta submeter sem preencher
    await page.click('button[type="submit"]:has-text("Lançar"), button:has-text("Confirmar")');
    
    // Verifica que há mensagens de validação
    // (pode ser HTML5 validation ou mensagens customizadas)
    const quantidadeInput = page.locator('input[name="quantidade"], input[placeholder*="quantidade" i]');
    await expect(quantidadeInput).toHaveAttribute('required', '');
  });

  test('deve limpar formulário após sucesso', async ({ page }) => {
    await page.goto('http://localhost:8080/lancamentos');
    await page.click('button:has-text("Nascimento")');
    
    // Preenche e submete
    await page.fill('input[name="quantidade"], input[placeholder*="quantidade" i]', '3');
    await page.click('text=Fêmea');
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[type="date"]', today);
    
    await page.click('button[type="submit"]:has-text("Lançar"), button:has-text("Confirmar")');
    
    // Aguarda sucesso
    await expect(page.locator('text=sucesso')).toBeVisible({ timeout: 3000 });
    
    // Verifica que campos foram resetados
    await expect(page.locator('input[name="quantidade"], input[placeholder*="quantidade" i]')).toHaveValue('');
  });

  test('deve salvar nascimento no IndexedDB quando offline', async ({ page, context }) => {
    // Simula modo offline
    await context.setOffline(true);
    
    await page.goto('http://localhost:8080/lancamentos');
    await page.click('button:has-text("Nascimento")');
    
    // Preenche formulário
    await page.fill('input[name="quantidade"], input[placeholder*="quantidade" i]', '2');
    await page.click('text=Macho');
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[type="date"]', today);
    
    await page.click('button[type="submit"]:has-text("Lançar"), button:has-text("Confirmar")');
    
    // Deve salvar localmente e mostrar indicador de sync pendente
    await expect(page.locator('text=/salvo localmente|pendente de sincronização/i')).toBeVisible({ timeout: 3000 });
    
    // Verifica IndexedDB
    const queueSize = await page.evaluate(async () => {
      const db = await (window as any).indexedDB.open('agrosaldo-db', 1);
      return new Promise((resolve) => {
        db.onsuccess = () => {
          const transaction = db.result.transaction(['syncQueue'], 'readonly');
          const store = transaction.objectStore('syncQueue');
          const request = store.count();
          request.onsuccess = () => resolve(request.result);
        };
      });
    });
    
    expect(queueSize).toBeGreaterThan(0);
    
    // Volta online
    await context.setOffline(false);
  });

  test('deve exibir nascimento no Extrato após lançamento', async ({ page }) => {
    await page.goto('http://localhost:8080/lancamentos');
    await page.click('button:has-text("Nascimento")');
    
    // Preenche e submete
    const quantidade = '7';
    await page.fill('input[name="quantidade"], input[placeholder*="quantidade" i]', quantidade);
    await page.click('text=Macho');
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[type="date"]', today);
    
    await page.click('button[type="submit"]:has-text("Lançar"), button:has-text("Confirmar")');
    await expect(page.locator('text=sucesso')).toBeVisible({ timeout: 3000 });
    
    // Navega para Extrato
    await page.click('a[href*="extrato"], text=Extrato');
    await page.waitForURL(/.*extrato/);
    
    // Verifica que nascimento aparece na tabela
    await expect(page.locator('text=Nascimento')).toBeVisible();
    await expect(page.locator(`text=${quantidade}`)).toBeVisible();
  });

  test('deve atualizar saldo do rebanho após nascimento', async ({ page }) => {
    // Captura saldo inicial no dashboard
    await page.goto('http://localhost:8080/dashboard');
    const saldoInicial = await page.locator('text=/Total:|Cabeças:/').first().textContent();
    const numeroInicial = parseInt(saldoInicial?.match(/\d+/)?.[0] || '0');
    
    // Registra nascimento
    await page.goto('http://localhost:8080/lancamentos');
    await page.click('button:has-text("Nascimento")');
    
    await page.fill('input[name="quantidade"], input[placeholder*="quantidade" i]', '10');
    await page.click('text=Fêmea');
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[type="date"]', today);
    
    await page.click('button[type="submit"]:has-text("Lançar"), button:has-text("Confirmar")');
    await expect(page.locator('text=sucesso')).toBeVisible({ timeout: 3000 });
    
    // Volta para dashboard
    await page.goto('http://localhost:8080/dashboard');
    
    // Verifica que saldo aumentou
    const saldoFinal = await page.locator('text=/Total:|Cabeças:/').first().textContent();
    const numeroFinal = parseInt(saldoFinal?.match(/\d+/)?.[0] || '0');
    
    expect(numeroFinal).toBeGreaterThan(numeroInicial);
  });

  test('deve permitir capturar foto durante lançamento', async ({ page, context }) => {
    // Grant camera permission
    await context.grantPermissions(['camera']);
    
    await page.goto('http://localhost:8080/lancamentos');
    await page.click('button:has-text("Nascimento")');
    
    // Procura botão de câmera
    const cameraButton = page.locator('button:has-text("Câmera"), button:has([aria-label*="camera" i])');
    
    if (await cameraButton.isVisible()) {
      await cameraButton.click();
      
      // Verifica que componente de câmera abriu
      await expect(page.locator('video, canvas')).toBeVisible({ timeout: 3000 });
    }
  });
});
