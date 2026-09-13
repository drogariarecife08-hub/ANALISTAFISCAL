import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  FileDown,
  Calendar,
  Building2,
  GitBranch,
  User,
  AlertOctagon,
  CheckCircle2,
  Filter,
  CheckSquare,
  PackageX,
  PackageMinus
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { exportToCSV, exportToExcel, printFormattedReport } from '../utils/export';

type ReportType =
  | 'ocorrencias'
  | 'notas_fiscais'
  | 'produtividade'
  | 'avarias_perdas'
  | 'faltas_produtos'
  | 'tarefas';

export const ReportsView: React.FC = () => {
  const {
    occurrences,
    invoices,
    lossDamages,
    shortages,
    tasks,
    companies,
    branches,
    collaborators,
    currentUser
  } = useSystem();

  const [selectedReport, setSelectedReport] = useState<ReportType>('ocorrencias');

  // Filters from prompt: ["Data inicial e final", "Empresa", "Filial", "Status", "Colaborador", "Tipo de ocorrência"]
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [empresaId, setEmpresaId] = useState('todas');
  const [filialId, setFilialId] = useState('todas');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [colaboradorFilter, setColaboradorFilter] = useState('todos');
  const [tipoOcorrencia, setTipoOcorrencia] = useState('todos');

  // Report generators
  const handleGenerateCSV = () => {
    if (selectedReport === 'ocorrencias') {
      const filtered = occurrences.filter(o => {
        if (empresaId !== 'todas' && o.empresaId !== empresaId) return false;
        if (filialId !== 'todas' && o.filialId !== filialId) return false;
        if (statusFilter !== 'todos' && o.status !== statusFilter) return false;
        if (tipoOcorrencia !== 'todos' && o.tipo !== tipoOcorrencia) return false;
        return true;
      });
      const headers = ['Protocolo', 'Data', 'Tipo', 'Gravidade', 'Filial', 'Produto', 'Qtd', 'Perda (R$)', 'Status', 'Solução'];
      const rows = filtered.map(o => [
        o.protocolo || o.numero || 'OC-S/N',
        o.dataHora || o.data || '',
        o.tipo || '',
        o.gravidade || 'Média',
        o.filialId || '',
        o.produto || '',
        o.quantidadeAfetada ?? o.quantidade ?? 0,
        Number(o.valorEstimadoPerda ?? o.valorTotal ?? 0).toFixed(2),
        o.status || '',
        o.solucao || 'Pendente'
      ]);
      exportToCSV('relatorio_geral_ocorrencias', headers, rows);
    } else if (selectedReport === 'notas_fiscais') {
      const filtered = invoices.filter(i => {
        if (empresaId !== 'todas' && i.empresaId !== empresaId) return false;
        if (filialId !== 'todas' && i.filialId !== filialId) return false;
        if (statusFilter !== 'todos' && i.status !== statusFilter) return false;
        return true;
      });
      const headers = ['Número NF', 'Série', 'Entrada', 'Fornecedor', 'Filial', 'Valor (R$)', 'Status', 'Responsável'];
      const rows = filtered.map(i => [
        i.numero || '',
        i.serie || '',
        i.dataEntrada || '',
        i.fornecedor || '',
        i.filialId || '',
        Number(i.valor ?? 0).toFixed(2),
        i.status || '',
        i.responsavel || ''
      ]);
      exportToCSV('relatorio_notas_fiscais', headers, rows);
    } else if (selectedReport === 'avarias_perdas') {
      const headers = ['Data', 'Filial', 'Produto', 'Código', 'Lote', 'Validade', 'Qtd', 'Valor Total', 'Motivo', 'Status'];
      const rows = lossDamages.map(l => [
        l.data || '',
        l.filialNome || '',
        l.produto || '',
        l.codigo || l.codigoBarras || '',
        l.lote || 'N/A',
        l.validade || 'N/A',
        l.quantidade || 0,
        Number(l.valorTotal ?? 0).toFixed(2),
        l.motivoPerda || l.motivoAvaria || l.tipoPerda || 'Avaria',
        l.status || ''
      ]);
      exportToCSV('relatorio_avarias_perdas', headers, rows);
    } else if (selectedReport === 'faltas_produtos') {
      const headers = ['Data', 'Filial', 'NF', 'Fornecedor', 'Produto', 'Qtd Faturada', 'Qtd Recebida', 'Qtd Falta', 'Valor Total Falta', 'Status'];
      const rows = shortages.map(s => [
        s.data || '',
        s.filialNome || '',
        s.notaFiscal || '',
        s.fornecedor || '',
        s.produto || '',
        s.quantidadeFaturada ?? s.quantidadeSolicitada ?? 0,
        s.quantidadeRecebida || 0,
        s.quantidadeFaltante || 0,
        Number(s.valorTotal ?? 0).toFixed(2),
        s.status || ''
      ]);
      exportToCSV('relatorio_faltas_produtos', headers, rows);
    } else if (selectedReport === 'tarefas') {
      const headers = ['Título', 'Prioridade', 'Prazo', 'Responsável', 'Status', 'Data Conclusão'];
      const rows = tasks.map(t => [
        t.titulo || '',
        t.prioridade || 'Média',
        t.prazoConclusao || '',
        t.responsavel || '',
        t.status || '',
        t.dataConclusao || '-'
      ]);
      exportToCSV('relatorio_tarefas', headers, rows);
    } else if (selectedReport === 'produtividade') {
      const headers = ['Colaborador', 'Cargo', 'Tarefas Atribuídas', 'Tarefas Concluídas', 'Taxa de Produtividade'];
      const rows = collaborators.map(c => {
        const userTasks = tasks.filter(t => t.responsavel === c.nomeCompleto);
        const done = userTasks.filter(t => t.status === 'Concluída').length;
        const total = userTasks.length;
        const rate = total > 0 ? Math.round((done / total) * 100) : 0;
        return [c.nomeCompleto || '', c.cargo || '', total, done, `${rate}%`];
      });
      exportToCSV('relatorio_produtividade', headers, rows);
    }
  };

  const handleGenerateExcel = () => {
    if (selectedReport === 'ocorrencias') {
      const headers = ['Protocolo', 'Data/Hora', 'Tipo', 'Gravidade', 'Filial', 'Produto', 'Qtd', 'Perda', 'Status', 'Solução'];
      const rows = occurrences.map(o => [
        o.protocolo || o.numero || 'OC-S/N',
        o.dataHora || o.data || '',
        o.tipo || '',
        o.gravidade || 'Média',
        o.filialId || '',
        o.produto || '',
        o.quantidadeAfetada ?? o.quantidade ?? 0,
        `R$ ${Number(o.valorEstimadoPerda ?? o.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        o.status || '',
        o.solucao || 'Pendente'
      ]);
      exportToExcel('relatorio_geral_ocorrencias', 'Relatório Executivo Geral de Ocorrências Fiscais', headers, rows, {
        'Emitido Por': currentUser.name,
        'Data do Relatório': new Date().toLocaleDateString('pt-BR')
      });
    } else if (selectedReport === 'notas_fiscais') {
      const headers = ['Número NF', 'Série', 'Entrada', 'Fornecedor', 'Filial', 'Valor Total', 'Status', 'Responsável'];
      const rows = invoices.map(i => [
        i.numero || '',
        i.serie || '',
        i.dataEntrada || '',
        i.fornecedor || '',
        i.filialId || '',
        `R$ ${Number(i.valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        i.status || '',
        i.responsavel || ''
      ]);
      exportToExcel('relatorio_notas_fiscais', 'Relatório Consolidado de Notas Fiscais e Alíquotas', headers, rows, {
        'Total de Notas': `${invoices.length} documentos`,
        'Emitido Por': currentUser.name
      });
    } else if (selectedReport === 'produtividade') {
      const headers = ['Colaborador', 'Cargo', 'Tarefas Atribuídas', 'Tarefas Concluídas', 'Taxa de Produtividade'];
      const rows = collaborators.map(c => {
        const userTasks = tasks.filter(t => t.responsavel === c.nomeCompleto);
        const done = userTasks.filter(t => t.status === 'Concluída').length;
        const total = userTasks.length;
        const rate = total > 0 ? Math.round((done / total) * 100) : 0;
        return [c.nomeCompleto || '', c.cargo || '', `${total} tarefas`, `${done} tarefas`, `${rate}%`];
      });
      exportToExcel('relatorio_produtividade', 'Quadro de Produtividade e Eficiência da Equipe Fiscal', headers, rows, {
        'Responsável': currentUser.name
      });
    } else if (selectedReport === 'avarias_perdas') {
      const headers = ['Data', 'Filial', 'Produto', 'Código', 'Lote', 'Qtd', 'Valor Total', 'Motivo', 'Status'];
      const rows = lossDamages.map(l => [
        l.data || '',
        l.filialNome || '',
        l.produto || '',
        l.codigo || l.codigoBarras || '',
        l.lote || 'N/A',
        `${l.quantidade || 0} un`,
        `R$ ${Number(l.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        l.motivoPerda || l.motivoAvaria || l.tipoPerda || 'Avaria',
        l.status || ''
      ]);
      exportToExcel('relatorio_avarias_perdas', 'Relatório Consolidado de Avarias e Descarte Fiscal', headers, rows);
    } else if (selectedReport === 'faltas_produtos') {
      const headers = ['Data', 'Filial', 'NF', 'Fornecedor', 'Produto', 'Faturado', 'Recebido', 'Falta', 'Valor Total Falta', 'Status'];
      const rows = shortages.map(s => [
        s.data || '',
        s.filialNome || '',
        s.notaFiscal || '',
        s.fornecedor || '',
        s.produto || '',
        s.quantidadeFaturada ?? s.quantidadeSolicitada ?? 0,
        s.quantidadeRecebida || 0,
        `${s.quantidadeFaltante || 0} un`,
        `R$ ${Number(s.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        s.status || ''
      ]);
      exportToExcel('relatorio_faltas_produtos', 'Relatório de Mercadorias e Faltas Faturadas', headers, rows);
    } else if (selectedReport === 'tarefas') {
      const headers = ['Título', 'Prioridade', 'Prazo', 'Responsável', 'Status'];
      const rows = tasks.map(t => [
        t.titulo || '',
        t.prioridade || 'Média',
        t.prazoConclusao || '',
        t.responsavel || '',
        t.status || ''
      ]);
      exportToExcel('relatorio_tarefas', 'Quadro Analítico de Rotinas Fiscais', headers, rows);
    }
  };

  const handlePrintOrPDF = () => {
    if (selectedReport === 'ocorrencias') {
      const headers = ['Protocolo', 'Data', 'Tipo', 'Produto', 'Qtd', 'Perda', 'Status'];
      const rows = occurrences.map(o => [
        o.protocolo || o.numero || 'OC-S/N',
        o.dataHora ? new Date(o.dataHora).toLocaleDateString('pt-BR') : o.data || '',
        o.tipo || '',
        o.produto || '',
        o.quantidadeAfetada ?? o.quantidade ?? 0,
        `R$ ${Number(o.valorEstimadoPerda ?? o.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        o.status || ''
      ]);
      printFormattedReport('Relatório Executivo Geral de Ocorrências Fiscais', headers, rows, {
        'Emitido Por': currentUser.name,
        'Data de Emissão': new Date().toLocaleDateString('pt-BR')
      });
    } else if (selectedReport === 'notas_fiscais') {
      const headers = ['Número NF', 'Entrada', 'Fornecedor', 'Valor', 'Status', 'Responsável'];
      const rows = invoices.map(i => [
        i.numero || '',
        i.dataEntrada ? new Date(i.dataEntrada).toLocaleDateString('pt-BR') : '',
        i.fornecedor || '',
        `R$ ${Number(i.valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        i.status || '',
        i.responsavel || ''
      ]);
      printFormattedReport('Relatório Fiscal de Notas Fiscais Registradas', headers, rows, {
        'Emitido Por': currentUser.name
      });
    } else if (selectedReport === 'produtividade') {
      const headers = ['Colaborador', 'Cargo', 'Total Tarefas', 'Concluídas', 'Produtividade'];
      const rows = collaborators.map(c => {
        const userTasks = tasks.filter(t => t.responsavel === c.nomeCompleto);
        const done = userTasks.filter(t => t.status === 'Concluída').length;
        const total = userTasks.length;
        const rate = total > 0 ? Math.round((done / total) * 100) : 0;
        return [c.nomeCompleto || '', c.cargo || '', total, done, `${rate}%`];
      });
      printFormattedReport('Relatório de Produtividade da Equipe Fiscal', headers, rows, {
        'Emitido Por': currentUser.name
      });
    } else if (selectedReport === 'avarias_perdas') {
      const headers = ['Data', 'Filial', 'Produto', 'Qtd', 'Total Perda', 'Status'];
      const rows = lossDamages.map(l => [
        l.data ? new Date(l.data).toLocaleDateString('pt-BR') : '',
        (l.filialNome || '').split(' - ')[1] || l.filialNome || '',
        l.produto || '',
        l.quantidade || 0,
        `R$ ${Number(l.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        l.status || ''
      ]);
      printFormattedReport('Relatório de Avarias e Perdas Fiscais', headers, rows);
    } else if (selectedReport === 'faltas_produtos') {
      const headers = ['Data', 'Filial', 'NF', 'Produto', 'Qtd Falta', 'Total Falta', 'Status'];
      const rows = shortages.map(s => [
        s.data ? new Date(s.data).toLocaleDateString('pt-BR') : '',
        (s.filialNome || '').split(' - ')[1] || s.filialNome || '',
        s.notaFiscal || '',
        s.produto || '',
        s.quantidadeFaltante || 0,
        `R$ ${Number(s.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        s.status || ''
      ]);
      printFormattedReport('Relatório de Falta de Produtos Faturados', headers, rows);
    } else if (selectedReport === 'tarefas') {
      const headers = ['Título', 'Prazo', 'Prioridade', 'Responsável', 'Status'];
      const rows = tasks.map(t => [
        t.titulo || '',
        t.prazoConclusao ? new Date(t.prazoConclusao).toLocaleDateString('pt-BR') : '',
        t.prioridade || 'Média',
        t.responsavel || '',
        t.status || ''
      ]);
      printFormattedReport('Relatório de Tarefas e Rotinas Fiscais', headers, rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-bold text-slate-900">Central de Relatórios Fiscais e Operacionais</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Gere relatórios completos para fiscalização, auditoria, diretoria e controle interno nos formatos PDF, Excel, CSV e Impressão.
        </p>
      </div>

      {/* Report Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { id: 'ocorrencias', label: 'Ocorrências Gerais', icon: AlertOctagon, count: occurrences.length },
          { id: 'notas_fiscais', label: 'Notas Fiscais', icon: FileSpreadsheet, count: invoices.length },
          { id: 'produtividade', label: 'Produtividade', icon: User, count: collaborators.length },
          { id: 'avarias_perdas', label: 'Avarias e Perdas', icon: PackageX, count: lossDamages.length },
          { id: 'faltas_produtos', label: 'Faltas de Produtos', icon: PackageMinus, count: shortages.length },
          { id: 'tarefas', label: 'Tarefas e Rotinas', icon: CheckSquare, count: tasks.length }
        ].map(item => {
          const Icon = item.icon;
          const isSelected = selectedReport === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setSelectedReport(item.id as ReportType)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-red-700 text-white border-red-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-red-600'}`} />
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isSelected ? 'bg-red-800 text-red-100' : 'bg-slate-100 text-slate-600'
                }`}>
                  {item.count}
                </span>
              </div>
              <p className="text-xs font-bold leading-snug">{item.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filter Parameters */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-red-600" />
          <span>Parâmetros e Filtros do Relatório Selecionado</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Data Inicial</label>
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Data Final</label>
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Empresa</label>
            <select
              value={empresaId}
              onChange={e => setEmpresaId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todas">Todas as Empresas</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.nomeFantasia}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Filial</label>
            <select
              value={filialId}
              onChange={e => setFilialId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todas">Todas as Filiais</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.codigo} - {b.nome.split(' - ')[1] || b.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Colaborador</label>
            <select
              value={colaboradorFilter}
              onChange={e => setColaboradorFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todos">Todos</option>
              {collaborators.map(col => (
                <option key={col.id} value={col.nomeCompleto}>{col.nomeCompleto}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todos">Todos</option>
              <option value="Aberta">Aberta</option>
              <option value="Em análise">Em análise</option>
              <option value="Resolvida">Resolvida</option>
              <option value="Concluída">Concluída</option>
              <option value="Pendente">Pendente</option>
            </select>
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Relatório pronto para emissão imediata: <strong>{selectedReport.replace('_', ' ').toUpperCase()}</strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateCSV}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateExcel}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg border border-emerald-300 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Exportar Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handlePrintOrPDF}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar em PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
