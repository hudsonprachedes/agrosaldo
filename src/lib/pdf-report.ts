/**
 * Utilitários para geração de relatórios em PDF
 * Gera "Espelho Oficial do Rebanho" e outros documentos
 */

import html2pdf from 'html2pdf.js';

export interface ReportData {
  propertyName: string;
  ownerName: string;
  ownerDocument?: string;
  stateRegistration?: string;
  propertyCode?: string;
  city: string;
  state: string;
  generatedAt: string;
  totalCattle: number;
  balances: Array<{
    ageGroup: string;
    male: number;
    female: number;
    total: number;
  }>;
  otherSpecies?: Array<{
    name: string;
    balance: number;
    entries: number;
    exits: number;
    unit: string;
  }>;
  monthlyBirths?: number;
  monthlyDeaths?: number;
  monthlyRevenue?: number;
}

/**
 * Gerar HTML do relatório
 */
export function generateReportHTML(data: ReportData): string {
  const totalMale = data.balances.reduce((sum, b) => sum + b.male, 0);
  const totalFemale = data.balances.reduce((sum, b) => sum + b.female, 0);

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Espelho do Rebanho - ${data.propertyName}</title>
      <style>
        :root {
          color-scheme: only light;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: "Times New Roman", Georgia, serif;
          color: #1f2937;
          line-height: 1.4;
          background: #f3f4f6;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 18mm 16mm 16mm;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #111827;
        }

        .page + .page {
          page-break-before: always;
          margin-top: 12mm;
        }

        .header {
          display: grid;
          grid-template-columns: 96px 1fr 140px;
          align-items: center;
          gap: 12px;
          border-bottom: 2px solid #111827;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .seal {
          width: 84px;
          height: 84px;
          border: 2px solid #111827;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          text-align: center;
          font-weight: 700;
          letter-spacing: 0.6px;
          line-height: 1.2;
        }

        .seal img {
          width: 70px !important;
          height: 70px !important;
          max-width: 70px;
          max-height: 70px;
          border-radius: 50%;
          object-fit: cover;
        }

        .header-title {
          text-align: center;
        }

        .header-title h1 {
          font-size: 20px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .header-title p {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .header-meta {
          font-size: 10px;
          text-align: right;
          line-height: 1.5;
        }

        .header-meta strong {
          font-size: 11px;
          text-transform: uppercase;
        }

        .property-info {
          border: 1px solid #111827;
          padding: 12px;
          margin-bottom: 14px;
        }

        .property-info h2 {
          font-size: 12px;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          margin-bottom: 8px;
          border-bottom: 1px solid #111827;
          padding-bottom: 6px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 8px 16px;
          font-size: 11px;
        }

        .info-item {
          display: grid;
          grid-template-columns: 110px 1fr;
          gap: 8px;
        }

        .info-label {
          font-weight: 700;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.4px;
          color: #111827;
        }

        .info-value {
          font-weight: 600;
          color: #111827;
        }

        .section {
          margin-bottom: 16px;
        }

        .section h3 {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 8px;
          border-bottom: 1px solid #111827;
          padding-bottom: 4px;
        }

        .summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .official-block {
          border: 1px solid #111827;
          padding: 10px;
          margin-top: 10px;
          font-size: 10px;
        }

        .official-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .official-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .official-item span:first-child {
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.4px;
          font-size: 9px;
        }

        .summary-card {
          border: 1px solid #111827;
          padding: 8px;
          text-align: center;
          font-size: 10px;
        }

        .summary-card .label {
          text-transform: uppercase;
          letter-spacing: 0.6px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .summary-card .value {
          font-size: 16px;
          font-weight: 700;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }

        .table th,
        .table td {
          border: 1px solid #111827;
          padding: 6px 6px;
        }

        .table th {
          background: #e5e7eb;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 9px;
        }

        .table td {
          background: #fff;
        }

        .table-total td {
          font-weight: 700;
          background: #f3f4f6;
        }

        .signature-area {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-top: 18px;
        }

        .signature-stamp {
          border: 1px solid #111827;
          padding: 10px;
          font-size: 9px;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .signature {
          text-align: center;
          font-size: 10px;
        }

        .signature-line {
          border-top: 1px solid #111827;
          margin-bottom: 6px;
          height: 30px;
        }

        .footer {
          margin-top: 18px;
          border-top: 1px solid #111827;
          padding-top: 8px;
          font-size: 9px;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        @media print {
          body {
            background: #fff;
          }

          .page {
            border: none;
            padding: 14mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="seal">
            <img src="/agrosaldo-logo.png" alt="Selo AgroSaldo" width="70" height="70" style="width: 70px; height: 70px;" />
          </div>
          <div class="header-title">
            <h1>Espelho Oficial do Rebanho</h1>
            <p>Controle de Estoque Pecuário</p>
          </div>
          <div class="header-meta">
            <strong>Documento nº</strong><br/>
            ${(data.propertyCode || data.propertyName.toUpperCase().slice(0, 3))}-${new Date().getFullYear()}<br/>
            <strong>Emissão</strong><br/>
            ${formatDate(data.generatedAt)}
          </div>
        </div>

        <div class="property-info">
          <h2>Dados da Propriedade</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Propriedade</span>
              <span class="info-value">${data.propertyName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Responsável</span>
              <span class="info-value">${data.ownerName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Localização</span>
              <span class="info-value">${data.city}, ${data.state}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Total de Cabeças</span>
              <span class="info-value">${data.totalCattle.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h3>Resumo Geral</h3>
          <div class="summary">
            <div class="summary-card">
              <div class="label">Total</div>
              <div class="value">${data.totalCattle.toLocaleString('pt-BR')}</div>
            </div>
            <div class="summary-card">
              <div class="label">Machos</div>
              <div class="value">${totalMale.toLocaleString('pt-BR')}</div>
            </div>
            <div class="summary-card">
              <div class="label">Fêmeas</div>
              <div class="value">${totalFemale.toLocaleString('pt-BR')}</div>
            </div>
            <div class="summary-card">
              <div class="label">Taxa Macho/Fêmea</div>
              <div class="value">${((totalMale / totalFemale) * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <div class="official-block">
          <div class="official-grid">
            <div class="official-item">
              <span>CPF/CNPJ do Responsável</span>
              <span>${data.ownerDocument || 'Não informado'}</span>
            </div>
            <div class="official-item">
              <span>Inscrição Estadual</span>
              <span>${data.stateRegistration || 'Não informado'}</span>
            </div>
            <div class="official-item">
              <span>Código da Propriedade</span>
              <span>${data.propertyCode || 'Não informado'}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="page">
        <div class="section">
          <h3>Detalhamento por Faixa Etária</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Faixa Etária</th>
                <th style="text-align: center;">Machos</th>
                <th style="text-align: center;">Fêmeas</th>
                <th style="text-align: center;">Total</th>
                <th style="text-align: center;">%</th>
              </tr>
            </thead>
            <tbody>
              ${data.balances.map(balance => `
                <tr>
                  <td>${balance.ageGroup}</td>
                  <td style="text-align: right;">${balance.male.toLocaleString('pt-BR')}</td>
                  <td style="text-align: right;">${balance.female.toLocaleString('pt-BR')}</td>
                  <td style="text-align: right;">${balance.total.toLocaleString('pt-BR')}</td>
                  <td style="text-align: right;">${((balance.total / data.totalCattle) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
              <tr class="table-total">
                <td>TOTAL</td>
                <td style="text-align: right;">${totalMale.toLocaleString('pt-BR')}</td>
                <td style="text-align: right;">${totalFemale.toLocaleString('pt-BR')}</td>
                <td style="text-align: right;">${data.totalCattle.toLocaleString('pt-BR')}</td>
                <td style="text-align: right;">100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        ${data.otherSpecies && data.otherSpecies.length > 0 ? `
          <div class="section">
            <h3>🐾 Outras Espécies</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Espécie</th>
                  <th style="text-align: center;">Saldo Anterior</th>
                  <th style="text-align: center;">Entradas</th>
                  <th style="text-align: center;">Saídas</th>
                  <th style="text-align: center;">Saldo Atual</th>
                  <th style="text-align: center;">Unidade</th>
                </tr>
              </thead>
              <tbody>
                ${data.otherSpecies.map(species => `
                  <tr>
                    <td>${species.name}</td>
                    <td style="text-align: right;">${(species.balance - species.entries + species.exits).toLocaleString('pt-BR')}</td>
                    <td style="text-align: right; color: #22c55e;">+${species.entries.toLocaleString('pt-BR')}</td>
                    <td style="text-align: right; color: #ef4444;">-${species.exits.toLocaleString('pt-BR')}</td>
                    <td style="text-align: right; font-weight: bold;">${species.balance.toLocaleString('pt-BR')}</td>
                    <td style="text-align: center;">${species.unit}</td>
                  </tr>
                `).join('')}
                <tr class="table-total">
                  <td>TOTAL</td>
                  <td style="text-align: right;">${data.otherSpecies.reduce((sum, s) => sum + (s.balance - s.entries + s.exits), 0).toLocaleString('pt-BR')}</td>
                  <td style="text-align: right;">${data.otherSpecies.reduce((sum, s) => sum + s.entries, 0).toLocaleString('pt-BR')}</td>
                  <td style="text-align: right;">${data.otherSpecies.reduce((sum, s) => sum + s.exits, 0).toLocaleString('pt-BR')}</td>
                  <td style="text-align: right;">${data.otherSpecies.reduce((sum, s) => sum + s.balance, 0).toLocaleString('pt-BR')}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        ` : ''}
        
        ${data.monthlyBirths || data.monthlyDeaths || data.monthlyRevenue ? `
          <div class="section">
            <h3>Movimento do Mês</h3>
            <div class="summary">
              ${data.monthlyBirths !== undefined ? `
                <div class="summary-card">
                  <div class="label">Nascimentos</div>
                  <div class="value" style="color: #22c55e;">${data.monthlyBirths.toLocaleString('pt-BR')}</div>
                </div>
              ` : ''}
              ${data.monthlyDeaths !== undefined ? `
                <div class="summary-card">
                  <div class="label">Mortes</div>
                  <div class="value" style="color: #ef4444;">${data.monthlyDeaths.toLocaleString('pt-BR')}</div>
                </div>
              ` : ''}
              ${data.monthlyRevenue !== undefined ? `
                <div class="summary-card" style="grid-column: span 2;">
                  <div class="label">Receita do Mês</div>
                  <div class="value" style="color: #3b82f6;">R$ ${data.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
        
        <div class="signature-area">
          <div class="signature-stamp">
            <strong>Assinatura Digital</strong>
            <p>Documento autenticado por AgroSaldo</p>
            <p>Código de validação: ${data.propertyCode || 'AGRO'}-${new Date().getFullYear()}</p>
          </div>
          <div class="signature">
            <div class="signature-line"></div>
            <strong>${data.ownerName}</strong>
            <p>Proprietário</p>
          </div>
          <div class="signature">
            <div class="signature-line"></div>
            <strong>Gestor/Operador</strong>
            <p>Responsável pelo Registro</p>
          </div>
        </div>
        
        <div class="footer">
          <p>Este documento foi gerado automaticamente pelo AgroSaldo</p>
          <p>Documento válido para consulta pessoal e gestão interna</p>
          <p>Para fins comerciais, apresentar GTA oficial</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

/**
 * Gerar PDF a partir de dados
 */
export async function generatePDF(
  data: ReportData,
  fileName: string = 'espelho-rebanho.pdf'
): Promise<void> {
  const html = generateReportHTML(data);
  
  const options = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: fileName,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { format: 'a4' as const, orientation: 'portrait' as const },
  };

  try {
    await html2pdf().set(options).from(html).save();
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error('Erro ao gerar PDF. Tente novamente.');
  }
}

/**
 * Gerar PDF e retornar como Blob (para envio)
 */
export async function generatePDFBlob(data: ReportData): Promise<Blob> {
  const html = generateReportHTML(data);
  
  const options = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { format: 'a4' as const, orientation: 'portrait' as const },
  };

  return new Promise((resolve, reject) => {
    html2pdf()
      .set(options)
      .from(html)
      .outputPdf('blob')
      .then((blob: Blob) => {
        resolve(blob);
      })
      .catch((error) => {
        console.error('Erro ao gerar PDF:', error);
        reject(error);
      });
  });
}

/**
 * Formatar data em português
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  
  // Verificar se a data é válida
  if (isNaN(date.getTime())) {
    return new Date().toLocaleString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Abrir PDF em nova aba
 */
export async function openPDFInNewTab(data: ReportData): Promise<void> {
  const html = generateReportHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

/**
 * Imprimir relatório usando o navegador
 * Gera PDF com texto selecionável e melhor qualidade
 */
export function printReport(data: ReportData): void {
  const html = generateReportHTML(data);
  
  // Adicionar script para imprimir automaticamente
  const htmlWithPrintScript = html.replace('</body>', `
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 500);
      };
    </script>
    </body>
  `);

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlWithPrintScript);
    printWindow.document.close();
  } else {
    alert('Por favor, permita pop-ups para imprimir o relatório.');
  }
}
