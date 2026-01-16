import { test, expect } from './_setup';

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/login');
  });

  test('deve fazer login com credenciais válidas de produtor', async ({ page }) => {
    // Preenche formulário de login
    await page.fill('input[type="text"]', '529.982.247-25');
    await page.fill('input[type="password"]', '123456');
    
    // Clica no botão Entrar
    await page.click('button[type="submit"]');
    
    // Aguarda redirecionamento para seleção de propriedade
    await expect(page).toHaveURL(/.*property-selection/);
    
    // Verifica que há propriedades para selecionar
    await expect(page.locator('text=Selecione uma Propriedade')).toBeVisible();
  });

  test('deve fazer login como SuperAdmin', async ({ page }) => {
    // Preenche formulário com credenciais de admin
    await page.fill('input[type="text"]', '04.252.011/0001-10');
    await page.fill('input[type="password"]', 'admin123');
    
    // Clica no botão Entrar
    await page.click('button[type="submit"]');
    
    // SuperAdmin deve ir direto para dashboard admin
    await expect(page).toHaveURL(/.*admin\/dashboard/);
    
    // Verifica elementos do painel admin
    await expect(page.locator('text=Painel SuperAdmin')).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    // Preenche formulário com credenciais incorretas
    await page.fill('input[type="text"]', '999.999.999-99');
    await page.fill('input[type="password"]', 'senhaerrada');
    
    // Clica no botão Entrar
    await page.click('button[type="submit"]');
    
    // Deve exibir toast de erro
    await expect(page.locator('text=CPF/CNPJ ou senha incorretos')).toBeVisible({ timeout: 3000 });
    
    // Deve permanecer na tela de login
    await expect(page).toHaveURL(/.*login/);
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    // Tenta submeter formulário vazio
    await page.click('button[type="submit"]');
    
    // Verifica validação HTML5
    const cpfInput = page.locator('input[type="text"]');
    await expect(cpfInput).toHaveAttribute('required', '');
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('deve fazer logout corretamente', async ({ page }) => {
    // Faz login primeiro
    await page.fill('input[type="text"]', '529.982.247-25');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    
    // Aguarda seleção de propriedade
    await page.waitForURL(/.*property-selection/);
    
    // Seleciona uma propriedade
    await page.click('button:has-text("Selecionar"):first');
    
    // Aguarda dashboard
    await page.waitForURL(/.*dashboard/);
    
    // Procura botão de logout (geralmente com ícone LogOut)
    await page.click('[aria-label="Sair"]');
    
    // Deve voltar para página de login
    await expect(page).toHaveURL(/.*login/);
    
    // Verifica que dados foram limpos (tenta acessar dashboard sem auth)
    await page.goto('http://localhost:8080/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('deve redirecionar para login quando não autenticado', async ({ page }) => {
    // Tenta acessar página protegida diretamente
    await page.goto('http://localhost:8080/dashboard');
    
    // Deve redirecionar para login
    await expect(page).toHaveURL(/.*login/);
  });

  test('deve aceitar CPF com ou sem formatação', async ({ page }) => {
    // Login com CPF formatado
    await page.fill('input[type="text"]', '529.982.247-25');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*property-selection/);
    
    // Volta para login
    await page.goto('http://localhost:8080/login');
    
    // Login com CPF sem formatação
    await page.fill('input[type="text"]', '52998224725');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*property-selection/);
  });

  test('deve manter sessão após reload', async ({ page }) => {
    // Faz login
    await page.fill('input[type="text"]', '529.982.247-25');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/.*property-selection/);
    await page.click('button:has-text("Selecionar"):first');
    await page.waitForURL(/.*dashboard/);
    
    // Recarrega página
    await page.reload();
    
    // Deve permanecer autenticado
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
});
