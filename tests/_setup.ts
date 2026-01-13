import { test as base, expect } from '@playwright/test';

// Fixture that collects console errors and fails tests if any occur
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, useFixture) => {
    const errors: string[] = [];
    
    // Captura erros críticos de JavaScript não tratados
    page.on('pageerror', (err) => {
      // Ignora erros esperados de tratamento de erro
      const errorMsg = String(err);
      if (
        errorMsg.includes('Erro ao') || 
        errorMsg.includes('404 Error:') ||
        errorMsg.includes('Service Worker')
      ) {
        return;
      }
      errors.push(errorMsg);
    });
    
    // Captura console.error apenas de erros não tratados
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignora logs de erro esperados (tratamento de erro)
        if (
          text.includes('Erro ao') ||
          text.includes('404 Error:') ||
          text.includes('Service Worker') ||
          text.includes('Failed to load resource') ||
          text.includes('net::ERR_')
        ) {
          return;
        }
        errors.push(text);
      }
    });
    
    await useFixture(errors);
    
    if (errors.length > 0) {
      throw new Error('Erros críticos de console detectados:\n' + errors.join('\n'));
    }
  },
});

export { expect };
