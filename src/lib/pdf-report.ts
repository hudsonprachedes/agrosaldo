/**
 * Utilitários para geração de relatórios em PDF
 * Gera "Espelho Oficial do Rebanho" e outros documentos
 */

import html2pdf from 'html2pdf.js';

export interface ReportData {
  propertyName: string;
  ownerName: string;
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
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
          line-height: 1.6;
        }
        
        .page {
          width: 210mm;
          height: 297mm;
          padding: 20mm;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #22c55e;
          padding-bottom: 20px;
        }
        
        .header h1 {
          font-size: 28px;
          color: #16a34a;
          margin-bottom: 5px;
        }
        
        .header p {
          font-size: 12px;
          color: #666;
        }
        
        .property-info {
          background: #f0fdf4;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #22c55e;
        }
        
        .property-info h2 {
          font-size: 16px;
          color: #16a34a;
          margin-bottom: 10px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          font-size: 12px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-label {
          color: #666;
          font-weight: 600;
          margin-bottom: 2px;
        }
        
        .info-value {
          color: #333;
          font-weight: bold;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section h3 {
          font-size: 14px;
          color: #16a34a;
          margin-bottom: 12px;
          border-bottom: 2px solid #dcfce7;
          padding-bottom: 8px;
        }
        
        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        
        .table th {
          background: #22c55e;
          color: white;
          padding: 10px;
          text-align: left;
          font-weight: 600;
        }
        
        .table td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
        
        .table tr:nth-child(even) {
          background: #f0fdf4;
        }
        
        .table tr:hover {
          background: #dcfce7;
        }
        
        .table-total {
          background: #22c55e;
          color: white;
          font-weight: 600;
        }
        
        .table-total td {
          border: none;
        }
        
        .summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .summary-card {
          background: #f8fafc;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          text-align: center;
        }
        
        .summary-card .label {
          font-size: 10px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .summary-card .value {
          font-size: 18px;
          font-weight: bold;
          color: #16a34a;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 10px;
          color: #999;
        }
        
        .signature-area {
          margin-top: 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          font-size: 10px;
        }
        
        .signature {
          text-align: center;
        }
        
        .signature-line {
          border-top: 1px solid #333;
          margin-bottom: 5px;
          height: 50px;
        }
        
        .stamp {
          text-align: center;
          margin-top: 40px;
          color: #999;
          font-size: 12px;
          font-style: italic;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .page {
            box-shadow: none;
            margin: 0;
            padding: 15mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        {/* HEADER */}
        <div class="header">
          <h1>🐮 ESPELHO DO REBANHO</h1>
          <p>Relatório Oficial de Estoque Pecuário</p>
          <p>Gerado em ${formatDate(data.generatedAt)}</p>
        </div>
        
        {/* INFORMAÇÕES DA PROPRIEDADE */}
        <div class="property-info">
          <h2>Informações da Propriedade</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Propriedade:</span>
              <span class="info-value">${data.propertyName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Proprietário:</span>
              <span class="info-value">${data.ownerName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Localização:</span>
              <span class="info-value">${data.city}, ${data.state}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Total de Cabeças:</span>
              <span class="info-value">${data.totalCattle.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
        
        {/* RESUMO */}
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
        
        {/* DETALHAMENTO POR FAIXA ETÁRIA */}
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
        
        {/* ASSINATURA */}
        <div class="signature-area">
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
        
        {/* RODAPÉ */}
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
    margin: [10, 10, 10, 10],
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { format: 'a4', orientation: 'portrait' },
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
    margin: [10, 10, 10, 10],
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { format: 'a4', orientation: 'portrait' },
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
