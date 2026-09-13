// Utilities to export data to CSV, Excel (.xls table) and Print/PDF

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  // UTF-8 BOM for proper Portuguese characters (ç, ã, é, etc.) in Excel
  const BOM = '\uFEFF';
  const csvContent = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(';'),
    ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
  ].join('\r\n');

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcel(
  filename: string,
  title: string,
  headers: string[],
  rows: (string | number)[][],
  metadata?: Record<string, string>
) {
  const metaRows = metadata
    ? Object.entries(metadata)
        .map(([k, v]) => `<tr><td style="font-weight:bold; background-color:#f1f5f9; width:200px;">${k}:</td><td>${v}</td></tr>`)
        .join('')
    : '';

  const headerCells = headers
    .map(h => `<th style="background-color:#991B1B; color:#ffffff; font-weight:bold; padding:10px 14px; border:1px solid #7f1d1d; text-align:left;">${h}</th>`)
    .join('');

  const bodyRows = rows
    .map((row, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      const cells = row
        .map(cell => `<td style="padding:8px 12px; border:1px solid #e2e8f0; vertical-align:middle;">${String(cell ?? '')}</td>`)
        .join('');
      return `<tr style="background-color:${bg}">${cells}</tr>`;
    })
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${title.slice(0, 30)}</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
      </style>
    </head>
    <body>
      <div style="font-family: Arial, sans-serif; padding: 15px;">
        <h2 style="color: #991B1B; margin-bottom: 4px;">Sistema de Analista Fiscal</h2>
        <h3 style="color: #334155; margin-top: 0;">${title}</h3>
        <p style="color: #64748B; font-size: 12px;">Gerado em: ${new Date().toLocaleString('pt-BR')} | Responsável: Álvaro Santos</p>
        
        ${metadata ? `<table style="margin-bottom: 20px; font-size: 13px;">${metaRows}</table>` : ''}
        
        <table style="font-size: 13px;">
          <thead>
            <tr>${headerCells}</tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>
        <p style="margin-top:20px; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:8px;">
          Sistema de Analista Fiscal © 2026 - Criado por Álvaro Santos. Documento confidencial corporativo.
        </p>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printFormattedReport(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  metadata?: Record<string, string>
) {
  const metaHtml = metadata
    ? `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:12px; margin-bottom:20px; background:#f8fafc; padding:12px 16px; border-radius:6px; border:1px solid #e2e8f0;">
        ${Object.entries(metadata)
          .map(([k, v]) => `<div><span style="font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase;">${k}</span><div style="font-size:13px; font-weight:bold; color:#1e293b;">${v}</div></div>`)
          .join('')}
       </div>`
    : '';

  const headerCells = headers
    .map(h => `<th style="background-color:#991B1B; color:#ffffff; font-size:11px; font-weight:600; text-transform:uppercase; padding:8px 10px; border:1px solid #7f1d1d; text-align:left;">${h}</th>`)
    .join('');

  const bodyRows = rows
    .map((row, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      const cells = row
        .map(cell => `<td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:12px; color:#334155;">${String(cell ?? '')}</td>`)
        .join('');
      return `<tr style="background-color:${bg}">${cells}</tr>`;
    })
    .join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // If popups blocked, trigger fallback window.print()
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${title} - Sistema de Analista Fiscal</title>
      <style>
        @page { size: landscape; margin: 15mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #1e293b; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #991B1B; padding-bottom: 12px; margin-bottom: 16px; }
        .title { color: #991B1B; font-size: 20px; font-weight: bold; margin: 0; }
        .subtitle { color: #475569; font-size: 14px; margin: 4px 0 0 0; }
        .date { font-size: 11px; color: #64748b; text-align: right; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">Sistema de Analista Fiscal</h1>
          <p class="subtitle">${title}</p>
        </div>
        <div class="date">
          <div>Emissão: <strong>${new Date().toLocaleString('pt-BR')}</strong></div>
          <div>Criador: <strong>Álvaro Santos</strong></div>
        </div>
      </div>
      ${metaHtml}
      <table>
        <thead>
          <tr>${headerCells}</tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>
      <div class="footer">
        <span>Sistema de Analista Fiscal © 2026 - Gestão e Auditoria Fiscal</span>
        <span>Página 1 de 1 - Relatório Corporativo</span>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
