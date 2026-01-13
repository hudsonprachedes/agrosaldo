/**
 * Funções genéricas para CRUD de dados admin
 * Usa IndexedDB para persistência local até backend estar pronto
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AdminDB extends DBSchema {
  plans: {
    key: string;
    value: {
      id: string;
      name: string;
      price: number;
      maxCattle: number;
      features?: string[];
      active: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
  };
  clients: {
    key: string;
    value: {
      id: string;
      name: string;
      email: string;
      cpfCnpj: string;
      status: 'active' | 'inactive' | 'blocked';
      plan: string;
      properties: number;
      cattle: number;
      createdAt: Date;
      lastAccess: Date;
    };
    indexes: { 'by-status': string; 'by-plan': string };
  };
  requests: {
    key: string;
    value: {
      id: string;
      userId: string;
      userName: string;
      requestType: 'new_account' | 'plan_upgrade' | 'support' | 'data_export';
      status: 'pending' | 'approved' | 'rejected';
      description: string;
      requestedAt: Date;
      processedAt?: Date;
      processedBy?: string;
      rejectionReason?: string;
    };
    indexes: { 'by-status': string; 'by-user': string };
  };
}

const ADMIN_DB_NAME = 'agrosaldo-admin-db';
const ADMIN_DB_VERSION = 1;

let adminDbInstance: IDBPDatabase<AdminDB> | null = null;

/**
 * Inicializa e retorna instância do banco admin
 */
export async function getAdminDB(): Promise<IDBPDatabase<AdminDB>> {
  if (adminDbInstance) return adminDbInstance;

  adminDbInstance = await openDB<AdminDB>(ADMIN_DB_NAME, ADMIN_DB_VERSION, {
    upgrade(db) {
      // Store: plans
      if (!db.objectStoreNames.contains('plans')) {
        db.createObjectStore('plans', { keyPath: 'id' });
      }

      // Store: clients
      if (!db.objectStoreNames.contains('clients')) {
        const clientStore = db.createObjectStore('clients', { keyPath: 'id' });
        clientStore.createIndex('by-status', 'status');
        clientStore.createIndex('by-plan', 'plan');
      }

      // Store: requests
      if (!db.objectStoreNames.contains('requests')) {
        const requestStore = db.createObjectStore('requests', { keyPath: 'id' });
        requestStore.createIndex('by-status', 'status');
        requestStore.createIndex('by-user', 'userId');
      }
    },
  });

  return adminDbInstance;
}

// ==================== CRUD GENÉRICO ====================

/**
 * Criar ou atualizar registro
 */
export async function adminUpsert<K extends keyof AdminDB>(
  storeName: K,
  value: AdminDB[K]['value']
): Promise<void> {
  const db = await getAdminDB();
  await db.put(storeName as 'plans' | 'clients' | 'requests', value);
}

/**
 * Buscar registro por ID
 */
export async function adminGetById<K extends keyof AdminDB>(
  storeName: K,
  id: string
): Promise<AdminDB[K]['value'] | undefined> {
  const db = await getAdminDB();
  return await db.get(storeName as 'plans' | 'clients' | 'requests', id);
}

/**
 * Buscar todos os registros
 */
export async function adminGetAll<K extends keyof AdminDB>(
  storeName: K
): Promise<AdminDB[K]['value'][]> {
  const db = await getAdminDB();
  return await db.getAll(storeName as 'plans' | 'clients' | 'requests');
}

/**
 * Deletar registro
 */
export async function adminDelete<K extends keyof AdminDB>(
  storeName: K,
  id: string
): Promise<void> {
  const db = await getAdminDB();
  await db.delete(storeName as 'plans' | 'clients' | 'requests', id);
}

/**
 * Buscar por índice
 */
export async function adminGetByIndex(
  storeName: 'plans' | 'clients' | 'requests',
  indexName: string,
  query: string
): Promise<Record<string, unknown>[]> {
  const db = await getAdminDB();
  return await (db as any).getAllFromIndex(
    storeName,
    indexName,
    query
  );
}

// ==================== FUNÇÕES ESPECÍFICAS ====================

/**
 * Criar ou atualizar plano
 */
export async function savePlan(plan: Omit<AdminDB['plans']['value'], 'createdAt' | 'updatedAt'>): Promise<void> {
  const existing = await adminGetById('plans', plan.id);
  
  await adminUpsert('plans', {
    ...plan,
    createdAt: existing?.createdAt || new Date(),
    updatedAt: new Date(),
  });
}

/**
 * Bloquear/desbloquear cliente
 */
export async function toggleClientStatus(clientId: string, newStatus: 'active' | 'inactive' | 'blocked'): Promise<void> {
  const client = await adminGetById('clients', clientId);
  if (!client) throw new Error('Cliente não encontrado');

  await adminUpsert('clients', {
    ...client,
    status: newStatus,
  });
}

/**
 * Aprovar/rejeitar solicitação
 */
export async function processRequest(
  requestId: string,
  approved: boolean,
  processedBy: string,
  rejectionReason?: string
): Promise<void> {
  const request = await adminGetById('requests', requestId);
  if (!request) throw new Error('Solicitação não encontrada');

  await adminUpsert('requests', {
    ...request,
    status: approved ? 'approved' : 'rejected',
    processedAt: new Date(),
    processedBy,
    rejectionReason,
  });
}

/**
 * Resetar senha de cliente
 */
export async function resetClientPassword(clientId: string): Promise<string> {
  // Gerar senha temporária
  const tempPassword = Math.random().toString(36).substring(2, 10);
  
  // TODO: Quando backend estiver pronto, enviar email com senha temporária
  console.log(`Senha temporária para cliente ${clientId}: ${tempPassword}`);
  
  return tempPassword;
}

/**
 * Estatísticas admin
 */
export async function getAdminStats() {
  const [plans, clients, requests] = await Promise.all([
    adminGetAll('plans'),
    adminGetAll('clients'),
    adminGetAll('requests'),
  ]);

  const activePlans = plans.filter(p => p.active).length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;

  return {
    totalPlans: plans.length,
    activePlans,
    totalClients: clients.length,
    activeClients,
    blockedClients: clients.filter(c => c.status === 'blocked').length,
    totalRequests: requests.length,
    pendingRequests,
    approvedRequests: requests.filter(r => r.status === 'approved').length,
    rejectedRequests: requests.filter(r => r.status === 'rejected').length,
  };
}
