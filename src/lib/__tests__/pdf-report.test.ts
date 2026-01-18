import { describe, it, expect, jest } from '@jest/globals';
import { generateReportHTML, generatePDFBlob, formatDate } from '../pdf-report';

// Mock do html2pdf
jest.mock('html2pdf.js', () => ({
  default: jest.fn(() => ({
    set: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    save: jest.fn(async () => undefined),
    outputPdf: jest.fn(async () => new Blob(['mock pdf'], { type: 'application/pdf' })),
  })),
}), { virtual: true });

describe('generateReportHTML', () => {
  const mockData = {
    propertyName: 'Fazenda Santa Maria',
    ownerName: 'João Pedro Mendes',
    city: 'Campo Grande',
    state: 'MS',
    generatedAt: '2024-01-15 14:30',
    totalCattle: 850,
    balances: [
      { ageGroup: '0-4 meses', male: 50, female: 60, total: 110 },
      { ageGroup: '5-12 meses', male: 80, female: 90, total: 170 },
      { ageGroup: '13-24 meses', male: 100, female: 120, total: 220 },
      { ageGroup: '25-36 meses', male: 90, female: 110, total: 200 },
      { ageGroup: '36+ meses', male: 50, female: 100, total: 150 },
    ],
    monthlyBirths: 25,
    monthlyDeaths: 3,
    monthlyRevenue: 45000,
  };

  it('deve gerar HTML com o nome da propriedade', () => {
    const html = generateReportHTML(mockData);
    expect(html).toContain('Fazenda Santa Maria');
  });

  it('deve incluir nome do proprietário', () => {
    const html = generateReportHTML(mockData);
    expect(html).toContain('João Pedro Mendes');
  });

  it('deve incluir cidade e estado', () => {
    const html = generateReportHTML(mockData);
    expect(html).toContain('Campo Grande');
    expect(html).toContain('MS');
  });

  it('deve incluir data de geração', () => {
    const html = generateReportHTML(mockData);
    expect(html).toContain(formatDate(mockData.generatedAt));
  });

  it('deve incluir total de cabeças', () => {
    const html = generateReportHTML(mockData);
    expect(html).toContain('850');
  });

  it('deve incluir todas as faixas etárias', () => {
    const html = generateReportHTML(mockData);
    expect(html).toContain('0-4 meses');
    expect(html).toContain('5-12 meses');
    expect(html).toContain('13-24 meses');
    expect(html).toContain('25-36 meses');
    expect(html).toContain('36+ meses');
  });

  it('deve incluir dados de machos e fêmeas para cada faixa', () => {
    const html = generateReportHTML(mockData);
    
    // Verifica se os números aparecem no HTML
    mockData.balances.forEach(balance => {
      expect(html).toContain(balance.male.toString());
      expect(html).toContain(balance.female.toString());
      expect(html).toContain(balance.total.toString());
    });
  });

  it('deve calcular e exibir totais gerais', () => {
    const html = generateReportHTML(mockData);
    
    const totalMale = mockData.balances.reduce((sum, b) => sum + b.male, 0);
    const totalFemale = mockData.balances.reduce((sum, b) => sum + b.female, 0);
    
    expect(html).toContain(totalMale.toString());
    expect(html).toContain(totalFemale.toString());
  });

  it('deve incluir métricas opcionais quando fornecidas', () => {
    const html = generateReportHTML(mockData);
    expect(html).toContain('25'); // monthlyBirths
    expect(html).toContain('3'); // monthlyDeaths
  });

  it('deve gerar HTML válido com tags essenciais', () => {
    const html = generateReportHTML(mockData);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('<head>');
    expect(html).toContain('<body>');
    expect(html).toContain('</html>');
  });

  it('deve incluir meta charset UTF-8', () => {
    const html = generateReportHTML(mockData);
    expect(html).toContain('charset="UTF-8"');
  });

  it('deve incluir título com nome da propriedade', () => {
    const html = generateReportHTML(mockData);
    expect(html).toContain('<title>Espelho do Rebanho - Fazenda Santa Maria</title>');
  });

  it('deve incluir estilos CSS', () => {
    const html = generateReportHTML(mockData);
    expect(html).toContain('<style>');
    expect(html).toContain('font-family');
    expect(html).toContain('color');
  });

  it('deve funcionar com dados mínimos', () => {
    const minimalData = {
      propertyName: 'Teste',
      ownerName: 'Teste',
      city: 'Teste',
      state: 'MS',
      generatedAt: '2024-01-01',
      totalCattle: 0,
      balances: [],
    };
    
    const html = generateReportHTML(minimalData);
    expect(html).toContain('Teste');
    expect(html).toBeTruthy();
    expect(html.length).toBeGreaterThan(100);
  });

  it('deve lidar com valores zerados', () => {
    const zeroData = {
      ...mockData,
      balances: [
        { ageGroup: '0-4 meses', male: 0, female: 0, total: 0 },
      ],
    };
    
    const html = generateReportHTML(zeroData);
    expect(html).toBeTruthy();
  });
});

describe('generatePDFBlob', () => {
  it('deve retornar uma Promise que resolve com Blob', async () => {
    const mockData = {
      propertyName: 'Fazenda Teste',
      ownerName: 'Teste',
      city: 'Teste',
      state: 'MS',
      generatedAt: '2024-01-01',
      totalCattle: 100,
      balances: [
        { ageGroup: '0-4 meses', male: 50, female: 50, total: 100 },
      ],
    };

    const result = await generatePDFBlob(mockData);
    expect(result).toBeInstanceOf(Blob);
  });

  it('deve gerar Blob do tipo application/pdf', async () => {
    const mockData = {
      propertyName: 'Fazenda Teste',
      ownerName: 'Teste',
      city: 'Teste',
      state: 'MS',
      generatedAt: '2024-01-01',
      totalCattle: 100,
      balances: [],
    };

    const blob = await generatePDFBlob(mockData);
    expect(blob.type).toBe('application/pdf');
  });

  it('não deve lançar erro com dados válidos', async () => {
    const mockData = {
      propertyName: 'Fazenda Teste',
      ownerName: 'Teste',
      city: 'Teste',
      state: 'MS',
      generatedAt: '2024-01-01',
      totalCattle: 100,
      balances: [
        { ageGroup: '0-4 meses', male: 10, female: 15, total: 25 },
      ],
    };

    await expect(generatePDFBlob(mockData)).resolves.toBeTruthy();
  });
});
