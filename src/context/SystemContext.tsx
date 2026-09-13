import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Company,
  Branch,
  Collaborator,
  Invoice,
  Occurrence,
  LossDamage,
  ProductShortage,
  Task,
  CalendarEvent,
  AuditLog,
  SystemAlert,
  User,
  UserRole
} from '../types';
import {
  INITIAL_COMPANIES,
  INITIAL_BRANCHES,
  INITIAL_COLLABORATORS,
  INITIAL_INVOICES,
  INITIAL_OCCURRENCES,
  INITIAL_LOSS_DAMAGES,
  INITIAL_SHORTAGES,
  INITIAL_TASKS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ALERTS,
  INITIAL_USERS
} from '../data/initialData';
import { playNotificationSound } from '../utils/sound';

interface SystemContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  availableUsers: User[];
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  realTimeEnabled: boolean;
  setRealTimeEnabled: (enabled: boolean) => void;

  // Data
  companies: Company[];
  branches: Branch[];
  collaborators: Collaborator[];
  invoices: Invoice[];
  occurrences: Occurrence[];
  lossDamages: LossDamage[];
  shortages: ProductShortage[];
  tasks: Task[];
  calendarEvents: CalendarEvent[];
  auditLogs: AuditLog[];
  alerts: SystemAlert[];

  // Companies CRUD
  addCompany: (data: Omit<Company, 'id' | 'createdAt'>) => void;
  updateCompany: (id: string, data: Partial<Company>) => void;
  deleteCompany: (id: string) => void;

  // Branches CRUD
  addBranch: (data: Omit<Branch, 'id' | 'createdAt'>) => void;
  updateBranch: (id: string, data: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;

  // Collaborators CRUD
  addCollaborator: (data: Omit<Collaborator, 'id'>) => void;
  updateCollaborator: (id: string, data: Partial<Collaborator>) => void;
  deleteCollaborator: (id: string) => void;

  // Invoices CRUD
  addInvoice: (data: Omit<Invoice, 'id' | 'createdAt'>) => void;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  // Occurrences CRUD
  addOccurrence: (data: Omit<Occurrence, 'id' | 'numero' | 'createdAt'>) => void;
  updateOccurrence: (id: string, data: Partial<Occurrence>) => void;
  deleteOccurrence: (id: string) => void;

  // Loss and Damages CRUD
  addLossDamage: (data: Omit<LossDamage, 'id'>) => void;
  updateLossDamage: (id: string, data: Partial<LossDamage>) => void;
  deleteLossDamage: (id: string) => void;

  // Shortages CRUD
  addShortage: (data: Omit<ProductShortage, 'id'>) => void;
  updateShortage: (id: string, data: Partial<ProductShortage>) => void;
  deleteShortage: (id: string) => void;

  // Tasks CRUD
  addTask: (data: Omit<Task, 'id' | 'numero'>) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => void;

  // Calendar CRUD
  addCalendarEvent: (data: Omit<CalendarEvent, 'id'>) => void;
  deleteCalendarEvent: (id: string) => void;

  // Users CRUD
  addUser: (data: Omit<User, 'id'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Alerts
  markAlertAsRead: (id: string) => void;
  markAllAlertsAsRead: () => void;
  triggerManualRealTimeAlert: () => void;

  // Permissions helper
  hasPermission: (permission: string) => boolean;

  // Reset or clear system data
  resetToDefaultData: () => void;
  clearAllData: () => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Helpers for storage with local persistence
  const getStored = <T,>(key: string, defaultVal: T): T => {
    try {
      const item = localStorage.getItem(`fiscal_analyst_${key}`);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const setStored = (key: string, value: unknown) => {
    try {
      localStorage.setItem(`fiscal_analyst_${key}`, JSON.stringify(value));
    } catch {
      // ignore
    }
  };

  const [availableUsers, setAvailableUsers] = useState<User[]>(() =>
    getStored('available_users', INITIAL_USERS)
  );
  const [currentUser, setCurrentUserState] = useState<User>(() =>
    getStored('current_user', INITIAL_USERS[0])
  );
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() =>
    getStored('sound_enabled', true)
  );
  const [realTimeEnabled, setRealTimeEnabledState] = useState<boolean>(() =>
    getStored('realtime_enabled', true)
  );

  const [companies, setCompanies] = useState<Company[]>(() =>
    getStored('companies', INITIAL_COMPANIES)
  );
  const [branches, setBranches] = useState<Branch[]>(() =>
    getStored('branches', INITIAL_BRANCHES)
  );
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() =>
    getStored('collaborators', INITIAL_COLLABORATORS)
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    getStored('invoices', INITIAL_INVOICES)
  );
  const [occurrences, setOccurrences] = useState<Occurrence[]>(() => {
    const raw = getStored<Occurrence[]>('occurrences', INITIAL_OCCURRENCES);
    return raw.map(o => ({
      ...o,
      protocolo: o.protocolo || o.numero || `OC-${o.id}`,
      gravidade: o.gravidade || 'Média',
      codigoProduto: o.codigoProduto || o.codigoBarras || '',
      quantidadeAfetada: o.quantidadeAfetada ?? o.quantidade ?? 1,
      valorEstimadoPerda: o.valorEstimadoPerda ?? o.valorTotal ?? 0,
      dataHora: o.dataHora || (o.data ? `${o.data}T${o.hora || '10:00'}` : new Date().toISOString()),
      solucao: o.solucao || '',
      fotos: o.fotos || o.evidencias || []
    }));
  });

  const [lossDamages, setLossDamages] = useState<LossDamage[]>(() => {
    const raw = getStored<LossDamage[]>('loss_damages', INITIAL_LOSS_DAMAGES);
    return raw.map(l => ({
      ...l,
      codigo: l.codigo || l.codigoBarras || 'SKU-001',
      lote: l.lote || 'L-2026-A',
      validade: l.validade || '2027-12-31',
      custoUnitario: l.custoUnitario ?? l.valorUnitario ?? 0,
      motivoPerda: l.motivoPerda || l.motivoAvaria || l.tipoPerda || 'Avaria Operacional'
    }));
  });

  const [shortages, setShortages] = useState<ProductShortage[]>(() => {
    const raw = getStored<ProductShortage[]>('shortages', INITIAL_SHORTAGES);
    return raw.map(s => ({
      ...s,
      codigo: s.codigo || s.codigoBarras || 'SKU-001',
      quantidadeFaturada: s.quantidadeFaturada ?? s.quantidadeSolicitada ?? 0
    }));
  });

  // Initialize tasks with dynamic overdue check rule:
  // "Tarefas atrasadas devem aparecer automaticamente como atrasadas."
  const [tasks, setTasks] = useState<Task[]>(() => {
    const raw = getStored<Task[]>('tasks', INITIAL_TASKS);
    const todayStr = '2026-09-13';
    return raw.map(t => {
      const prazoFinal = t.prazoConclusao || t.prazo || todayStr;
      const isLate = prazoFinal < todayStr && t.status !== 'Concluída' && t.status !== 'Cancelada';
      return {
        ...t,
        prazoConclusao: prazoFinal,
        status: isLate ? ('Atrasada' as const) : t.status
      };
    });
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() =>
    getStored('calendar_events', INITIAL_CALENDAR_EVENTS)
  );

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const raw = getStored<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
    return raw.map(log => ({
      ...log,
      dataHora: log.dataHora || log.timestamp || new Date().toISOString(),
      tipoAcao: log.tipoAcao || log.acao || 'Operação',
      cargo: log.cargo || (log.perfil === 'administrador' ? 'Administrador' : log.perfil === 'analista_fiscal' ? 'Analista Fiscal' : 'Colaborador')
    }));
  });
  const [alerts, setAlerts] = useState<SystemAlert[]>(() =>
    getStored('alerts', INITIAL_ALERTS)
  );

  // Persistence triggers
  useEffect(() => setStored('available_users', availableUsers), [availableUsers]);
  useEffect(() => setStored('current_user', currentUser), [currentUser]);
  useEffect(() => setStored('sound_enabled', soundEnabled), [soundEnabled]);
  useEffect(() => setStored('realtime_enabled', realTimeEnabled), [realTimeEnabled]);
  useEffect(() => setStored('companies', companies), [companies]);
  useEffect(() => setStored('branches', branches), [branches]);
  useEffect(() => setStored('collaborators', collaborators), [collaborators]);
  useEffect(() => setStored('invoices', invoices), [invoices]);
  useEffect(() => setStored('occurrences', occurrences), [occurrences]);
  useEffect(() => setStored('loss_damages', lossDamages), [lossDamages]);
  useEffect(() => setStored('shortages', shortages), [shortages]);
  useEffect(() => setStored('tasks', tasks), [tasks]);
  useEffect(() => setStored('calendar_events', calendarEvents), [calendarEvents]);
  useEffect(() => setStored('audit_logs', auditLogs), [auditLogs]);
  useEffect(() => setStored('alerts', alerts), [alerts]);

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    logAudit('Login', 'Autenticação', `Usuário alternado para ${user.name} (${user.role})`);
  };

  const setSoundEnabled = (val: boolean) => setSoundEnabledState(val);
  const setRealTimeEnabled = (val: boolean) => setRealTimeEnabledState(val);

  const logAudit = useCallback((
    acao: AuditLog['acao'],
    modulo: string,
    detalhes: string,
    registroId?: string
  ) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const cargoName = currentUser.role === 'administrador' ? 'Administrador' : currentUser.role === 'analista_fiscal' ? 'Analista Fiscal' : 'Colaborador';
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: nowStr,
      dataHora: nowStr,
      usuario: currentUser.name,
      cargo: cargoName,
      perfil: currentUser.role,
      acao,
      tipoAcao: acao,
      modulo,
      detalhes,
      registroId
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  const pushAlert = useCallback((
    titulo: string,
    mensagem: string,
    tipo: SystemAlert['tipo'],
    gravidade: SystemAlert['gravidade'],
    moduloDestino?: string
  ) => {
    const newAlert: SystemAlert = {
      id: 'alt-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      titulo,
      mensagem,
      tipo,
      lida: false,
      gravidade,
      moduloDestino
    };
    setAlerts(prev => [newAlert, ...prev]);
    if (soundEnabled) {
      playNotificationSound(gravidade);
    }
  }, [soundEnabled]);

  // Periodic real-time updates simulation:
  // "Todos os usuários autorizados devem visualizar atualizações importantes sem precisar atualizar manualmente a página."
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      const simulatedUpdates = [
        {
          titulo: 'Atualização Fiscal em Tempo Real',
          mensagem: 'SEFAZ PE autorizou com sucesso a chave NFe 000.104.520.',
          tipo: 'nota' as const,
          gravidade: 'sucesso' as const,
          modulo: 'controle_notas'
        },
        {
          titulo: 'Alerta de Conferência de Entrada',
          mensagem: 'Filial 03 (Olinda) iniciou descarregamento de carga EMS S/A.',
          tipo: 'sistema' as const,
          gravidade: 'info' as const,
          modulo: 'cadastro_filiais'
        },
        {
          titulo: 'Verificação de Tarefas Automática',
          mensagem: 'Sincronização periódica de conformidade fiscal concluída.',
          tipo: 'tarefa' as const,
          gravidade: 'info' as const,
          modulo: 'tarefas'
        }
      ];
      const randomEvent = simulatedUpdates[Math.floor(Math.random() * simulatedUpdates.length)];
      pushAlert(
        randomEvent.titulo,
        randomEvent.mensagem,
        randomEvent.tipo,
        randomEvent.gravidade,
        randomEvent.modulo
      );
    }, 60000); // every 60 seconds

    return () => clearInterval(interval);
  }, [realTimeEnabled, pushAlert]);

  const triggerManualRealTimeAlert = () => {
    pushAlert(
      'Alerta Imediato: Auditoria Fiscal Sincronizada',
      'Validação automática dos documentos de transporte e entradas processada com êxito.',
      'sistema',
      'sucesso',
      'controle_notas'
    );
  };

  // Permission verification
  const hasPermission = (permission: string): boolean => {
    const role: UserRole = currentUser.role;
    if (role === 'administrador') return true;

    if (role === 'analista_fiscal') {
      const allowed = [
        'view_dashboard',
        'manage_invoices',
        'manage_occurrences',
        'manage_tasks',
        'manage_losses',
        'manage_shortages',
        'view_companies',
        'manage_companies',
        'view_branches',
        'manage_branches',
        'view_collaborators',
        'view_calendar',
        'add_calendar',
        'view_reports',
        'view_spreadsheets',
        'export_data'
      ];
      return allowed.includes(permission);
    }

    if (role === 'colaborador') {
      const allowed = [
        'view_dashboard',
        'view_my_tasks',
        'update_task_status',
        'register_occurrence',
        'view_occurrences',
        'view_calendar',
        'view_notifications'
      ];
      return allowed.includes(permission);
    }

    return false;
  };

  // Companies CRUD
  const addCompany = (data: Omit<Company, 'id' | 'createdAt'>) => {
    const newCompany: Company = {
      ...data,
      id: 'emp-' + Date.now(),
      createdAt: new Date().toISOString().substring(0, 10)
    };
    setCompanies(prev => [newCompany, ...prev]);
    logAudit('Criar', 'Empresas', `Cadastrada empresa: ${newCompany.nomeFantasia}`, newCompany.id);
    pushAlert('Empresa Cadastrada', `A empresa "${newCompany.nomeFantasia}" foi adicionada.`, 'sistema', 'sucesso', 'cadastro_empresas');
  };

  const updateCompany = (id: string, data: Partial<Company>) => {
    setCompanies(prev =>
      prev.map(c => (c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString().substring(0, 10) } : c))
    );
    logAudit('Editar', 'Empresas', `Atualizada empresa ID ${id}`, id);
  };

  const deleteCompany = (id: string) => {
    const target = companies.find(c => c.id === id);
    setCompanies(prev => prev.filter(c => c.id !== id));
    logAudit('Excluir', 'Empresas', `Excluída empresa: ${target?.nomeFantasia || id}`, id);
  };

  // Branches CRUD
  const addBranch = (data: Omit<Branch, 'id' | 'createdAt'>) => {
    const newBranch: Branch = {
      ...data,
      id: 'fil-' + Date.now(),
      createdAt: new Date().toISOString().substring(0, 10)
    };
    setBranches(prev => [newBranch, ...prev]);
    logAudit('Criar', 'Filiais', `Cadastrada filial: ${newBranch.nome}`, newBranch.id);
    pushAlert('Filial Cadastrada', `A filial "${newBranch.nome}" foi cadastrada com sucesso.`, 'sistema', 'sucesso', 'cadastro_filiais');
  };

  const updateBranch = (id: string, data: Partial<Branch>) => {
    setBranches(prev => prev.map(b => (b.id === id ? { ...b, ...data } : b)));
    logAudit('Editar', 'Filiais', `Atualizada filial ID ${id}`, id);
  };

  const deleteBranch = (id: string) => {
    const target = branches.find(b => b.id === id);
    setBranches(prev => prev.filter(b => b.id !== id));
    logAudit('Excluir', 'Filiais', `Excluída filial: ${target?.nome || id}`, id);
    pushAlert('Filial Excluída', `A filial "${target?.nome || id}" foi removida com sucesso.`, 'sistema', 'aviso', 'cadastro_filiais');
  };

  // Collaborators CRUD
  const addCollaborator = (data: Omit<Collaborator, 'id'>) => {
    const newCol: Collaborator = {
      ...data,
      id: 'col-' + Date.now()
    };
    setCollaborators(prev => [newCol, ...prev]);
    logAudit('Criar', 'Colaboradores', `Cadastrado colaborador: ${newCol.nomeCompleto}`, newCol.id);
  };

  const updateCollaborator = (id: string, data: Partial<Collaborator>) => {
    setCollaborators(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)));
    logAudit('Editar', 'Colaboradores', `Atualizado colaborador ID ${id}`, id);
  };

  const deleteCollaborator = (id: string) => {
    const target = collaborators.find(c => c.id === id);
    setCollaborators(prev => prev.filter(c => c.id !== id));
    logAudit('Excluir', 'Colaboradores', `Excluído colaborador: ${target?.nomeCompleto || id}`, id);
  };

  // Invoices CRUD
  const addInvoice = (data: Omit<Invoice, 'id' | 'createdAt'>) => {
    const newInv: Invoice = {
      ...data,
      id: 'nf-' + Date.now(),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setInvoices(prev => [newInv, ...prev]);
    logAudit('Criar', 'Notas Fiscais', `Cadastrada NFe ${newInv.numero} - ${newInv.fornecedor}`, newInv.id);
    pushAlert(
      'Nova Nota Fiscal Cadastrada',
      `NFe nº ${newInv.numero} (${newInv.fornecedor}) cadastrada no valor de R$ ${newInv.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      'nota',
      'info',
      'controle_notas'
    );
  };

  const updateInvoice = (id: string, data: Partial<Invoice>) => {
    setInvoices(prev => prev.map(inv => (inv.id === id ? { ...inv, ...data } : inv)));
    logAudit('Editar', 'Notas Fiscais', `Atualizada NFe ID ${id}`, id);
  };

  const deleteInvoice = (id: string) => {
    const target = invoices.find(i => i.id === id);
    setInvoices(prev => prev.filter(i => i.id !== id));
    logAudit('Excluir', 'Notas Fiscais', `Excluída NFe nº ${target?.numero || id}`, id);
  };

  // Occurrences CRUD
  const addOccurrence = (data: Omit<Occurrence, 'id' | 'numero' | 'createdAt'>) => {
    const nextSeq = occurrences.length + 1;
    const numero = `OC-2026-${String(nextSeq).padStart(3, '0')}`;
    const emp = companies.find(c => c.id === data.empresaId);
    const fil = branches.find(b => b.id === data.filialId);
    const nowIso = new Date().toISOString();
    const newOcc: Occurrence = {
      ...data,
      id: 'oc-' + Date.now(),
      numero,
      protocolo: data.protocolo || numero,
      data: data.data || nowIso.substring(0, 10),
      hora: data.hora || new Date().toTimeString().substring(0, 5),
      dataHora: data.dataHora || nowIso,
      empresaNome: data.empresaNome || emp?.nomeFantasia || '',
      filialNome: data.filialNome || fil?.nome || '',
      numeroNotaFiscal: data.numeroNotaFiscal || '',
      valorBoleto: data.valorBoleto ? Number(data.valorBoleto) : undefined,
      createdAt: nowIso.replace('T', ' ').substring(0, 16)
    };
    setOccurrences(prev => [newOcc, ...prev]);
    logAudit('Criar', 'Ocorrências', `Criada ocorrência ${numero}: ${newOcc.descricao || newOcc.tipo}`, newOcc.id);

    // Prompt rule: "Novas ocorrências devem gerar alerta na tela."
    pushAlert(
      `Nova Ocorrência Registrada: ${numero}`,
      `${newOcc.tipo} registrada na filial ${newOcc.filialNome}. Produto: ${newOcc.produto}`,
      'ocorrencia',
      'aviso',
      'ocorrencias'
    );
  };

  const updateOccurrence = (id: string, data: Partial<Occurrence>) => {
    setOccurrences(prev =>
      prev.map(occ => {
        if (occ.id === id) {
          const updated = { ...occ, ...data };
          if (data.status === 'Resolvida' && !occ.dataResolucao) {
            updated.dataResolucao = new Date().toISOString().substring(0, 10);
            pushAlert(
              `Ocorrência Resolvida: ${occ.numero}`,
              `A ocorrência ${occ.numero} foi marcada como resolvida por ${currentUser.name}.`,
              'ocorrencia',
              'sucesso',
              'ocorrencias'
            );
          }
          return updated;
        }
        return occ;
      })
    );
    logAudit('Editar', 'Ocorrências', `Atualizada ocorrência ID ${id}`, id);
  };

  const deleteOccurrence = (id: string) => {
    const target = occurrences.find(o => o.id === id);
    setOccurrences(prev => prev.filter(o => o.id !== id));
    logAudit('Excluir', 'Ocorrências', `Excluída ocorrência ${target?.numero || id}`, id);
  };

  // Loss and Damages CRUD
  const addLossDamage = (data: Omit<LossDamage, 'id'>) => {
    const newLoss: LossDamage = {
      ...data,
      id: 'perda-' + Date.now()
    };
    setLossDamages(prev => [newLoss, ...prev]);
    logAudit('Criar', 'Perdas e Avarias', `Registrada avaria: ${newLoss.produto} (R$ ${newLoss.valorTotal})`, newLoss.id);

    // Prompt rule: "Alertar quando uma filial registrar uma avaria"
    pushAlert(
      'Avaria Registrada',
      `Filial "${newLoss.filialNome}" registrou avaria: ${newLoss.produto} (R$ ${newLoss.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`,
      'avaria',
      'urgente',
      'controle_perdas_avarias'
    );
  };

  const updateLossDamage = (id: string, data: Partial<LossDamage>) => {
    setLossDamages(prev => prev.map(l => (l.id === id ? { ...l, ...data } : l)));
    logAudit('Editar', 'Perdas e Avarias', `Atualizada perda/avaria ID ${id}`, id);
  };

  const deleteLossDamage = (id: string) => {
    const target = lossDamages.find(l => l.id === id);
    setLossDamages(prev => prev.filter(l => l.id !== id));
    logAudit('Excluir', 'Perdas e Avarias', `Excluída perda/avaria: ${target?.produto || id}`, id);
  };

  // Shortages CRUD
  const addShortage = (data: Omit<ProductShortage, 'id'>) => {
    const newShort: ProductShortage = {
      ...data,
      id: 'falta-' + Date.now()
    };
    setShortages(prev => [newShort, ...prev]);
    logAudit('Criar', 'Falta de Produtos', `Registrada falta: ${newShort.produto} (-${newShort.quantidadeFaltante} un)`, newShort.id);

    // Prompt rule: "Alertar quando uma filial registrar falta de produto"
    pushAlert(
      'Falta de Produto Registrada',
      `Filial "${newShort.filialNome}" apontou falta de ${newShort.quantidadeFaltante} un de ${newShort.produto}.`,
      'falta',
      'aviso',
      'falta_produtos'
    );
  };

  const updateShortage = (id: string, data: Partial<ProductShortage>) => {
    setShortages(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
    logAudit('Editar', 'Falta de Produtos', `Atualizada falta de produto ID ${id}`, id);
  };

  const deleteShortage = (id: string) => {
    const target = shortages.find(s => s.id === id);
    setShortages(prev => prev.filter(s => s.id !== id));
    logAudit('Excluir', 'Falta de Produtos', `Excluída falta: ${target?.produto || id}`, id);
  };

  // Tasks CRUD
  const addTask = (data: Omit<Task, 'id' | 'numero'>) => {
    const nextSeq = tasks.length + 1;
    const numero = `TSK-${String(nextSeq).padStart(3, '0')}`;
    const newTask: Task = {
      ...data,
      id: 'tsk-' + Date.now(),
      numero
    };
    setTasks(prev => [newTask, ...prev]);
    logAudit('Criar', 'Tarefas', `Criada tarefa ${numero}: ${newTask.titulo}`, newTask.id);

    if (newTask.status === 'Pendente' || newTask.prioridade === 'Urgente') {
      pushAlert(
        `Nova Tarefa: ${numero}`,
        `${newTask.titulo} (${newTask.prioridade}). Prazo: ${newTask.prazo}.`,
        'tarefa',
        newTask.prioridade === 'Urgente' ? 'urgente' : 'info',
        'tarefas'
      );
    }
  };

  const updateTask = (id: string, data: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          const updated = { ...t, ...data };
          if (data.percentualConclusao === 100 && t.status !== 'Concluída') {
            updated.status = 'Concluída';
          }
          return updated;
        }
        return t;
      })
    );
    logAudit('Editar', 'Tarefas', `Atualizada tarefa ID ${id}`, id);
  };

  const deleteTask = (id: string) => {
    const target = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    logAudit('Excluir', 'Tarefas', `Excluída tarefa ${target?.numero || id}`, id);
  };

  const duplicateTask = (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;
    const nextSeq = tasks.length + 1;
    const numero = `TSK-${String(nextSeq).padStart(3, '0')}`;
    const cloned: Task = {
      ...target,
      id: 'tsk-' + Date.now(),
      numero,
      titulo: `${target.titulo} (Cópia)`,
      status: 'Não iniciada',
      percentualConclusao: 0,
      dataCriacao: new Date().toISOString().substring(0, 10)
    };
    setTasks(prev => [cloned, ...prev]);
    logAudit('Criar', 'Tarefas', `Duplicada tarefa ${target.numero} para ${cloned.numero}`, cloned.id);
    pushAlert('Tarefa Duplicada', `Tarefa ${cloned.numero} criada com sucesso.`, 'tarefa', 'info', 'tarefas');
  };

  // Calendar
  const addCalendarEvent = (data: Omit<CalendarEvent, 'id'>) => {
    const newEv: CalendarEvent = {
      ...data,
      id: 'ev-' + Date.now()
    };
    setCalendarEvents(prev => [...prev, newEv]);
    logAudit('Criar', 'Agenda', `Agendado compromisso: ${newEv.titulo}`, newEv.id);
    pushAlert('Atividade Agendada', `Compromisso "${newEv.titulo}" adicionado à agenda.`, 'sistema', 'info', 'agenda');
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
    logAudit('Excluir', 'Agenda', `Excluído evento ID ${id}`, id);
  };

  // Alerts
  const markAlertAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, lida: true } : a)));
  };

  const markAllAlertsAsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, lida: true })));
  };

  // Users CRUD
  const addUser = (data: Omit<User, 'id'>) => {
    const newUser: User = {
      ...data,
      id: 'usr-' + Date.now(),
      avatar: data.avatar || data.name.substring(0, 2).toUpperCase(),
      status: data.status || 'Ativo'
    };
    setAvailableUsers(prev => [...prev, newUser]);
    logAudit('Criar', 'Usuários', `Cadastrado novo usuário: ${newUser.name} (${newUser.role})`, newUser.id);
    pushAlert('Usuário Criado', `O usuário "${newUser.name}" foi cadastrado com sucesso.`, 'sistema', 'sucesso');
  };

  const updateUser = (id: string, data: Partial<User>) => {
    setAvailableUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const updated = { ...u, ...data };
          if (data.name && !data.avatar) {
            updated.avatar = data.name.substring(0, 2).toUpperCase();
          }
          return updated;
        }
        return u;
      })
    );
    if (currentUser.id === id) {
      setCurrentUserState(prev => ({
        ...prev,
        ...data,
        avatar: data.name && !data.avatar ? data.name.substring(0, 2).toUpperCase() : prev.avatar
      }));
    }
    logAudit('Editar', 'Usuários', `Atualizado usuário ID ${id}`, id);
    pushAlert('Usuário Atualizado', 'As credenciais e permissões foram atualizadas.', 'sistema', 'sucesso');
  };

  const deleteUser = (id: string) => {
    const target = availableUsers.find(u => u.id === id);
    if (availableUsers.length <= 1) {
      pushAlert('Ação Bloqueada', 'Não é possível excluir o único usuário restante no sistema.', 'sistema', 'urgente');
      return;
    }
    setAvailableUsers(prev => prev.filter(u => u.id !== id));
    if (currentUser.id === id) {
      const nextUser = availableUsers.find(u => u.id !== id);
      if (nextUser) setCurrentUserState(nextUser);
    }
    logAudit('Excluir', 'Usuários', `Excluído usuário: ${target?.name || id}`, id);
    pushAlert('Usuário Excluído', `O usuário "${target?.name || id}" foi removido do sistema.`, 'sistema', 'aviso');
  };

  const resetToDefaultData = () => {
    setCompanies(INITIAL_COMPANIES);
    setBranches(INITIAL_BRANCHES);
    setCollaborators(INITIAL_COLLABORATORS);
    setInvoices(INITIAL_INVOICES);
    setOccurrences(INITIAL_OCCURRENCES);
    setLossDamages(INITIAL_LOSS_DAMAGES);
    setShortages(INITIAL_SHORTAGES);
    setTasks(INITIAL_TASKS);
    setCalendarEvents(INITIAL_CALENDAR_EVENTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setAlerts(INITIAL_ALERTS);
    logAudit('Editar', 'Sistema', 'Dados restaurados para o padrão inicial corporativo.');
    pushAlert('Sistema Restaurado', 'Dados de demonstração restaurados com sucesso.', 'sistema', 'sucesso');
  };

  const clearAllData = () => {
    setCompanies([]);
    setBranches([]);
    setCollaborators([]);
    setInvoices([]);
    setOccurrences([]);
    setLossDamages([]);
    setShortages([]);
    setTasks([]);
    setCalendarEvents([]);
    setAuditLogs([]);
    setAlerts([]);
    try {
      const keys = [
        'companies',
        'branches',
        'collaborators',
        'invoices',
        'occurrences',
        'loss_damages',
        'shortages',
        'tasks',
        'calendar_events',
        'audit_logs',
        'alerts'
      ];
      keys.forEach(k => localStorage.removeItem(`fiscal_analyst_${k}`));
    } catch {
      // ignore
    }
    logAudit('Excluir', 'Sistema', 'Sistema zerado para novos cadastros de empresas, filiais e fornecedores.');
    pushAlert('Sistema Zerado', 'Base de dados limpa. Pronto para cadastrar novas empresas, filiais e fornecedores.', 'sistema', 'aviso');
  };

  return (
    <SystemContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers,
        soundEnabled,
        setSoundEnabled,
        realTimeEnabled,
        setRealTimeEnabled,
        companies,
        branches,
        collaborators,
        invoices,
        occurrences,
        lossDamages,
        shortages,
        tasks,
        calendarEvents,
        auditLogs,
        alerts,
        addCompany,
        updateCompany,
        deleteCompany,
        addBranch,
        updateBranch,
        deleteBranch,
        addCollaborator,
        updateCollaborator,
        deleteCollaborator,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addOccurrence,
        updateOccurrence,
        deleteOccurrence,
        addLossDamage,
        updateLossDamage,
        deleteLossDamage,
        addShortage,
        updateShortage,
        deleteShortage,
        addTask,
        updateTask,
        deleteTask,
        duplicateTask,
        addCalendarEvent,
        deleteCalendarEvent,
        markAlertAsRead,
        markAllAlertsAsRead,
        triggerManualRealTimeAlert,
        hasPermission,
        resetToDefaultData,
        clearAllData,
        addUser,
        updateUser,
        deleteUser
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};
