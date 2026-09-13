import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Download,
  Printer,
  FileDown,
  Filter,
  Lock,
  UserCheck,
  History,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { exportToCSV, exportToExcel, printFormattedReport } from '../utils/export';

export const AuditsView: React.FC = () => {
  const { auditLogs, currentUser } = useSystem();

  const [searchTerm, setSearchTerm] = useState('');
  const [moduloFilter, setModuloFilter] = useState('todos');
  const [acaoFilter, setAcaoFilter] = useState('todas');

  const filteredLogs = useMemo(() => {
    const termo = (searchTerm || '').toLowerCase();
    return auditLogs.filter(log => {
      const matchSearch =
        (log.usuario || '').toLowerCase().includes(termo) ||
        (log.detalhes || '').toLowerCase().includes(termo) ||
        (log.modulo || '').toLowerCase().includes(termo) ||
        (log.tipoAcao || '').toLowerCase().includes(termo);

      const matchModulo = moduloFilter === 'todos' || log.modulo === moduloFilter;
      const matchAcao = acaoFilter === 'todas' || log.tipoAcao === acaoFilter;

      return matchSearch && matchModulo && matchAcao;
    });
  }, [auditLogs, searchTerm, moduloFilter, acaoFilter]);

  const uniqueModules = useMemo(() => {
    return Array.from(new Set(auditLogs.map(l => l.modulo)));
  }, [auditLogs]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(auditLogs.map(l => l.tipoAcao)));
  }, [auditLogs]);

  const handleExportCSV = () => {
    const headers = ['Data/Hora', 'Usuário', 'Cargo/Perfil', 'Tipo de Ação', 'Módulo', 'Detalhes da Operação'];
    const rows = filteredLogs.map(l => [
      l.dataHora,
      l.usuario,
      l.cargo,
      l.tipoAcao,
      l.modulo,
      l.detalhes
    ]);
    exportToCSV('trilha_auditoria_sistema_fiscal', headers, rows);
  };

  const handleExportExcel = () => {
    const headers = ['Data/Hora', 'Usuário', 'Perfil', 'Ação', 'Módulo', 'Registro'];
    const rows = filteredLogs.map(l => [
      l.dataHora,
      l.usuario,
      l.cargo,
      l.tipoAcao,
      l.modulo,
      l.detalhes
    ]);
    exportToExcel('trilha_auditoria_sistema_fiscal', 'Trilha Completa de Auditoria e Governança Fiscal', headers, rows, {
      'Total de Logs': `${filteredLogs.length} eventos registrados`,
      'Extração Realizada Por': currentUser.name
    });
  };

  const handlePrint = () => {
    const headers = ['Data/Hora', 'Usuário', 'Perfil', 'Ação', 'Módulo', 'Detalhes'];
    const rows = filteredLogs.map(l => [
      new Date(l.dataHora).toLocaleString('pt-BR'),
      l.usuario,
      l.cargo,
      l.tipoAcao,
      l.modulo,
      l.detalhes
    ]);
    printFormattedReport('Trilha de Auditoria e Logs do Sistema', headers, rows, {
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
            <ShieldCheck className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-900">Auditoria e Logs de Segurança</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rastreabilidade completa de todas as operações, edições, baixas e acessos de usuários no sistema.
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
        </div>
      </div>

      {/* Security Policies Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Controle RBAC Ativo</h4>
            <p className="text-[11px] text-slate-500">
              Perfis de Administrador, Analista Fiscal e Colaborador com regras por tela.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Bloqueio de Exclusão</h4>
            <p className="text-[11px] text-slate-500">
              Colaboradores possuem permissão estrita somente de consulta e lançamento.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Histórico Imutável</h4>
            <p className="text-[11px] text-slate-500">
              Logs cronológicos com identificação de IP fictício e protocolo fiscal.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-red-600" />
            <span>Filtros da Trilha de Auditoria</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredLogs.length} evento(s) encontrado(s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por usuário, ação ou detalhe..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
              />
            </div>
          </div>

          <div>
            <select
              value={moduloFilter}
              onChange={e => setModuloFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todos">Todos os Módulos</option>
              {uniqueModules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={acaoFilter}
              onChange={e => setAcaoFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-600"
            >
              <option value="todas">Todas as Ações</option>
              {uniqueActions.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Data e Hora</th>
                <th className="px-4 py-3">Usuário / Perfil</th>
                <th className="px-4 py-3">Tipo da Ação</th>
                <th className="px-4 py-3">Módulo Afetado</th>
                <th className="px-4 py-3">Detalhes da Operação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 font-sans">
                    Nenhum registro de log encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  let actionBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (log.tipoAcao.includes('Exclusão') || log.tipoAcao.includes('Remoção')) {
                    actionBadge = 'bg-red-50 text-red-700 border-red-200';
                  } else if (log.tipoAcao.includes('Criação') || log.tipoAcao.includes('Cadastro') || log.tipoAcao.includes('Conclusão') || log.tipoAcao.includes('Resolução')) {
                    actionBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  } else if (log.tipoAcao.includes('Edição') || log.tipoAcao.includes('Atualização')) {
                    actionBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {new Date(log.dataHora).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-sans font-bold text-slate-900">{log.usuario}</span>
                        <span className="block font-sans text-[10px] text-slate-400">{log.cargo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold border ${actionBadge}`}>
                          {log.tipoAcao}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-sans font-semibold text-slate-800">
                        {log.modulo}
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-700 max-w-md">
                        {log.detalhes}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
