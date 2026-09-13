import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Building2,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { printFormattedReport } from '../utils/export';

interface FiscalEvent {
  id: string;
  data: string;
  hora: string;
  titulo: string;
  tipo: 'imposto' | 'declaracao' | 'reuniao' | 'conferencia';
  filial: string;
  responsavel: string;
  status: 'pendente' | 'concluido' | 'atrasado';
}

export const ScheduleView: React.FC = () => {
  const { currentUser, branches } = useSystem();

  const [currentMonth, setCurrentMonth] = useState('Outubro 2026');
  const [events, setEvents] = useState<FiscalEvent[]>([
    {
      id: 'EVT-01',
      data: '2026-10-05',
      hora: '09:00',
      titulo: 'Fechamento Fiscal Mensal - Conferência de Livros Entrada/Saída',
      tipo: 'conferencia',
      filial: 'Matriz São Paulo',
      responsavel: 'Álvaro Santos',
      status: 'concluido'
    },
    {
      id: 'EVT-02',
      data: '2026-10-10',
      hora: '14:00',
      titulo: 'Apuração e Vencimento do ICMS Próprio e ICMS-ST',
      tipo: 'imposto',
      filial: 'Filial 01 - CD Barueri',
      responsavel: 'Álvaro Santos',
      status: 'pendente'
    },
    {
      id: 'EVT-03',
      data: '2026-10-15',
      hora: '17:00',
      titulo: 'Transmissão do EFD-Reinf e DCTFWeb Competência Setembro',
      tipo: 'declaracao',
      filial: 'Todas as Filiais',
      responsavel: 'Mariana Costa',
      status: 'pendente'
    },
    {
      id: 'EVT-04',
      data: '2026-10-20',
      hora: '10:30',
      titulo: 'Transmissão SPED Fiscal ICMS/IPI (EFD) e Conciliação de Inventário',
      tipo: 'declaracao',
      filial: 'Filial 02 - CD Campinas',
      responsavel: 'Carlos Eduardo',
      status: 'pendente'
    },
    {
      id: 'EVT-05',
      data: '2026-10-25',
      hora: '16:00',
      titulo: 'Reunião de Alinhamento Fiscal com Encarregados de Recebimento',
      tipo: 'reuniao',
      filial: 'Matriz São Paulo',
      responsavel: 'Álvaro Santos',
      status: 'pendente'
    },
    {
      id: 'EVT-06',
      data: '2026-10-31',
      hora: '18:00',
      titulo: 'Inventário Geral Físico vs. Contábil - Auditoria de Avarias',
      tipo: 'conferencia',
      filial: 'Filial 03 - Santos',
      responsavel: 'Lucas Pereira',
      status: 'pendente'
    }
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    titulo: '',
    data: new Date().toISOString().substring(0, 10),
    hora: '10:00',
    tipo: 'imposto' as 'imposto' | 'declaracao' | 'reuniao' | 'conferencia',
    filial: branches[0]?.nome || 'Matriz',
    responsavel: currentUser.name
  });

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const created: FiscalEvent = {
      id: 'EVT-' + Math.floor(100 + Math.random() * 900),
      ...newEvent,
      status: 'pendente'
    };
    setEvents([...events, created]);
    setModalOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    setEvents(events.map(ev => {
      if (ev.id === id) {
        return {
          ...ev,
          status: ev.status === 'concluido' ? 'pendente' : 'concluido'
        };
      }
      return ev;
    }));
  };

  const handlePrint = () => {
    const headers = ['Data', 'Horário', 'Compromisso Fiscal', 'Tipo', 'Filial', 'Responsável', 'Status'];
    const rows = events.map(e => [
      new Date(e.data).toLocaleDateString('pt-BR'),
      e.hora,
      e.titulo,
      e.tipo.toUpperCase(),
      e.filial,
      e.responsavel,
      e.status.toUpperCase()
    ]);
    printFormattedReport('Agenda Tributária e Calendário Fiscal', headers, rows, {
      'Emitido por': currentUser.name,
      'Período': currentMonth
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-900">Agenda de Atividades e Calendário Fiscal</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle de prazos de declarações (SPED, EFD, Reinf), fechamentos mensais e vencimentos de tributos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Agenda</span>
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Compromisso</span>
          </button>
        </div>
      </div>

      {/* Month Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">{currentMonth}</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium">
            {events.filter(e => e.status === 'pendente').length} pendências no mês
          </span>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="divide-y divide-slate-100">
          {events.map(ev => {
            const isDone = ev.status === 'concluido';
            return (
              <div key={ev.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(ev.id)}
                    className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-red-600 bg-white'
                    }`}
                  >
                    {isDone && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {ev.titulo}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          ev.tipo === 'imposto'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : ev.tipo === 'declaracao'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {ev.tipo.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <CalendarIcon className="w-3.5 h-3.5 text-red-600" />
                        {new Date(ev.data).toLocaleDateString('pt-BR')} às {ev.hora}
                      </span>
                      <span>•</span>
                      <span>Filial: <strong>{ev.filial}</strong></span>
                      <span>•</span>
                      <span>Responsável: <strong>{ev.responsavel}</strong></span>
                    </div>
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isDone
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {isDone ? 'Concluído' : 'Aguardando Execução'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Add Event */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Adicionar Compromisso Fiscal</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título / Obrigação Fiscal *
                </label>
                <input
                  type="text"
                  required
                  value={newEvent.titulo}
                  onChange={e => setNewEvent({ ...newEvent, titulo: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
                  placeholder="Ex: Entrega EFD-ICMS/IPI"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data Limite *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEvent.data}
                    onChange={e => setNewEvent({ ...newEvent, data: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Horário Limite *
                  </label>
                  <input
                    type="time"
                    required
                    value={newEvent.hora}
                    onChange={e => setNewEvent({ ...newEvent, hora: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Obrigação
                  </label>
                  <select
                    value={newEvent.tipo}
                    onChange={e => setNewEvent({ ...newEvent, tipo: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
                  >
                    <option value="imposto">Guia de Imposto</option>
                    <option value="declaracao">Declaração / SPED</option>
                    <option value="conferencia">Conferência / Fechamento</option>
                    <option value="reuniao">Reunião Interna</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Filial
                  </label>
                  <select
                    value={newEvent.filial}
                    onChange={e => setNewEvent({ ...newEvent, filial: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.nome}>{b.codigo} - {b.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
