import React, { useState, useMemo } from 'react';
import {
  PackageMinus,
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
  FileSpreadsheet
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { ProductShortage, ShortageStatus } from '../types';
import { exportToCSV, exportToExcel, printFormattedReport } from '../utils/export';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const ShortagesView: React.FC = () => {
  const {
    shortages,
    branches,
    addShortage,
    updateShortage,
    deleteShortage,
    hasPermission,
    currentUser
  } = useSystem();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | ShortageStatus>('todos');
  const [filialFilter, setFilialFilter] = useState('todas');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedShortage, setSelectedShortage] = useState<ProductShortage | null>(null);
  const [shortageToDelete, setShortageToDelete] = useState<ProductShortage | null>(null);

  const [formData, setFormData] = useState({
    data: new Date().toISOString().substring(0, 10),
    filialId: branches[0]?.id || '',
    notaFiscal: '',
    fornecedor: '',
    produto: '',
    codigo: '',
    quantidadeFaturada: 10,
    quantidadeRecebida: 8,
    valorUnitario: 0,
    status: 'Pendente de regularização' as ShortageStatus,
    observacoes: ''
  });

  const canManage = hasPermission('manage_shortages') || currentUser.role === 'administrador';

  const filteredShortages = useMemo(() => {
    const termo = (searchTerm || '').toLowerCase();
    return shortages.filter(s => {
      const matchSearch =
        (s.produto || '').toLowerCase().includes(termo) ||
        (s.codigo || s.codigoBarras || '').toLowerCase().includes(termo) ||
        (s.fornecedor || '').toLowerCase().includes(termo) ||
        (s.notaFiscal || '').toLowerCase().includes(termo);

      const matchStatus = statusFilter === 'todos' || s.status === statusFilter;
      const matchFilial = filialFilter === 'todas' || s.filialId === filialFilter;

      return matchSearch && matchStatus && matchFilial;
    });
  }, [shortages, searchTerm, statusFilter, filialFilter]);

  const totalFaltanteQtd = useMemo(() => {
    return filteredShortages.reduce((acc, curr) => acc + curr.quantidadeFaltante, 0);
  }, [filteredShortages]);

  const totalFaltanteValor = useMemo(() => {
    return filteredShortages.reduce((acc, curr) => acc + curr.valorTotal, 0);
  }, [filteredShortages]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedShortage(null);
    setFormData({
      data: new Date().toISOString().substring(0, 10),
      filialId: branches[0]?.id || '',
      notaFiscal: '',
      fornecedor: '',
      produto: '',
      codigo: '',
      quantidadeFaturada: 10,
      quantidadeRecebida: 8,
      valorUnitario: 0,
      status: 'Pendente de regularização',
      observacoes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (s: ProductShortage) => {
    setModalMode('edit');
    setSelectedShortage(s);
    setFormData({
      data: s.data,
      filialId: s.filialId,
      notaFiscal: s.notaFiscal,
      fornecedor: s.fornecedor,
      produto: s.produto,
      codigo: s.codigo,
      quantidadeFaturada: s.quantidadeFaturada,
      quantidadeRecebida: s.quantidadeRecebida,
      valorUnitario: s.valorUnitario,
      status: s.status,
      observacoes: s.observacoes || ''
    });
    setModalOpen(true);
  };

  const handleOpenView = (s: ProductShortage) => {
    setModalMode('view');
    setSelectedShortage(s);
    setFormData({
      data: s.data,
      filialId: s.filialId,
      notaFiscal: s.notaFiscal,
      fornecedor: s.fornecedor,
      produto: s.produto,
      codigo: s.codigo,
      quantidadeFaturada: s.quantidadeFaturada,
      quantidadeRecebida: s.quantidadeRecebida,
      valorUnitario: s.valorUnitario,
      status: s.status,
      observacoes: s.observacoes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const branch = branches.find(b => b.id === formData.filialId);
    const quantidadeFaltante = Math.max(0, formData.quantidadeFaturada - formData.quantidadeRecebida);
    const valorTotal = quantidadeFaltante * formData.valorUnitario;

    const payload = {
      ...formData,
      filialNome: branch?.nome || '',
      quantidadeFaltante,
      valorTotal
    };

    if (modalMode === 'create') {
      addShortage(payload);
    } else if (modalMode === 'edit' && selectedShortage) {
      updateShortage(selectedShortage.id, payload);
    }
    setModalOpen(false);
  };

  const handleDelete = (s: ProductShortage) => {
    setShortageToDelete(s);
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Filial', 'Nota Fiscal', 'Fornecedor', 'Produto', 'Código', 'Qtd Faturada', 'Qtd Recebida', 'Qtd Faltante', 'Valor Unit.', 'Valor Total', 'Status'];
    const rows = filteredShortages.map(s => [
      s.data || '',
      s.filialNome || '',
      s.notaFiscal || '',
      s.fornecedor || '',
      s.produto || '',
      s.codigo || s.codigoBarras || '',
      s.quantidadeFaturada ?? s.quantidadeSolicitada ?? 0,
      s.quantidadeRecebida || 0,
      s.quantidadeFaltante || 0,
      Number(s.valorUnitario ?? 0).toFixed(2),
      Number(s.valorTotal ?? 0).toFixed(2),
      s.status || ''
    ]);
    exportToCSV('controle_falta_produtos', headers, rows);
  };

  const handleExportExcel = () => {
    const headers = ['Data', 'Filial', 'NF', 'Fornecedor', 'Produto', 'Código', 'Faturado', 'Recebido', 'Falta', 'Total Faltante', 'Status'];
    const rows = filteredShortages.map(s => [
      s.data || '',
      s.filialNome || '',
      s.notaFiscal || '',
      s.fornecedor || '',
      s.produto || '',
      s.codigo || s.codigoBarras || '',
      s.quantidadeFaturada ?? s.quantidadeSolicitada ?? 0,
      s.quantidadeRecebida || 0,
      `${s.quantidadeFaltante || 0} un`,
      `R$ ${Number(s.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      s.status || ''
    ]);
    exportToExcel('controle_falta_produtos', 'Controle de Mercadorias e Faltas Faturadas', headers, rows, {
      'Unidades Faltantes': `${totalFaltanteQtd} itens`,
      'Prejuízo Financeiro em Aberto': `R$ ${totalFaltanteValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      'Emitido por': currentUser.name
    });
  };

  const handlePrint = () => {
    const headers = ['Data', 'Filial', 'NF', 'Fornecedor', 'Produto', 'Qtd Faltante', 'Total (R$)', 'Status'];
    const rows = filteredShortages.map(s => [
      s.data ? new Date(s.data).toLocaleDateString('pt-BR') : '',
      (s.filialNome || '').split(' - ')[1] || s.filialNome || '',
      s.notaFiscal || '',
      s.fornecedor || '',
      s.produto || '',
      s.quantidadeFaltante || 0,
      `R$ ${Number(s.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      s.status || ''
    ]);
    printFormattedReport('Relatório de Faltas de Produtos em Conferência', headers, rows, {
      'Total Faltante': `${totalFaltanteQtd} unidades (R$ ${totalFaltanteValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
      'Data de Emissão': new Date().toLocaleDateString('pt-BR')
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <PackageMinus className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-900">Controle de Falta de Produtos</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mercadorias faturadas não entregues, conferência cega e solicitação de carta de correção.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900">
            Falta Total: {totalFaltanteQtd} un (R$ {totalFaltanteValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
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
              id="btn-add-shortage"
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Falta</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-red-600" />
            <span>Filtros de Faltas</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredShortages.length} item(ns) encontrado(s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Produto, fornecedor, NF ou código..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
              />
            </div>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'todos' | ShortageStatus)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todos">Todos os Status</option>
              <option value="Pendente de regularização">Pendente de regularização</option>
              <option value="Carta de correção solicitada">Carta de correção solicitada</option>
              <option value="Devolução gerada">Devolução gerada</option>
              <option value="Resolvido">Resolvido</option>
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Data / Filial</th>
                <th className="px-4 py-3">NF / Fornecedor</th>
                <th className="px-4 py-3">Produto / Código</th>
                <th className="px-4 py-3 text-center">Faturado</th>
                <th className="px-4 py-3 text-center">Recebido</th>
                <th className="px-4 py-3 text-center">Falta</th>
                <th className="px-4 py-3 text-right">Valor Total Faltante</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShortages.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    Nenhum registro de falta de produto localizado.
                  </td>
                </tr>
              ) : (
                filteredShortages.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{s.data ? new Date(s.data).toLocaleDateString('pt-BR') : '-'}</p>
                      <p className="text-[10px] text-slate-400">{(s.filialNome || '').split(' - ')[1] || s.filialNome || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono font-bold text-slate-900">NF {s.notaFiscal || '-'}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{s.fornecedor || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900 truncate max-w-[200px]">{s.produto || '-'}</p>
                      <p className="font-mono text-[10px] text-slate-400">{s.codigo || s.codigoBarras || 'S/N'}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700 font-medium">
                      {s.quantidadeFaturada ?? s.quantidadeSolicitada ?? 0} un
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700 font-medium">
                      {s.quantidadeRecebida || 0} un
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full font-bold text-xs bg-red-100 text-red-800">
                        -{s.quantidadeFaltante || 0} un
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-red-700">
                      R$ {Number(s.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          s.status === 'Resolvido'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : s.status === 'Carta de correção solicitada'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenView(s)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                          title="Visualizar"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(s)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(s)}
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
                <PackageMinus className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-sm">
                  {modalMode === 'create' && 'Registrar Falta de Mercadoria'}
                  {modalMode === 'edit' && 'Editar Registro de Falta'}
                  {modalMode === 'view' && 'Dados da Falta de Produto'}
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
                    Data da Entrada *
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
                    Número da Nota Fiscal *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.notaFiscal}
                    onChange={e => setFormData({ ...formData, notaFiscal: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="000.123.456"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fornecedor *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.fornecedor}
                    onChange={e => setFormData({ ...formData, fornecedor: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
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
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código do Produto (SKU)
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'view'}
                    value={formData.codigo}
                    onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qtd Faturada na NF *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.quantidadeFaturada}
                    onChange={e => setFormData({ ...formData, quantidadeFaturada: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qtd Efetivamente Recebida *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.quantidadeRecebida}
                    onChange={e => setFormData({ ...formData, quantidadeRecebida: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Unitário na NF (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.valorUnitario}
                    onChange={e => setFormData({ ...formData, valorUnitario: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status da Regularização *
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as ShortageStatus })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  >
                    <option value="Pendente de regularização">Pendente de regularização</option>
                    <option value="Carta de correção solicitada">Carta de correção solicitada</option>
                    <option value="Devolução gerada">Devolução gerada</option>
                    <option value="Resolvido">Resolvido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações e Contatos com o Fornecedor
                </label>
                <textarea
                  rows={2}
                  disabled={modalMode === 'view'}
                  value={formData.observacoes}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  placeholder="Número do chamado no fornecedor ou dados da expedição..."
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
      {shortageToDelete && (
        <DeleteConfirmModal
          isOpen={!!shortageToDelete}
          onClose={() => setShortageToDelete(null)}
          onConfirm={() => {
            if (shortageToDelete) {
              deleteShortage(shortageToDelete.id);
              setShortageToDelete(null);
            }
          }}
          title="Excluir Registro de Falta"
          itemName={`${shortageToDelete.produto} (Falta: ${shortageToDelete.quantidadeFaltante})`}
          itemType="registro de falta"
          description="O registro fiscal desta falta de mercadoria será removido do sistema."
        />
      )}
    </div>
  );
};
