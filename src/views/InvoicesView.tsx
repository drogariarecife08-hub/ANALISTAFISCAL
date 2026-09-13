import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  FileDown,
  X,
  Building2,
  GitBranch,
  Calendar,
  DollarSign,
  Filter,
  Check
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { Invoice, InvoiceStatus } from '../types';
import { exportToCSV, exportToExcel, printFormattedReport } from '../utils/export';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const InvoicesView: React.FC = () => {
  const { invoices, branches, companies, addInvoice, updateInvoice, deleteInvoice, hasPermission, currentUser } = useSystem();

  const [searchTerm, setSearchTerm] = useState('');
  const [filialFilter, setFilialFilter] = useState('todas');
  const [fornecedorFilter, setFornecedorFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState<'Todos' | InvoiceStatus>('Todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const [formData, setFormData] = useState({
    numero: '',
    serie: '1',
    dataEmissao: new Date().toISOString().substring(0, 10),
    dataEntrada: new Date().toISOString().substring(0, 10),
    fornecedor: '',
    cnpjFornecedor: '',
    filialId: branches[0]?.id || '',
    empresaId: companies[0]?.id || '',
    valor: 0,
    responsavel: currentUser.name,
    status: 'Pendente' as InvoiceStatus,
    observacoes: ''
  });

  const canManage = hasPermission('manage_invoices') || currentUser.role === 'administrador';

  // Extract unique vendors
  const uniqueVendors = useMemo(() => {
    return Array.from(new Set(invoices.map(i => i.fornecedor))).filter(Boolean);
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch =
        inv.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.cnpjFornecedor.includes(searchTerm) ||
        inv.responsavel.toLowerCase().includes(searchTerm.toLowerCase());

      const matchFilial = filialFilter === 'todas' || inv.filialId === filialFilter;
      const matchFornecedor = fornecedorFilter === 'todos' || inv.fornecedor === fornecedorFilter;
      const matchStatus = statusFilter === 'Todos' || inv.status === statusFilter;

      let matchPeriodo = true;
      if (dataInicio && inv.dataEntrada < dataInicio) matchPeriodo = false;
      if (dataFim && inv.dataEntrada > dataFim) matchPeriodo = false;

      return matchSearch && matchFilial && matchFornecedor && matchStatus && matchPeriodo;
    });
  }, [invoices, searchTerm, filialFilter, fornecedorFilter, statusFilter, dataInicio, dataFim]);

  const totalValor = useMemo(() => {
    return filteredInvoices.reduce((acc, curr) => acc + curr.valor, 0);
  }, [filteredInvoices]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedInvoice(null);
    setFormData({
      numero: '',
      serie: '1',
      dataEmissao: new Date().toISOString().substring(0, 10),
      dataEntrada: new Date().toISOString().substring(0, 10),
      fornecedor: '',
      cnpjFornecedor: '',
      filialId: branches[0]?.id || '',
      empresaId: companies[0]?.id || '',
      valor: 0,
      responsavel: currentUser.name,
      status: 'Pendente',
      observacoes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (inv: Invoice) => {
    setModalMode('edit');
    setSelectedInvoice(inv);
    setFormData({
      numero: inv.numero,
      serie: inv.serie,
      dataEmissao: inv.dataEmissao,
      dataEntrada: inv.dataEntrada,
      fornecedor: inv.fornecedor,
      cnpjFornecedor: inv.cnpjFornecedor,
      filialId: inv.filialId,
      empresaId: inv.empresaId,
      valor: inv.valor,
      responsavel: inv.responsavel,
      status: inv.status,
      observacoes: inv.observacoes
    });
    setModalOpen(true);
  };

  const handleOpenView = (inv: Invoice) => {
    setModalMode('view');
    setSelectedInvoice(inv);
    setFormData({
      numero: inv.numero,
      serie: inv.serie,
      dataEmissao: inv.dataEmissao,
      dataEntrada: inv.dataEntrada,
      fornecedor: inv.fornecedor,
      cnpjFornecedor: inv.cnpjFornecedor,
      filialId: inv.filialId,
      empresaId: inv.empresaId,
      valor: inv.valor,
      responsavel: inv.responsavel,
      status: inv.status,
      observacoes: inv.observacoes
    });
    setModalOpen(true);
  };

  const handleMarkAsConcluded = (inv: Invoice) => {
    updateInvoice(inv.id, {
      status: 'Concluída',
      observacoes: inv.observacoes ? `${inv.observacoes} [Concluída por ${currentUser.name} em ${new Date().toLocaleDateString('pt-BR')}]` : `Conferência fiscal concluída por ${currentUser.name}`
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') {
      addInvoice(formData);
    } else if (modalMode === 'edit' && selectedInvoice) {
      updateInvoice(selectedInvoice.id, formData);
    }
    setModalOpen(false);
  };

  const handleDelete = (inv: Invoice) => {
    setInvoiceToDelete(inv);
  };

  // Export actions
  const handleExportCSV = () => {
    const headers = ['Número NF', 'Série', 'Emissão', 'Entrada', 'Fornecedor', 'CNPJ Fornecedor', 'Filial', 'Valor (R$)', 'Responsável', 'Status', 'Observações'];
    const rows = filteredInvoices.map(i => {
      const b = branches.find(br => br.id === i.filialId);
      return [
        i.numero,
        i.serie,
        i.dataEmissao,
        i.dataEntrada,
        i.fornecedor,
        i.cnpjFornecedor,
        b?.nome || i.filialId,
        i.valor.toFixed(2),
        i.responsavel,
        i.status,
        i.observacoes
      ];
    });
    exportToCSV('controle_fiscal_notas', headers, rows);
  };

  const handleExportExcel = () => {
    const headers = ['Número NF', 'Série', 'Emissão', 'Entrada', 'Fornecedor', 'CNPJ Fornecedor', 'Filial', 'Valor (R$)', 'Responsável', 'Status'];
    const rows = filteredInvoices.map(i => {
      const b = branches.find(br => br.id === i.filialId);
      return [
        i.numero,
        i.serie,
        i.dataEmissao,
        i.dataEntrada,
        i.fornecedor,
        i.cnpjFornecedor,
        b?.nome || i.filialId,
        `R$ ${i.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        i.responsavel,
        i.status
      ];
    });
    exportToExcel('controle_fiscal_notas', 'Controle Fiscal e Escrituração de Notas Fiscais', headers, rows, {
      'Total de Notas': `${filteredInvoices.length} documentos`,
      'Valor Total': `R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      'Analista Responsável': currentUser.name
    });
  };

  const handlePrint = () => {
    const headers = ['Número NF', 'Entrada', 'Fornecedor', 'Filial', 'Valor (R$)', 'Status', 'Responsável'];
    const rows = filteredInvoices.map(i => {
      const b = branches.find(br => br.id === i.filialId);
      return [
        i.numero,
        i.dataEntrada,
        i.fornecedor,
        b?.codigo || b?.nome || '',
        `R$ ${i.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        i.status,
        i.responsavel
      ];
    });
    printFormattedReport('Relatório de Controle Fiscal de Notas', headers, rows, {
      'Valor Total Faturado': `R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      'Data de Emissão': new Date().toLocaleDateString('pt-BR'),
      'Emitido por': currentUser.name
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-900">Controle Fiscal de Notas Fiscais</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Recepção, escrituração, controle de divergências e conferência com a SEFAZ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-800">
            Total: R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
              id="btn-add-invoice"
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Nota Fiscal</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-red-600" />
            <span>Filtros do Módulo Fiscal</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredInvoices.length} nota(s) encontrada(s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Número NF, fornecedor, CNPJ ou responsável..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
              />
            </div>
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
              value={fornecedorFilter}
              onChange={e => setFornecedorFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todos">Todos os Fornecedores</option>
              {uniqueVendors.map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'Todos' | InvoiceStatus)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Pendente">Pendente</option>
              <option value="Em análise">Em análise</option>
              <option value="Concluída">Concluída</option>
              <option value="Com divergência">Com divergência</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className="w-1/2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-2"
              title="Data Entrada Início"
            />
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              className="w-1/2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-2"
              title="Data Entrada Fim"
            />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Número / Série</th>
                <th className="px-4 py-3">Datas (Emissão / Entrada)</th>
                <th className="px-4 py-3">Fornecedor / CNPJ</th>
                <th className="px-4 py-3">Filial Destino</th>
                <th className="px-4 py-3 text-right">Valor Total</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Nenhuma nota fiscal encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const b = branches.find(br => br.id === inv.filialId);

                  let statusBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (inv.status === 'Concluída') statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (inv.status === 'Pendente') statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                  if (inv.status === 'Em análise') statusBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (inv.status === 'Com divergência') statusBadge = 'bg-red-50 text-red-700 border-red-200';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-mono font-bold text-slate-900">{inv.numero}</p>
                        <p className="text-[10px] text-slate-400">Série: {inv.serie}</p>
                      </td>
                      <td className="px-4 py-3 text-[11px]">
                        <p className="text-slate-800">Entrada: <strong>{new Date(inv.dataEntrada).toLocaleDateString('pt-BR')}</strong></p>
                        <p className="text-slate-400">Emissão: {new Date(inv.dataEmissao).toLocaleDateString('pt-BR')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 truncate max-w-[180px]">{inv.fornecedor}</p>
                        <p className="font-mono text-[10px] text-slate-400">{inv.cnpjFornecedor}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <GitBranch className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{b?.nome.split(' - ')[1] || b?.nome || inv.filialId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        R$ {inv.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {inv.responsavel}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {inv.status !== 'Concluída' && canManage && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsConcluded(inv)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 rounded hover:bg-emerald-50"
                              title="Marcar como Concluída"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenView(inv)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                            title="Visualizar Detalhes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(inv)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(inv)}
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

      {/* Modal CRUD */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-sm">
                  {modalMode === 'create' && 'Cadastrar Nota Fiscal'}
                  {modalMode === 'edit' && 'Editar Nota Fiscal'}
                  {modalMode === 'view' && 'Dados da Nota Fiscal'}
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
                    Número da Nota Fiscal *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.numero}
                    onChange={e => setFormData({ ...formData, numero: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="000.123.456"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Série
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'view'}
                    value={formData.serie}
                    onChange={e => setFormData({ ...formData, serie: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fornecedor / Emitente *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.fornecedor}
                    onChange={e => setFormData({ ...formData, fornecedor: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="Ex: Eurofarma Laboratórios"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CNPJ do Fornecedor *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.cnpjFornecedor}
                    onChange={e => setFormData({ ...formData, cnpjFornecedor: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Emissão *
                  </label>
                  <input
                    type="date"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.dataEmissao}
                    onChange={e => setFormData({ ...formData, dataEmissao: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Entrada no Sistema *
                  </label>
                  <input
                    type="date"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.dataEntrada}
                    onChange={e => setFormData({ ...formData, dataEntrada: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Filial de Entrada *
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
                    Valor Total da Nota (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.valor}
                    onChange={e => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Responsável Fiscal *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.responsavel}
                    onChange={e => setFormData({ ...formData, responsavel: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status da Nota *
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as InvoiceStatus })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em análise">Em análise</option>
                    <option value="Concluída">Concluída</option>
                    <option value="Com divergência">Com divergência</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações e Controle de Pendências
                </label>
                <textarea
                  rows={3}
                  disabled={modalMode === 'view'}
                  value={formData.observacoes}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  placeholder="Informações sobre chave NFe, divergência de alíquota, frete ou romaneio..."
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
                    {modalMode === 'create' ? 'Cadastrar Nota' : 'Salvar Nota Fiscal'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão */}
      {invoiceToDelete && (
        <DeleteConfirmModal
          isOpen={!!invoiceToDelete}
          onClose={() => setInvoiceToDelete(null)}
          onConfirm={() => {
            if (invoiceToDelete) {
              deleteInvoice(invoiceToDelete.id);
              setInvoiceToDelete(null);
            }
          }}
          title="Excluir Nota Fiscal"
          itemName={`NF nº ${invoiceToDelete.numero} - Série ${invoiceToDelete.serie} (${invoiceToDelete.fornecedor})`}
          itemType="nota fiscal"
          description="O registro fiscal desta nota e seus lançamentos tributários serão excluídos do sistema."
        />
      )}
    </div>
  );
};
