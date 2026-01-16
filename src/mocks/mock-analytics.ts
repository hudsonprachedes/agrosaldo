export interface MonthlyData {
  month: string;
  year: number;
  totalCattle: number;
  births: number;
  deaths: number;
  sales: number;
  purchases: number;
  vaccinations: number;
}

export interface ComplianceData {
  category: string;
  percentage: number;
  status: 'ok' | 'warning' | 'error';
}

export const mockAnalyticsData: Record<string, MonthlyData[]> = {
  'prop-1': [
    { month: 'Fev', year: 2023, totalCattle: 2050, births: 35, deaths: 8, sales: 45, purchases: 0, vaccinations: 0 },
    { month: 'Mar', year: 2023, totalCattle: 2032, births: 28, deaths: 6, sales: 40, purchases: 0, vaccinations: 850 },
    { month: 'Abr', year: 2023, totalCattle: 2014, births: 22, deaths: 5, sales: 35, purchases: 0, vaccinations: 0 },
    { month: 'Mai', year: 2023, totalCattle: 1996, births: 30, deaths: 7, sales: 41, purchases: 0, vaccinations: 0 },
    { month: 'Jun', year: 2023, totalCattle: 1978, births: 25, deaths: 4, sales: 39, purchases: 0, vaccinations: 0 },
    { month: 'Jul', year: 2023, totalCattle: 1960, births: 18, deaths: 6, sales: 30, purchases: 0, vaccinations: 0 },
    { month: 'Ago', year: 2023, totalCattle: 1942, births: 32, deaths: 5, sales: 45, purchases: 0, vaccinations: 1800 },
    { month: 'Set', year: 2023, totalCattle: 1924, births: 28, deaths: 8, sales: 38, purchases: 0, vaccinations: 0 },
    { month: 'Out', year: 2023, totalCattle: 1906, births: 45, deaths: 6, sales: 57, purchases: 0, vaccinations: 0 },
    { month: 'Nov', year: 2023, totalCattle: 1888, births: 52, deaths: 7, sales: 63, purchases: 0, vaccinations: 0 },
    { month: 'Dez', year: 2023, totalCattle: 1870, births: 48, deaths: 5, sales: 61, purchases: 0, vaccinations: 0 },
    { month: 'Jan', year: 2024, totalCattle: 2340, births: 87, deaths: 10, sales: 45, purchases: 438, vaccinations: 2200 },
  ],
  'prop-2': [
    { month: 'Fev', year: 2023, totalCattle: 4200, births: 65, deaths: 12, sales: 85, purchases: 0, vaccinations: 0 },
    { month: 'Mar', year: 2023, totalCattle: 4168, births: 55, deaths: 10, sales: 77, purchases: 0, vaccinations: 1650 },
    { month: 'Abr', year: 2023, totalCattle: 4136, births: 48, deaths: 8, sales: 72, purchases: 0, vaccinations: 0 },
    { month: 'Mai', year: 2023, totalCattle: 4104, births: 58, deaths: 11, sales: 79, purchases: 0, vaccinations: 0 },
    { month: 'Jun', year: 2023, totalCattle: 4072, births: 42, deaths: 7, sales: 67, purchases: 0, vaccinations: 0 },
    { month: 'Jul', year: 2023, totalCattle: 4040, births: 38, deaths: 9, sales: 61, purchases: 0, vaccinations: 0 },
    { month: 'Ago', year: 2023, totalCattle: 4008, births: 62, deaths: 8, sales: 86, purchases: 0, vaccinations: 3800 },
    { month: 'Set', year: 2023, totalCattle: 3976, births: 55, deaths: 12, sales: 75, purchases: 0, vaccinations: 0 },
    { month: 'Out', year: 2023, totalCattle: 3944, births: 78, deaths: 10, sales: 100, purchases: 0, vaccinations: 0 },
    { month: 'Nov', year: 2023, totalCattle: 3912, births: 92, deaths: 11, sales: 113, purchases: 0, vaccinations: 0 },
    { month: 'Dez', year: 2023, totalCattle: 3880, births: 85, deaths: 9, sales: 108, purchases: 0, vaccinations: 0 },
    { month: 'Jan', year: 2024, totalCattle: 4520, births: 165, deaths: 18, sales: 95, purchases: 588, vaccinations: 4200 },
  ],
  'prop-3': [
    { month: 'Fev', year: 2023, totalCattle: 165, births: 4, deaths: 1, sales: 5, purchases: 0, vaccinations: 0 },
    { month: 'Mar', year: 2023, totalCattle: 163, births: 3, deaths: 0, sales: 5, purchases: 0, vaccinations: 150 },
    { month: 'Abr', year: 2023, totalCattle: 161, births: 2, deaths: 1, sales: 3, purchases: 0, vaccinations: 0 },
    { month: 'Mai', year: 2023, totalCattle: 159, births: 4, deaths: 0, sales: 6, purchases: 0, vaccinations: 0 },
    { month: 'Jun', year: 2023, totalCattle: 157, births: 3, deaths: 1, sales: 4, purchases: 0, vaccinations: 0 },
    { month: 'Jul', year: 2023, totalCattle: 155, births: 2, deaths: 0, sales: 4, purchases: 0, vaccinations: 0 },
    { month: 'Ago', year: 2023, totalCattle: 153, births: 5, deaths: 1, sales: 4, purchases: 0, vaccinations: 145 },
    { month: 'Set', year: 2023, totalCattle: 153, births: 3, deaths: 0, sales: 3, purchases: 0, vaccinations: 0 },
    { month: 'Out', year: 2023, totalCattle: 153, births: 6, deaths: 1, sales: 5, purchases: 0, vaccinations: 0 },
    { month: 'Nov', year: 2023, totalCattle: 153, births: 5, deaths: 0, sales: 5, purchases: 0, vaccinations: 0 },
    { month: 'Dez', year: 2023, totalCattle: 153, births: 4, deaths: 1, sales: 3, purchases: 0, vaccinations: 0 },
    { month: 'Jan', year: 2024, totalCattle: 180, births: 9, deaths: 1, sales: 4, purchases: 23, vaccinations: 175 },
  ],
};

export const mockComplianceData: Record<string, ComplianceData[]> = {
  'prop-1': [
    { category: 'Vacinação Aftosa', percentage: 98, status: 'ok' },
    { category: 'Brucelose', percentage: 95, status: 'ok' },
    { category: 'Tuberculose', percentage: 88, status: 'warning' },
    { category: 'Raiva', percentage: 100, status: 'ok' },
  ],
  'prop-2': [
    { category: 'Vacinação Aftosa', percentage: 100, status: 'ok' },
    { category: 'Brucelose', percentage: 92, status: 'ok' },
    { category: 'Tuberculose', percentage: 75, status: 'error' },
    { category: 'Raiva', percentage: 100, status: 'ok' },
  ],
  'prop-3': [
    { category: 'Vacinação Aftosa', percentage: 100, status: 'ok' },
    { category: 'Brucelose', percentage: 100, status: 'ok' },
    { category: 'Tuberculose', percentage: 100, status: 'ok' },
    { category: 'Raiva', percentage: 100, status: 'ok' },
  ],
};

export function getAgeDistribution(propertyId: string): { label: string; male: number; female: number }[] {
  const balanceData: Record<string, { male: number; female: number }[]> = {
    'prop-1': [
      { male: 157, female: 152 },
      { male: 253, female: 247 },
      { male: 285, female: 295 },
      { male: 220, female: 380 },
      { male: 110, female: 260 },
    ],
    'prop-2': [
      { male: 283, female: 275 },
      { male: 450, female: 440 },
      { male: 485, female: 510 },
      { male: 385, female: 635 },
      { male: 195, female: 445 },
    ],
    'prop-3': [
      { male: 16, female: 14 },
      { male: 25, female: 22 },
      { male: 26, female: 25 },
      { male: 17, female: 35 },
      { male: 7, female: 14 },
    ],
  };

  const labels = ['0-4m', '5-12m', '12-24m', '24-36m', '>36m'];
  const data = balanceData[propertyId] || balanceData['prop-1'];

  return data.map((d, i) => ({
    label: labels[i],
    male: d.male,
    female: d.female,
  }));
}
