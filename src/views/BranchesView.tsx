import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Download,
  Printer,
  FileSpreadsheet,
  X,
  Building2
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { Branch, BranchStatus } from '../types';
import { exportToCSV, exportToExcel, printFormattedReport } from '../utils/export';

export const BranchesView: React.FC = () => {
  const { branches, companies, addBranch, updateBranch, deleteBranch, hasPermission, currentUser } = useSystem();

  const [searchTerm, setSearchTerm] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState<'Todos' | BranchStatus>('Todos');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    cnpj: '',
    empresaId: companies[0]?.id || '',
    empresaNome: companies[0]?.nomeFantasia || '',
    email: '',
    telefone: '',
    responsavel: '',
    endereco: '',
    cidade: '',
    estado: 'PE',
    status: 'Ativa' as BranchStatus
  });

  const canManage = hasPermission('manage_branches') || currentUser.role === 'administrador' || currentUser.role === 'analista_fiscal';

  const filteredBranches = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    return branches.filter(b => {
      const matchSearch =
        (b.nome || '').toLowerCase().includes(term) ||
        (b.codigo || '').toLowerCase().includes(term) ||
        (b.cnpj || '').includes(term) ||
        (b.cidade || '').toLowerCase().includes(term);
      const matchEmpresa = empresaFilter === 'todas' || b.empresaId === empresaFilter;
      const matchStatus = statusFilter === 'Todos' || b.status === statusFilter;
      return matchSearch && matchEmpresa && matchStatus;
    });
  }, [branches, searchTerm, empresaFilter, statusFilter]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedBranch(null);
    const defaultEmp = companies[0];
    setFormData({
      nome: '',
      codigo: `FIL-REC-0${branches.length + 1}`,
      cnpj: '',
      empresaId: defaultEmp?.id || '',
      empresaNome: defaultEmp?.nomeFantasia || '',
      email: '',
      telefone: '',
      responsavel: currentUser.name,
      endereco: '',
      cidade: 'Recife',
      estado: 'PE',
      status: 'Ativa'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setModalMode('edit');
    setSelectedBranch(branch);
    setFormData({
      nome: branch.nome,
      codigo: branch.codigo,
      cnpj: branch.cnpj,
      empresaId: branch.empresaId,
      empresaNome: branch.empresaNome,
      email: branch.email,
      telefone: branch.telefone,
      responsavel: branch.responsavel,
      endereco: branch.endereco,
      cidade: branch.cidade,
      estado: branch.estado,
      status: branch.status
    });
    setModalOpen(true);
  };

  const handleOpenView = (branch: Branch) => {
    setModalMode('view');
    setSelectedBranch(branch);
    setFormData({
      nome: branch.nome,
      codigo: branch.codigo,
      cnpj: branch.cnpj,
      empresaId: branch.empresaId,
      empresaNome: branch.empresaNome,
      email: branch.email,
      telefone: branch.telefone,
      responsavel: branch.responsavel,
      endereco: branch.endereco,
      cidade: branch.cidade,
      estado: branch.estado,
      status: branch.status
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedEmp = companies.find(c => c.id === formData.empresaId);
    const payload = {
      ...formData,
      empresaNome: matchedEmp ? matchedEmp.nomeFantasia : formData.empresaNome
    };

    if (modalMode === 'create') {
      addBranch(payload);
    } else if (modalMode === 'edit' && selectedBranch) {
      updateBranch(selectedBranch.id, payload);
    }
    setModalOpen(false);
  };

  const handleDelete = (branch: Branch) => {
    setBranchToDelete(branch);
  };

  const confirmDelete = () => {
    if (branchToDelete) {
      deleteBranch(branchToDelete.id);
      setBranchToDelete(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Código', 'Nome da Filial', 'CNPJ', 'Empresa Vinculada', 'Responsável', 'Telefone', 'E-mail', 'Cidade/UF', 'Status'];
    const rows = filteredBranches.map(b => [
      b.codigo,
      b.nome,
      b.cnpj,
      b.empresaNome,
      b.responsavel,
      b.telefone,
      b.email,
      `${b.cidade}/${b.estado}`,
      b.status
    ]);
    exportToCSV('relatorio_filiais_fiscal', headers, rows);
  };

  const handleExportExcel = () => {
    const headers = ['Código', 'Nome da Filial', 'CNPJ', 'Empresa Vinculada', 'Responsável', 'Telefone', 'E-mail', 'Cidade/UF', 'Status'];
    const rows = filteredBranches.map(b => [
      b.codigo,
      b.nome,
      b.cnpj,
      b.empresaNome,
      b.responsavel,
      b.telefone,
      b.email,
      `${b.cidade}/${b.estado}`,
      b.status
    ]);
    exportToExcel('relatorio_filiais_fiscal', 'Controle e Cadastro de Filiais Operacionais', headers, rows, {
      'Total de Filiais': `${filteredBranches.length} filiais`,
      'Responsável da Extração': currentUser.name
    });
  };

  const handlePrint = () => {
    const headers = ['Código', 'Nome da Filial', 'CNPJ', 'Empresa', 'Responsável', 'Cidade/UF', 'Status'];
    const rows = filteredBranches.map(b => [
      b.codigo,
      b.nome,
      b.cnpj,
      b.empresaNome,
      b.responsavel,
      `${b.cidade}/${b.estado}`,
      b.status
    ]);
    printFormattedReport('Relatório de Filiais - Sistema de Analista Fiscal', headers, rows, {
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
            <GitBranch className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-900">Cadastro de Filiais</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle de filiais, centros de distribuição e vinculação societária.
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
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
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
              id="btn-add-branch"
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Filial</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código, nome da filial, CNPJ ou cidade..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={empresaFilter}
            onChange={e => setEmpresaFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
          >
            <option value="todas">Todas as Empresas</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.nomeFantasia}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'Todos' | BranchStatus)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Ativa">Ativas</option>
            <option value="Inativa">Inativas</option>
          </select>
        </div>
      </div>

      {/* Branches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Código / Nome da Filial</th>
                <th className="px-4 py-3">CNPJ</th>
                <th className="px-4 py-3">Empresa Vinculada</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Cidade/UF</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Nenhuma filial encontrada.
                  </td>
                </tr>
              ) : (
                filteredBranches.map(branch => (
                  <tr key={branch.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {branch.codigo}
                      </span>
                      <p className="font-bold text-slate-900 mt-1">{branch.nome}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-800">
                      {branch.cnpj}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span className="truncate max-w-[180px]">{branch.empresaNome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {branch.responsavel}
                    </td>
                    <td className="px-4 py-3 text-[11px]">
                      <p className="text-slate-800">{branch.telefone}</p>
                      <p className="text-slate-500 truncate max-w-[150px]">{branch.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-800">
                      {branch.cidade} - {branch.estado}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          branch.status === 'Ativa'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {branch.status === 'Ativa' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-slate-400" />
                        )}
                        <span>{branch.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenView(branch)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 flex items-center gap-1 border border-slate-200"
                          title="Visualizar detalhes da filial"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(branch)}
                              className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md flex items-center gap-1 border border-blue-200 transition-colors"
                              title="Editar dados desta filial"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(branch)}
                              className="px-2 py-1 text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-md flex items-center gap-1 border border-red-200 transition-colors"
                              title="Excluir filial do sistema"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir</span>
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
                <GitBranch className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-sm">
                  {modalMode === 'create' && 'Cadastrar Nova Filial'}
                  {modalMode === 'edit' && 'Editar Cadastro da Filial'}
                  {modalMode === 'view' && 'Dados Cadastrais da Filial'}
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
                    Nome da Filial *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="Ex: Filial 05 - Caruaru Shopping"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código da Filial *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.codigo}
                    onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="FIL-REC-05"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CNPJ da Filial *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.cnpj}
                    onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vincular à Empresa *
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.empresaId}
                    onChange={e => setFormData({ ...formData, empresaId: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  >
                    {companies.map(comp => (
                      <option key={comp.id} value={comp.id}>{comp.nomeFantasia}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Responsável pela Filial
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'view'}
                    value={formData.responsavel}
                    onChange={e => setFormData({ ...formData, responsavel: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="Gerente ou conferente"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'view'}
                    value={formData.telefone}
                    onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="(81) 3456-7890"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    disabled={modalMode === 'view'}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="filial@empresa.com.br"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as BranchStatus })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  >
                    <option value="Ativa">Ativa</option>
                    <option value="Inativa">Inativa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  disabled={modalMode === 'view'}
                  value={formData.endereco}
                  onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'view'}
                    value={formData.cidade}
                    onChange={e => setFormData({ ...formData, cidade: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'view'}
                    value={formData.estado}
                    onChange={e => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                {modalMode === 'view' && canManage && selectedBranch && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedBranch)}
                    className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 border border-blue-200 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Dados da Filial</span>
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
                    {modalMode === 'create' ? 'Cadastrar Filial' : 'Salvar Alterações'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {branchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-red-700" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Excluir Filial</h3>
                <p className="text-xs text-slate-500">Ação irreversível de cadastro</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza de que deseja remover a filial <strong className="text-slate-900">{branchToDelete.nome}</strong> (Código: <span className="font-mono font-bold text-slate-800">{branchToDelete.codigo}</span>)?
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 my-3 text-xs text-slate-600 space-y-1">
              <div><span className="font-semibold text-slate-700">Empresa:</span> {branchToDelete.empresaNome}</div>
              <div><span className="font-semibold text-slate-700">CNPJ:</span> <span className="font-mono">{branchToDelete.cnpj}</span></div>
              <div><span className="font-semibold text-slate-700">Cidade/UF:</span> {branchToDelete.cidade}/{branchToDelete.estado}</div>
            </div>
            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setBranchToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
