import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Printer,
  FileDown,
  X,
  Filter,
  Check,
  Calendar,
  User,
  GitBranch,
  Building2
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { Task, TaskPriority, TaskStatus } from '../types';
import { exportToCSV, exportToExcel, printFormattedReport } from '../utils/export';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const TasksView: React.FC = () => {
  const {
    tasks,
    companies,
    branches,
    collaborators,
    addTask,
    updateTask,
    deleteTask,
    hasPermission,
    currentUser
  } = useSystem();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | TaskStatus>('todos');
  const [priorityFilter, setPriorityFilter] = useState<'todos' | TaskPriority>('todos');
  const [responsavelFilter, setResponsavelFilter] = useState('todos');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'Média' as TaskPriority,
    prazoConclusao: new Date(Date.now() + 86400000 * 2).toISOString().substring(0, 10),
    responsavel: currentUser.name,
    empresaId: companies[0]?.id || '',
    filialId: branches[0]?.id || '',
    status: 'Não iniciada' as TaskStatus,
    observacoes: ''
  });

  const canManage = hasPermission('manage_tasks') || currentUser.role === 'administrador';

  const todayStr = new Date().toISOString().substring(0, 10);

  // Business rule check: overdue tasks
  const processedTasks = useMemo(() => {
    return tasks.map(t => {
      if (t.status !== 'Concluída' && t.prazoConclusao < todayStr) {
        return { ...t, status: 'Atrasada' as TaskStatus };
      }
      return t;
    });
  }, [tasks, todayStr]);

  const filteredTasks = useMemo(() => {
    const termo = (searchTerm || '').toLowerCase();
    return processedTasks.filter(t => {
      const matchSearch =
        (t.titulo || '').toLowerCase().includes(termo) ||
        (t.descricao || '').toLowerCase().includes(termo) ||
        (t.responsavel || '').toLowerCase().includes(termo);

      const matchStatus = statusFilter === 'todos' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'todos' || t.prioridade === priorityFilter;
      const matchResp = responsavelFilter === 'todos' || t.responsavel === responsavelFilter;

      return matchSearch && matchStatus && matchPriority && matchResp;
    });
  }, [processedTasks, searchTerm, statusFilter, priorityFilter, responsavelFilter]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedTask(null);
    setFormData({
      titulo: '',
      descricao: '',
      prioridade: 'Média',
      prazoConclusao: new Date(Date.now() + 86400000 * 2).toISOString().substring(0, 10),
      responsavel: currentUser.name,
      empresaId: companies[0]?.id || '',
      filialId: branches[0]?.id || '',
      status: 'Não iniciada',
      observacoes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setModalMode('edit');
    setSelectedTask(task);
    setFormData({
      titulo: task.titulo,
      descricao: task.descricao,
      prioridade: task.prioridade,
      prazoConclusao: task.prazoConclusao,
      responsavel: task.responsavel,
      empresaId: task.empresaId,
      filialId: task.filialId,
      status: task.status,
      observacoes: task.observacoes
    });
    setModalOpen(true);
  };

  const handleOpenView = (task: Task) => {
    setModalMode('view');
    setSelectedTask(task);
    setFormData({
      titulo: task.titulo,
      descricao: task.descricao,
      prioridade: task.prioridade,
      prazoConclusao: task.prazoConclusao,
      responsavel: task.responsavel,
      empresaId: task.empresaId,
      filialId: task.filialId,
      status: task.status,
      observacoes: task.observacoes
    });
    setModalOpen(true);
  };

  // 1-Click complete task
  const handleToggleComplete = (task: Task) => {
    if (task.status === 'Concluída') {
      updateTask(task.id, {
        status: 'Em andamento',
        dataConclusao: undefined
      });
    } else {
      updateTask(task.id, {
        status: 'Concluída',
        dataConclusao: new Date().toISOString()
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      dataConclusao: formData.status === 'Concluída' ? new Date().toISOString() : undefined
    };

    if (modalMode === 'create') {
      addTask(payload);
    } else if (modalMode === 'edit' && selectedTask) {
      updateTask(selectedTask.id, payload);
    }
    setModalOpen(false);
  };

  const handleDelete = (task: Task) => {
    setTaskToDelete(task);
  };

  // Exports
  const handleExportCSV = () => {
    const headers = ['Título', 'Prioridade', 'Prazo', 'Responsável', 'Filial', 'Status', 'Criação', 'Conclusão', 'Descrição'];
    const rows = filteredTasks.map(t => {
      const b = branches.find(br => br.id === t.filialId);
      return [
        t.titulo,
        t.prioridade,
        t.prazoConclusao,
        t.responsavel,
        b?.nome || t.filialId,
        t.status,
        t.dataCriacao,
        t.dataConclusao || 'Em aberto',
        t.descricao
      ];
    });
    exportToCSV('relatorio_tarefas_fiscais', headers, rows);
  };

  const handleExportExcel = () => {
    const headers = ['Título da Tarefa', 'Prioridade', 'Prazo', 'Responsável', 'Filial', 'Status', 'Data Conclusão'];
    const rows = filteredTasks.map(t => {
      const b = branches.find(br => br.id === t.filialId);
      return [
        t.titulo,
        t.prioridade,
        t.prazoConclusao,
        t.responsavel,
        b?.nome || t.filialId,
        t.status,
        t.dataConclusao ? new Date(t.dataConclusao).toLocaleDateString('pt-BR') : '-'
      ];
    });
    exportToExcel('relatorio_tarefas_fiscais', 'Quadro de Tarefas e Rotinas Fiscais', headers, rows, {
      'Total de Tarefas': `${filteredTasks.length} rotinas`,
      'Extraído por': currentUser.name
    });
  };

  const handlePrint = () => {
    const headers = ['Título', 'Prazo', 'Prioridade', 'Responsável', 'Status'];
    const rows = filteredTasks.map(t => [
      t.titulo,
      new Date(t.prazoConclusao).toLocaleDateString('pt-BR'),
      t.prioridade,
      t.responsavel,
      t.status
    ]);
    printFormattedReport('Controle de Tarefas e Rotinas Fiscais', headers, rows, {
      'Emitido por': currentUser.name,
      'Data de Emissão': new Date().toLocaleDateString('pt-BR')
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-900">Gestão de Tarefas e Rotinas Fiscais</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organize rotinas diárias, mensais de fechamento, SPED, conciliação e apuração de tributos.
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
              id="btn-add-task"
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Tarefa</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-red-600" />
            <span>Filtros do Módulo de Tarefas</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredTasks.length} tarefa(s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por título ou responsável..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
              />
            </div>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'todos' | TaskStatus)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todos">Todos os Status</option>
              <option value="Não iniciada">Não iniciada</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Concluída">Concluída</option>
              <option value="Atrasada">Atrasada (Vencida)</option>
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as 'todos' | TaskPriority)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todos">Todas as Prioridades</option>
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>

          <div>
            <select
              value={responsavelFilter}
              onChange={e => setResponsavelFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todos">Todos os Responsáveis</option>
              {collaborators.map(col => (
                <option key={col.id} value={col.nomeCompleto}>{col.nomeCompleto}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10 text-center">OK</th>
                <th className="px-4 py-3">Tarefa / Descrição</th>
                <th className="px-4 py-3">Prioridade</th>
                <th className="px-4 py-3">Prazo Limite</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Filial</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Nenhuma tarefa localizada com os filtros definidos.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(t => {
                  const b = branches.find(br => br.id === t.filialId);
                  const isOverdue = t.status === 'Atrasada';

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isOverdue ? 'bg-red-50/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(t)}
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            t.status === 'Concluída'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 hover:border-red-600 bg-white'
                          }`}
                          title={t.status === 'Concluída' ? 'Reabrir tarefa' : 'Marcar como Concluída'}
                        >
                          {t.status === 'Concluída' && <Check className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`font-bold text-slate-900 ${t.status === 'Concluída' ? 'line-through text-slate-400' : ''}`}>
                          {t.titulo}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate max-w-sm">{t.descricao}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            t.prioridade === 'Urgente'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : t.prioridade === 'Alta'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : t.prioridade === 'Média'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {t.prioridade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px]">
                        <div className="flex items-center gap-1 font-medium">
                          <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-red-600' : 'text-slate-400'}`} />
                          <span className={isOverdue ? 'text-red-700 font-bold' : 'text-slate-700'}>
                            {new Date(t.prazoConclusao).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-medium">
                        {t.responsavel}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-600">
                        {b?.codigo || b?.nome || t.filialId}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            t.status === 'Concluída'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : t.status === 'Atrasada'
                              ? 'bg-red-100 text-red-800 border-red-300 font-bold animate-pulse'
                              : t.status === 'Em andamento'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {t.status === 'Atrasada' && <AlertTriangle className="w-3 h-3 text-red-700" />}
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenView(t)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                            title="Visualizar"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(t)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(t)}
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
                <CheckSquare className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-sm">
                  {modalMode === 'create' && 'Criar Nova Tarefa / Rotina Fiscal'}
                  {modalMode === 'edit' && 'Editar Tarefa Fiscal'}
                  {modalMode === 'view' && 'Dados da Tarefa'}
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  required
                  disabled={modalMode === 'view'}
                  value={formData.titulo}
                  onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  placeholder="Ex: Conciliar alíquotas do ICMS da Filial 02"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição e Orientações *
                </label>
                <textarea
                  rows={3}
                  required
                  disabled={modalMode === 'view'}
                  value={formData.descricao}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  placeholder="Procedimento padrão a ser realizado..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prioridade *
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.prioridade}
                    onChange={e => setFormData({ ...formData, prioridade: e.target.value as TaskPriority })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prazo Limite *
                  </label>
                  <input
                    type="date"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.prazoConclusao}
                    onChange={e => setFormData({ ...formData, prazoConclusao: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status *
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  >
                    <option value="Não iniciada">Não iniciada</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluída">Concluída</option>
                    <option value="Atrasada">Atrasada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Responsável *
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.responsavel}
                    onChange={e => setFormData({ ...formData, responsavel: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  >
                    {collaborators.map(c => (
                      <option key={c.id} value={c.nomeCompleto}>{c.nomeCompleto}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Empresa Vinculada
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
                    Filial
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações de Acompanhamento
                </label>
                <textarea
                  rows={2}
                  disabled={modalMode === 'view'}
                  value={formData.observacoes}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600 disabled:opacity-75"
                  placeholder="Anotações internas, links de planilhas ou tickets..."
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
                    {modalMode === 'create' ? 'Criar Tarefa' : 'Salvar Alterações'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão */}
      {taskToDelete && (
        <DeleteConfirmModal
          isOpen={!!taskToDelete}
          onClose={() => setTaskToDelete(null)}
          onConfirm={() => {
            if (taskToDelete) {
              deleteTask(taskToDelete.id);
              setTaskToDelete(null);
            }
          }}
          title="Excluir Tarefa / Rotina Fiscal"
          itemName={taskToDelete.titulo}
          itemType="tarefa"
          description="A tarefa será removida da agenda operacional e das métricas de conformidade."
        />
      )}
    </div>
  );
};
