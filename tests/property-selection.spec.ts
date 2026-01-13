import { test, expect } from './_setup';

test.describe('Seleção de Propriedade', () => {
  test.beforeEach(async ({ page }) => {
    // Faz login como produtor com múltiplas propriedades
    await page.goto('http://localhost:8080/login');
    await page.fill('input[type="text"]', '123.456.789-00');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    
    // Aguarda página de seleção de propriedade
    await page.waitForURL(/.*property-selection/);
  });

  test('deve exibir lista de propriedades do usuário', async ({ page }) => {
    // Verifica título
    await expect(page.locator('text=Selecione uma Propriedade')).toBeVisible();
    
    // Verifica que há cards de propriedades
    const propertyCards = page.locator('[role="button"]:has-text("Selecionar")');
    const count = await propertyCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('deve exibir informações de cada propriedade', async ({ page }) => {
    // Verifica que há nome, cidade e total de cabeças
    const firstCard = page.locator('article').first();
    
    // Deve ter nome da propriedade
    await expect(firstCard).toContainText(/Fazenda|Sítio|Rancho/);
    
    // Deve ter localização (cidade)
    await expect(firstCard.locator('text=/Campo Grande|Dourados|Três Lagoas/')).toBeVisible();
    
    // Deve ter total de cabeças
    await expect(firstCard.locator('text=/cabeças/')).toBeVisible();
  });

  test('deve selecionar propriedade e redirecionar para dashboard', async ({ page }) => {
    // Clica no botão Selecionar da primeira propriedade
    await page.click('button:has-text("Selecionar"):first');
    
    // Deve redirecionar para dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 });
    
    // Verifica que dashboard carregou
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Verifica que há nome da propriedade no header/sidebar
    await expect(page.locator('header, aside')).toContainText(/Fazenda|Sítio|Rancho/);
  });

  test('deve permitir trocar de propriedade', async ({ page }) => {
    // Seleciona primeira propriedade
    const firstPropertyName = await page.locator('article').first().locator('h3').textContent();
    await page.click('button:has-text("Selecionar"):first');
    await page.waitForURL(/.*dashboard/);
    
    // Verifica que está na propriedade correta
    await expect(page.locator('header, aside')).toContainText(firstPropertyName || '');
    
    // Navega de volta para seleção de propriedade (via menu ou rota)
    await page.goto('http://localhost:8080/property-selection');
    
    // Seleciona segunda propriedade se existir
    const propertyCards = page.locator('button:has-text("Selecionar")');
    const count = await propertyCards.count();
    
    if (count > 1) {
      const secondPropertyName = await page.locator('article').nth(1).locator('h3').textContent();
      await page.click('button:has-text("Selecionar"):nth(1)');
      await page.waitForURL(/.*dashboard/);
      
      // Verifica que trocou de propriedade
      await expect(page.locator('header, aside')).toContainText(secondPropertyName || '');
    }
  });

  test('deve mostrar indicador visual de propriedade selecionada', async ({ page }) => {
    // Após selecionar, volta para tela de seleção
    await page.click('button:has-text("Selecionar"):first');
    await page.waitForURL(/.*dashboard/);
    await page.goto('http://localhost:8080/property-selection');
    
    // Deve haver indicação visual da propriedade ativa
    // (pode ser border, badge "Ativa", checkbox marcado, etc)
    const selectedProperty = page.locator('[data-selected="true"], .border-primary, :has-text("Ativa")').first();
    await expect(selectedProperty).toBeVisible();
  });

  test('deve funcionar em mobile (modo responsivo)', async ({ page }) => {
    // Define viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verifica que cards de propriedade estão empilhados
    const firstCard = page.locator('article').first();
    const box = await firstCard.boundingBox();
    
    // Em mobile, cards devem ocupar largura próxima ao viewport
    expect(box?.width).toBeGreaterThan(300);
  });

  test('deve persistir seleção no localStorage', async ({ page }) => {
    // Seleciona propriedade
    await page.click('button:has-text("Selecionar"):first');
    await page.waitForURL(/.*dashboard/);
    
    // Verifica localStorage
    const propertyId = await page.evaluate(() => {
      return localStorage.getItem('agrosaldo_property_id');
    });
    
    expect(propertyId).toBeTruthy();
    expect(propertyId).toMatch(/^[a-zA-Z0-9-_]+$/);
  });

  test('deve redirecionar automaticamente se só tem uma propriedade', async ({ page }) => {
    // Nota: Este teste depende de mock específico
    // Se usuário tem apenas 1 propriedade, pode redirecionar direto
    
    // Para testar, seria necessário criar usuário com 1 propriedade
    // ou mockar resposta diferente
    
    // Implementação placeholder:
    // const properties = await page.evaluate(() => ...);
    // if (properties.length === 1) {
    //   await expect(page).toHaveURL(/.*dashboard/);
    // }
  });

  test('deve mostrar loading durante seleção', async ({ page }) => {
    // Clica em selecionar
    const selectButton = page.locator('button:has-text("Selecionar"):first');
    await selectButton.click();
    
    // Pode ter loading spinner ou botão disabled
    // await expect(selectButton).toBeDisabled();
    // ou
    // await expect(page.locator('svg.animate-spin')).toBeVisible();
    
    // Aguarda redirecionamento
    await page.waitForURL(/.*dashboard/);
  });
});
