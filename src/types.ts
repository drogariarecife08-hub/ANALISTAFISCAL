export type UserRole = 'administrador' | 'analista_fiscal' | 'colaborador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  cargo?: string;
  status?: 'Ativo' | 'Inativo';
  empresaId?: string;
  filialId?: string;
}

export type CompanyStatus = 'Ativa' | 'Inativa';

export interface Company {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  email: string;
  telefone: string;
  responsavel: string;
  endereco: string;
  cidade: string;
  estado: string;
  status: CompanyStatus;
  createdAt: string;
  updatedAt?: string;
}

export type BranchStatus = 'Ativa' | 'Inativa';

export interface Branch {
  id: string;
  nome: string;
  codigo: string;
  cnpj: string;
  empresaId: string;
  empresaNome: string;
  email: string;
  telefone: string;
  responsavel: string;
  endereco: string;
  cidade: string;
  estado: string;
  status: BranchStatus;
  createdAt: string;
}

export type CollaboratorStatus = 'Ativo' | 'Inativo';

export interface Collaborator {
  id: string;
  nomeCompleto: string;
  cpf: string;
  matricula: string;
  email: string;
  telefone: string;
  cargo: string;
  departamento: string;
  empresaId: string;
  filialId: string;
  dataAdmissao: string;
  status: CollaboratorStatus;
}

export type InvoiceStatus = 'Pendente' | 'Em análise' | 'Concluída' | 'Com divergência' | 'Cancelada';

export interface Invoice {
  id: string;
  numero: string;
  serie: string;
  dataEmissao: string;
  dataEntrada: string;
  fornecedor: string;
  cnpjFornecedor: string;
  filialId: string;
  empresaId: string;
  valor: number;
  responsavel: string;
  status: InvoiceStatus;
  observacoes: string;
  createdAt: string;
}

export type OccurrenceType =
  | 'Avaria'
  | 'Falta de produto'
  | 'Excesso de produto'
  | 'Produto divergente'
  | 'Erro de estoque'
  | 'Erro de nota fiscal'
  | 'Preço divergente'
  | 'Produto vencido'
  | 'Produto próximo do vencimento'
  | 'Divergência de quantidade'
  | 'Divergência de valor'
  | 'Outros';

export type SeverityLevel = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

export type OccurrenceStatus =
  | 'Aberta'
  | 'Em análise'
  | 'Aguardando fornecedor'
  | 'Aguardando filial'
  | 'Resolvida'
  | 'Cancelada';

export interface Occurrence {
  id: string;
  numero: string; // ex: OC-2026-001
  protocolo?: string;
  data: string;
  hora: string;
  dataHora?: string;
  empresaId: string;
  empresaNome: string;
  filialId: string;
  filialNome: string;
  fornecedor: string;
  numeroNotaFiscal: string;
  valorBoleto?: number;
  produto: string;
  codigoBarras: string;
  codigoProduto?: string;
  descricao: string;
  tipo: OccurrenceType;
  gravidade?: SeverityLevel | string;
  quantidade: number;
  quantidadeAfetada?: number;
  valorUnitario: number;
  valorTotal: number;
  valorEstimadoPerda?: number;
  responsavelRegistro: string;
  responsavelSolucao: string;
  prazoSolucao: string;
  status: OccurrenceStatus;
  solucao?: string;
  observacoes: string;
  evidencias: string[];
  fotos?: string[];
  dataResolucao?: string;
  createdAt: string;
}

export type LossDamageType =
  | 'Produto avariado no recebimento'
  | 'Produto avariado no transporte'
  | 'Produto vencido'
  | 'Produto quebrado'
  | 'Produto faltante'
  | 'Produto danificado'
  | 'Erro de separação'
  | 'Outros';

export type LossDamageStatus =
  | 'Em análise'
  | 'Aprovada para descarte'
  | 'Indenizada pelo fornecedor'
  | 'Estornada'
  | 'Registrada'
  | 'Em avaliação'
  | 'Ressarcida'
  | 'Descartada';

export interface LossDamage {
  id: string;
  data: string;
  empresaId: string;
  empresaNome: string;
  filialId: string;
  filialNome: string;
  produto: string;
  codigo?: string;
  codigoBarras?: string;
  lote?: string;
  validade?: string;
  quantidade: number;
  custoUnitario?: number;
  valorUnitario?: number;
  valorTotal: number;
  motivoPerda?: string;
  motivoAvaria?: string;
  tipoPerda?: LossDamageType;
  distribuidora?: string;
  numeroNotaFiscal?: string;
  responsavel: string;
  observacoes?: string;
  status: LossDamageStatus;
  dataSolucao?: string;
  evidencias?: string[];
}

export type ShortageStatus =
  | 'Pendente de regularização'
  | 'Carta de correção solicitada'
  | 'Devolução gerada'
  | 'Resolvido'
  | 'Pendente'
  | 'Notificado'
  | 'Reposto'
  | 'Abatido em NF'
  | 'Cancelado';

export interface ProductShortage {
  id: string;
  data: string;
  filialId: string;
  filialNome: string;
  fornecedor: string;
  notaFiscal: string;
  produto: string;
  codigo?: string;
  codigoBarras?: string;
  quantidadeFaturada?: number;
  quantidadeSolicitada?: number;
  quantidadeRecebida: number;
  quantidadeFaltante: number;
  valorUnitario: number;
  valorTotal: number;
  motivo?: string;
  responsavel?: string;
  status: ShortageStatus;
  observacoes?: string;
}

export type TaskPriority = 'Baixa' | 'Normal' | 'Média' | 'Alta' | 'Urgente';
export type TaskStatus = 'Não iniciada' | 'Em andamento' | 'Pendente' | 'Concluída' | 'Atrasada' | 'Cancelada';

export interface Task {
  id: string;
  numero?: string;
  titulo: string;
  descricao: string;
  categoria?: string;
  empresaId?: string;
  empresaNome?: string;
  filialId?: string;
  filialNome?: string;
  responsavel: string;
  dataCriacao?: string;
  prazo?: string;
  prazoConclusao?: string;
  prioridade: TaskPriority;
  status: TaskStatus;
  percentualConclusao?: number;
  observacoes?: string;
  dataConclusao?: string;
}

export interface CalendarEvent {
  id: string;
  titulo: string;
  data: string;
  horario: string;
  responsavel: string;
  filialId: string;
  tipo: 'compromisso' | 'recorrente';
  observacoes: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  dataHora?: string;
  usuario: string;
  cargo?: string;
  perfil?: UserRole;
  acao?: 'Criar' | 'Editar' | 'Excluir' | 'Status' | 'Login' | 'Exportar' | string;
  tipoAcao?: string;
  modulo: string;
  detalhes: string;
  registroId?: string;
}

export interface SystemAlert {
  id: string;
  timestamp: string;
  titulo: string;
  mensagem: string;
  tipo: 'ocorrencia' | 'tarefa' | 'nota' | 'avaria' | 'falta' | 'sistema';
  lida: boolean;
  gravidade: 'info' | 'aviso' | 'urgente' | 'sucesso';
  moduloDestino?: string;
}
