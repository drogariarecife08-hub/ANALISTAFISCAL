import React, { useState, useMemo, useRef } from 'react';
import {
  AlertOctagon,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  FileDown,
  X,
  Upload,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  GitBranch,
  Building2,
  Filter,
  History,
  Send
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { Occurrence, OccurrenceType, SeverityLevel, OccurrenceStatus } from '../types';
import { exportToCSV, exportToExcel, printFormattedReport } from '../utils/export';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const OccurrencesView: React.FC = () => {
  const {
    occurrences,
    companies,
    branches,
    addOccurrence,
    updateOccurrence,
    deleteOccurrence,
    hasPermission,
    currentUser
  } = useSystem();

  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | OccurrenceStatus>('todos');
  const [gravidadeFilter, setGravidadeFilter] = useState<'todos' | SeverityLevel>('todos');
  const [filialFilter, setFilialFilter] = useState('todas');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [occurrenceToDelete, setOccurrenceToDelete] = useState<Occurrence | null>(null);

  // Resolution modal
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [occurrenceToResolve, setOccurrenceToResolve] = useState<Occurrence | null>(null);
  const [solucaoText, setSolucaoText] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    tipo: 'Avaria' as OccurrenceType,
    gravidade: 'Média' as SeverityLevel,
    empresaId: companies[0]?.id || '',
    filialId: branches[0]?.id || '',
    numeroNotaFiscal: '',
    valorBoleto: 0,
    fornecedor: '',
    produto: '',
    codigoProduto: '',
    quantidadeAfetada: 1,
    valorEstimadoPerda: 0,
    responsavelRegistro: currentUser.name,
    responsavelSolucao: 'Álvaro Santos (Analista Fiscal)',
    status: 'Aberta' as OccurrenceStatus,
    descricao: '',
    solucao: '',
    fotos: [] as string[]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManage = hasPermission('manage_occurrences') || currentUser.role === 'administrador' || currentUser.role === 'analista_fiscal';

  const occurrenceTypes: OccurrenceType[] = [
    'Avaria',
    'Falta de produto',
    'Excesso de produto',
    'Produto divergente',
    'Erro de estoque',
    'Erro de nota fiscal',
    'Preço divergente',
    'Produto vencido',
    'Produto próximo do vencimento',
    'Divergência de quantidade',
    'Divergência de valor',
    'Outros'
  ];

  const filteredOccurrences = useMemo(() => {
    const termo = (searchTerm || '').toLowerCase();
    return occurrences.filter(occ => {
      const matchSearch =
        (occ.protocolo || occ.numero || '').toLowerCase().includes(termo) ||
        (occ.produto || '').toLowerCase().includes(termo) ||
        (occ.fornecedor || '').toLowerCase().includes(termo) ||
        (occ.numeroNotaFiscal || '').toLowerCase().includes(termo) ||
        (occ.responsavelRegistro || '').toLowerCase().includes(termo);

      const matchTipo = tipoFilter === 'todos' || occ.tipo === tipoFilter;
      const matchStatus = statusFilter === 'todos' || occ.status === statusFilter;
      const matchGravidade = gravidadeFilter === 'todos' || occ.gravidade === gravidadeFilter;
      const matchFilial = filialFilter === 'todas' || occ.filialId === filialFilter;

      return matchSearch && matchTipo && matchStatus && matchGravidade && matchFilial;
    });
  }, [occurrences, searchTerm, tipoFilter, statusFilter, gravidadeFilter, filialFilter]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedOccurrence(null);
    setFormData({
      tipo: 'Avaria',
      gravidade: 'Média',
      empresaId: companies[0]?.id || '',
      filialId: branches[0]?.id || '',
      numeroNotaFiscal: '',
      valorBoleto: 0,
      fornecedor: '',
      produto: '',
      codigoProduto: '',
      quantidadeAfetada: 1,
      valorEstimadoPerda: 0,
      responsavelRegistro: currentUser.name,
      responsavelSolucao: 'Álvaro Santos (Analista Fiscal)',
      status: 'Aberta',
      descricao: '',
      solucao: '',
      fotos: []
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (occ: Occurrence) => {
    setModalMode('edit');
    setSelectedOccurrence(occ);
    setFormData({
      tipo: occ.tipo,
      gravidade: occ.gravidade as SeverityLevel,
      empresaId: occ.empresaId,
      filialId: occ.filialId,
      numeroNotaFiscal: occ.numeroNotaFiscal || '',
      valorBoleto: occ.valorBoleto ?? 0,
      fornecedor: occ.fornecedor,
      produto: occ.produto,
      codigoProduto: occ.codigoProduto || '',
      quantidadeAfetada: occ.quantidadeAfetada ?? occ.quantidade ?? 1,
      valorEstimadoPerda: occ.valorEstimadoPerda ?? occ.valorTotal ?? 0,
      responsavelRegistro: occ.responsavelRegistro,
      responsavelSolucao: occ.responsavelSolucao,
      status: occ.status,
      descricao: occ.descricao,
      solucao: occ.solucao || '',
      fotos: occ.fotos || []
    });
    setModalOpen(true);
  };

  const handleOpenView = (occ: Occurrence) => {
    setModalMode('view');
    setSelectedOccurrence(occ);
    setFormData({
      tipo: occ.tipo,
      gravidade: occ.gravidade as SeverityLevel,
      empresaId: occ.empresaId,
      filialId: occ.filialId,
      numeroNotaFiscal: occ.numeroNotaFiscal || '',
      valorBoleto: occ.valorBoleto ?? 0,
      fornecedor: occ.fornecedor,
      produto: occ.produto,
      codigoProduto: occ.codigoProduto || '',
      quantidadeAfetada: occ.quantidadeAfetada ?? occ.quantidade ?? 1,
      valorEstimadoPerda: occ.valorEstimadoPerda ?? occ.valorTotal ?? 0,
      responsavelRegistro: occ.responsavelRegistro,
      responsavelSolucao: occ.responsavelSolucao,
      status: occ.status,
      descricao: occ.descricao,
      solucao: occ.solucao || '',
      fotos: occ.fotos || []
    });
    setModalOpen(true);
  };

  // Rule: Ocorrências só podem ser fechadas após preenchimento da solução
  const handleOpenResolutionModal = (occ: Occurrence) => {
    setOccurrenceToResolve(occ);
    setSolucaoText(occ.solucao || '');
    setResolutionModalOpen(true);
  };

  const handleSaveResolution = () => {
    if (!solucaoText.trim()) {
      alert('Regra do Sistema: Ocorrências só podem ser fechadas após o preenchimento da solução adotada!');
      return;
    }
    if (occurrenceToResolve) {
      updateOccurrence(occurrenceToResolve.id, {
        status: 'Resolvida',
        solucao: solucaoText.trim()
      });
      setResolutionModalOpen(false);
      setOccurrenceToResolve(null);
      setSolucaoText('');
    }
  };

  // Image Upload simulation / FileReader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({
            ...prev,
            fotos: [...prev.fotos, reader.result as string]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Rule: if status is Resolvida, solucao must be filled
    if (formData.status === 'Resolvida' && !formData.solucao.trim()) {
      alert('Atenção: Para marcar a ocorrência como "Resolvida", é obrigatório detalhar o campo "Ação tomada / Solução".');
      return;
    }

    if (modalMode === 'create') {
      addOccurrence(formData as any);
    } else if (modalMode === 'edit' && selectedOccurrence) {
      updateOccurrence(selectedOccurrence.id, formData as any);
    }
    setModalOpen(false);
  };

  const handleDelete = (occ: Occurrence) => {
    setOccurrenceToDelete(occ);
  };

  // Exports
  const handleExportCSV = () => {
    const headers = ['Protocolo', 'Data/Hora', 'Tipo', 'Gravidade', 'Filial', 'Produto', 'NF-e', 'Valor Boleto (R$)', 'Qtd', 'Valor Perda (R$)', 'Status', 'Resp. Registro', 'Resp. Solução', 'Solução'];
    const rows = filteredOccurrences.map(o => {
      const b = branches.find(br => br.id === o.filialId);
      const val = Number(o.valorEstimadoPerda ?? o.valorTotal ?? 0);
      const bol = Number(o.valorBoleto ?? 0);
      return [
        o.protocolo || o.numero || 'OC-S/N',
        o.dataHora || o.data || '',
        o.tipo || '',
        o.gravidade || 'Média',
        b?.nome || o.filialId || '',
        o.produto || '',
        o.numeroNotaFiscal || '',
        bol > 0 ? bol.toFixed(2) : '',
        o.quantidadeAfetada ?? o.quantidade ?? 0,
        val.toFixed(2),
        o.status || '',
        o.responsavelRegistro || '',
        o.responsavelSolucao || '',
        o.solucao || 'Pendente'
      ];
    });
    exportToCSV('relatorio_ocorrencias_fiscais', headers, rows);
  };

  const handleExportExcel = () => {
    const headers = ['Protocolo', 'Data/Hora', 'Tipo', 'Gravidade', 'Filial', 'Produto', 'NF-e', 'Valor Boleto', 'Qtd', 'Valor Perda', 'Status', 'Solução'];
    const rows = filteredOccurrences.map(o => {
      const b = branches.find(br => br.id === o.filialId);
      const val = Number(o.valorEstimadoPerda ?? o.valorTotal ?? 0);
      const bol = Number(o.valorBoleto ?? 0);
      return [
        o.protocolo || o.numero || 'OC-S/N',
        o.dataHora || o.data || '',
        o.tipo || '',
        o.gravidade || 'Média',
        b?.nome || o.filialId || '',
        o.produto || '',
        o.numeroNotaFiscal || '-',
        bol > 0 ? `R$ ${bol.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-',
        o.quantidadeAfetada ?? o.quantidade ?? 0,
        `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        o.status || '',
        o.solucao || 'Aguardando solução'
      ];
    });
    exportToExcel('relatorio_ocorrencias_fiscais', 'Livro de Ocorrências Fiscais e Operacionais', headers, rows, {
      'Total de Registros': `${filteredOccurrences.length} ocorrências`,
      'Emitido por': currentUser.name
    });
  };

  const handlePrint = () => {
    const headers = ['Protocolo', 'Data', 'Tipo', 'Filial', 'Produto', 'NF-e', 'Boleto (R$)', 'Qtd', 'Valor Perda', 'Status'];
    const rows = filteredOccurrences.map(o => {
      const b = branches.find(br => br.id === o.filialId);
      const val = Number(o.valorEstimadoPerda ?? o.valorTotal ?? 0);
      const bol = Number(o.valorBoleto ?? 0);
      return [
        o.protocolo || o.numero || 'OC-S/N',
        o.dataHora ? new Date(o.dataHora).toLocaleDateString('pt-BR') : o.data || '',
        o.tipo || '',
        b?.codigo || '',
        o.produto || '',
        o.numeroNotaFiscal || '-',
        bol > 0 ? `R$ ${bol.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-',
        o.quantidadeAfetada ?? o.quantidade ?? 0,
        `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        o.status || ''
      ];
    });
    printFormattedReport('Relatório de Ocorrências Fiscais', headers, rows, {
      'Emitido por': currentUser.name,
      'Data de Emissão': new Date().toLocaleDateString('pt-BR')
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-900">Cadastro de Ocorrências</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle de avarias, divergências de cargas, preços, notas e protocolos fiscais com fotos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>

          {canManage && (
            <button
              id="btn-add-occurrence"
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Ocorrência</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-red-600" />
            <span>Filtros de Ocorrências</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredOccurrences.length} ocorrência(s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Protocolo, produto, fornecedor ou NF..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
              />
            </div>
          </div>

          <div>
            <select
              value={tipoFilter}
              onChange={e => setTipoFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todos">Todos os Tipos</option>
              {occurrenceTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={gravidadeFilter}
              onChange={e => setGravidadeFilter(e.target.value as 'todos' | SeverityLevel)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todos">Todas as Gravidades</option>
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente (Alerta Vermelho)</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'todos' | OccurrenceStatus)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todos">Todos os Status</option>
              <option value="Aberta">Aberta</option>
              <option value="Em análise">Em análise</option>
              <option value="Aguardando fornecedor">Aguardando fornecedor</option>
              <option value="Aguardando filial">Aguardando filial</option>
              <option value="Resolvida">Resolvida</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <select
              value={filialFilter}
              onChange={e => setFilialFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todas">Todas as Filiais</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.codigo} - {b.nome.split(' - ')[1] || b.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Occurrences List / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Protocolo / Data</th>
                <th className="px-4 py-3">Gravidade</th>
                <th className="px-4 py-3">Tipo da Ocorrência</th>
                <th className="px-4 py-3">Produto / NF / Fornecedor</th>
                <th className="px-4 py-3">Filial</th>
                <th className="px-4 py-3 text-right">Qtd / Perda</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOccurrences.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Nenhuma ocorrência encontrada.
                  </td>
                </tr>
              ) : (
                filteredOccurrences.map(occ => {
                  const b = branches.find(br => br.id === occ.filialId);

                  let gravidadeBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (occ.gravidade === 'Urgente') gravidadeBadge = 'bg-red-100 text-red-800 border-red-300 animate-pulse font-bold';
                  if (occ.gravidade === 'Alta') gravidadeBadge = 'bg-red-50 text-red-700 border-red-200 font-semibold';
                  if (occ.gravidade === 'Média') gravidadeBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                  if (occ.gravidade === 'Baixa') gravidadeBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';

                  return (
                    <tr
                      key={occ.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        occ.gravidade === 'Urgente' && occ.status !== 'Resolvida' ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-mono font-bold text-red-700">{occ.protocolo || occ.numero || 'OC-S/N'}</p>
                        <p className="text-[10px] text-slate-400">
                          {occ.dataHora
                            ? new Date(occ.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                            : occ.data || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${gravidadeBadge}`}>
                          {occ.gravidade === 'Urgente' && <AlertTriangle className="w-3 h-3 text-red-700" />}
                          <span>{occ.gravidade || 'Média'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {occ.tipo}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 truncate max-w-[200px]">{occ.produto}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                          <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            NF: {occ.numeroNotaFiscal || 'S/N'}
                          </span>
                          {occ.valorBoleto ? (
                            <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                              Boleto: R$ {Number(occ.valorBoleto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          ) : null}
                          <span className="text-slate-400">•</span>
                          <span className="truncate max-w-[120px]">{occ.fornecedor}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-slate-700 font-medium text-[11px]">
                          <GitBranch className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[120px]">{b?.codigo || b?.nome || occ.filialId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-bold text-slate-900">{occ.quantidadeAfetada ?? occ.quantidade ?? 0} un</p>
                        <p className="font-mono text-[10px] text-red-700">
                          R$ {Number(occ.valorEstimadoPerda ?? occ.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            occ.status === 'Resolvida'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : occ.status === 'Aberta'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {occ.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {occ.status !== 'Resolvida' && canManage && (
                            <button
                              type="button"
                              onClick={() => handleOpenResolutionModal(occ)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 rounded hover:bg-emerald-50"
                              title="Solucionar e Fechar Ocorrência"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenView(occ)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                            title="Ver Detalhes / Evidências"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(occ)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(occ)}
                                className="p-1.5 text-red-600 hover:text-red-800 rounded hover:bg-red-50"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Solution Mandatory Modal */}
      {resolutionModalOpen && occurrenceToResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-800 text-white">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-sm">Fechar Ocorrência: {occurrenceToResolve.protocolo || occurrenceToResolve.numero}</h3>
              </div>
              <button
                type="button"
                onClick={() => setResolutionModalOpen(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800">
                <strong>Regra de Negócio:</strong> É obrigatório descrever a ação corretiva tomada (ex: carta de correção emitida, troca autorizada pelo fornecedor, estorno de estoque ou bonificação).
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ação Tomada / Solução Definitiva *
                </label>
                <textarea
                  rows={4}
                  required
                  value={solucaoText}
                  onChange={e => setSolucaoText(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                  placeholder="Ex: Emitida NF de devolução nº 44109 para Eurofarma com recolhimento das 8 caixas e crédito fiscal aplicado..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolutionModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveResolution}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Confirmar e Finalizar Ocorrência
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main CRUD Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-sm">
                  {modalMode === 'create' && 'Registrar Nova Ocorrência Fiscal'}
                  {modalMode === 'edit' && `Editar Ocorrência ${selectedOccurrence?.protocolo || selectedOccurrence?.numero || ''}`}
                  {modalMode === 'view' && `Ficha da Ocorrência ${selectedOccurrence?.protocolo || selectedOccurrence?.numero || ''}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo da Ocorrência *
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.tipo}
                    onChange={e => setFormData({ ...formData, tipo: e.target.value as OccurrenceType })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  >
                    {occurrenceTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gravidade *
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.gravidade}
                    onChange={e => setFormData({ ...formData, gravidade: e.target.value as SeverityLevel })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente (Alerta Sonoro e Visual)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Atual *
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as OccurrenceStatus })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  >
                    <option value="Aberta">Aberta</option>
                    <option value="Em análise">Em análise</option>
                    <option value="Aguardando fornecedor">Aguardando fornecedor</option>
                    <option value="Aguardando filial">Aguardando filial</option>
                    <option value="Resolvida">Resolvida</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Empresa *
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.empresaId}
                    onChange={e => setFormData({ ...formData, empresaId: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.nomeFantasia}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Filial *
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.filialId}
                    onChange={e => setFormData({ ...formData, filialId: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.codigo} - {b.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Produto / Item *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.produto}
                    onChange={e => setFormData({ ...formData, produto: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="Ex: Paracetamol 750mg c/ 20 comprimidos"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código do Produto (SKU)
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'view'}
                    value={formData.codigoProduto}
                    onChange={e => setFormData({ ...formData, codigoProduto: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="PRD-00123"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número da Nota Fiscal (NF-e)
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'view'}
                    value={formData.numeroNotaFiscal}
                    onChange={e => setFormData({ ...formData, numeroNotaFiscal: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="Ex: 000.123.456"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor do Boleto (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={modalMode === 'view'}
                      value={formData.valorBoleto || ''}
                      onChange={e => setFormData({ ...formData, valorBoleto: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs font-mono pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fornecedor / Transportadora
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'view'}
                    value={formData.fornecedor}
                    onChange={e => setFormData({ ...formData, fornecedor: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="Nome do fornecedor"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade Afetada *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.quantidadeAfetada}
                    onChange={e => setFormData({ ...formData, quantidadeAfetada: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Estimado da Perda (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={modalMode === 'view'}
                    value={formData.valorEstimadoPerda}
                    onChange={e => setFormData({ ...formData, valorEstimadoPerda: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Responsável pelo Registro
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'view'}
                    value={formData.responsavelRegistro}
                    onChange={e => setFormData({ ...formData, responsavelRegistro: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Responsável pela Solução
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'view'}
                    value={formData.responsavelSolucao}
                    onChange={e => setFormData({ ...formData, responsavelSolucao: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição Detalhada do Fato *
                </label>
                <textarea
                  rows={3}
                  required
                  disabled={modalMode === 'view'}
                  value={formData.descricao}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  placeholder="Relate como ocorreu a avaria, conferência ou divergência constatada na filial..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ação Tomada / Solução (Obrigatória para status "Resolvida")
                </label>
                <textarea
                  rows={2}
                  disabled={modalMode === 'view'}
                  value={formData.solucao}
                  onChange={e => setFormData({ ...formData, solucao: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  placeholder="Se solucionada, descreva a tratativa realizada com a filial ou fornecedor..."
                />
              </div>

              {/* Photos / Evidences */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Evidências Fotográficas e Documentos ({formData.fotos.length})
                  </label>
                  {modalMode !== 'view' && (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Adicionar Foto / Evidência</span>
                      </button>
                    </div>
                  )}
                </div>

                {formData.fotos.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {formData.fotos.map((img, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
                        <img
                          src={img}
                          alt={`Evidência ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {modalMode !== 'view' && (
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 shadow-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                    Nenhuma foto ou evidência anexada.
                  </div>
                )}
              </div>

              {/* History trail */}
              {selectedOccurrence && selectedOccurrence.historico && selectedOccurrence.historico.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-700 mb-2">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    Histórico de Auditoria da Ocorrência
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedOccurrence.historico.map(h => (
                      <div key={h.id} className="text-[11px] p-2 bg-slate-50 rounded border border-slate-100 text-slate-600">
                        <span className="font-semibold text-slate-800">{new Date(h.dataHora).toLocaleString('pt-BR')}:</span> {h.descricao}
                        <span className="text-slate-400"> ({h.usuario})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                {modalMode === 'view' && canManage && selectedOccurrence && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedOccurrence)}
                    className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 border border-blue-200 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Ocorrência</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  {modalMode === 'view' ? 'Fechar' : 'Cancelar'}
                </button>
                {modalMode !== 'view' && (
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs"
                  >
                    {modalMode === 'create' ? 'Salvar Ocorrência' : 'Salvar Alterações'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão */}
      {occurrenceToDelete && (
        <DeleteConfirmModal
          isOpen={!!occurrenceToDelete}
          onClose={() => setOccurrenceToDelete(null)}
          onConfirm={() => {
            if (occurrenceToDelete) {
              deleteOccurrence(occurrenceToDelete.id);
              setOccurrenceToDelete(null);
            }
          }}
          title="Excluir Ocorrência Fiscal"
          itemName={`Protocolo ${occurrenceToDelete.protocolo || occurrenceToDelete.numero} - ${occurrenceToDelete.tipo}`}
          itemType="ocorrência"
          description="O histórico e relatórios desta ocorrência fiscal serão removidos."
        />
      )}
    </div>
  );
};
