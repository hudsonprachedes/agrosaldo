import { test, expect } from './_setup';

// Navegação geral cobrindo páginas principais
test.describe('Navegação Geral', () => {
  test.beforeEach(async ({ page }) => {
    // Login como produtor e seleção de propriedade
    await page.goto('/login');
    await page.fill('input[type="text"]', '529.982.247-25');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*property-selection/);
    await page.click('button:has-text("Selecionar"):first');
    await page.waitForURL(/.*dashboard/);
  });

  const rotas = [
    { path: '/dashboard', selector: 'text=Dashboard' },
    { path: '/rebanho', selector: 'text=/Rebanho|Estoque/i' },
    { path: '/extrato', selector: 'table' },
    { path: '/lancamentos', selector: 'text=/Lançamentos|Nascimento/i' },
    { path: '/analytics', selector: 'text=/Analytics|Desempenho/i' },
    { path: '/minha-fazenda', selector: 'text=/Minha Fazenda|Propriedade/i' },
    { path: '/onboarding', selector: 'text=/Onboarding|Bem-vindo/i' },
    { path: '/questionario-epidemiologico', selector: 'text=/Questionário|Epidemiológico/i' },
    { path: '/', selector: 'text=/AgroSaldo|Landing/i' },
    { path: '/blog', selector: 'text=/Blog/i' },
    { path: '/contact', selector: 'text=/Contato|Contact/i' },
  ];

  for (const rota of rotas) {
    test(`deve navegar para ${rota.path}`, async ({ page }) => {
      await page.goto(rota.path);
      await expect(page.locator(rota.selector)).toBeVisible({ timeout: 3000 });
    });
  }

  test('fluxo de cadastro básico (mock)', async ({ page }) => {
    // Se houver formulário de cadastro em Minha Fazenda ou Onboarding, simula preenchimento
    await page.goto('/minha-fazenda');
    const nomeInput = page.locator('input[name="nome"], input[placeholder*="nome" i]');
    const cidadeInput = page.locator('input[name="cidade"], input[placeholder*="cidade" i]');
    const salvarButton = page.locator('button:has-text("Salvar"), button:has-text("Cadastrar")');

    if (await nomeInput.isVisible() && await cidadeInput.isVisible() && await salvarButton.isVisible()) {
      await nomeInput.fill('Fazenda Teste Automatizada');
      await cidadeInput.fill('Campo Grande');
      await salvarButton.click();
      await expect(page.locator('text=/salvo|cadastrad[ao]|sucesso/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('navegação admin (SuperAdmin)', async ({ page }) => {
    // Faz logout e entra como SuperAdmin
    const sair = page.locator('[aria-label="Sair"], button:has-text("Sair")');
    if (await sair.isVisible()) {
      await sair.click();
    } else {
      await page.goto('/login');
    }
    await page.fill('input[type="text"]', '04.252.011/0001-10');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*admin\/dashboard/);

    const adminRotas = [
      { path: '/admin/dashboard', selector: 'text=/Painel SuperAdmin|Dashboard/i' },
      { path: '/admin/solicitacoes', selector: 'text=/Solicitações|Aprovações/i' },
    ];

    for (const rota of adminRotas) {
      await page.goto(rota.path);
      await expect(page.locator(rota.selector)).toBeVisible({ timeout: 3000 });
    }
  });
});
