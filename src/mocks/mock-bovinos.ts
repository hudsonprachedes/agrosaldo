export interface AgeGroup {
  id: string;
  label: string;
  minMonths: number;
  maxMonths: number;
}

export interface CattleBalance {
  ageGroupId: string;
  male: {
    previousBalance: number;
    entries: number;
    exits: number;
    currentBalance: number;
  };
  female: {
    previousBalance: number;
    entries: number;
    exits: number;
    currentBalance: number;
  };
}

export interface MovementRecord {
  id: string;
  type: 'birth' | 'death' | 'sale' | 'purchase' | 'vaccine' | 'adjustment';
  date: string;
  quantity: number;
  sex?: 'male' | 'female';
  ageGroupId?: string;
  description: string;
  destination?: string;
  value?: number;
  gtaNumber?: string;
  photoUrl?: string;
  cause?: string;
  propertyId: string;
  createdAt: string;
  birthDate?: string; // Data de nascimento do animal (para cálculo de faixa etária)
}

export const ageGroups: AgeGroup[] = [
  { id: '0-4', label: '0 a 4 meses', minMonths: 0, maxMonths: 4 },
  { id: '5-12', label: '5 a 12 meses', minMonths: 5, maxMonths: 12 },
  { id: '12-24', label: '12 a 24 meses', minMonths: 12, maxMonths: 24 },
  { id: '24-36', label: '24 a 36 meses', minMonths: 24, maxMonths: 36 },
  { id: '36+', label: 'Acima de 36 meses', minMonths: 36, maxMonths: Infinity },
];

export const mockCattleBalance: Record<string, CattleBalance[]> = {
  'prop-1': [
    {
      ageGroupId: '0-4',
      male: { previousBalance: 120, entries: 45, exits: 8, currentBalance: 157 },
      female: { previousBalance: 115, entries: 42, exits: 5, currentBalance: 152 },
    },
    {
      ageGroupId: '5-12',
      male: { previousBalance: 180, entries: 95, exits: 22, currentBalance: 253 },
      female: { previousBalance: 175, entries: 90, exits: 18, currentBalance: 247 },
    },
    {
      ageGroupId: '12-24',
      male: { previousBalance: 220, entries: 110, exits: 45, currentBalance: 285 },
      female: { previousBalance: 230, entries: 105, exits: 40, currentBalance: 295 },
    },
    {
      ageGroupId: '24-36',
      male: { previousBalance: 195, entries: 85, exits: 60, currentBalance: 220 },
      female: { previousBalance: 310, entries: 95, exits: 25, currentBalance: 380 },
    },
    {
      ageGroupId: '36+',
      male: { previousBalance: 85, entries: 40, exits: 15, currentBalance: 110 },
      female: { previousBalance: 225, entries: 55, exits: 20, currentBalance: 260 },
    },
  ],
  'prop-2': [
    {
      ageGroupId: '0-4',
      male: { previousBalance: 210, entries: 85, exits: 12, currentBalance: 283 },
      female: { previousBalance: 205, entries: 80, exits: 10, currentBalance: 275 },
    },
    {
      ageGroupId: '5-12',
      male: { previousBalance: 320, entries: 165, exits: 35, currentBalance: 450 },
      female: { previousBalance: 310, entries: 160, exits: 30, currentBalance: 440 },
    },
    {
      ageGroupId: '12-24',
      male: { previousBalance: 380, entries: 185, exits: 80, currentBalance: 485 },
      female: { previousBalance: 400, entries: 180, exits: 70, currentBalance: 510 },
    },
    {
      ageGroupId: '24-36',
      male: { previousBalance: 340, entries: 145, exits: 100, currentBalance: 385 },
      female: { previousBalance: 520, entries: 160, exits: 45, currentBalance: 635 },
    },
    {
      ageGroupId: '36+',
      male: { previousBalance: 150, entries: 70, exits: 25, currentBalance: 195 },
      female: { previousBalance: 385, entries: 95, exits: 35, currentBalance: 445 },
    },
  ],
  'prop-3': [
    {
      ageGroupId: '0-4',
      male: { previousBalance: 12, entries: 5, exits: 1, currentBalance: 16 },
      female: { previousBalance: 10, entries: 4, exits: 0, currentBalance: 14 },
    },
    {
      ageGroupId: '5-12',
      male: { previousBalance: 18, entries: 10, exits: 3, currentBalance: 25 },
      female: { previousBalance: 16, entries: 8, exits: 2, currentBalance: 22 },
    },
    {
      ageGroupId: '12-24',
      male: { previousBalance: 22, entries: 12, exits: 8, currentBalance: 26 },
      female: { previousBalance: 20, entries: 10, exits: 5, currentBalance: 25 },
    },
    {
      ageGroupId: '24-36',
      male: { previousBalance: 15, entries: 8, exits: 6, currentBalance: 17 },
      female: { previousBalance: 28, entries: 10, exits: 3, currentBalance: 35 },
    },
    {
      ageGroupId: '36+',
      male: { previousBalance: 5, entries: 3, exits: 1, currentBalance: 7 },
      female: { previousBalance: 12, entries: 4, exits: 2, currentBalance: 14 },
    },
  ],
};

export const mockMovements: MovementRecord[] = [
  {
    id: 'mov-1',
    type: 'birth',
    date: '2024-01-15',
    quantity: 12,
    sex: 'male',
    ageGroupId: '0-4',
    description: 'Nascimento - Lote Janeiro',
    propertyId: 'prop-1',
    createdAt: '2024-01-15T08:30:00Z',
    birthDate: '2024-01-15',
  },
  {
    id: 'mov-2',
    type: 'birth',
    date: '2024-01-15',
    quantity: 10,
    sex: 'female',
    ageGroupId: '0-4',
    description: 'Nascimento - Lote Janeiro',
    propertyId: 'prop-1',
    createdAt: '2024-01-15T08:35:00Z',
    birthDate: '2024-01-15',
  },
  {
    id: 'mov-3',
    type: 'death',
    date: '2024-01-18',
    quantity: 2,
    sex: 'male',
    ageGroupId: '0-4',
    description: 'Morte natural - Complicações pós-parto',
    cause: 'Complicações pós-parto',
    photoUrl: 'https://placeholder.com/death-1.jpg',
    propertyId: 'prop-1',
    createdAt: '2024-01-18T14:20:00Z',
  },
  {
    id: 'mov-4',
    type: 'sale',
    date: '2024-01-20',
    quantity: 45,
    ageGroupId: '24-36',
    description: 'Venda para Frigorífico JBS',
    destination: 'Frigorífico JBS - Cuiabá',
    value: 157500,
    gtaNumber: 'GTA-2024-001234',
    propertyId: 'prop-1',
    createdAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'mov-5',
    type: 'vaccine',
    date: '2024-01-22',
    quantity: 850,
    description: 'Vacinação Aftosa - Campanha Janeiro 2024',
    propertyId: 'prop-1',
    createdAt: '2024-01-22T07:00:00Z',
  },
  {
    id: 'mov-6',
    type: 'birth',
    date: '2024-01-25',
    quantity: 8,
    sex: 'female',
    ageGroupId: '0-4',
    description: 'Nascimento - Lote Janeiro B',
    propertyId: 'prop-1',
    createdAt: '2024-01-25T09:15:00Z',
    birthDate: '2024-01-25',
  },
  // Movements for prop-2 (Fazenda Ouro Verde)
  {
    id: 'mov-7',
    type: 'birth',
    date: '2024-01-12',
    quantity: 25,
    sex: 'male',
    ageGroupId: '0-4',
    description: 'Nascimento - Lote Janeiro Ouro Verde',
    propertyId: 'prop-2',
    createdAt: '2024-01-12T08:00:00Z',
    birthDate: '2024-01-12',
  },
  {
    id: 'mov-8',
    type: 'birth',
    date: '2024-01-14',
    quantity: 22,
    sex: 'female',
    ageGroupId: '0-4',
    description: 'Nascimento - Lote Janeiro Ouro Verde Fêmeas',
    propertyId: 'prop-2',
    createdAt: '2024-01-14T08:30:00Z',
    birthDate: '2024-01-14',
  },
  {
    id: 'mov-9',
    type: 'death',
    date: '2024-01-16',
    quantity: 3,
    sex: 'female',
    ageGroupId: '0-4',
    description: 'Morte natural - Doença respiratória',
    cause: 'Doença respiratória',
    photoUrl: 'https://placeholder.com/death-2.jpg',
    propertyId: 'prop-2',
    createdAt: '2024-01-16T15:45:00Z',
  },
  {
    id: 'mov-10',
    type: 'sale',
    date: '2024-01-19',
    quantity: 85,
    ageGroupId: '24-36',
    description: 'Venda para Frigorífico Marfrig',
    destination: 'Frigorífico Marfrig - Rondonópolis',
    value: 297500,
    gtaNumber: 'GTA-2024-005678',
    propertyId: 'prop-2',
    createdAt: '2024-01-19T11:30:00Z',
  },
  {
    id: 'mov-11',
    type: 'purchase',
    date: '2024-01-21',
    quantity: 120,
    ageGroupId: '12-24',
    description: 'Compra de gado de corte - Leilão',
    destination: 'Leilão Cuiabá',
    value: 480000,
    gtaNumber: 'GTA-2024-009012',
    propertyId: 'prop-2',
    createdAt: '2024-01-21T14:00:00Z',
  },
  {
    id: 'mov-12',
    type: 'vaccine',
    date: '2024-01-23',
    quantity: 1600,
    description: 'Vacinação Aftosa - Campanha Janeiro 2024',
    propertyId: 'prop-2',
    createdAt: '2024-01-23T06:30:00Z',
  },
  {
    id: 'mov-13',
    type: 'birth',
    date: '2024-01-26',
    quantity: 18,
    sex: 'male',
    ageGroupId: '0-4',
    description: 'Nascimento - Lote Fevereiro Ouro Verde',
    propertyId: 'prop-2',
    createdAt: '2024-01-26T09:45:00Z',
    birthDate: '2024-01-26',
  },
  // Movements for prop-3 (Sítio Boa Vista)
  {
    id: 'mov-14',
    type: 'birth',
    date: '2024-01-10',
    quantity: 4,
    sex: 'male',
    ageGroupId: '0-4',
    description: 'Nascimento - Lote Janeiro Boa Vista',
    propertyId: 'prop-3',
    createdAt: '2024-01-10T07:30:00Z',
    birthDate: '2024-01-10',
  },
  {
    id: 'mov-15',
    type: 'birth',
    date: '2024-01-13',
    quantity: 3,
    sex: 'female',
    ageGroupId: '0-4',
    description: 'Nascimento - Lote Janeiro Boa Vista Fêmeas',
    propertyId: 'prop-3',
    createdAt: '2024-01-13T08:00:00Z',
    birthDate: '2024-01-13',
  },
  {
    id: 'mov-16',
    type: 'death',
    date: '2024-01-17',
    quantity: 1,
    sex: 'male',
    ageGroupId: '0-4',
    description: 'Morte natural - Ataque de predador',
    cause: 'Ataque de predador',
    photoUrl: 'https://placeholder.com/death-3.jpg',
    propertyId: 'prop-3',
    createdAt: '2024-01-17T16:20:00Z',
  },
  {
    id: 'mov-17',
    type: 'sale',
    date: '2024-01-24',
    quantity: 15,
    ageGroupId: '24-36',
    description: 'Venda para Abatedouro Local',
    destination: 'Abatedouro Primavera do Leste',
    value: 52500,
    gtaNumber: 'GTA-2024-003456',
    propertyId: 'prop-3',
    createdAt: '2024-01-24T10:15:00Z',
  },
  {
    id: 'mov-18',
    type: 'vaccine',
    date: '2024-01-25',
    quantity: 65,
    description: 'Vacinação Aftosa - Campanha Janeiro 2024',
    propertyId: 'prop-3',
    createdAt: '2024-01-25T07:00:00Z',
  },
  {
    id: 'mov-19',
    type: 'purchase',
    date: '2024-01-28',
    quantity: 25,
    ageGroupId: '12-24',
    description: 'Compra de matrizes - Vizinho',
    destination: 'Fazenda Santa Maria',
    value: 87500,
    gtaNumber: 'GTA-2024-007890',
    propertyId: 'prop-3',
    createdAt: '2024-01-28T13:30:00Z',
  },
];

export function getTotalCattle(propertyId: string): number {
  const balances = mockCattleBalance[propertyId] || [];
  return balances.reduce((total, balance) => {
    return total + balance.male.currentBalance + balance.female.currentBalance;
  }, 0);
}

export function getMonthlyBirths(propertyId: string): number {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return mockMovements
    .filter(m => {
      const date = new Date(m.date);
      return (
        m.propertyId === propertyId &&
        m.type === 'birth' &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    })
    .reduce((sum, m) => sum + m.quantity, 0);
}

export function getMonthlyDeaths(propertyId: string): number {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return mockMovements
    .filter(m => {
      const date = new Date(m.date);
      return (
        m.propertyId === propertyId &&
        m.type === 'death' &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    })
    .reduce((sum, m) => sum + m.quantity, 0);
}


/**
 * Retorna movimentos de uma propriedade específica
 */
export function getMovements(propertyId: string): MovementRecord[] {
  return mockMovements.filter(m => m.propertyId === propertyId);
}

/**
 * Retorna total de fêmeas adultas (matrizes) disponíveis para reprodução
 * Considera fêmeas acima de 24 meses
 */
export function getAvailableMatrizes(propertyId: string): number {
  const balances = mockCattleBalance[propertyId] || [];
  
  // Fêmeas nas faixas 24-36 e 36+
  const mature = balances.filter(b => b.ageGroupId === '24-36' || b.ageGroupId === '36+');
  
  return mature.reduce((sum, balance) => sum + balance.female.currentBalance, 0);
}

/**
 * Interface para rastrear animais individuais com data de nascimento
 * Necessário para evolução automática de faixas etárias
 */
export interface Animal {
  id: string;
  birthDate: Date;
  sex: 'male' | 'female';
  currentAgeGroup: string;
  propertyId: string;
  movements: string[]; // IDs de movimentos relacionados
}

/**
 * Mock de animais individuais para demonstração de evolução automática
 * Em produção, isso virá do banco de dados
 */
export const mockAnimals: Animal[] = [
  {
    id: 'animal-1',
    birthDate: new Date('2024-08-15'), // ~5 meses atrás
    sex: 'male',
    currentAgeGroup: '5-12',
    propertyId: 'prop-1',
    movements: ['mov-1'],
  },
  {
    id: 'animal-2',
    birthDate: new Date('2023-01-15'), // ~1 ano atrás
    sex: 'female',
    currentAgeGroup: '12-24',
    propertyId: 'prop-1',
    movements: ['mov-2'],
  },
];

/**
 * Job automático que deve rodar diariamente para recalcular faixas etárias
 * Retorna array de animais que precisam ser movidos
 */
export function recalculateAgeGroups(propertyId?: string): {
  animalId: string;
  from: string;
  to: string;
  birthDate: Date;
}[] {
  const animals = propertyId 
    ? mockAnimals.filter(a => a.propertyId === propertyId)
    : mockAnimals;

  const updates: {
    animalId: string;
    from: string;
    to: string;
    birthDate: Date;
  }[] = [];

  animals.forEach(animal => {
    const ageInMonths = calculateAgeInMonths(animal.birthDate);
    let newAgeGroup = animal.currentAgeGroup;

    // Determinar nova faixa etária
    if (ageInMonths <= 4) newAgeGroup = '0-4';
    else if (ageInMonths <= 12) newAgeGroup = '5-12';
    else if (ageInMonths <= 24) newAgeGroup = '12-24';
    else if (ageInMonths <= 36) newAgeGroup = '24-36';
    else newAgeGroup = '36+';

    // Se mudou de faixa, adicionar ao array de updates
    if (newAgeGroup !== animal.currentAgeGroup) {
      updates.push({
        animalId: animal.id,
        from: animal.currentAgeGroup,
        to: newAgeGroup,
        birthDate: animal.birthDate,
      });
      
      // Atualizar mock (em produção, isso seria no banco)
      animal.currentAgeGroup = newAgeGroup;
    }
  });

  return updates;
}

/**
 * Calcula idade em meses de um animal
 */
function calculateAgeInMonths(birthDate: Date): number {
  const now = new Date();
  const months = (now.getFullYear() - birthDate.getFullYear()) * 12 + 
                 (now.getMonth() - birthDate.getMonth());
  return months;
}
