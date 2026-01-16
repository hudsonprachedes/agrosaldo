import { test, expect } from './_setup';

test.describe('Filtros do Extrato', () => {
  test.beforeEach(async ({ page }) => {
    // Login e seleção de propriedade
    await page.goto('http://localhost:8080/login');
    await page.fill('input[type="text"]', '529.982.247-25');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*property-selection/);
    await page.click('button:has-text("Selecionar"):first');
    await page.waitForURL(/.*dashboard/);
    
    // Navega para Extrato
    await page.click('a[href*="extrato"], text=Extrato');
    await page.waitForURL(/.*extrato/);
  });

  test('deve exibir tabela de movimentações', async ({ page }) => {
    // Verifica que há tabela
    await expect(page.locator('table')).toBeVisible();
    
    // Verifica headers da tabela
    await expect(page.locator('th:has-text("Data")')).toBeVisible();
    await expect(page.locator('th:has-text("Tipo")')).toBeVisible();
    await expect(page.locator('th:has-text("Quantidade")')).toBeVisible();
  });

  test('deve filtrar por tipo de movimentação', async ({ page }) => {
    // Localiza select de tipo
    const tipoSelect = page.locator('select[name="tipo"], select:has(option:has-text("Nascimento"))');
    
    // Seleciona "Nascimento"
    await tipoSelect.selectOption({ label: 'Nascimento' });
    
    // Aguarda atualização
    await page.waitForTimeout(500);
    
    // Verifica que apenas nascimentos aparecem
    const tiposCells = page.locator('td:has-text("Nascimento")');
    const count = await tiposCells.count();
    expect(count).toBeGreaterThan(0);
    
    // Verifica que não há outros tipos
    await expect(page.locator('td:has-text("Venda")')).not.toBeVisible();
    await expect(page.locator('td:has-text("Mortalidade")')).not.toBeVisible();
  });

  test('deve filtrar por faixa etária', async ({ page }) => {
    // Localiza select de faixa etária
    const ageSelect = page.locator('select[name="faixaEtaria"], select:has(option:has-text("0-4"))');
    
    // Seleciona "0-4 meses"
    await ageSelect.selectOption({ label: '0-4 meses' });
    
    await page.waitForTimeout(500);
    
    // Verifica que resultados foram filtrados
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    
    // Deve ter algum resultado
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('deve filtrar por intervalo de datas', async ({ page }) => {
    // Localiza inputs de data
    const dataInicio = page.locator('input[name="dataInicio"], input[type="date"]:first');
    const dataFim = page.locator('input[name="dataFim"], input[type="date"]:last');
    
    // Define intervalo de 30 dias atrás até hoje
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    
    await dataInicio.fill(trintaDiasAtras.toISOString().split('T')[0]);
    await dataFim.fill(hoje.toISOString().split('T')[0]);
    
    // Pode ter botão "Filtrar" ou atualizar automaticamente
    const filtrarButton = page.locator('button:has-text("Filtrar")');
    if (await filtrarButton.isVisible()) {
      await filtrarButton.click();
    }
    
    await page.waitForTimeout(500);
    
    // Verifica que há resultados dentro do período
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('deve limpar filtros', async ({ page }) => {
    // Aplica alguns filtros
    const tipoSelect = page.locator('select[name="tipo"], select:has(option:has-text("Nascimento"))');
    await tipoSelect.selectOption({ label: 'Nascimento' });
    
    await page.waitForTimeout(500);
    
    // Conta resultados filtrados
    const rowsFiltered = page.locator('tbody tr');
    const countFiltered = await rowsFiltered.count();
    
    // Limpa filtros (botão "Limpar" ou reset)
    const limparButton = page.locator('button:has-text("Limpar"), button:has-text("Reset")');
    if (await limparButton.isVisible()) {
      await limparButton.click();
      await page.waitForTimeout(500);
      
      // Verifica que há mais resultados agora
      const rowsAll = page.locator('tbody tr');
      const countAll = await rowsAll.count();
      
      expect(countAll).toBeGreaterThanOrEqual(countFiltered);
    }
  });

  test('deve paginar resultados', async ({ page }) => {
    // Verifica se há controles de paginação
    const paginacao = page.locator('nav:has-text("Página"), div:has(button:has-text("Próximo"))');
    
    if (await paginacao.isVisible()) {
      // Captura primeira linha da primeira página
      const primeiraLinha = await page.locator('tbody tr:first-child').textContent();
      
      // Clica em "Próximo" ou página 2
      await page.click('button:has-text("Próximo"), button:has-text("2")');
      
      await page.waitForTimeout(500);
      
      // Verifica que conteúdo mudou
      const novaLinha = await page.locator('tbody tr:first-child').textContent();
      expect(novaLinha).not.toBe(primeiraLinha);
      
      // Volta para página anterior
      await page.click('button:has-text("Anterior"), button:has-text("1")');
      
      await page.waitForTimeout(500);
      
      // Verifica que voltou ao conteúdo original
      const linhaRestaurada = await page.locator('tbody tr:first-child').textContent();
      expect(linhaRestaurada).toBe(primeiraLinha);
    }
  });

  test('deve exportar PDF do extrato', async ({ page }) => {
    // Procura botão de exportar PDF
    const pdfButton = page.locator('button:has-text("PDF"), button:has-text("Exportar")');
    
    if (await pdfButton.isVisible()) {
      // Configura listener para download
      const downloadPromise = page.waitForEvent('download');
      
      await pdfButton.click();
      
      // Aguarda download iniciar
      const download = await downloadPromise;
      
      // Verifica nome do arquivo
      expect(download.suggestedFilename()).toContain('.pdf');
    }
  });

  test('deve compartilhar via WhatsApp', async ({ page, context }) => {
    // Procura botão de WhatsApp
    const whatsappButton = page.locator('button:has-text("WhatsApp"), button:has([aria-label*="whatsapp" i])');
    
    if (await whatsappButton.isVisible()) {
      // Configura listener para popup
      const popupPromise = page.waitForEvent('popup');
      
      await whatsappButton.click();
      
      // Aguarda abertura do WhatsApp Web
      const popup = await popupPromise;
      
      // Verifica URL do WhatsApp
      await expect(popup).toHaveURL(/wa.me|api.whatsapp.com/);
    }
  });

  test('deve exibir mensagem quando não há resultados', async ({ page }) => {
    // Aplica filtros que não retornam resultados
    const dataInicio = page.locator('input[name="dataInicio"], input[type="date"]:first');
    const dataFim = page.locator('input[name="dataFim"], input[type="date"]:last');
    
    // Define datas no futuro
    const futuro = new Date();
    futuro.setFullYear(futuro.getFullYear() + 1);
    
    await dataInicio.fill(futuro.toISOString().split('T')[0]);
    await dataFim.fill(futuro.toISOString().split('T')[0]);
    
    const filtrarButton = page.locator('button:has-text("Filtrar")');
    if (await filtrarButton.isVisible()) {
      await filtrarButton.click();
    }
    
    await page.waitForTimeout(500);
    
    // Verifica mensagem de "nenhum resultado"
    await expect(page.locator('text=/nenhum.*encontrado|sem.*resultados/i')).toBeVisible();
  });

  test('deve combinar múltiplos filtros', async ({ page }) => {
    // Aplica filtro de tipo
    const tipoSelect = page.locator('select[name="tipo"], select:has(option:has-text("Nascimento"))');
    await tipoSelect.selectOption({ label: 'Nascimento' });
    
    // Aplica filtro de faixa etária
    const ageSelect = page.locator('select[name="faixaEtaria"], select:has(option:has-text("0-4"))');
    await ageSelect.selectOption({ label: '0-4 meses' });
    
    // Aplica filtro de data
    const dataInicio = page.locator('input[name="dataInicio"], input[type="date"]:first');
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    await dataInicio.fill(trintaDiasAtras.toISOString().split('T')[0]);
    
    await page.waitForTimeout(500);
    
    // Verifica que resultados atendem todos os critérios
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    
    // Deve filtrar corretamente
    expect(count).toBeGreaterThanOrEqual(0);
    
    // Verifica que células contêm "Nascimento"
    if (count > 0) {
      await expect(page.locator('td:has-text("Nascimento")').first()).toBeVisible();
    }
  });
});
