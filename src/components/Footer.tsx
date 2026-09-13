import React from 'react';
import { ShieldCheck, Database, Clock } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const Footer: React.FC = () => {
  const { realTimeEnabled, companies, branches, occurrences, invoices, tasks } = useSystem();

  return (
    <footer
      id="app-footer"
      className="mt-auto border-t border-slate-200 bg-white px-4 py-4 md:px-6 text-xs text-slate-500"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-red-700 text-white flex items-center justify-center font-bold text-[10px]">
            AF
          </div>
          <span className="font-semibold text-slate-800">Sistema de Analista Fiscal</span>
          <span className="text-slate-400">•</span>
          <span>Criado por <strong>Álvaro Santos</strong></span>
          <span className="text-slate-400">•</span>
          <span>Ano 2026</span>
        </div>

        {/* Status bar */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {companies.length} Emp | {branches.length} Fil | {invoices.length} NF-e | {occurrences.length} Ocorrências | {tasks.length} Tarefas
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                realTimeEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{realTimeEnabled ? 'Tempo Real Ativo' : 'Sincronização Manual'}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
