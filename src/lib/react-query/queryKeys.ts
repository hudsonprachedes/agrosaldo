export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
    preferences: (propertyId: string) => ['auth', 'preferences', propertyId] as const,
  },
  properties: {
    all: ['properties'] as const,
    one: (id: string) => ['properties', id] as const,
    mine: ['properties', 'mine'] as const,
  },
  plans: {
    catalog: ['plans', 'catalog'] as const,
  },
  subscription: {
    mine: ['subscription', 'mine'] as const,
    paymentsMine: ['subscription', 'payments', 'mine'] as const,
  },
  livestock: {
    mirror: (propertyId: string, months: number) => ['livestock', 'mirror', propertyId, months] as const,
    otherSpecies: (propertyId: string, months: number) =>
      ['livestock', 'other-species', propertyId, months] as const,
    balance: (propertyId: string) => ['livestock', 'balance', propertyId] as const,
    history: (propertyId: string, months?: number) => ['livestock', 'history', propertyId, months ?? null] as const,
    summary: (propertyId: string) => ['livestock', 'summary', propertyId] as const,
  },
  movements: {
    all: (propertyId: string, filters?: Record<string, unknown>) =>
      ['movements', 'all', propertyId, filters ?? null] as const,
    one: (id: string) => ['movements', 'one', id] as const,
    history: (propertyId: string, months?: number) => ['movements', 'history', propertyId, months ?? null] as const,
    launchSummary: (propertyId: string) => ['movements', 'launch-summary', propertyId] as const,
    extract: (propertyId: string, params: Record<string, unknown>) =>
      ['movements', 'extract', propertyId, params] as const,
  },
  admin: {
    dashboard: ['admin', 'dashboard'] as const,
    audit: (filters?: Record<string, unknown>) => ['admin', 'audit', filters ?? null] as const,
    tenants: ['admin', 'tenants'] as const,
    pendingUsers: ['admin', 'pending-users'] as const,
    solicitations: ['admin', 'solicitations'] as const,
    plans: ['admin', 'plans'] as const,
    coupons: ['admin', 'coupons'] as const,
    referrers: ['admin', 'referrers'] as const,
    communications: ['admin', 'communications'] as const,
    regulations: ['admin', 'regulations'] as const,
    payments: ['admin', 'payments'] as const,
    pixConfig: ['admin', 'pix-config'] as const,
    companySettings: ['admin', 'company-settings'] as const,
  },
};
