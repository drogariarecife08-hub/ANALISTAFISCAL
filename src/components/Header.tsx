import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  UserCheck,
  Check,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  Users,
  Trash2,
  Settings2
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { ActiveModule } from './Sidebar';
import { UserManagementModal } from './UserManagementModal';
import { ClearSystemModal } from './ClearSystemModal';

interface HeaderProps {
  activeModule: ActiveModule;
  setActiveModule: (mod: ActiveModule) => void;
  setMobileOpen: (open: boolean) => void;
}

const MODULE_NAMES: Record<ActiveModule, string> = {
  dashboard: 'Dashboard do Analista Fiscal',
  cadastro_empresas: 'Cadastro de Empresas',
  cadastro_filiais: 'Cadastro de Filiais',
  colaboradores: 'Cadastro de Colaboradores',
  controle_notas: 'Controle Fiscal de Notas Fiscais',
  ocorrencias: 'Cadastro de Ocorrências Fiscais',
  controle_perdas_avarias: 'Controle de Perdas e Avarias',
  falta_produtos: 'Controle de Falta de Produtos',
  tarefas: 'Organização de Tarefas',
  agenda: 'Agenda de Atividades',
  relatorios: 'Central de Relatórios Corporativos',
  planilhas: 'Gerador de Planilhas',
  organizacao_tarefas: 'Planilha de Organização de Tarefas',
  auditoria: 'Histórico & Auditoria de Alterações'
};

export const Header: React.FC<HeaderProps> = ({
  activeModule,
  setActiveModule,
  setMobileOpen
}) => {
  const {
    currentUser,
    setCurrentUser,
    availableUsers,
    soundEnabled,
    setSoundEnabled,
    realTimeEnabled,
    setRealTimeEnabled,
    alerts,
    markAlertAsRead,
    markAllAlertsAsRead,
    triggerManualRealTimeAlert,
    resetToDefaultData
  } = useSystem();

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [clearSystemOpen, setClearSystemOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profRef = useRef<HTMLDivElement>(null);

  const unreadAlerts = alerts.filter(a => !a.lida);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
      if (profRef.current && !profRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs"
    >
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          id="btn-mobile-menu"
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
          title="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {MODULE_NAMES[activeModule] || 'Sistema Fiscal'}
            </h1>
            <span className="hidden sm:inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
              Corporativo
            </span>
          </div>
          <span className="text-[11px] text-slate-500 hidden md:block">
            Controle, acompanhamento e fiscalização em tempo real
          </span>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real-time Status Badge */}
        <button
          id="btn-toggle-realtime"
          type="button"
          onClick={() => setRealTimeEnabled(!realTimeEnabled)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            realTimeEnabled
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
          }`}
          title={realTimeEnabled ? 'Tempo Real Ativado (Clique para pausar)' : 'Tempo Real Pausado (Clique para ativar)'}
        >
          <span className="relative flex h-2 w-2">
            {realTimeEnabled && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                realTimeEnabled ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            ></span>
          </span>
          <span className="hidden md:inline">
            {realTimeEnabled ? 'Tempo Real Ativo' : 'Pausado'}
          </span>
        </button>

        {/* Quick Simulation Trigger */}
        <button
          id="btn-simulate-alert"
          type="button"
          onClick={triggerManualRealTimeAlert}
          className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
          title="Disparar verificação fiscal em tempo real"
        >
          <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />
          <span>Testar Alerta</span>
        </button>

        {/* Audio notification toggle */}
        <button
          id="btn-toggle-sound"
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-lg text-slate-600 hover:text-slate-900 border transition-colors ${
            soundEnabled
              ? 'bg-white border-slate-200 hover:bg-slate-50'
              : 'bg-slate-100 border-slate-200 text-slate-400'
          }`}
          title={soundEnabled ? 'Notificações sonoras ativadas' : 'Notificações sonoras silenciadas'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-slate-700" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            id="btn-notifications-menu"
            type="button"
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 relative transition-colors"
            title="Central de Notificações"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div
              id="notifications-dropdown-menu"
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-red-400" />
                  <span className="font-semibold text-xs uppercase tracking-wider">
                    Alertas & Notificações
                  </span>
                </div>
                {unreadAlerts.length > 0 && (
                  <button
                    type="button"
                    onClick={markAllAlertsAsRead}
                    className="text-[11px] text-red-300 hover:text-white underline"
                  >
                    Marcar lidas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Nenhuma notificação no momento.
                  </div>
                ) : (
                  alerts.slice(0, 8).map(alert => {
                    const bgClass = !alert.lida
                      ? alert.gravidade === 'urgente'
                        ? 'bg-red-50/60'
                        : 'bg-amber-50/40'
                      : 'bg-white';

                    return (
                      <div
                        key={alert.id}
                        onClick={() => {
                          markAlertAsRead(alert.id);
                          if (alert.moduloDestino) {
                            setActiveModule(alert.moduloDestino as ActiveModule);
                            setNotificationOpen(false);
                          }
                        }}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${bgClass}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-xs font-semibold ${
                              alert.gravidade === 'urgente'
                                ? 'text-red-700'
                                : alert.gravidade === 'aviso'
                                ? 'text-amber-800'
                                : 'text-slate-800'
                            }`}
                          >
                            {alert.titulo}
                          </span>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {alert.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                          {alert.mensagem}
                        </p>
                        {alert.moduloDestino && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-red-700 font-medium">
                            <span>Acessar módulo</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Switcher / Profile Dropdown */}
        <div className="relative" ref={profRef}>
          <button
            id="btn-user-profile-menu"
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-red-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {currentUser.avatar || currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left min-w-0">
              <span className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-500 capitalize">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div
              id="profile-dropdown-menu"
              className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Alternar Usuário / Perfil (RBAC)
                </p>
              </div>

              <div className="py-1 space-y-1">
                {availableUsers.map(user => {
                  const isSelected = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setCurrentUser(user);
                        setProfileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                        isSelected ? 'bg-red-50 text-red-900' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-red-700 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {user.avatar || user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{user.name}</p>
                          <p className="text-[10px] text-slate-500 capitalize">
                            Perfil: {user.role.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-red-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setUserManagementOpen(true);
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  <Users className="w-3.5 h-3.5 text-red-600" />
                  <span>Gerenciar Usuários (Adicionar / Editar / Excluir)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setClearSystemOpen(true);
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50 rounded-lg transition-colors font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Zerar Todo o Sistema (Novos Cadastros)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetToDefaultData();
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Restaurar Dados Padrão</span>
                </button>

                <div className="px-2.5 py-1 text-[10px] text-slate-400">
                  Responsável Técnico: <strong>Álvaro Santos</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals for User Management and System Wipe */}
      <UserManagementModal
        isOpen={userManagementOpen}
        onClose={() => setUserManagementOpen(false)}
      />

      <ClearSystemModal
        isOpen={clearSystemOpen}
        onClose={() => setClearSystemOpen(false)}
      />
    </header>
  );
};
