import React from 'react';
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Users,
  FileSpreadsheet,
  AlertOctagon,
  PackageX,
  PackageMinus,
  CheckSquare,
  Calendar,
  FileBarChart,
  FileDown,
  TableProperties,
  History,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export type ActiveModule =
  | 'dashboard'
  | 'cadastro_empresas'
  | 'cadastro_filiais'
  | 'colaboradores'
  | 'controle_notas'
  | 'ocorrencias'
  | 'controle_perdas_avarias'
  | 'falta_produtos'
  | 'tarefas'
  | 'agenda'
  | 'relatorios'
  | 'planilhas'
  | 'organizacao_tarefas'
  | 'auditoria';

interface SidebarProps {
  activeModule: ActiveModule;
  setActiveModule: (mod: ActiveModule) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen
}) => {
  const { invoices, occurrences, tasks, currentUser } = useSystem();

  const pendingInvoicesCount = invoices.filter(i => i.status === 'Pendente' || i.status === 'Com divergência').length;
  const openOccurrencesCount = occurrences.filter(o => o.status === 'Aberta' || o.status === 'Em análise').length;
  const pendingTasksCount = tasks.filter(t => t.status === 'Pendente' || t.status === 'Atrasada').length;

  const menuSections = [
    {
      title: 'Principal',
      items: [
        {
          id: 'dashboard' as ActiveModule,
          label: 'Dashboard Fiscal',
          icon: LayoutDashboard,
          badge: null
        }
      ]
    },
    {
      title: 'Cadastros Corporativos',
      items: [
        {
          id: 'cadastro_empresas' as ActiveModule,
          label: 'Empresas',
          icon: Building2,
          badge: null
        },
        {
          id: 'cadastro_filiais' as ActiveModule,
          label: 'Filiais',
          icon: GitBranch,
          badge: null
        },
        {
          id: 'colaboradores' as ActiveModule,
          label: 'Colaboradores',
          icon: Users,
          badge: null
        }
      ]
    },
    {
      title: 'Operações & Fiscalização',
      items: [
        {
          id: 'controle_notas' as ActiveModule,
          label: 'Notas Fiscais',
          icon: FileSpreadsheet,
          badge: pendingInvoicesCount > 0 ? { count: pendingInvoicesCount, color: 'bg-amber-500' } : null
        },
        {
          id: 'ocorrencias' as ActiveModule,
          label: 'Ocorrências',
          icon: AlertOctagon,
          badge: openOccurrencesCount > 0 ? { count: openOccurrencesCount, color: 'bg-red-600' } : null
        },
        {
          id: 'controle_perdas_avarias' as ActiveModule,
          label: 'Perdas e Avarias',
          icon: PackageX,
          badge: null
        },
        {
          id: 'falta_produtos' as ActiveModule,
          label: 'Falta de Produtos',
          icon: PackageMinus,
          badge: null
        }
      ]
    },
    {
      title: 'Gestão & Produtividade',
      items: [
        {
          id: 'tarefas' as ActiveModule,
          label: 'Tarefas',
          icon: CheckSquare,
          badge: pendingTasksCount > 0 ? { count: pendingTasksCount, color: 'bg-red-500' } : null
        },
        {
          id: 'agenda' as ActiveModule,
          label: 'Agenda de Atividades',
          icon: Calendar,
          badge: null
        }
      ]
    },
    {
      title: 'Relatórios & Dados',
      items: [
        {
          id: 'relatorios' as ActiveModule,
          label: 'Central de Relatórios',
          icon: FileBarChart,
          badge: null
        },
        {
          id: 'planilhas' as ActiveModule,
          label: 'Gerador de Planilhas',
          icon: FileDown,
          badge: null
        },
        {
          id: 'organizacao_tarefas' as ActiveModule,
          label: 'Planilha de Tarefas',
          icon: TableProperties,
          badge: null
        },
        {
          id: 'auditoria' as ActiveModule,
          label: 'Histórico & Auditoria',
          icon: History,
          badge: null
        }
      ]
    }
  ];

  const handleSelect = (mod: ActiveModule) => {
    setActiveModule(mod);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          id="mobile-sidebar-backdrop"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-200 ease-in-out ${
          collapsed ? 'w-20' : 'w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shrink-0 shadow-md shadow-red-950">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight text-white truncate">
                  Analista Fiscal
                </span>
                <span className="text-[11px] text-red-400 font-medium truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Sistema Corporativo
                </span>
              </div>
            )}
          </div>

          <button
            id="btn-toggle-sidebar"
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Info Capsule */}
        <div className={`px-3 py-3 border-b border-slate-800/80 bg-slate-900/50 ${collapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-red-700/80 text-white font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-red-500/30">
              {currentUser.avatar || currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 truncate">{currentUser.name}</p>
                <span className="inline-block text-[10px] uppercase font-medium tracking-wider px-1.5 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-800/50">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {menuSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
              )}
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left group relative ${
                      isActive
                        ? 'bg-red-700 text-white shadow-md shadow-red-950 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-red-400'
                      }`}
                    />
                    {!collapsed && (
                      <span className="flex-1 truncate">{item.label}</span>
                    )}
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${item.badge.color} ${
                          collapsed ? 'absolute -top-1 -right-1 ring-2 ring-slate-900' : ''
                        }`}
                      >
                        {item.badge.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer Info */}
        {!collapsed && (
          <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/60">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>Criado por <strong>Álvaro Santos</strong></span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Versão 2026.1 • Fiscal Web</div>
          </div>
        )}
      </aside>
    </>
  );
};
