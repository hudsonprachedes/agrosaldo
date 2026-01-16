export interface User {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  nickname?: string;
  cep?: string;
  address?: string;
  city?: string;
  uf?: string;
  password?: string;
  role: 'super_admin' | 'owner' | 'manager' | 'operator';
  status?: 'active' | 'pending_approval' | 'suspended';
  avatar?: string;
  properties: Property[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Property {
  id: string;
  name: string;
  cep?: string;
  accessRoute?: string;
  community?: string;
  city: string;
  state: string;
  totalArea: number;
  cultivatedArea: number;
  naturalArea: number;
  pastureNaturalHa?: number;
  pastureCultivatedHa?: number;
  areaTotalHa?: number;
  cattleCount: number;
  status: 'active' | 'pending' | 'suspended';
  plan: 'porteira' | 'piquete' | 'retiro' | 'estancia' | 'barao';
  speciesEnabled?: { bovino: boolean; bubalino: boolean };
  stateRegistration?: string; // Inscrição Estadual
  propertyCode?: string; // Código da Propriedade
}

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@fazendaexemplo.com',
    cpfCnpj: '123.456.789-00',
    phone: '(65) 98765-4321',
    nickname: 'João',
    cep: '78000-000',
    address: 'Rua das Flores, 123',
    city: 'Cuiabá',
    uf: 'MT',
    role: 'owner',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joao',
    properties: [
      {
        id: 'prop-1',
        name: 'Fazenda Santa Rita',
        cep: '78000-000',
        accessRoute: 'BR-163',
        community: 'Santa Rita',
        city: 'Cuiabá',
        state: 'MT',
        totalArea: 1500,
        cultivatedArea: 800,
        naturalArea: 700,
        pastureNaturalHa: 700,
        pastureCultivatedHa: 800,
        areaTotalHa: 1500,
        cattleCount: 2340,
        status: 'active',
        plan: 'retiro',
        speciesEnabled: { bovino: true, bubalino: false },
      },
      {
        id: 'prop-2',
        name: 'Fazenda Ouro Verde',
        cep: '78500-000',
        accessRoute: 'BR-364',
        community: 'Ouro Verde',
        city: 'Rondonópolis',
        state: 'MT',
        totalArea: 3200,
        cultivatedArea: 2000,
        naturalArea: 1200,
        pastureNaturalHa: 1200,
        pastureCultivatedHa: 2000,
        areaTotalHa: 3200,
        cattleCount: 4520,
        status: 'active',
        plan: 'estancia',
        speciesEnabled: { bovino: true, bubalino: true },
      },
      {
        id: 'prop-3',
        name: 'Sítio Boa Vista',
        cep: '78850-000',
        accessRoute: 'MT-100',
        community: 'Boa Vista',
        city: 'Primavera do Leste',
        state: 'MT',
        totalArea: 200,
        cultivatedArea: 150,
        naturalArea: 50,
        pastureNaturalHa: 50,
        pastureCultivatedHa: 150,
        areaTotalHa: 200,
        cattleCount: 180,
        status: 'active',
        plan: 'porteira',
        speciesEnabled: { bovino: true, bubalino: false },
      },
    ],
  },
  {
    id: 'admin-1',
    name: 'Admin Master',
    email: 'admin@agrosaldo.com',
    cpfCnpj: '00.000.000/0001-00',
    role: 'super_admin',
    properties: [],
  },
];

export const mockCredentials = [
  { cpfCnpj: '123.456.789-00', password: '123456', userId: '1' },
  { cpfCnpj: '12345678900', password: '123456', userId: '1' },
  { cpfCnpj: '00.000.000/0001-00', password: 'admin123', userId: 'admin-1' },
  { cpfCnpj: '00000000000100', password: 'admin123', userId: 'admin-1' },
];

export const plans = [
  { id: 'porteira', name: 'Porteira', price: 49.90, maxCattle: 500, color: 'hsl(142, 76%, 36%)' },
  { id: 'piquete', name: 'Piquete', price: 99.90, maxCattle: 1000, color: 'hsl(200, 80%, 50%)' },
  { id: 'retiro', name: 'Retiro', price: 149.90, maxCattle: 2000, color: 'hsl(43, 96%, 56%)' },
  { id: 'estancia', name: 'Estância', price: 249.90, maxCattle: 3000, color: 'hsl(280, 60%, 50%)' },
  { id: 'barao', name: 'Barão', price: 499.90, maxCattle: Infinity, color: 'hsl(20, 80%, 50%)' },
];

export function authenticateUser(cpfCnpj: string, password: string): User | null {
  const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');
  const credential = mockCredentials.find(
    c => c.cpfCnpj.replace(/\D/g, '') === cleanCpfCnpj && c.password === password
  );
  
  if (credential) {
    return mockUsers.find(u => u.id === credential.userId) || null;
  }
  return null;
}

export function determineUserPlan(totalCattle: number): typeof plans[0] {
  // Find the appropriate plan based on total cattle count
  // Plans are ordered by maxCattle capacity, so we find the first one that fits
  const sortedPlans = [...plans].sort((a, b) => a.maxCattle - b.maxCattle);
  
  for (const plan of sortedPlans) {
    if (totalCattle <= plan.maxCattle) {
      return plan;
    }
  }
  
  // If no plan fits, return the highest tier plan
  return sortedPlans[sortedPlans.length - 1];
}

export function getUserTotalCattle(user: User): number {
  return user.properties.reduce((total, property) => total + property.cattleCount, 0);
}

export function getUserPlan(user: User): typeof plans[0] {
  const totalCattle = getUserTotalCattle(user);
  return determineUserPlan(totalCattle);
}
