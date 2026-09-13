import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Shield,
  Trash2,
  Edit2,
  Check,
  UserCheck,
  Building2,
  GitBranch,
  AlertCircle
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { User, UserRole } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    availableUsers,
    currentUser,
    setCurrentUser,
    addUser,
    updateUser,
    deleteUser,
    companies,
    branches
  } = useSystem();

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    cargo: string;
    status: 'Ativo' | 'Inativo';
    empresaId: string;
    filialId: string;
  }>({
    name: '',
    email: '',
    role: 'analista_fiscal',
    cargo: 'Analista Fiscal Corporativo',
    status: 'Ativo',
    empresaId: companies[0]?.id || '',
    filialId: branches[0]?.id || ''
  });

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setMode('create');
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      role: 'analista_fiscal',
      cargo: 'Analista Fiscal',
      status: 'Ativo',
      empresaId: companies[0]?.id || '',
      filialId: branches[0]?.id || ''
    });
  };

  const handleStartEdit = (u: User) => {
    setMode('edit');
    setEditingUserId(u.id);
    setFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      cargo: u.cargo || (u.role === 'administrador' ? 'Administrador do Sistema' : u.role === 'analista_fiscal' ? 'Analista Fiscal Pleno' : 'Assistente Fiscal'),
      status: u.status || 'Ativo',
      empresaId: u.empresaId || companies[0]?.id || '',
      filialId: u.filialId || branches[0]?.id || ''
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    if (mode === 'create') {
      addUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        cargo: formData.cargo,
        status: formData.status,
        empresaId: formData.empresaId,
        filialId: formData.filialId,
        avatar: formData.name.trim().substring(0, 2).toUpperCase()
      });
    } else if (mode === 'edit' && editingUserId) {
      updateUser(editingUserId, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        cargo: formData.cargo,
        status: formData.status,
        empresaId: formData.empresaId,
        filialId: formData.filialId
      });
    }
    setMode('list');
    setEditingUserId(null);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'administrador':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'analista_fiscal':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'colaborador':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-700 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Gerenciamento de Usuários do Sistema
                </h3>
                <p className="text-xs text-slate-500">
                  Cadastre, edite e remova acessos com controle de perfis (RBAC)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {mode === 'list' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Usuários Ativos ({availableUsers.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartCreate}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Novo Usuário</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  {availableUsers.map(user => {
                    const isCurrent = user.id === currentUser.id;
                    const b = branches.find(branch => branch.id === user.filialId);
                    const c = companies.find(comp => comp.id === user.empresaId);

                    return (
                      <div
                        key={user.id}
                        className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs border border-slate-700">
                            {user.avatar || user.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">{user.name}</p>
                              {isCurrent && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <Check className="w-3 h-3" /> Conectado agora
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                              <span className={`px-2 py-0.5 rounded-full font-semibold border ${getRoleBadge(user.role)} capitalize`}>
                                {user.role.replace('_', ' ')}
                              </span>
                              {user.cargo && <span>• {user.cargo}</span>}
                              {b && <span>• {b.nome}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => setCurrentUser(user)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
                              title="Alternar sessão para este usuário"
                            >
                              Alternar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(user)}
                            className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                            title="Editar Dados do Usuário"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setUserToDelete(user)}
                            disabled={availableUsers.length <= 1}
                            className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            title={availableUsers.length <= 1 ? 'Não é possível excluir o único usuário' : 'Excluir Usuário'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    {mode === 'create' ? 'Cadastrar Novo Usuário' : 'Editar Dados do Usuário'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMode('list')}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    Voltar para a lista
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Carlos Oliveira da Silva"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      E-mail Corporativo *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="carlos.fiscal@drogariarecife.com.br"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Perfil de Acesso (RBAC) *
                    </label>
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
                    >
                      <option value="administrador">Administrador (Acesso Total)</option>
                      <option value="analista_fiscal">Analista Fiscal (Gestão e Fiscalização)</option>
                      <option value="colaborador">Colaborador / Conferente (Operacional)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cargo / Função
                    </label>
                    <input
                      type="text"
                      value={formData.cargo}
                      onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                      placeholder="Ex: Analista Fiscal Sênior"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Empresa Vinculada
                    </label>
                    <select
                      value={formData.empresaId}
                      onChange={e => setFormData({ ...formData, empresaId: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
                    >
                      <option value="">Todas / Corporativo Matriz</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nomeFantasia} ({c.cnpj})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Filial de Lotação
                    </label>
                    <select
                      value={formData.filialId}
                      onChange={e => setFormData({ ...formData, filialId: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
                    >
                      <option value="">Todas / Geral</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.nome} ({b.codigo})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setMode('list')}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar Usuário</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <DeleteConfirmModal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={() => {
            if (userToDelete) {
              deleteUser(userToDelete.id);
              setUserToDelete(null);
            }
          }}
          title="Excluir Usuário de Acesso"
          itemName={`${userToDelete.name} (${userToDelete.email})`}
          itemType="usuário"
          description="O usuário perderá o acesso imediatamente ao sistema corporativo."
        />
      )}
    </>
  );
};
