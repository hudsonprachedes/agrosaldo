/**
 * Utilitários para geração de relatórios em PDF (Layout Oficial A4)
 * Gera "Espelho Oficial do Rebanho" com qualidade vetorial e texto selecionável
 */

export interface ReportData {
  propertyName: string;
  ownerName: string;
  ownerDocument?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  stateRegistration?: string;
  propertyCode?: string;
  propertyAddress?: string;
  propertyCep?: string;
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
  latestSurvey?: {
    submittedAt: string;
    nextDueAt: string;
    answers: Array<{ fieldId: string; value: string | string[] | number | boolean }>;
  };

  includeSurvey?: boolean;

  reportHash?: string;
  qrCodePayload?: string;
  qrCodeDataUrl?: string;
}

export interface ExtractData {
  propertyName: string;
  ownerName: string;
  period: string;
  filters: string;
  generatedAt: string;
  movements: Array<{
    date: string;
    type: string;
    typeLabel: string;
    description: string;
    sexLabel?: string;
    ageGroupLabel?: string;
    quantity: number;
    value?: number;
  }>;
  summary: {
    totalEntries: number;
    totalExits: number;
    balance: number;
  };
}

/**
 * Formatar data em português
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date);
}

/**
 * Gerar HTML do relatório com Layout A4 Profissional (Papel Timbrado)
 */
export function generateReportHTML(data: ReportData): string {
  const totalMale = data.balances.reduce((sum, b) => sum + b.male, 0);
  const totalFemale = data.balances.reduce((sum, b) => sum + b.female, 0);

  const reportHash = (data.reportHash || Math.random().toString(36).substring(2, 10)).toUpperCase();
  const qrCodePayload = data.qrCodePayload || `agrosaldo://espelho-oficial?property=${encodeURIComponent(data.propertyCode || data.propertyName)}&hash=${encodeURIComponent(reportHash)}`;

  const surveyFieldLabels: Record<string, string> = {
    a_email: 'E-mail',
    a_telefone: 'Telefone',
    b_area_pastagem_cultivada_ha: 'Área de pastagem cultivada (ha)',
    b_area_pastagem_natural_ha: 'Área de pastagem natural (ha)',
    b_quantidade_vacas_leiteiras: 'Quantidade de vacas leiteiras (secas + lactação)',
    b_finalidade_criacao_bovinos: 'Finalidade da criação de bovinos',
    b_ordenha: 'Como é feita a ordenha?',
    b_ordenha_vezes_ao_dia: 'Quantas vezes por dia realiza a ordenha?',
    c_contato_com_javalis: 'Contato com javalis e cruzados?',
    d_aves_acesso_agua: 'Aves com acesso a espelho d’água?',
    d_aves_contato_silvestres: 'Aves domésticas com contato silvestre?',
    e_mordedura_morcego_ultimos_6_meses: 'Mordedura por morcego nos últimos 6 meses?',
  };

  const formatSurveyField = (fieldId: string): string => {
    const mapped = surveyFieldLabels[fieldId];
    if (mapped) return mapped;
    return String(fieldId || '').replace(/_/g, ' ').trim() || fieldId;
  };

  const formatSurveyValue = (value: unknown): string => {
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.join(', ');

    const asString = String(value ?? '');
    const enumMap: Record<string, string> = {
      nao_se_aplica: 'Não se aplica',
      mecanica: 'Mecânica',
      manual: 'Manual',
      uma: 'Uma',
      duas: 'Duas',
      tres: 'Três',
      leite: 'Leite',
      corte: 'Corte',
      mista: 'Mista',
      sim: 'Sim',
      nao: 'Não',
    };
    return enumMap[asString] ?? asString;
  };

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Espelho Oficial - ${data.propertyName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Merriweather:wght@400;700&display=swap');

        :root {
          --primary: #166534; /* green-800 */
          --border: #e5e7eb;
          --text: #1f2937;
          --text-light: #6b7280;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page {
          size: A4;
          margin: 15mm;
        }

        body {
          font-family: 'Inter', sans-serif;
          color: var(--text);
          line-height: 1.5;
          background: #fff;
          font-size: 12px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* Estrutura de Papel Timbrado */
        .page-container {
          width: 100%;
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          padding: 0;
        }

        /* Cabeçalho Institucional */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 3px solid var(--primary);
          padding-bottom: 15px;
          margin-bottom: 25px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .logo {
          width: 60px !important;
          height: 60px !important;
          object-fit: contain;
        }

        .brand-text h1 {
          font-family: 'Merriweather', serif;
          color: var(--primary);
          font-size: 22px;
          font-weight: 900;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .brand-text p {
          color: var(--text-light);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 2px;
        }

        .doc-meta {
          text-align: right;
          font-size: 10px;
          color: var(--text-light);
        }

        .doc-meta strong {
          display: block;
          color: var(--text);
          font-size: 11px;
          margin-bottom: 2px;
        }

        /* Seções */
        .section {
          margin-bottom: 25px;
        }

        .section-title {
          font-family: 'Merriweather', serif;
          font-size: 14px;
          color: var(--primary);
          border-bottom: 1px solid var(--border);
          padding-bottom: 5px;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Grid de Informações */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          background: #f9fafb;
          padding: 15px;
          border-radius: 4px;
          border: 1px solid var(--border);
        }

        .info-item label {
          display: block;
          font-size: 9px;
          text-transform: uppercase;
          color: var(--text-light);
          margin-bottom: 2px;
          font-weight: 600;
        }

        .info-item span {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }

        /* Cards de Resumo */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .summary-card {
          border: 1px solid var(--border);
          padding: 12px;
          text-align: center;
          border-radius: 4px;
        }

        .summary-card.highlight {
          background-color: #f0fdf4;
          border-color: #bbf7d0;
        }

        .summary-card .label {
          font-size: 10px;
          text-transform: uppercase;
          color: var(--text-light);
          margin-bottom: 5px;
        }

        .summary-card .value {
          font-size: 18px;
          font-weight: 700;
          color: var(--primary);
        }

        /* Tabelas Oficiais */
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }

        th {
          background-color: #f3f4f6;
          color: var(--text);
          font-weight: 700;
          text-transform: uppercase;
          font-size: 9px;
          padding: 8px 10px;
          text-align: left;
          border: 1px solid var(--border);
        }

        td {
          padding: 8px 10px;
          border: 1px solid var(--border);
          color: var(--text);
        }

        tr:nth-child(even) { background-color: #fcfcfc; }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }

        /* Rodapé Oficial */
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .signature-box {
          text-align: center;
          width: 200px;
        }

        .signature-line {
          border-top: 1px solid black;
          margin-bottom: 5px;
        }

        .system-info {
          font-size: 9px;
          color: var(--text-light);
          text-align: right;
        }

        .qr-code {
          width: 60px;
          height: 60px;
          object-fit: contain;
          background: #fff;
          border: 1px solid var(--border);
          padding: 2px;
          margin-left: auto;
          display: block;
        }

        .qr-placeholder {
          width: 60px;
          height: 60px;
          background: #f3f4f6;
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: var(--text-light);
          margin-left: auto;
        }

        /* Impressão */
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <div class="page-container">
        <!-- CABEÇALHO -->
        <header class="header">
          <div class="brand">
            <img src="/agrosaldo-logo.png" alt="Logo" class="logo" />
            <div class="brand-text">
              <h1>AgroSaldo</h1>
              <p>Gestão Pecuária Inteligente</p>
            </div>
          </div>
          <div class="doc-meta">
            <div class="info-item">
              <strong>DOCUMENTO Nº</strong>
              ${(data.propertyCode || data.propertyName.substring(0, 3)).toUpperCase()}-${new Date().getFullYear()}/${new Date().getMonth() + 1}
            </div>
            <div class="info-item" style="margin-top: 8px;">
              <strong>EMISSÃO</strong>
              ${formatDate(data.generatedAt)}
            </div>
          </div>
        </header>

        <!-- DADOS CADASTRAIS -->
        <div class="section">
          <h3 class="section-title">Dados da Propriedade e Responsável</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>PROPRIEDADE</label>
              <span>${data.propertyName}</span>
            </div>
            <div class="info-item">
              <label>RESPONSÁVEL TÉCNICO / PROPRIETÁRIO</label>
              <span>${data.ownerName}</span>
            </div>
            <div class="info-item">
              <label>LOCALIZAÇÃO</label>
              <span>${data.city} - ${data.state}</span>
            </div>
            <div class="info-item">
              <label>DOCUMENTO (CPF/CNPJ)</label>
              <span>${data.ownerDocument || 'Não informado'}</span>
            </div>
            <div class="info-item">
              <label>INSCRIÇÃO ESTADUAL</label>
              <span>${data.stateRegistration || 'Não informado'}</span>
            </div>
            <div class="info-item">
              <label>CONTATO</label>
              <span>${[data.ownerEmail, data.ownerPhone].filter(Boolean).join(' | ') || 'Não informado'}</span>
            </div>
            <div class="info-item">
              <label>ENDEREÇO</label>
              <span>${data.propertyAddress || 'Não informado'}</span>
            </div>
            <div class="info-item">
              <label>CEP</label>
              <span>${data.propertyCep || 'Não informado'}</span>
            </div>
          </div>
        </div>

        <!-- RESUMO EXECUTIVO -->
        <div class="section">
          <h3 class="section-title">Resumo do Rebanho</h3>
          <div class="summary-grid">
            <div class="summary-card highlight">
              <div class="label">Total Geral</div>
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
              <div class="label">Relação M/F</div>
              <div class="value">${totalFemale > 0 ? (totalMale / totalFemale).toFixed(2) : '0'}</div>
            </div>
          </div>
        </div>

        <!-- TABELA DETALHADA -->
        <div class="section">
          <h3 class="section-title">Detalhamento por Faixa Etária (Bovinos)</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 40%">Faixa Etária</th>
                <th class="text-right">Machos</th>
                <th class="text-right">Fêmeas</th>
                <th class="text-right">Total</th>
                <th class="text-right">Part. %</th>
              </tr>
            </thead>
            <tbody>
              ${data.balances.map(b => `
                <tr>
                  <td>${b.ageGroup}</td>
                  <td class="text-right">${b.male.toLocaleString('pt-BR')}</td>
                  <td class="text-right">${b.female.toLocaleString('pt-BR')}</td>
                  <td class="text-right font-bold">${b.total.toLocaleString('pt-BR')}</td>
                  <td class="text-right">${data.totalCattle > 0 ? ((b.total / data.totalCattle) * 100).toFixed(1) : 0}%</td>
                </tr>
              `).join('')}
              <tr style="background-color: #f3f4f6; font-weight: 700;">
                <td>TOTAIS</td>
                <td class="text-right">${totalMale.toLocaleString('pt-BR')}</td>
                <td class="text-right">${totalFemale.toLocaleString('pt-BR')}</td>
                <td class="text-right">${data.totalCattle.toLocaleString('pt-BR')}</td>
                <td class="text-right">100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${data.otherSpecies && data.otherSpecies.length > 0 ? `
          <div class="section">
            <h3 class="section-title">Outras Espécies</h3>
            <table>
              <thead>
                <tr>
                  <th style="width: 40%">Espécie</th>
                  <th class="text-right">Saldo Anterior</th>
                  <th class="text-right">Entradas</th>
                  <th class="text-right">Saídas</th>
                  <th class="text-right">Saldo Atual</th>
                </tr>
              </thead>
              <tbody>
                ${data.otherSpecies.map(s => `
                  <tr>
                    <td>${s.name} <small>(${s.unit})</small></td>
                    <td class="text-right">${(s.balance - s.entries + s.exits).toLocaleString('pt-BR')}</td>
                    <td class="text-right" style="color: #166534;">+${s.entries}</td>
                    <td class="text-right" style="color: #dc2626;">-${s.exits}</td>
                    <td class="text-right font-bold">${s.balance.toLocaleString('pt-BR')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${data.monthlyBirths || data.monthlyDeaths ? `
          <div class="section">
            <h3 class="section-title">Movimentação do Mês</h3>
            <div class="info-grid" style="grid-template-columns: repeat(3, 1fr);">
              <div class="info-item">
                <label>NASCIMENTOS</label>
                <span style="color: #166534;">+ ${data.monthlyBirths || 0}</span>
              </div>
              <div class="info-item">
                <label>MORTALIDADE</label>
                <span style="color: #dc2626;">- ${data.monthlyDeaths || 0}</span>
              </div>
              <div class="info-item">
                <label>RECEITA ESTIMADA</label>
                <span>R$ ${data.monthlyRevenue ? data.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</span>
              </div>
            </div>
          </div>
        ` : ''}

        ${data.includeSurvey !== false && data.latestSurvey ? `
          <div class="section">
            <h3 class="section-title">Questionário Epidemiológico (Último Respondido)</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>ENVIADO EM</label>
                <span>${formatDate(data.latestSurvey.submittedAt)}</span>
              </div>
              <div class="info-item">
                <label>PRÓXIMO (6 MESES)</label>
                <span>${formatDate(data.latestSurvey.nextDueAt)}</span>
              </div>
            </div>

            <table style="margin-top: 12px;">
              <thead>
                <tr>
                  <th style="width: 45%">Pergunta</th>
                  <th>Resposta</th>
                </tr>
              </thead>
              <tbody>
                ${data.latestSurvey.answers.map(a => `
                  <tr>
                    <td>${formatSurveyField(a.fieldId)}</td>
                    <td>${formatSurveyValue(a.value)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- RODAPÉ -->
        <footer class="footer">
          <div class="signature-box">
            <div class="signature-line"></div>
            <p style="font-size: 10px; font-weight: bold; text-transform: uppercase;">${data.ownerName}</p>
            <p style="font-size: 9px; color: #6b7280;">Responsável</p>
          </div>
          
          <div class="system-info">
            ${data.qrCodeDataUrl ? `<img class="qr-code" src="${data.qrCodeDataUrl}" alt="QR Code de validação" />` : `<img class="qr-code" id="agrosaldo-qr" alt="QR Code de validação" />`}
            <p style="margin-top: 5px;">Gerado via AgroSaldo</p>
            <p>Hash: ${reportHash}</p>
          </div>
        </footer>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"></script>
      <script>
        // Auto-print ao carregar
        window.onload = function() {
          try {
            var img = document.getElementById('agrosaldo-qr');
            if (img && window.QRCode) {
              window.QRCode.toDataURL(${JSON.stringify(qrCodePayload)}, {
                margin: 1,
                width: 240,
                color: {
                  dark: '#111827',
                  light: '#ffffff'
                }
              }, function(err, url) {
                if (!err && url) {
                  img.src = url;
                }
                setTimeout(function() { window.print(); }, 600);
              });
              return;
            }
          } catch (e) {
            // silencioso
          }

          setTimeout(function() { window.print(); }, 600);
        };
      </script>
    </body>
    </html>
  `;
}

/**
 * Gerar HTML do Extrato (Layout A4)
 */
export function generateExtractHTML(data: ExtractData): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Extrato de Movimentação - ${data.propertyName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Merriweather:wght@400;700&display=swap');

        :root {
          --primary: #166534; /* green-800 */
          --border: #e5e7eb;
          --text: #1f2937;
          --text-light: #6b7280;
          --success: #16a34a;
          --error: #dc2626;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page {
          size: A4;
          margin: 15mm;
        }

        body {
          font-family: 'Inter', sans-serif;
          color: var(--text);
          line-height: 1.5;
          background: #fff;
          font-size: 11px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .page-container {
          width: 100%;
          max-width: 210mm;
          margin: 0 auto;
        }

        /* Cabeçalho */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 3px solid var(--primary);
          padding-bottom: 15px;
          margin-bottom: 25px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .logo {
          width: 50px !important;
          height: 50px !important;
          object-fit: contain;
        }

        .brand-text h1 {
          font-family: 'Merriweather', serif;
          color: var(--primary);
          font-size: 20px;
          font-weight: 900;
          margin: 0;
        }

        .brand-text p {
          color: var(--text-light);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .doc-meta {
          text-align: right;
          font-size: 10px;
        }

        /* Informações do Relatório */
        .report-info {
          background: #f9fafb;
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 20px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .info-row {
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-size: 9px;
          text-transform: uppercase;
          color: var(--text-light);
          font-weight: 600;
        }

        .info-value {
          font-weight: 600;
          font-size: 12px;
        }

        /* Resumo */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }

        .summary-card {
          border: 1px solid var(--border);
          padding: 10px;
          text-align: center;
          border-radius: 4px;
        }

        .summary-card .label {
          font-size: 10px;
          text-transform: uppercase;
          color: var(--text-light);
        }

        .summary-card .value {
          font-size: 16px;
          font-weight: 700;
          margin-top: 2px;
        }

        /* Tabela */
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }

        th {
          background-color: #f3f4f6;
          padding: 8px;
          text-align: left;
          font-weight: 700;
          border-bottom: 2px solid var(--border);
          text-transform: uppercase;
          font-size: 9px;
        }

        td {
          padding: 8px;
          border-bottom: 1px solid var(--border);
        }

        tr:nth-child(even) { background-color: #fcfcfc; }

        .type-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        .text-success { color: var(--success); }
        .text-error { color: var(--error); }

        /* Rodapé */
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid var(--border);
          font-size: 9px;
          color: var(--text-light);
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="page-container">
        <header class="header">
          <div class="brand">
            <img src="/agrosaldo-logo.png" alt="Logo" class="logo" />
            <div class="brand-text">
              <h1>Extrato de Movimentação</h1>
              <p>AgroSaldo - Gestão Inteligente</p>
            </div>
          </div>
          <div class="doc-meta">
            <div><strong>Emissão:</strong> ${formatDate(data.generatedAt)}</div>
            <div style="margin-top: 2px;"><strong>Pág:</strong> 1/1</div>
          </div>
        </header>

        <div class="report-info">
          <div class="info-row">
            <span class="info-label">Propriedade</span>
            <span class="info-value">${data.propertyName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Proprietário</span>
            <span class="info-value">${data.ownerName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Período</span>
            <span class="info-value">${data.period}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Filtros Ativos</span>
            <span class="info-value">${data.filters}</span>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="label">Total de Entradas</div>
            <div class="value text-success">+${data.summary.totalEntries}</div>
          </div>
          <div class="summary-card">
            <div class="label">Total de Saídas</div>
            <div class="value text-error">-${data.summary.totalExits}</div>
          </div>
          <div class="summary-card" style="background-color: #f0fdf4;">
            <div class="label">Saldo do Período</div>
            <div class="value">${data.summary.balance > 0 ? '+' : ''}${data.summary.balance}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 80px;">Data</th>
              <th style="width: 100px;">Tipo</th>
              <th>Descrição / Categoria</th>
              <th style="width: 90px;">Sexo</th>
              <th style="width: 130px;">Faixa Etária</th>
              <th class="text-right" style="width: 80px;">Qtd.</th>
              <th class="text-right" style="width: 100px;">Valor (R$)</th>
            </tr>
          </thead>
          <tbody>
            ${data.movements.length > 0 ? data.movements.map(m => `
              <tr>
                <td>${new Date(m.date).toLocaleDateString('pt-BR')}</td>
                <td>
                  <span class="type-badge" style="background: #f3f4f6;">${m.typeLabel}</span>
                </td>
                <td>${m.description}</td>
                <td>${m.sexLabel ?? '-'}</td>
                <td>${m.ageGroupLabel ?? '-'}</td>
                <td class="text-right font-bold ${m.quantity > 0 ? 'text-success' : 'text-error'}">
                  ${m.quantity > 0 ? '+' : ''}${m.quantity}
                </td>
                <td class="text-right">
                  ${m.value ? m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'}
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="7" class="text-center" style="padding: 20px; color: #6b7280;">
                  Nenhuma movimentação encontrada neste período.
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <div class="footer">
          <p>Relatório gerado automaticamente pelo sistema AgroSaldo</p>
          <p>Este documento serve apenas para conferência interna</p>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 500);
        };
      </script>
    </body>
    </html>
  `;
}

/**
 * Imprimir Extrato
 */
export function printExtract(data: ExtractData): void {
  const width = 1024;
  const height = 768;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;

  const printWindow = window.open(
    '', 
    '_blank', 
    `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
  );

  if (printWindow) {
    printWindow.document.write(generateExtractHTML(data));
    printWindow.document.close();
    printWindow.focus();
  } else {
    alert('Por favor, permita pop-ups para imprimir o relatório.');
  }
}

/**
 * Função principal para imprimir o relatório
 * Abre uma nova janela, renderiza o HTML e chama window.print()
 */
export function printReport(data: ReportData): void {
  // Configurações da janela de impressão
  const width = 1024;
  const height = 768;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;

  const printWindow = window.open(
    '', 
    '_blank', 
    `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
  );

  if (printWindow) {
    printWindow.document.write(generateReportHTML(data));
    printWindow.document.close(); // Necessário para alguns navegadores terminarem o carregamento
    printWindow.focus(); // Foca na nova janela
  } else {
    alert('Por favor, permita pop-ups para imprimir o relatório oficial.');
  }
}

// Alias para compatibilidade, mas usando printReport
export async function generatePDF(data: ReportData, fileName?: string): Promise<void> {
  printReport(data);
}
