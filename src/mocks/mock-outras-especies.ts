export interface OtherSpeciesBalance {
  speciesId: string;
  speciesName: string;
  previousBalance: number;
  entries: number;
  exits: number;
  currentBalance: number;
  unit: 'cabeças' | 'unidades';
}

export interface OtherSpeciesMovement {
  id: string;
  speciesId: string;
  speciesName: string;
  type: 'birth' | 'death' | 'sale' | 'purchase' | 'adjustment';
  date: string;
  quantity: number;
  description: string;
  destination?: string;
  value?: number;
  propertyId: string;
  createdAt: string;
}

export const otherSpecies = [
  { id: 'suinos', name: 'Suínos', unit: 'cabeças' as const, icon: '🐷' },
  { id: 'aves', name: 'Aves (Frangos/Galinhas)', unit: 'unidades' as const, icon: '🐔' },
  { id: 'equinos', name: 'Equinos (Cavalos)', unit: 'cabeças' as const, icon: '🐴' },
  { id: 'caprinos', name: 'Caprinos (Cabras)', unit: 'cabeças' as const, icon: '🐐' },
  { id: 'ovinos', name: 'Ovinos (Ovelhas)', unit: 'cabeças' as const, icon: '🐑' },
];

export const mockOtherSpeciesBalance: Record<string, OtherSpeciesBalance[]> = {
  'prop-1': [
    {
      speciesId: 'suinos',
      speciesName: 'Suínos',
      previousBalance: 450,
      entries: 120,
      exits: 85,
      currentBalance: 485,
      unit: 'cabeças',
    },
    {
      speciesId: 'aves',
      speciesName: 'Aves (Frangos/Galinhas)',
      previousBalance: 2500,
      entries: 800,
      exits: 650,
      currentBalance: 2650,
      unit: 'unidades',
    },
    {
      speciesId: 'equinos',
      speciesName: 'Equinos (Cavalos)',
      previousBalance: 12,
      entries: 2,
      exits: 1,
      currentBalance: 13,
      unit: 'cabeças',
    },
    {
      speciesId: 'caprinos',
      speciesName: 'Caprinos (Cabras)',
      previousBalance: 85,
      entries: 25,
      exits: 15,
      currentBalance: 95,
      unit: 'cabeças',
    },
    {
      speciesId: 'ovinos',
      speciesName: 'Ovinos (Ovelhas)',
      previousBalance: 120,
      entries: 35,
      exits: 20,
      currentBalance: 135,
      unit: 'cabeças',
    },
  ],
  'prop-2': [
    {
      speciesId: 'suinos',
      speciesName: 'Suínos',
      previousBalance: 850,
      entries: 220,
      exits: 180,
      currentBalance: 890,
      unit: 'cabeças',
    },
    {
      speciesId: 'aves',
      speciesName: 'Aves (Frangos/Galinhas)',
      previousBalance: 5200,
      entries: 1500,
      exits: 1200,
      currentBalance: 5500,
      unit: 'unidades',
    },
    {
      speciesId: 'equinos',
      speciesName: 'Equinos (Cavalos)',
      previousBalance: 8,
      entries: 1,
      exits: 0,
      currentBalance: 9,
      unit: 'cabeças',
    },
    {
      speciesId: 'caprinos',
      speciesName: 'Caprinos (Cabras)',
      previousBalance: 0,
      entries: 0,
      exits: 0,
      currentBalance: 0,
      unit: 'cabeças',
    },
    {
      speciesId: 'ovinos',
      speciesName: 'Ovinos (Ovelhas)',
      previousBalance: 45,
      entries: 15,
      exits: 10,
      currentBalance: 50,
      unit: 'cabeças',
    },
  ],
  'prop-3': [
    {
      speciesId: 'suinos',
      speciesName: 'Suínos',
      previousBalance: 0,
      entries: 0,
      exits: 0,
      currentBalance: 0,
      unit: 'cabeças',
    },
    {
      speciesId: 'aves',
      speciesName: 'Aves (Frangos/Galinhas)',
      previousBalance: 150,
      entries: 50,
      exits: 30,
      currentBalance: 170,
      unit: 'unidades',
    },
    {
      speciesId: 'equinos',
      speciesName: 'Equinos (Cavalos)',
      previousBalance: 4,
      entries: 0,
      exits: 0,
      currentBalance: 4,
      unit: 'cabeças',
    },
    {
      speciesId: 'caprinos',
      speciesName: 'Caprinos (Cabras)',
      previousBalance: 25,
      entries: 8,
      exits: 5,
      currentBalance: 28,
      unit: 'cabeças',
    },
    {
      speciesId: 'ovinos',
      speciesName: 'Ovinos (Ovelhas)',
      previousBalance: 0,
      entries: 0,
      exits: 0,
      currentBalance: 0,
      unit: 'cabeças',
    },
  ],
};

export const mockOtherSpeciesMovements: OtherSpeciesMovement[] = [
  // Suínos - Propriedade 1
  {
    id: 'other-mov-1',
    speciesId: 'suinos',
    speciesName: 'Suínos',
    type: 'birth',
    date: '2024-01-15',
    quantity: 45,
    description: 'Nascimento - Lote Janeiro',
    propertyId: 'prop-1',
    createdAt: '2024-01-15T08:30:00Z',
  },
  {
    id: 'other-mov-2',
    speciesId: 'suinos',
    speciesName: 'Suínos',
    type: 'sale',
    date: '2024-01-20',
    quantity: 85,
    description: 'Venda para Frigorífico',
    destination: 'Frigorífico Bertioga',
    value: 85000,
    propertyId: 'prop-1',
    createdAt: '2024-01-20T10:00:00Z',
  },
  // Aves - Propriedade 1
  {
    id: 'other-mov-3',
    speciesId: 'aves',
    speciesName: 'Aves (Frangos/Galinhas)',
    type: 'purchase',
    date: '2024-01-12',
    quantity: 500,
    description: 'Compra de pintos de um dia',
    destination: 'Incubatório Avícola',
    value: 15000,
    propertyId: 'prop-1',
    createdAt: '2024-01-12T14:00:00Z',
  },
  {
    id: 'other-mov-4',
    speciesId: 'aves',
    speciesName: 'Aves (Frangos/Galinhas)',
    type: 'sale',
    date: '2024-01-25',
    quantity: 650,
    description: 'Venda para abate',
    destination: 'Abatedouro Avícola',
    value: 32500,
    propertyId: 'prop-1',
    createdAt: '2024-01-25T09:00:00Z',
  },
  // Equinos - Propriedade 1
  {
    id: 'other-mov-5',
    speciesId: 'equinos',
    speciesName: 'Equinos (Cavalos)',
    type: 'purchase',
    date: '2024-01-18',
    quantity: 2,
    description: 'Compra de cavalos de trabalho',
    destination: 'Haras Santa Cruz',
    value: 24000,
    propertyId: 'prop-1',
    createdAt: '2024-01-18T11:00:00Z',
  },
  // Suínos - Propriedade 2
  {
    id: 'other-mov-6',
    speciesId: 'suinos',
    speciesName: 'Suínos',
    type: 'birth',
    date: '2024-01-14',
    quantity: 85,
    description: 'Nascimento - Lote Janeiro',
    propertyId: 'prop-2',
    createdAt: '2024-01-14T07:30:00Z',
  },
  {
    id: 'other-mov-7',
    speciesId: 'suinos',
    speciesName: 'Suínos',
    type: 'sale',
    date: '2024-01-22',
    quantity: 180,
    description: 'Venda para Frigorífico',
    destination: 'Frigorífico Sadia',
    value: 180000,
    propertyId: 'prop-2',
    createdAt: '2024-01-22T15:30:00Z',
  },
  // Aves - Propriedade 2
  {
    id: 'other-mov-8',
    speciesId: 'aves',
    speciesName: 'Aves (Frangos/Galinhas)',
    type: 'purchase',
    date: '2024-01-10',
    quantity: 1000,
    description: 'Compra de pintos de um dia',
    destination: 'Incubatório Avícola São Paulo',
    value: 30000,
    propertyId: 'prop-2',
    createdAt: '2024-01-10T13:00:00Z',
  },
  {
    id: 'other-mov-9',
    speciesId: 'aves',
    speciesName: 'Aves (Frangos/Galinhas)',
    type: 'sale',
    date: '2024-01-28',
    quantity: 1200,
    description: 'Venda para abate',
    destination: 'Abatedouro BRF',
    value: 60000,
    propertyId: 'prop-2',
    createdAt: '2024-01-28T10:30:00Z',
  },
  // Caprinos - Propriedade 3
  {
    id: 'other-mov-10',
    speciesId: 'caprinos',
    speciesName: 'Caprinos (Cabras)',
    type: 'birth',
    date: '2024-01-16',
    quantity: 8,
    description: 'Nascimento - Cabritos',
    propertyId: 'prop-3',
    createdAt: '2024-01-16T08:00:00Z',
  },
  {
    id: 'other-mov-11',
    speciesId: 'caprinos',
    speciesName: 'Caprinos (Cabras)',
    type: 'sale',
    date: '2024-01-24',
    quantity: 5,
    description: 'Venda para reprodução',
    destination: 'Propriedade vizinha',
    value: 7500,
    propertyId: 'prop-3',
    createdAt: '2024-01-24T14:00:00Z',
  },
];

export function getTotalOtherSpecies(propertyId: string): number {
  const balances = mockOtherSpeciesBalance[propertyId] || [];
  return balances.reduce((total, balance) => total + balance.currentBalance, 0);
}

export function getOtherSpeciesMovements(propertyId: string): OtherSpeciesMovement[] {
  return mockOtherSpeciesMovements.filter(m => m.propertyId === propertyId);
}

export function getMonthlyOtherSpeciesEntries(propertyId: string): number {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return mockOtherSpeciesMovements
    .filter(m => {
      const date = new Date(m.date);
      return (
        m.propertyId === propertyId &&
        (m.type === 'birth' || m.type === 'purchase') &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    })
    .reduce((sum, m) => sum + m.quantity, 0);
}

export function getMonthlyOtherSpeciesExits(propertyId: string): number {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return mockOtherSpeciesMovements
    .filter(m => {
      const date = new Date(m.date);
      return (
        m.propertyId === propertyId &&
        (m.type === 'death' || m.type === 'sale') &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    })
    .reduce((sum, m) => sum + m.quantity, 0);
}
