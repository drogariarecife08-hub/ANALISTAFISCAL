import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  FileDown,
  Printer,
  CheckCircle2,
  TableProperties,
  Building2,
  GitBranch,
  Layers,
  Sparkles
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { exportToCSV, exportToExcel, printFormattedReport } from '../utils/export';

export const SpreadsheetsView: React.FC = () => {
  const {
    companies,
    branches,
    collaborators,
    invoices,
    occurrences,
    lossDamages,
    shortages,
    tasks,
    currentUser
  } = useSystem();

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const notifySuccess = (name: string) => {
    setDownloadSuccess(`Planilha "${name}" gerada com sucesso!`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  // 1. Planilha de Notas Fiscais e Tributos
  const handleExportInvoices = () => {
    const headers = ['Número NF', 'Série', 'Data Entrada', 'Fornecedor', 'Filial', 'Valor Total (R$)', 'Status', 'Responsável Fiscal'];
    const rows = invoices.map(i => [
      i.numero,
      i.serie,
      i.dataEntrada,
      i.fornecedor,
      i.filialId,
      `R$ ${i.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      i.status,
      i.responsavel
    ]);
    exportToExcel('planilha_notas_fiscais_tributos', 'Planilha Geral de Notas Fiscais e Alíquotas Fiscais', headers, rows, {
      'Total de Notas': `${invoices.length} documentos`,
      'Extraído por': currentUser.name
    });
    notifySuccess('Notas Fiscais e Tributos');
  };

  // 2. Planilha de Ocorrências Fiscais
  const handleExportOccurrences = () => {
    const headers = ['Protocolo', 'Data Registro', 'Tipo Ocorrência', 'Gravidade', 'Filial', 'Produto Afetado', 'Qtd', 'Perda Estimada', 'Status', 'Solução Aplicada'];
    const rows = occurrences.map(o => [
      o.protocolo,
      o.dataHora,
      o.tipo,
      o.gravidade,
      o.filialId,
      o.produto,
      o.quantidadeAfetada,
      `R$ ${o.valorEstimadoPerda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      o.status,
      o.solucao || 'Pendente de Resolução'
    ]);
    exportToExcel('planilha_ocorrencias_fiscais', 'Planilha de Ocorrências e Divergências de Loja/CD', headers, rows, {
      'Total de Ocorrências': `${occurrences.length} protocolos`,
      'Extraído por': currentUser.name
    });
    notifySuccess('Ocorrências Fiscais');
  };

  // 3. Planilha de Perdas e Avarias
  const handleExportLosses = () => {
    const headers = ['Data', 'Empresa', 'Filial', 'Produto', 'Código SKU', 'Lote', 'Validade', 'Qtd', 'Custo Unit.', 'Valor Total Perda', 'Motivo', 'Status'];
    const rows = lossDamages.map(l => [
      l.data,
      l.empresaNome,
      l.filialNome,
      l.produto,
      l.codigo,
      l.lote,
      l.validade,
      l.quantidade,
      `R$ ${l.custoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${l.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      l.motivoPerda,
      l.status
    ]);
    exportToExcel('planilha_perdas_avarias', 'Planilha Consolidada de Perdas e Avarias Operacionais', headers, rows, {
      'Total Itens': `${lossDamages.length} registros`,
      'Extraído por': currentUser.name
    });
    notifySuccess('Perdas e Avarias');
  };

  // 4. Planilha de Faltas de Produtos
  const handleExportShortages = () => {
    const headers = ['Data', 'Filial', 'NF Entrada', 'Fornecedor', 'Produto', 'Código', 'Faturado', 'Recebido', 'Falta', 'Valor Faltante (R$)', 'Status'];
    const rows = shortages.map(s => [
      s.data,
      s.filialNome,
      s.notaFiscal,
      s.fornecedor,
      s.produto,
      s.codigo,
      s.quantidadeFaturada,
      s.quantidadeRecebida,
      s.quantidadeFaltante,
      `R$ ${s.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      s.status
    ]);
    exportToExcel('planilha_faltas_produtos', 'Planilha de Divergências de Mercadorias e Faltas Faturadas', headers, rows, {
      'Extraído por': currentUser.name
    });
    notifySuccess('Faltas de Produtos');
  };

  // 5. Planilha de Rotinas e Tarefas Fiscais
  const handleExportTasks = () => {
    const headers = ['Tarefa', 'Prioridade', 'Prazo Limite', 'Responsável', 'Status', 'Data Conclusão', 'Descrição'];
    const rows = tasks.map(t => [
      t.titulo,
      t.prioridade,
      t.prazoConclusao,
      t.responsavel,
      t.status,
      t.dataConclusao || 'Em aberto',
      t.descricao
    ]);
    exportToExcel('planilha_organizacao_tarefas', 'Planilha de Organização de Tarefas e Rotinas Fiscais', headers, rows, {
      'Total de Tarefas': `${tasks.length} rotinas`,
      'Extraído por': currentUser.name
    });
    notifySuccess('Organização de Tarefas');
  };

  // 6. Planilha de Cadastro Geral Corporativo (Empresas, Filiais, Colaboradores)
  const handleExportCorporate = () => {
    const headers = ['Tipo de Entidade', 'Nome / Razão Social', 'CNPJ / CPF', 'Código / Cargo', 'Cidade / Estado', 'Status'];
    const rows: (string | number)[][] = [];

    companies.forEach(c => {
      rows.push(['Empresa', c.razaoSocial, c.cnpj, c.inscricaoEstadual, `${c.cidade}/${c.estado}`, c.status]);
    });
    branches.forEach(b => {
      rows.push(['Filial', b.nome, b.cnpj, b.codigo, `${b.cidade}/${b.estado}`, b.status]);
    });
    collaborators.forEach(col => {
      rows.push(['Colaborador', col.nomeCompleto, col.cpf, col.cargo, col.departamento, col.status]);
    });

    exportToExcel('planilha_cadastros_corporativos', 'Planilha Cadastral Unificada (Empresas, Filiais e Equipe)', headers, rows, {
      'Extraído por': currentUser.name
    });
    notifySuccess('Cadastros Corporativos');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-900">Gerador de Planilhas e Exportações em Lote</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gere planilhas em Excel e CSV com formatação corporativa, fórmulas de totais e filtros automáticos.
          </p>
        </div>

        {downloadSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}
      </div>

      {/* Spreadsheet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-red-300 transition-colors flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Planilha de Notas Fiscais</h3>
            <p className="text-xs text-slate-500 mt-1">
              Exportação completa de notas fiscais, séries, chaves de acesso, fornecedores, valores e alíquotas.
            </p>
            <div className="mt-3 text-[11px] text-slate-400 font-medium">
              {invoices.length} documentos prontos para exportação
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportInvoices}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-red-300 transition-colors flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center mb-3">
              <TableProperties className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Planilha de Ocorrências Fiscais</h3>
            <p className="text-xs text-slate-500 mt-1">
              Controle de protocolos, causas-raiz, gravidade, produtos impactados, perdas estimadas e soluções.
            </p>
            <div className="mt-3 text-[11px] text-slate-400 font-medium">
              {occurrences.length} protocolos registrados
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportOccurrences}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-red-300 transition-colors flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Planilha de Perdas e Avarias</h3>
            <p className="text-xs text-slate-500 mt-1">
              Rastreamento de lotes, datas de validade, custos contábeis, descarte e compensações financeiras.
            </p>
            <div className="mt-3 text-[11px] text-slate-400 font-medium">
              {lossDamages.length} registros de avaria
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportLosses}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-red-300 transition-colors flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Planilha de Falta de Produtos</h3>
            <p className="text-xs text-slate-500 mt-1">
              Mercadorias faturadas não entregues em conferência cega, cartas de correção e solicitações de devolução.
            </p>
            <div className="mt-3 text-[11px] text-slate-400 font-medium">
              {shortages.length} ocorrências de mercadoria faltante
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportShortages}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-red-300 transition-colors flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center mb-3">
              <TableProperties className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Planilha de Organização de Tarefas</h3>
            <p className="text-xs text-slate-500 mt-1">
              Cronograma operacional da equipe, responsáveis, prazos de cumprimento e status de entrega.
            </p>
            <div className="mt-3 text-[11px] text-slate-400 font-medium">
              {tasks.length} rotinas monitoradas
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportTasks}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Card 6 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-red-300 transition-colors flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Planilha Cadastral Unificada</h3>
            <p className="text-xs text-slate-500 mt-1">
              Base consolidada contendo Empresas, Filiais, Inscrições Estaduais e Colaboradores ativos.
            </p>
            <div className="mt-3 text-[11px] text-slate-400 font-medium">
              {companies.length + branches.length + collaborators.length} registros cadastrais
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCorporate}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
