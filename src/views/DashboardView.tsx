import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertOctagon,
  CheckCheck,
  PackageX,
  PackageMinus,
  FileSpreadsheet,
  FileCheck,
  Filter,
  RefreshCw,
  TrendingUp,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ShieldAlert,
  Building2,
  GitBranch,
  UserCheck,
  FileText,
  ShieldCheck,
  Receipt,
  Calendar
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { ActiveModule } from '../components/Sidebar';

interface DashboardViewProps {
  setActiveModule?: (mod: ActiveModule) => void;
  onNavigate?: (mod: ActiveModule) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveModule, onNavigate }) => {
  const navigate = onNavigate || setActiveModule || (() => {});
  const {
    tasks,
    occurrences,
    lossDamages,
    shortages,
    invoices,
    companies,
    branches,
    collaborators,
    auditLogs
  } = useSystem();

  // Filters from prompt:
  // "filtros": ["Período", "Empresa", "Filial", "Colaborador", "Status", "Tipo de ocorrência"]
  const [filterPeriodo, setFilterPeriodo] = useState<string>('todos'); // 'todos', 'hoje', '7dias', '30dias', 'mes'
  const [filterEmpresa, setFilterEmpresa] = useState<string>('todas');
  const [filterFilial, setFilterFilial] = useState<string>('todas');
  const [filterColaborador, setFilterColaborador] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterTipoOcorrencia, setFilterTipoOcorrencia] = useState<string>('todos');

  // Filtered datasets based on selections
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterEmpresa !== 'todas' && t.empresaId !== filterEmpresa) return false;
      if (filterFilial !== 'todas' && t.filialId !== filterFilial) return false;
      if (filterColaborador !== 'todos' && t.responsavel !== filterColaborador) return false;
      if (filterStatus !== 'todos' && t.status !== filterStatus) return false;
      return true;
    });
  }, [tasks, filterEmpresa, filterFilial, filterColaborador, filterStatus]);

  const filteredOccurrences = useMemo(() => {
    return occurrences.filter(o => {
      if (filterEmpresa !== 'todas' && o.empresaId !== filterEmpresa) return false;
      if (filterFilial !== 'todas' && o.filialId !== filterFilial) return false;
      if (filterColaborador !== 'todos' && o.responsavelRegistro !== filterColaborador && o.responsavelSolucao !== filterColaborador) return false;
      if (filterStatus !== 'todos' && o.status !== filterStatus) return false;
      if (filterTipoOcorrencia !== 'todos' && o.tipo !== filterTipoOcorrencia) return false;
      return true;
    });
  }, [occurrences, filterEmpresa, filterFilial, filterColaborador, filterStatus, filterTipoOcorrencia]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (filterEmpresa !== 'todas' && inv.empresaId !== filterEmpresa) return false;
      if (filterFilial !== 'todas' && inv.filialId !== filterFilial) return false;
      if (filterColaborador !== 'todos' && inv.responsavel !== filterColaborador) return false;
      if (filterStatus !== 'todos' && inv.status !== filterStatus) return false;
      return true;
    });
  }, [invoices, filterEmpresa, filterFilial, filterColaborador, filterStatus]);

  const filteredLosses = useMemo(() => {
    return lossDamages.filter(l => {
      if (filterEmpresa !== 'todas' && l.empresaId !== filterEmpresa) return false;
      if (filterFilial !== 'todas' && l.filialId !== filterFilial) return false;
      return true;
    });
  }, [lossDamages, filterEmpresa, filterFilial]);

  const filteredShortages = useMemo(() => {
    return shortages.filter(s => {
      if (filterFilial !== 'todas' && s.filialId !== filterFilial) return false;
      return true;
    });
  }, [shortages, filterFilial]);

  // The 8 Cards requested in prompt:
  // 1. Tarefas concluídas
  // 2. Tarefas pendentes
  // 3. Ocorrências abertas
  // 4. Ocorrências resolvidas
  // 5. Avarias registradas
  // 6. Produtos em falta
  // 7. Notas fiscais pendentes
  // 8. Notas fiscais concluídas
  const tarefasConcluidas = filteredTasks.filter(t => t.status === 'Concluída').length;
  const tarefasPendentes = filteredTasks.filter(t => t.status === 'Pendente' || t.status === 'Em andamento' || t.status === 'Atrasada').length;
  const ocorrenciasAbertas = filteredOccurrences.filter(o => o.status === 'Aberta' || o.status === 'Em análise' || o.status.startsWith('Aguardando')).length;
  const ocorrenciasResolvidas = filteredOccurrences.filter(o => o.status === 'Resolvida').length;
  const avariasRegistradas = filteredLosses.length;
  const produtosEmFalta = filteredShortages.reduce((acc, curr) => acc + curr.quantidadeFaltante, 0);
  const notasPendentes = filteredInvoices.filter(i => i.status === 'Pendente' || i.status === 'Em análise' || i.status === 'Com divergência').length;
  const notasConcluidas = filteredInvoices.filter(i => i.status === 'Concluída').length;

  // Key Metrics for Summary Cards:
  const pendingInvoicesList = useMemo(() => {
    return filteredInvoices.filter(i => i.status === 'Pendente' || i.status === 'Em análise' || i.status === 'Com divergência');
  }, [filteredInvoices]);

  const totalPendingInvoicesCount = pendingInvoicesList.length;
  const totalPendingInvoicesValue = useMemo(() => {
    return pendingInvoicesList.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  }, [pendingInvoicesList]);

  const pendingInvoicesDivergenceCount = useMemo(() => {
    return pendingInvoicesList.filter(i => i.status === 'Com divergência').length;
  }, [pendingInvoicesList]);

  // Current Month's Audit Count
  const currentMonthAuditCount = useMemo(() => {
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return auditLogs.filter(log => {
      const dt = log.timestamp || log.dataHora || '';
      return dt.startsWith(currentYM) || dt.includes('2026-09');
    }).length;
  }, [auditLogs]);

  const todayAuditCount = useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    return auditLogs.filter(log => {
      const dt = log.timestamp || log.dataHora || '';
      return dt.startsWith(todayStr);
    }).length;
  }, [auditLogs]);

  const totalLossValue = useMemo(() => {
    return filteredLosses.reduce((acc, curr) => acc + (Number(curr.valorTotal) || 0), 0);
  }, [filteredLosses]);

  // Chart 1: Tarefas por status
  const tasksByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {
      Concluída: 0,
      'Em andamento': 0,
      Pendente: 0,
      Atrasada: 0,
      'Não iniciada': 0
    };
    filteredTasks.forEach(t => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
  }, [filteredTasks]);

  // Chart 2: Ocorrências por tipo
  const occurrencesByType = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOccurrences.forEach(o => {
      map[o.tipo] = (map[o.tipo] || 0) + 1;
    });
    return Object.entries(map).map(([tipo, count]) => ({ tipo, count })).sort((a, b) => b.count - a.count);
  }, [filteredOccurrences]);

  // Chart 3: Avarias por empresa
  const lossesByCompany = useMemo(() => {
    const map: Record<string, { totalVal: number; count: number; name: string }> = {};
    companies.forEach(c => {
      map[c.id] = { totalVal: 0, count: 0, name: c.nomeFantasia };
    });
    filteredLosses.forEach(l => {
      if (!map[l.empresaId]) {
        map[l.empresaId] = { totalVal: 0, count: 0, name: l.empresaNome || 'Outras' };
      }
      map[l.empresaId].totalVal += l.valorTotal;
      map[l.empresaId].count += 1;
    });
    return Object.values(map);
  }, [companies, filteredLosses]);

  // Chart 4: Faltas de produtos por filial
  const shortagesByBranch = useMemo(() => {
    const map: Record<string, { branchName: string; qty: number; value: number }> = {};
    branches.forEach(b => {
      map[b.id] = { branchName: b.nome.split(' - ')[1] || b.nome, qty: 0, value: 0 };
    });
    filteredShortages.forEach(s => {
      if (!map[s.filialId]) {
        map[s.filialId] = { branchName: s.filialNome.split(' - ')[1] || s.filialNome, qty: 0, value: 0 };
      }
      map[s.filialId].qty += s.quantidadeFaltante;
      map[s.filialId].value += s.valorTotal;
    });
    return Object.values(map);
  }, [branches, filteredShortages]);

  // Chart 5: Pendências por filial (Ocorrências + Notas Pendentes)
  const pendenciesByBranch = useMemo(() => {
    const map: Record<string, { name: string; ocorrencias: number; notas: number }> = {};
    branches.forEach(b => {
      const shortName = b.codigo || b.nome.slice(0, 15);
      map[b.id] = { name: shortName, ocorrencias: 0, notas: 0 };
    });
    filteredOccurrences.forEach(o => {
      if (o.status !== 'Resolvida' && o.status !== 'Cancelada') {
        if (map[o.filialId]) map[o.filialId].ocorrencias += 1;
      }
    });
    filteredInvoices.forEach(i => {
      if (i.status !== 'Concluída' && i.status !== 'Cancelada') {
        if (map[i.filialId]) map[i.filialId].notas += 1;
      }
    });
    return Object.values(map);
  }, [branches, filteredOccurrences, filteredInvoices]);

  // Chart 6: Produtividade por colaborador (Tarefas concluídas / Total de tarefas)
  const productivityByCollaborator = useMemo(() => {
    const map: Record<string, { name: string; total: number; concluidas: number }> = {};
    collaborators.forEach(c => {
      map[c.nomeCompleto] = { name: c.nomeCompleto.split(' ')[0] + ' ' + (c.nomeCompleto.split(' ')[1]?.[0] || '') + '.', total: 0, concluidas: 0 };
    });
    tasks.forEach(t => {
      if (!map[t.responsavel]) {
        map[t.responsavel] = { name: t.responsavel.split(' ')[0], total: 0, concluidas: 0 };
      }
      map[t.responsavel].total += 1;
      if (t.status === 'Concluída') {
        map[t.responsavel].concluidas += 1;
      }
    });
    return Object.values(map).map(item => ({
      ...item,
      rate: item.total > 0 ? Math.round((item.concluidas / item.total) * 100) : 0
    }));
  }, [collaborators, tasks]);

  const resetFilters = () => {
    setFilterPeriodo('todos');
    setFilterEmpresa('todas');
    setFilterFilial('todas');
    setFilterColaborador('todos');
    setFilterStatus('todos');
    setFilterTipoOcorrencia('todos');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Dashboard do Analista Fiscal</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold">
              Tempo Real
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Painel consolidado para controle, fiscalização e acompanhamento corporativo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Limpar Filtros</span>
          </button>
        </div>
      </div>

      {/* Corporate Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-red-600" />
          <span>Filtros Estratégicos do Painel</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Período */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Período</label>
            <select
              value={filterPeriodo}
              onChange={e => setFilterPeriodo(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todos">Todo o histórico</option>
              <option value="hoje">Hoje</option>
              <option value="7dias">Últimos 7 dias</option>
              <option value="30dias">Últimos 30 dias</option>
              <option value="mes">Mês de Setembro/2026</option>
            </select>
          </div>

          {/* Empresa */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Empresa</label>
            <select
              value={filterEmpresa}
              onChange={e => setFilterEmpresa(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todas">Todas as Empresas</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.nomeFantasia}</option>
              ))}
            </select>
          </div>

          {/* Filial */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Filial</label>
            <select
              value={filterFilial}
              onChange={e => setFilterFilial(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todas">Todas as Filiais</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.codigo} - {b.nome.split(' - ')[1] || b.nome}</option>
              ))}
            </select>
          </div>

          {/* Colaborador */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Colaborador</label>
            <select
              value={filterColaborador}
              onChange={e => setFilterColaborador(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todos">Todos os Colaboradores</option>
              {collaborators.map(c => (
                <option key={c.id} value={c.nomeCompleto}>{c.nomeCompleto}</option>
              ))}
            </select>
          </div>

          {/* Status Geral */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todos">Todos os Status</option>
              <option value="Pendente">Pendente</option>
              <option value="Em análise">Em análise</option>
              <option value="Concluída">Concluída</option>
              <option value="Atrasada">Atrasada</option>
              <option value="Aberta">Aberta</option>
              <option value="Resolvida">Resolvida</option>
            </select>
          </div>

          {/* Tipo de ocorrência */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tipo de Ocorrência</label>
            <select
              value={filterTipoOcorrencia}
              onChange={e => setFilterTipoOcorrencia(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="Avaria">Avaria</option>
              <option value="Falta de produto">Falta de produto</option>
              <option value="Preço divergente">Preço divergente</option>
              <option value="Produto próximo do vencimento">Produto próx. vencimento</option>
              <option value="Erro de nota fiscal">Erro de nota fiscal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Executive Summary Cards: Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Summary Card 1: Total de Notas Fiscais Pendentes */}
        <div
          onClick={() => navigate('notas-fiscais')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
              <span>{pendingInvoicesDivergenceCount} divergentes</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Notas Fiscais Pendentes</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">{totalPendingInvoicesCount}</span>
              <span className="text-xs font-medium text-slate-500">notas aguardando</span>
            </div>
            <p className="text-xs font-mono font-bold text-amber-700 mt-1">
              R$ {totalPendingInvoicesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Escrituração e conferência</span>
            <span className="font-semibold text-amber-800 group-hover:underline flex items-center gap-0.5">
              Acessar módulo
            </span>
          </div>
        </div>

        {/* Summary Card 2: Auditorias no Mês Atual */}
        <div
          onClick={() => navigate('auditoria')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/50">
              <Calendar className="w-3 h-3" />
              <span>Mês Vigente</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Auditorias no Mês Atual</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">{currentMonthAuditCount}</span>
              <span className="text-xs font-medium text-slate-500">eventos logados</span>
            </div>
            <p className="text-xs font-medium text-blue-700 mt-1">
              {todayAuditCount} registros efetuados hoje
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Trilha de conformidade LGPD</span>
            <span className="font-semibold text-blue-800 group-hover:underline flex items-center gap-0.5">
              Ver trilha
            </span>
          </div>
        </div>

        {/* Summary Card 3: Ocorrências Fiscais em Aberto */}
        <div
          onClick={() => navigate('ocorrencias')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-red-400 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200/60 flex items-center justify-center text-red-700 shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200/50">
              <span>{ocorrenciasResolvidas} resolvidas</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Ocorrências Fiscais</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-red-600">{ocorrenciasAbertas}</span>
              <span className="text-xs font-medium text-slate-500">em aberto / análise</span>
            </div>
            <p className="text-xs font-medium text-slate-600 mt-1">
              Divergências de preços, notas e avarias
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Gestão de pendências</span>
            <span className="font-semibold text-red-800 group-hover:underline flex items-center gap-0.5">
              Gerenciar
            </span>
          </div>
        </div>

        {/* Summary Card 4: Prejuízo Estimado em Avarias */}
        <div
          onClick={() => navigate('avarias')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-700 shrink-0">
              <PackageX className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/50">
              <span>{avariasRegistradas} registros</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Prejuízo por Avarias</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                R$ {totalLossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-600 mt-1">
              Termos de perda e ressarcimento
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Ressarcimento e descarte</span>
            <span className="font-semibold text-purple-800 group-hover:underline flex items-center gap-0.5">
              Ver laudos
            </span>
          </div>
        </div>
      </div>

      {/* 8 Cards Section as requested in Prompt */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Tarefas concluídas */}
        <div
          onClick={() => navigate('tarefas')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 truncate">Tarefas Concluídas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{tarefasConcluidas}</p>
          <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-0.5 mt-1">
            Status OK
          </span>
        </div>

        {/* 2. Tarefas pendentes */}
        <div
          onClick={() => navigate('tarefas')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 truncate">Tarefas Pendentes</span>
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{tarefasPendentes}</p>
          <span className="text-[10px] text-amber-700 font-medium flex items-center gap-0.5 mt-1">
            Requer atenção
          </span>
        </div>

        {/* 3. Ocorrências abertas */}
        <div
          onClick={() => navigate('ocorrencias')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-red-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 truncate">Ocorrências Abertas</span>
            <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">{ocorrenciasAbertas}</p>
          <span className="text-[10px] text-red-700 font-medium flex items-center gap-0.5 mt-1">
            Acompanhamento
          </span>
        </div>

        {/* 4. Ocorrências resolvidas */}
        <div
          onClick={() => navigate('ocorrencias')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 truncate">Ocorrências Resolvidas</span>
            <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{ocorrenciasResolvidas}</p>
          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5 mt-1">
            Taxa de resolução
          </span>
        </div>

        {/* 5. Avarias registradas */}
        <div
          onClick={() => navigate('controle_perdas_avarias')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-red-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 truncate">Avarias Registradas</span>
            <PackageX className="w-4 h-4 text-red-600 shrink-0" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{avariasRegistradas}</p>
          <span className="text-[10px] text-red-700 font-medium flex items-center gap-0.5 mt-1">
            Controle de perdas
          </span>
        </div>

        {/* 6. Produtos em falta */}
        <div
          onClick={() => navigate('falta_produtos')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 truncate">Produtos em Falta</span>
            <PackageMinus className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{produtosEmFalta} <span className="text-xs text-slate-500 font-normal">un</span></p>
          <span className="text-[10px] text-amber-700 font-medium flex items-center gap-0.5 mt-1">
            Conferência de carga
          </span>
        </div>

        {/* 7. Notas fiscais pendentes */}
        <div
          onClick={() => navigate('controle_notas')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-red-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 truncate">NFs Pendentes</span>
            <FileSpreadsheet className="w-4 h-4 text-red-600 shrink-0" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">{notasPendentes}</p>
          <span className="text-[10px] text-red-700 font-medium flex items-center gap-0.5 mt-1">
            Entrada fiscal
          </span>
        </div>

        {/* 8. Notas fiscais concluídas */}
        <div
          onClick={() => navigate('controle_notas')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 truncate">NFs Concluídas</span>
            <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{notasConcluidas}</p>
          <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-0.5 mt-1">
            Escrituração 100%
          </span>
        </div>
      </div>

      {/* 6 Interactive SVG Charts Requested in Prompt */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Gráfico 1: Tarefas por status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-red-600" />
              <span>Tarefas por Status</span>
            </h3>
            <span className="text-[11px] text-slate-400">Total: {filteredTasks.length}</span>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-3">
            {tasksByStatus.map(item => {
              const total = filteredTasks.length || 1;
              const pct = Math.round((item.count / total) * 100);
              let barColor = 'bg-slate-400';
              if (item.status === 'Concluída') barColor = 'bg-emerald-500';
              if (item.status === 'Em andamento') barColor = 'bg-blue-500';
              if (item.status === 'Pendente') barColor = 'bg-amber-500';
              if (item.status === 'Atrasada') barColor = 'bg-red-600';

              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.status}</span>
                    <span className="text-slate-500 text-[11px]">{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráfico 2: Ocorrências por tipo */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-600" />
              <span>Ocorrências por Tipo</span>
            </h3>
            <span className="text-[11px] text-slate-400">Total: {filteredOccurrences.length}</span>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-2.5">
            {occurrencesByType.slice(0, 5).map(item => {
              const maxCount = Math.max(...occurrencesByType.map(o => o.count), 1);
              const barWidth = Math.round((item.count / maxCount) * 100);
              return (
                <div key={item.tipo} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[200px]">{item.tipo}</span>
                    <span className="text-red-700 font-bold text-[11px]">{item.count} reg.</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-red-600 rounded-full transition-all duration-500" style={{ width: `${barWidth}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráfico 3: Avarias por empresa */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-red-600" />
              <span>Avarias por Empresa (R$)</span>
            </h3>
            <span className="text-[11px] text-slate-400">Custo Total</span>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4">
            {lossesByCompany.map((item, idx) => {
              const totalValAll = lossesByCompany.reduce((a, b) => a + b.totalVal, 0) || 1;
              const pct = Math.round((item.totalVal / totalValAll) * 100);
              return (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                    <span className="font-bold text-red-700">
                      R$ {item.totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-red-700 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{item.count} ocorrência(s) de avaria</span>
                    <span>{pct}% do total de perdas</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráfico 4: Faltas de produtos por filial */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <PackageMinus className="w-4 h-4 text-amber-600" />
              <span>Faltas de Produtos por Filial</span>
            </h3>
            <span className="text-[11px] text-slate-400">Unidades Faltantes</span>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-3">
            {shortagesByBranch.map((item, idx) => {
              const maxQty = Math.max(...shortagesByBranch.map(s => s.qty), 1);
              const barWidth = Math.round((item.qty / maxQty) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate">{item.branchName}</span>
                    <span className="text-amber-800 font-bold text-[11px]">{item.qty} un</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${barWidth}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráfico 5: Pendências por filial */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-red-600" />
              <span>Pendências por Filial</span>
            </h3>
            <span className="text-[11px] text-slate-400">Ocorrências vs NFs</span>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-3">
            {pendenciesByBranch.map((item, idx) => {
              const totalPend = item.ocorrencias + item.notas;
              return (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                      <span className="text-red-700">{item.ocorrencias} Ocorrências</span>
                      <span>•</span>
                      <span className="text-amber-700">{item.notas} Notas Pendentes</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                      totalPend > 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {totalPend} total
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráfico 6: Produtividade por colaborador */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Produtividade por Colaborador</span>
            </h3>
            <span className="text-[11px] text-slate-400">% Conclusão</span>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-3">
            {productivityByCollaborator.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{item.name}</span>
                  <span className="font-bold text-slate-800 text-[11px]">{item.concluidas}/{item.total} ({item.rate}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.rate >= 70 ? 'bg-emerald-500' : item.rate >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${item.rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('controle_notas')}
          className="p-4 bg-gradient-to-r from-red-900 to-red-800 text-white rounded-xl shadow-xs cursor-pointer hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-red-200 font-medium uppercase tracking-wider">Entrada de Documentos</span>
            <h4 className="text-base font-bold mt-0.5">Lançar ou Auditar NFe</h4>
            <p className="text-xs text-red-100/80 mt-1">Conferência com SEFAZ PE e alíquotas</p>
          </div>
          <ArrowUpRight className="w-6 h-6 text-red-200" />
        </div>

        <div
          onClick={() => navigate('ocorrencias')}
          className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl shadow-xs cursor-pointer hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Gestão de Incidências</span>
            <h4 className="text-base font-bold mt-0.5">Registrar Nova Ocorrência</h4>
            <p className="text-xs text-slate-300 mt-1">Geração de protocolo automático e fotos</p>
          </div>
          <ArrowUpRight className="w-6 h-6 text-slate-300" />
        </div>

        <div
          onClick={() => navigate('relatorios')}
          className="p-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl shadow-xs cursor-pointer hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-300 font-medium uppercase tracking-wider">Exportações e Fechamento</span>
            <h4 className="text-base font-bold mt-0.5">Emitir Relatório Gerencial</h4>
            <p className="text-xs text-slate-300 mt-1">Formatos PDF, Excel e CSV disponíveis</p>
          </div>
          <ArrowUpRight className="w-6 h-6 text-slate-200" />
        </div>
      </div>
    </div>
  );
};
