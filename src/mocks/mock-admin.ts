export interface Tenant {
  id: string;
  name: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  plan: 'porteira' | 'piquete' | 'retiro' | 'estancia' | 'barao';
  status: 'active' | 'pending' | 'suspended' | 'blocked';
  totalCattle: number;
  propertiesCount: number;
  lastLogin: string;
  appVersion: string;
  financialStatus: 'ok' | 'late' | 'overdue';
  createdAt: string;
  monthlyRevenue: number;
}

export interface PendingRequest {
  id: string;
  tenantName: string;
  tenantEmail: string;
  type: 'new_account' | 'plan_upgrade' | 'property_add';
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  details: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ip: string;
  timestamp: string;
}

export const mockTenants: Tenant[] = [
  {
    id: 't-1',
    name: 'Agropecuária São Jorge',
    cpfCnpj: '12.345.678/0001-90',
    email: 'contato@saoJorge.agro.br',
    phone: '(65) 99999-1234',
    plan: 'estancia',
    status: 'active',
    totalCattle: 5200,
    propertiesCount: 3,
    lastLogin: '2024-01-25T14:30:00Z',
    appVersion: '2.1.0',
    financialStatus: 'ok',
    createdAt: '2023-06-15',
    monthlyRevenue: 249.90,
  },
  {
    id: 't-2',
    name: 'Fazenda Primavera',
    cpfCnpj: '98.765.432/0001-10',
    email: 'admin@primavera.com',
    phone: '(65) 98888-5678',
    plan: 'retiro',
    status: 'active',
    totalCattle: 2800,
    propertiesCount: 2,
    lastLogin: '2024-01-24T09:15:00Z',
    appVersion: '2.1.0',
    financialStatus: 'ok',
    createdAt: '2023-08-20',
    monthlyRevenue: 129.90,
  },
  {
    id: 't-3',
    name: 'Rancho Bela Vista',
    cpfCnpj: '11.222.333/0001-44',
    email: 'gerencia@belavista.agro',
    phone: '(66) 97777-9012',
    plan: 'piquete',
    status: 'active',
    totalCattle: 1200,
    propertiesCount: 1,
    lastLogin: '2024-01-23T16:45:00Z',
    appVersion: '2.0.8',
    financialStatus: 'late',
    createdAt: '2023-10-05',
    monthlyRevenue: 69.90,
  },
  {
    id: 't-4',
    name: 'Sítio Boa Esperança',
    cpfCnpj: '44.555.666/0001-77',
    email: 'sitio@boaesperanca.com',
    phone: '(65) 96666-3456',
    plan: 'porteira',
    status: 'suspended',
    totalCattle: 320,
    propertiesCount: 1,
    lastLogin: '2024-01-10T11:20:00Z',
    appVersion: '2.0.5',
    financialStatus: 'overdue',
    createdAt: '2023-11-12',
    monthlyRevenue: 29.90,
  },
  {
    id: 't-5',
    name: 'Grupo Pecuária MT',
    cpfCnpj: '77.888.999/0001-00',
    email: 'financeiro@pecuariamt.com.br',
    phone: '(65) 95555-7890',
    plan: 'barao',
    status: 'active',
    totalCattle: 12500,
    propertiesCount: 8,
    lastLogin: '2024-01-25T18:00:00Z',
    appVersion: '2.1.0',
    financialStatus: 'ok',
    createdAt: '2023-03-01',
    monthlyRevenue: 399.90,
  },
];

export const mockPendingRequests: PendingRequest[] = [
  {
    id: 'req-1',
    tenantName: 'Nova Fazenda Horizonte',
    tenantEmail: 'contato@novahorizonte.agro',
    type: 'new_account',
    status: 'pending',
    requestDate: '2024-01-24',
    details: 'Solicitação de nova conta - Plano Retiro - 2500 cabeças estimadas',
  },
  {
    id: 'req-2',
    tenantName: 'Rancho Bela Vista',
    tenantEmail: 'gerencia@belavista.agro',
    type: 'plan_upgrade',
    status: 'pending',
    requestDate: '2024-01-23',
    details: 'Upgrade de Piquete para Retiro - crescimento do rebanho',
  },
  {
    id: 'req-3',
    tenantName: 'Agropecuária São Jorge',
    tenantEmail: 'contato@saoJorge.agro.br',
    type: 'property_add',
    status: 'pending',
    requestDate: '2024-01-22',
    details: 'Adicionar nova propriedade: Fazenda Serra Dourada - 800 cabeças',
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    userId: 'admin-1',
    userName: 'Admin Master',
    action: 'TENANT_APPROVED',
    details: 'Aprovado tenant: Fazenda Primavera',
    ip: '189.45.123.45',
    timestamp: '2024-01-25T14:30:00Z',
  },
  {
    id: 'log-2',
    userId: 'admin-1',
    userName: 'Admin Master',
    action: 'PLAN_CHANGED',
    details: 'Alterado plano de Sítio Boa Esperança: Porteira -> Piquete',
    ip: '189.45.123.45',
    timestamp: '2024-01-25T10:15:00Z',
  },
  {
    id: 'log-3',
    userId: 'admin-1',
    userName: 'Admin Master',
    action: 'USER_BLOCKED',
    details: 'Bloqueado usuário: joao@example.com - Inadimplência',
    ip: '189.45.123.45',
    timestamp: '2024-01-24T16:45:00Z',
  },
  {
    id: 'log-4',
    userId: 'admin-1',
    userName: 'Admin Master',
    action: 'PASSWORD_RESET',
    details: 'Reset de senha para: admin@primavera.com',
    ip: '189.45.123.45',
    timestamp: '2024-01-24T09:30:00Z',
  },
  {
    id: 'log-5',
    userId: 'admin-1',
    userName: 'Admin Master',
    action: 'IMPERSONATE',
    details: 'Impersonou usuário: Grupo Pecuária MT',
    ip: '189.45.123.45',
    timestamp: '2024-01-23T11:00:00Z',
  },
];

export function getAdminKPIs() {
  const totalTenants = mockTenants.length;
  const activeTenants = mockTenants.filter(t => t.status === 'active').length;
  const totalCattle = mockTenants.reduce((sum, t) => sum + t.totalCattle, 0);
  const mrr = mockTenants
    .filter(t => t.status === 'active')
    .reduce((sum, t) => sum + t.monthlyRevenue, 0);
  const pendingRequests = mockPendingRequests.filter(r => r.status === 'pending').length;
  const overdueCount = mockTenants.filter(t => t.financialStatus === 'overdue').length;

  return {
    totalTenants,
    activeTenants,
    totalCattle,
    mrr,
    pendingRequests,
    overdueCount,
  };
}
