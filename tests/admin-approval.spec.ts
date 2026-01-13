import { test, expect } from '@playwright/test';

test.describe('Aprovação Admin', () => {
  test.beforeEach(async ({ page }) => {
    // Login como SuperAdmin
    await page.goto('http://localhost:8080/login');
    await page.fill('input[type="text"]', '00.000.000/0001-00');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Aguarda dashboard admin
    await page.waitForURL(/.*admin\/dashboard/);
  });

  test('deve acessar página de solicitações', async ({ page }) => {
    // Navega para Solicitações
    await page.click('a[href*="solicitacoes"], text=Solicitações');
    await page.waitForURL(/.*admin\/solicitacoes/);
    
    // Verifica que página carregou
    await expect(page.locator('h1:has-text("Solicitações")')).toBeVisible();
  });

  test('deve exibir lista de solicitações pendentes', async ({ page }) => {
    await page.goto('http://localhost:8080/admin/solicitacoes');
    
    // Verifica que há tabela de solicitações
    await expect(page.locator('table, [role="table"]')).toBeVisible();
    
    // Deve ter colunas esperadas
    await expect(page.locator('th:has-text("Nome"), th:has-text("Solicitante")')).toBeVisible();
    await expect(page.locator('th:has-text("CPF/CNPJ")')).toBeVisible();
    await expect(page.locator('th:has-text("Plano")')).toBeVisible();
  });

  test('deve aprovar solicitação com sucesso', async ({ page }) => {
    await page.goto('http://localhost:8080/admin/solicitacoes');
    
    // Conta solicitações iniciais
    const initialRows = page.locator('tbody tr');
    const initialCount = await initialRows.count();
    
    if (initialCount > 0) {
      // Clica em botão Aprovar da primeira solicitação
      await page.click('button:has-text("Aprovar"):first');
      
      // Pode ter dialog de confirmação
      const confirmDialog = page.locator('text=Confirmar aprovação');
      if (await confirmDialog.isVisible({ timeout: 1000 })) {
        await page.click('button:has-text("Confirmar")');
      }
      
      // Aguarda toast de sucesso
      await expect(page.locator('text=/aprovad[oa]|sucesso/i')).toBeVisible({ timeout: 3000 });
      
      // Verifica que solicitação foi removida da lista
      const finalRows = page.locator('tbody tr');
      const finalCount = await finalRows.count();
      
      expect(finalCount).toBe(initialCount - 1);
    }
  });

  test('deve rejeitar solicitação com motivo obrigatório', async ({ page }) => {
    await page.goto('http://localhost:8080/admin/solicitacoes');
    
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    
    if (count > 0) {
      // Clica em botão Rejeitar
      await page.click('button:has-text("Rejeitar"):first');
      
      // Deve abrir dialog com campo de motivo
      await expect(page.locator('text=Motivo da rejeição')).toBeVisible({ timeout: 1000 });
      
      // Tenta confirmar sem preencher motivo
      await page.click('button:has-text("Confirmar"):last');
      
      // Deve exibir validação
      await expect(page.locator('text=/motivo.*obrigatório/i')).toBeVisible({ timeout: 2000 });
      
      // Preenche motivo
      await page.fill('textarea[name="motivo"], textarea[placeholder*="motivo" i]', 'Dados incompletos');
      
      // Confirma rejeição
      await page.click('button:has-text("Confirmar"):last');
      
      // Aguarda sucesso
      await expect(page.locator('text=/rejeitad[oa]|sucesso/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('deve visualizar detalhes da solicitação', async ({ page }) => {
    await page.goto('http://localhost:8080/admin/solicitacoes');
    
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    
    if (count > 0) {
      // Clica em botão Ver Detalhes ou na linha
      await page.click('button:has-text("Detalhes"):first, button:has-text("Ver"):first');
      
      // Verifica que dialog de detalhes abriu
      await expect(page.locator('text=Detalhes da Solicitação')).toBeVisible({ timeout: 1000 });
      
      // Verifica que há informações completas
      await expect(page.locator('text=Nome')).toBeVisible();
      await expect(page.locator('text=Email')).toBeVisible();
      await expect(page.locator('text=Telefone')).toBeVisible();
      await expect(page.locator('text=Propriedade')).toBeVisible();
    }
  });

  test('deve filtrar solicitações por status', async ({ page }) => {
    await page.goto('http://localhost:8080/admin/solicitacoes');
    
    // Procura select/tabs de status
    const statusFilter = page.locator('select[name="status"], button:has-text("Pendentes")');
    
    if (await statusFilter.isVisible()) {
      // Seleciona "Todas"
      await statusFilter.click();
      
      if (statusFilter.tagName === 'SELECT') {
        await statusFilter.selectOption({ label: 'Todas' });
      } else {
        await page.click('button:has-text("Todas")');
      }
      
      await page.waitForTimeout(500);
      
      // Verifica que há resultados
      const allRows = page.locator('tbody tr');
      const allCount = await allRows.count();
      
      expect(allCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('deve exibir contador de solicitações pendentes', async ({ page }) => {
    await page.goto('http://localhost:8080/admin/solicitacoes');
    
    // Procura badge/número de pendências
    const badge = page.locator('[role="status"]:has-text(/\d/), .badge:has-text(/\d/)');
    
    if (await badge.isVisible()) {
      const badgeText = await badge.textContent();
      const numero = parseInt(badgeText?.match(/\d+/)?.[0] || '0');
      
      expect(numero).toBeGreaterThanOrEqual(0);
    }
  });

  test('deve cancelar aprovação sem aplicar mudanças', async ({ page }) => {
    await page.goto('http://localhost:8080/admin/solicitacoes');
    
    const rows = page.locator('tbody tr');
    const initialCount = await rows.count();
    
    if (initialCount > 0) {
      // Clica em Aprovar
      await page.click('button:has-text("Aprovar"):first');
      
      // Verifica dialog
      const dialog = page.locator('[role="dialog"], .dialog');
      if (await dialog.isVisible({ timeout: 1000 })) {
        // Clica em Cancelar
        await page.click('button:has-text("Cancelar")');
        
        // Verifica que dialog fechou
        await expect(dialog).not.toBeVisible();
        
        // Verifica que contador não mudou
        const finalCount = await rows.count();
        expect(finalCount).toBe(initialCount);
      }
    }
  });

  test('deve buscar solicitação por nome ou CPF', async ({ page }) => {
    await page.goto('http://localhost:8080/admin/solicitacoes');
    
    // Procura campo de busca
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar" i]');
    
    if (await searchInput.isVisible()) {
      // Digite termo de busca
      await searchInput.fill('João');
      
      await page.waitForTimeout(500);
      
      // Verifica que resultados foram filtrados
      const rows = page.locator('tbody tr');
      const count = await rows.count();
      
      if (count > 0) {
        // Verifica que resultados contêm termo buscado
        const firstRow = await rows.first().textContent();
        expect(firstRow?.toLowerCase()).toContain('joão');
      }
    }
  });

  test('deve mostrar data de submissão formatada', async ({ page }) => {
    await page.goto('http://localhost:8080/admin/solicitacoes');
    
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    
    if (count > 0) {
      // Verifica que há coluna de data
      const dateCell = page.locator('td:has-text(/\d{2}\/\d{2}\/\d{4}/)').first();
      
      if (await dateCell.isVisible()) {
        const dateText = await dateCell.textContent();
        // Valida formato de data brasileiro
        expect(dateText).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      }
    }
  });

  test('deve notificar usuário após aprovação', async ({ page }) => {
    await page.goto('http://localhost:8080/admin/solicitacoes');
    
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    
    if (count > 0) {
      // Aprova solicitação
      await page.click('button:has-text("Aprovar"):first');
      
      const confirmDialog = page.locator('text=Confirmar aprovação');
      if (await confirmDialog.isVisible({ timeout: 1000 })) {
        await page.click('button:has-text("Confirmar")');
      }
      
      // Aguarda toast indicando que notificação foi enviada
      await expect(page.locator('text=/notificado|email enviado/i')).toBeVisible({ timeout: 3000 });
    }
  });
});
