export type PlanId = 'porteira' | 'piquete' | 'retiro' | 'estancia' | 'barao';

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  maxCattle: number;
  color: string;
};

export const plans: Plan[] = [
  { id: 'porteira', name: 'Porteira', price: 49.9, maxCattle: 500, color: 'hsl(142, 76%, 36%)' },
  { id: 'piquete', name: 'Piquete', price: 99.9, maxCattle: 1000, color: 'hsl(200, 80%, 50%)' },
  { id: 'retiro', name: 'Retiro', price: 149.9, maxCattle: 2000, color: 'hsl(43, 96%, 56%)' },
  { id: 'estancia', name: 'Estância', price: 249.9, maxCattle: 3000, color: 'hsl(280, 60%, 50%)' },
  { id: 'barao', name: 'Barão', price: 499.9, maxCattle: Infinity, color: 'hsl(20, 80%, 50%)' },
];

export function determineUserPlan(totalCattle: number): Plan {
  const sortedPlans = [...plans].sort((a, b) => a.maxCattle - b.maxCattle);

  for (const plan of sortedPlans) {
    if (totalCattle <= plan.maxCattle) {
      return plan;
    }
  }

  return sortedPlans[sortedPlans.length - 1];
}
