import React, { useState, useMemo } from 'react';
import {
  PackageX,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Download,
  Printer,
  FileDown,
  X,
  Filter,
  DollarSign,
  AlertTriangle,
  GitBranch,
  Building2
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { LossDamage, LossDamageStatus } from '../types';
import { exportToCSV, exportToExcel, printFormattedReport } from '../utils/export';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const LossDamagesView: React.FC = () => {
  const {
    lossDamages,
    companies,
    branches,
    addLossDamage,
    updateLossDamage,
    deleteLossDamage,
    hasPermission,
    currentUser
  } = useSystem();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | LossDamageStatus>('todos');
  const [filialFilter, setFilialFilter] = useState('todas');
  const [empresaFilter, setEmpresaFilter] = useState('todas');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedLoss, setSelectedLoss] = useState<LossDamage | null>(null);
  const [lossToDelete, setLossToDelete] = useState<LossDamage | null>(null);

  const [formData, setFormData] = useState({
    data: new Date().toISOString().substring(0, 10),
    empresaId: companies[0]?.id || '',
    filialId: branches[0]?.id || '',
    produto: '',
    codigo: '',
    lote: '',
    validade: '',
    quantidade: 1,
    custoUnitario: 0,
    motivoPerda: 'Avaria no transporte',
    responsavel: currentUser.name,
    status: 'Em análise' as LossDamageStatus,
    observacoes: ''
  });

  const canManage = hasPermission('manage_loss_damage') || currentUser.role === 'administrador';

  const filteredLosses = useMemo(() => {
    const termo = (searchTerm || '').toLowerCase();
    return lossDamages.filter(l => {
      const matchSearch =
        (l.produto || '').toLowerCase().includes(termo) ||
        (l.codigo || l.codigoBarras || '').toLowerCase().includes(termo) ||
        (l.lote || '').toLowerCase().includes(termo) ||
        (l.motivoPerda || l.motivoAvaria || l.tipoPerda || '').toLowerCase().includes(termo);

      const matchStatus = statusFilter === 'todos' || l.status === statusFilter;
      const matchFilial = filialFilter === 'todas' || l.filialId === filialFilter;
      const matchEmpresa = empresaFilter === 'todas' || l.empresaId === empresaFilter;

      return matchSearch && matchStatus && matchFilial && matchEmpresa;
    });
  }, [lossDamages, searchTerm, statusFilter, filialFilter, empresaFilter]);

  const totalPerdaFinanceira = useMemo(() => {
    return filteredLosses.reduce((acc, curr) => acc + curr.valorTotal, 0);
  }, [filteredLosses]);

  const totalUnidades = useMemo(() => {
    return filteredLosses.reduce((acc, curr) => acc + curr.quantidade, 0);
  }, [filteredLosses]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedLoss(null);
    setFormData({
      data: new Date().toISOString().substring(0, 10),
      empresaId: companies[0]?.id || '',
      filialId: branches[0]?.id || '',
      produto: '',
      codigo: '',
      lote: 'LT-' + Math.floor(100000 + Math.random() * 900000),
      validade: '2027-06-30',
      quantidade: 1,
      custoUnitario: 0,
      motivoPerda: 'Avaria no transporte',
      responsavel: currentUser.name,
      status: 'Em análise',
      observacoes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (loss: LossDamage) => {
    setModalMode('edit');
    setSelectedLoss(loss);
    setFormData({
      data: loss.data,
      empresaId: loss.empresaId,
      filialId: loss.filialId,
      produto: loss.produto,
      codigo: loss.codigo,
      lote: loss.lote,
      validade: loss.validade,
      quantidade: loss.quantidade,
      custoUnitario: loss.custoUnitario,
      motivoPerda: loss.motivoPerda,
      responsavel: loss.responsavel,
      status: loss.status,
      observacoes: loss.observacoes || ''
    });
    setModalOpen(true);
  };

  const handleOpenView = (loss: LossDamage) => {
    setModalMode('view');
    setSelectedLoss(loss);
    setFormData({
      data: loss.data,
      empresaId: loss.empresaId,
      filialId: loss.filialId,
      produto: loss.produto,
      codigo: loss.codigo,
      lote: loss.lote,
      validade: loss.validade,
      quantidade: loss.quantidade,
      custoUnitario: loss.custoUnitario,
      motivoPerda: loss.motivoPerda,
      responsavel: loss.responsavel,
      status: loss.status,
      observacoes: loss.observacoes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valorTotal = formData.quantidade * formData.custoUnitario;
    const emp = companies.find(c => c.id === formData.empresaId);
    const branch = branches.find(b => b.id === formData.filialId);

    const payload = {
      ...formData,
      empresaNome: emp?.nomeFantasia || '',
      filialNome: branch?.nome || '',
      valorTotal
    };

    if (modalMode === 'create') {
      addLossDamage(payload);
    } else if (modalMode === 'edit' && selectedLoss) {
      updateLossDamage(selectedLoss.id, payload);
    }
    setModalOpen(false);
  };

  const handleDelete = (loss: LossDamage) => {
    setLossToDelete(loss);
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Empresa', 'Filial', 'Produto', 'Código', 'Lote', 'Validade', 'Qtd', 'Custo Unit.', 'Valor Total', 'Motivo', 'Responsável', 'Status'];
    const rows = filteredLosses.map(l => [
      l.data || '',
      l.empresaNome || '',
      l.filialNome || '',
      l.produto || '',
      l.codigo || l.codigoBarras || '',
      l.lote || 'N/A',
      l.validade || 'N/A',
      l.quantidade || 0,
      Number(l.custoUnitario ?? l.valorUnitario ?? 0).toFixed(2),
      Number(l.valorTotal ?? 0).toFixed(2),
      l.motivoPerda || l.motivoAvaria || l.tipoPerda || 'Avaria',
      l.responsavel || '',
      l.status || ''
    ]);
    exportToCSV('controle_perdas_avarias', headers, rows);
  };

  const handleExportExcel = () => {
    const headers = ['Data', 'Filial', 'Produto', 'Código', 'Lote', 'Validade', 'Qtd', 'Custo Unit.', 'Valor Total', 'Motivo', 'Status'];
    const rows = filteredLosses.map(l => [
      l.data || '',
      l.filialNome || '',
      l.produto || '',
      l.codigo || l.codigoBarras || '',
      l.lote || 'N/A',
      l.validade || 'N/A',
      l.quantidade || 0,
      `R$ ${Number(l.custoUnitario ?? l.valorUnitario ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${Number(l.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      l.motivoPerda || l.motivoAvaria || l.tipoPerda || 'Avaria',
      l.status || ''
    ]);
    exportToExcel('controle_perdas_avarias', 'Controle Geral de Perdas e Avarias Operacionais', headers, rows, {
      'Perda Financeira Total': `R$ ${totalPerdaFinanceira.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      'Total de Itens Avariados': `${totalUnidades} unidades`,
      'Emitido por': currentUser.name
    });
  };

  const handlePrint = () => {
    const headers = ['Data', 'Filial', 'Produto', 'Lote', 'Qtd', 'Total (R$)', 'Motivo', 'Status'];
    const rows = filteredLosses.map(l => [
      l.data ? new Date(l.data).toLocaleDateString('pt-BR') : '',
      (l.filialNome || '').split(' - ')[1] || l.filialNome || '',
      l.produto || '',
      l.lote || 'N/A',
      l.quantidade || 0,
      `R$ ${Number(l.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      l.motivoPerda || l.motivoAvaria || l.tipoPerda || 'Avaria',
      l.status || ''
    ]);
    printFormattedReport('Relatório de Perdas e Avarias Fiscais', headers, rows, {
      'Custo Total das Avarias': `R$ ${totalPerdaFinanceira.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      'Data de Emissão': new Date().toLocaleDateString('pt-BR')
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <PackageX className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-900">Controle de Perdas e Avarias</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitoramento de perdas operacionais, lotes avariados, descarte fiscal e indenizações.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-800">
            Perda Total: R$ {totalPerdaFinanceira.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({totalUnidades} un)
          </div>
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
              id="btn-add-loss"
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Avaria</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-red-600" />
            <span>Filtros de Perdas</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredLosses.length} registro(s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar produto, código, lote ou motivo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
              />
            </div>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'todos' | LossDamageStatus)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todos">Todos os Status</option>
              <option value="Em análise">Em análise</option>
              <option value="Aprovada para descarte">Aprovada para descarte</option>
              <option value="Indenizada pelo fornecedor">Indenizada pelo fornecedor</option>
              <option value="Estornada">Estornada</option>
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

          <div>
            <select
              value={empresaFilter}
              onChange={e => setEmpresaFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todas">Todas as Empresas</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.nomeFantasia}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Data / Filial</th>
                <th className="px-4 py-3">Produto / Código</th>
                <th className="px-4 py-3">Lote / Validade</th>
                <th className="px-4 py-3 text-right">Qtd</th>
                <th className="px-4 py-3 text-right">Custo Unit.</th>
                <th className="px-4 py-3 text-right">Total Perda</th>
                <th className="px-4 py-3">Motivo da Perda</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLosses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    Nenhum registro de avaria encontrado.
                  </td>
                </tr>
              ) : (
                filteredLosses.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{l.data ? new Date(l.data).toLocaleDateString('pt-BR') : '-'}</p>
                      <p className="text-[10px] text-slate-400">{(l.filialNome || '').split(' - ')[1] || l.filialNome || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900 truncate max-w-[200px]">{l.produto || '-'}</p>
                      <p className="font-mono text-[10px] text-slate-400">SKU: {l.codigo || l.codigoBarras || 'S/N'}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <p className="text-slate-800">LT: {l.lote || 'S/L'}</p>
                      <p className="text-slate-400">VAL: {l.validade ? new Date(l.validade).toLocaleDateString('pt-BR') : 'N/A'}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {l.quantidade || 0} un
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      R$ {Number(l.custoUnitario ?? l.valorUnitario ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-red-700">
                      R$ {Number(l.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {l.motivoPerda || l.motivoAvaria || l.tipoPerda || 'Avaria'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          l.status === 'Indenizada pelo fornecedor'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : l.status === 'Aprovada para descarte'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenView(l)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                          title="Visualizar"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(l)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(l)}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <PackageX className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-sm">
                  {modalMode === 'create' && 'Registrar Perda / Avaria Fiscal'}
                  {modalMode === 'edit' && 'Editar Registro de Avaria'}
                  {modalMode === 'view' && 'Dados da Avaria'}
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data do Registro *
                  </label>
                  <input
                    type="date"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.data}
                    onChange={e => setFormData({ ...formData, data: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
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
                    Produto *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.produto}
                    onChange={e => setFormData({ ...formData, produto: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="Nome comercial do item"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código do Produto (SKU) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.codigo}
                    onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="PRD-0000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número do Lote
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'view'}
                    value={formData.lote}
                    onChange={e => setFormData({ ...formData, lote: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="LT-000000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Validade
                  </label>
                  <input
                    type="date"
                    disabled={modalMode === 'view'}
                    value={formData.validade}
                    onChange={e => setFormData({ ...formData, validade: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade Avariada *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.quantidade}
                    onChange={e => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custo Unitário (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.custoUnitario}
                    onChange={e => setFormData({ ...formData, custoUnitario: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Motivo da Perda *
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.motivoPerda}
                    onChange={e => setFormData({ ...formData, motivoPerda: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  >
                    <option value="Avaria no transporte">Avaria no transporte</option>
                    <option value="Queda interna na loja">Queda interna na loja</option>
                    <option value="Embalagem violada/rasgada">Embalagem violada/rasgada</option>
                    <option value="Validade vencida">Validade vencida</option>
                    <option value="Defeito de fabricação">Defeito de fabricação</option>
                    <option value="Umidade ou temperatura inadequada">Umidade ou temperatura inadequada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status do Processo Fiscal *
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as LossDamageStatus })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  >
                    <option value="Em análise">Em análise</option>
                    <option value="Aprovada para descarte">Aprovada para descarte</option>
                    <option value="Indenizada pelo fornecedor">Indenizada pelo fornecedor</option>
                    <option value="Estornada">Estornada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações e Laudo
                </label>
                <textarea
                  rows={2}
                  disabled={modalMode === 'view'}
                  value={formData.observacoes}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  placeholder="Número de protocolo do SAC do fabricante ou transportadora..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                    {modalMode === 'create' ? 'Salvar Registro' : 'Salvar Alterações'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão */}
      {lossToDelete && (
        <DeleteConfirmModal
          isOpen={!!lossToDelete}
          onClose={() => setLossToDelete(null)}
          onConfirm={() => {
            if (lossToDelete) {
              deleteLossDamage(lossToDelete.id);
              setLossToDelete(null);
            }
          }}
          title="Excluir Registro de Avaria"
          itemName={`${lossToDelete.produto} (Qtd: ${lossToDelete.quantidade})`}
          itemType="registro de avaria"
          description="O registro desta avaria/perda de produto será removido dos relatórios fiscais."
        />
      )}
    </div>
  );
};
