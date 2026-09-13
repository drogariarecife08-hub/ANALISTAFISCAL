import React, { useState, useMemo } from 'react';
import {
  Users,
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
  Building2,
  GitBranch,
  Briefcase
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { Collaborator, CollaboratorStatus } from '../types';
import { exportToCSV, exportToExcel, printFormattedReport } from '../utils/export';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const CollaboratorsView: React.FC = () => {
  const { collaborators, companies, branches, addCollaborator, updateCollaborator, deleteCollaborator, hasPermission, currentUser } = useSystem();

  const [searchTerm, setSearchTerm] = useState('');
  const [cargoFilter, setCargoFilter] = useState('todos');
  const [filialFilter, setFilialFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState<'Todos' | CollaboratorStatus>('Todos');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedCollab, setSelectedCollab] = useState<Collaborator | null>(null);
  const [collabToDelete, setCollabToDelete] = useState<Collaborator | null>(null);

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    cpf: '',
    matricula: '',
    email: '',
    telefone: '',
    cargo: 'Analista Fiscal',
    departamento: 'Fiscal e Tributário',
    empresaId: companies[0]?.id || '',
    filialId: branches[0]?.id || '',
    dataAdmissao: '2026-01-10',
    status: 'Ativo' as CollaboratorStatus
  });

  const canManage = hasPermission('manage_collaborators') || currentUser.role === 'administrador';

  const filteredCollaborators = useMemo(() => {
    return collaborators.filter(col => {
      const matchSearch =
        col.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.cpf.includes(searchTerm) ||
        col.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.cargo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCargo = cargoFilter === 'todos' || col.cargo === cargoFilter;
      const matchFilial = filialFilter === 'todas' || col.filialId === filialFilter;
      const matchStatus = statusFilter === 'Todos' || col.status === statusFilter;
      return matchSearch && matchCargo && matchFilial && matchStatus;
    });
  }, [collaborators, searchTerm, cargoFilter, filialFilter, statusFilter]);

  const uniqueCargos = useMemo(() => {
    return Array.from(new Set(collaborators.map(c => c.cargo)));
  }, [collaborators]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedCollab(null);
    setFormData({
      nomeCompleto: '',
      cpf: '',
      matricula: `MAT-2026-${String(collaborators.length + 1).padStart(2, '0')}`,
      email: '',
      telefone: '',
      cargo: 'Analista Fiscal',
      departamento: 'Fiscal e Tributário',
      empresaId: companies[0]?.id || '',
      filialId: branches[0]?.id || '',
      dataAdmissao: new Date().toISOString().substring(0, 10),
      status: 'Ativo'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (collab: Collaborator) => {
    setModalMode('edit');
    setSelectedCollab(collab);
    setFormData({
      nomeCompleto: collab.nomeCompleto,
      cpf: collab.cpf,
      matricula: collab.matricula,
      email: collab.email,
      telefone: collab.telefone,
      cargo: collab.cargo,
      departamento: collab.departamento,
      empresaId: collab.empresaId,
      filialId: collab.filialId,
      dataAdmissao: collab.dataAdmissao,
      status: collab.status
    });
    setModalOpen(true);
  };

  const handleOpenView = (collab: Collaborator) => {
    setModalMode('view');
    setSelectedCollab(collab);
    setFormData({
      nomeCompleto: collab.nomeCompleto,
      cpf: collab.cpf,
      matricula: collab.matricula,
      email: collab.email,
      telefone: collab.telefone,
      cargo: collab.cargo,
      departamento: collab.departamento,
      empresaId: collab.empresaId,
      filialId: collab.filialId,
      dataAdmissao: collab.dataAdmissao,
      status: collab.status
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') {
      addCollaborator(formData);
    } else if (modalMode === 'edit' && selectedCollab) {
      updateCollaborator(selectedCollab.id, formData);
    }
    setModalOpen(false);
  };

  const handleToggleStatus = (collab: Collaborator) => {
    const nextStatus: CollaboratorStatus = collab.status === 'Ativo' ? 'Inativo' : 'Ativo';
    updateCollaborator(collab.id, { status: nextStatus });
  };

  const handleDelete = (collab: Collaborator) => {
    setCollabToDelete(collab);
  };

  const handleExportCSV = () => {
    const headers = ['Nome Completo', 'Matrícula', 'CPF', 'Cargo', 'Departamento', 'Filial', 'E-mail', 'Telefone', 'Admissão', 'Status'];
    const rows = filteredCollaborators.map(c => {
      const b = branches.find(branch => branch.id === c.filialId);
      return [
        c.nomeCompleto,
        c.matricula,
        c.cpf,
        c.cargo,
        c.departamento,
        b?.nome || c.filialId,
        c.email,
        c.telefone,
        c.dataAdmissao,
        c.status
      ];
    });
    exportToCSV('relatorio_colaboradores_fiscal', headers, rows);
  };

  const handleExportExcel = () => {
    const headers = ['Matrícula', 'Nome Completo', 'CPF', 'Cargo', 'Departamento', 'Filial', 'Contato', 'Admissão', 'Status'];
    const rows = filteredCollaborators.map(c => {
      const b = branches.find(branch => branch.id === c.filialId);
      return [
        c.matricula,
        c.nomeCompleto,
        c.cpf,
        c.cargo,
        c.departamento,
        b?.nome || c.filialId,
        `${c.telefone} | ${c.email}`,
        c.dataAdmissao,
        c.status
      ];
    });
    exportToExcel('relatorio_colaboradores_fiscal', 'Quadro Geral de Colaboradores e Analistas Fiscais', headers, rows, {
      'Total de Colaboradores': `${filteredCollaborators.length} cadastrados`,
      'Extraído por': currentUser.name
    });
  };

  const handlePrint = () => {
    const headers = ['Matrícula', 'Nome Completo', 'CPF', 'Cargo', 'Filial', 'Telefone', 'Status'];
    const rows = filteredCollaborators.map(c => {
      const b = branches.find(branch => branch.id === c.filialId);
      return [
        c.matricula,
        c.nomeCompleto,
        c.cpf,
        c.cargo,
        b?.codigo || b?.nome || '',
        c.telefone,
        c.status
      ];
    });
    printFormattedReport('Quadro de Colaboradores Fiscais', headers, rows, {
      'Emitido por': currentUser.name,
      'Data': new Date().toLocaleDateString('pt-BR')
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-900">Cadastro de Colaboradores</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de equipes, analistas fiscais, conferentes e vínculos operacionais.
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
              id="btn-add-collaborator"
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Colaborador</span>
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
            placeholder="Pesquisar por nome, CPF, matrícula ou cargo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={cargoFilter}
            onChange={e => setCargoFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
          >
            <option value="todos">Todos os Cargos</option>
            {uniqueCargos.map(cargo => (
              <option key={cargo} value={cargo}>{cargo}</option>
            ))}
          </select>

          <select
            value={filialFilter}
            onChange={e => setFilialFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
          >
            <option value="todas">Todas as Filiais</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.nome.split(' - ')[1] || b.nome}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'Todos' | CollaboratorStatus)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </div>
      </div>

      {/* Collaborators Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Colaborador / Matrícula</th>
                <th className="px-4 py-3">CPF</th>
                <th className="px-4 py-3">Cargo / Depto</th>
                <th className="px-4 py-3">Filial de Lotação</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCollaborators.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : (
                filteredCollaborators.map(col => {
                  const b = branches.find(br => br.id === col.filialId);
                  return (
                    <tr key={col.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-red-100 text-red-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {col.nomeCompleto.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{col.nomeCompleto}</p>
                            <p className="font-mono text-[10px] text-slate-400">{col.matricula}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-800">
                        {col.cpf}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{col.cargo}</p>
                        <p className="text-[10px] text-slate-400">{col.departamento}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <GitBranch className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{b?.nome || col.filialId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px]">
                        <p className="text-slate-800">{col.telefone}</p>
                        <p className="text-slate-500 truncate max-w-[150px]">{col.email}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => canManage && handleToggleStatus(col)}
                          disabled={!canManage}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            col.status === 'Ativo'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {col.status === 'Ativo' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{col.status}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenView(col)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                            title="Visualizar"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(col)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(col)}
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
                <Users className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-sm">
                  {modalMode === 'create' && 'Cadastrar Novo Colaborador'}
                  {modalMode === 'edit' && 'Editar Dados do Colaborador'}
                  {modalMode === 'view' && 'Ficha Cadastral do Colaborador'}
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
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.nomeCompleto}
                    onChange={e => setFormData({ ...formData, nomeCompleto: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="Nome e Sobrenome"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPF *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.cpf}
                    onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Matrícula *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.matricula}
                    onChange={e => setFormData({ ...formData, matricula: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="MAT-2026-00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cargo / Função *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.cargo}
                    onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="Ex: Analista Fiscal Sênior"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'view'}
                    value={formData.departamento}
                    onChange={e => setFormData({ ...formData, departamento: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                    placeholder="Fiscal, Logística, Estoque..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Admissão
                  </label>
                  <input
                    type="date"
                    disabled={modalMode === 'view'}
                    value={formData.dataAdmissao}
                    onChange={e => setFormData({ ...formData, dataAdmissao: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
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
                    Vincular à Filial *
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.filialId}
                    onChange={e => setFormData({ ...formData, filialId: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.codigo} - {b.nome.split(' - ')[1] || b.nome}</option>
                    ))}
                  </select>
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
                    placeholder="(81) 99999-0000"
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
                    placeholder="colaborador@empresa.com.br"
                  />
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
                    {modalMode === 'create' ? 'Cadastrar Colaborador' : 'Salvar Alterações'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão */}
      {collabToDelete && (
        <DeleteConfirmModal
          isOpen={!!collabToDelete}
          onClose={() => setCollabToDelete(null)}
          onConfirm={() => {
            if (collabToDelete) {
              deleteCollaborator(collabToDelete.id);
              setCollabToDelete(null);
            }
          }}
          title="Excluir Colaborador"
          itemName={`${collabToDelete.nomeCompleto} (${collabToDelete.matricula})`}
          itemType="colaborador"
          description="O registro fiscal e operacional deste colaborador será excluído do sistema."
        />
      )}
    </div>
  );
};
