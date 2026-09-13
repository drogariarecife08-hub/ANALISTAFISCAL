import React, { useState, useMemo } from 'react';
import {
  Building2,
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
  X
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { Company, CompanyStatus } from '../types';
import { exportToCSV, exportToExcel, printFormattedReport } from '../utils/export';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const CompaniesView: React.FC = () => {
  const { companies, addCompany, updateCompany, deleteCompany, hasPermission, currentUser } = useSystem();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | CompanyStatus>('Todos');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    inscricaoEstadual: '',
    email: '',
    telefone: '',
    responsavel: '',
    endereco: '',
    cidade: '',
    estado: 'PE',
    status: 'Ativa' as CompanyStatus
  });

  const canManage = hasPermission('manage_companies') || currentUser.role === 'administrador';

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const matchSearch =
        c.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cnpj.includes(searchTerm) ||
        c.cidade.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'Todos' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [companies, searchTerm, statusFilter]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedCompany(null);
    setFormData({
      razaoSocial: '',
      nomeFantasia: '',
      cnpj: '',
      inscricaoEstadual: '',
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

  const handleOpenEdit = (comp: Company) => {
    setModalMode('edit');
    setSelectedCompany(comp);
    setFormData({
      razaoSocial: comp.razaoSocial,
      nomeFantasia: comp.nomeFantasia,
      cnpj: comp.cnpj,
      inscricaoEstadual: comp.inscricaoEstadual,
      email: comp.email,
      telefone: comp.telefone,
      responsavel: comp.responsavel,
      endereco: comp.endereco,
      cidade: comp.cidade,
      estado: comp.estado,
      status: comp.status
    });
    setModalOpen(true);
  };

  const handleOpenView = (comp: Company) => {
    setModalMode('view');
    setSelectedCompany(comp);
    setFormData({
      razaoSocial: comp.razaoSocial,
      nomeFantasia: comp.nomeFantasia,
      cnpj: comp.cnpj,
      inscricaoEstadual: comp.inscricaoEstadual,
      email: comp.email,
      telefone: comp.telefone,
      responsavel: comp.responsavel,
      endereco: comp.endereco,
      cidade: comp.cidade,
      estado: comp.estado,
      status: comp.status
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') {
      addCompany(formData);
    } else if (modalMode === 'edit' && selectedCompany) {
      updateCompany(selectedCompany.id, formData);
    }
    setModalOpen(false);
  };

  const handleToggleStatus = (comp: Company) => {
    const nextStatus: CompanyStatus = comp.status === 'Ativa' ? 'Inativa' : 'Ativa';
    updateCompany(comp.id, { status: nextStatus });
  };

  const handleDelete = (comp: Company) => {
    setCompanyToDelete(comp);
  };

  // Export handlers
  const handleExportCSV = () => {
    const headers = ['Razão Social', 'Nome Fantasia', 'CNPJ', 'Inscrição Estadual', 'E-mail', 'Telefone', 'Responsável', 'Cidade', 'Estado', 'Status'];
    const rows = filteredCompanies.map(c => [
      c.razaoSocial,
      c.nomeFantasia,
      c.cnpj,
      c.inscricaoEstadual,
      c.email,
      c.telefone,
      c.responsavel,
      c.cidade,
      c.estado,
      c.status
    ]);
    exportToCSV('relatorio_empresas_fiscal', headers, rows);
  };

  const handleExportExcel = () => {
    const headers = ['Razão Social', 'Nome Fantasia', 'CNPJ', 'Inscrição Estadual', 'E-mail', 'Telefone', 'Responsável', 'Cidade/UF', 'Status'];
    const rows = filteredCompanies.map(c => [
      c.razaoSocial,
      c.nomeFantasia,
      c.cnpj,
      c.inscricaoEstadual,
      c.email,
      c.telefone,
      c.responsavel,
      `${c.cidade}/${c.estado}`,
      c.status
    ]);
    exportToExcel('relatorio_empresas_fiscal', 'Cadastro Geral de Empresas Cadastradas', headers, rows, {
      'Total de Empresas': `${filteredCompanies.length} registros`,
      'Responsável da Extração': currentUser.name
    });
  };

  const handlePrint = () => {
    const headers = ['Nome Fantasia', 'Razão Social', 'CNPJ', 'Telefone', 'Responsável', 'Cidade/UF', 'Status'];
    const rows = filteredCompanies.map(c => [
      c.nomeFantasia,
      c.razaoSocial,
      c.cnpj,
      c.telefone,
      c.responsavel,
      `${c.cidade}/${c.estado}`,
      c.status
    ]);
    printFormattedReport('Relatório de Empresas - Analista Fiscal', headers, rows, {
      'Filtro Aplicado': statusFilter === 'Todos' ? 'Todas as Empresas' : `Status: ${statusFilter}`,
      'Emitido por': currentUser.name
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-900">Cadastro de Empresas</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie as empresas matrizes, dados cadastrais e parâmetros fiscais.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
            title="Exportar CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
            title="Exportar Planilha Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
            title="Imprimir Relatório"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>

          {canManage && (
            <button
              id="btn-add-company"
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Empresa</span>
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
            placeholder="Pesquisar por Razão Social, Nome Fantasia, CNPJ ou Cidade..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'Todos' | CompanyStatus)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Ativa">Ativas</option>
            <option value="Inativa">Inativas</option>
          </select>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            {filteredCompanies.length} resultado(s)
          </span>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Nome Fantasia / Razão Social</th>
                <th className="px-4 py-3">CNPJ / IE</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Localidade</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Nenhuma empresa encontrada com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map(comp => (
                  <tr key={comp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{comp.nomeFantasia}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{comp.razaoSocial}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-slate-800">{comp.cnpj}</p>
                      <p className="text-[11px] text-slate-400">IE: {comp.inscricaoEstadual}</p>
                    </td>
                    <td className="px-4 py-3 text-[11px]">
                      <p className="text-slate-800">{comp.telefone}</p>
                      <p className="text-slate-500 truncate max-w-[160px]">{comp.email}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {comp.responsavel}
                    </td>
                    <td className="px-4 py-3 text-[11px]">
                      <p className="text-slate-800">{comp.cidade} - {comp.estado}</p>
                      <p className="text-slate-400 truncate max-w-[140px]">{comp.endereco}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => canManage && handleToggleStatus(comp)}
                        disabled={!canManage}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          comp.status === 'Ativa'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={canManage ? 'Clique para alterar status' : undefined}
                      >
                        {comp.status === 'Ativa' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-slate-400" />
                        )}
                        <span>{comp.status}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenView(comp)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                          title="Visualizar Detalhes"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(comp)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                              title="Editar Empresa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(comp)}
                              className="p-1.5 text-red-600 hover:text-red-800 rounded hover:bg-red-50"
                              title="Excluir Empresa"
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

      {/* Modal CRUD / View */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-sm">
                  {modalMode === 'create' && 'Cadastrar Nova Empresa'}
                  {modalMode === 'edit' && 'Editar Cadastro da Empresa'}
                  {modalMode === 'view' && 'Visualizar Dados da Empresa'}
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
                    Nome Fantasia *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.nomeFantasia}
                    onChange={e => setFormData({ ...formData, nomeFantasia: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="Ex: Drogaria Recife Matriz"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.razaoSocial}
                    onChange={e => setFormData({ ...formData, razaoSocial: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="Ex: Rede Farmacêutica Recife S/A"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CNPJ *
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
                    Inscrição Estadual
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'view'}
                    value={formData.inscricaoEstadual}
                    onChange={e => setFormData({ ...formData, inscricaoEstadual: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="0000000-00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    disabled={modalMode === 'view'}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="fiscal@empresa.com.br"
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
                    placeholder="(81) 3333-0000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Responsável Fiscal
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'view'}
                    value={formData.responsavel}
                    onChange={e => setFormData({ ...formData, responsavel: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="Nome do analista ou gerente"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as CompanyStatus })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  >
                    <option value="Ativa">Ativa</option>
                    <option value="Inativa">Inativa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  disabled={modalMode === 'view'}
                  value={formData.endereco}
                  onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  placeholder="Avenida, número, complemento, bairro"
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
                    placeholder="Recife"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado (UF)
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.estado}
                    onChange={e => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  >
                    <option value="PE">Pernambuco (PE)</option>
                    <option value="PB">Paraíba (PB)</option>
                    <option value="AL">Alagoas (AL)</option>
                    <option value="RN">Rio Grande do Norte (RN)</option>
                    <option value="CE">Ceará (CE)</option>
                    <option value="BA">Bahia (BA)</option>
                    <option value="SP">São Paulo (SP)</option>
                    <option value="RJ">Rio de Janeiro (RJ)</option>
                    <option value="MG">Minas Gerais (MG)</option>
                  </select>
                </div>
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
                    {modalMode === 'create' ? 'Cadastrar Empresa' : 'Salvar Alterações'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão */}
      {companyToDelete && (
        <DeleteConfirmModal
          isOpen={!!companyToDelete}
          onClose={() => setCompanyToDelete(null)}
          onConfirm={() => {
            if (companyToDelete) {
              deleteCompany(companyToDelete.id);
              setCompanyToDelete(null);
            }
          }}
          title="Excluir Empresa Matriz"
          itemName={`${companyToDelete.nomeFantasia} (${companyToDelete.cnpj})`}
          itemType="empresa"
          description="Ao excluir esta empresa, verifique se não existem filiais ou registros fiscais vinculados."
        />
      )}
    </div>
  );
};
