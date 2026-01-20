import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  Calculator,
  ChevronRight,
  RotateCw,
  Scale,
  TrendingUp,
  Beef,
  Truck,
  Pill,
  Sprout,
  PiggyBank,
  Skull,
  CalendarClock,
} from 'lucide-react';

type CalculatorId =
  | 'peso_perimetro_comprimento'
  | 'peso_perimetro'
  | 'gmd'
  | 'conversao_alimentar'
  | 'conversao_arroba_kg'
  | 'rendimento_carcaca'
  | 'capacidade_suporte'
  | 'dosagem_vermifugo'
  | 'custo_por_animal'
  | 'mortalidade_impacto'
  | 'iep'
  | 'loteamento';

type CalcResult = {
  titulo: string;
  calculoFinal: string;
  formulaAplicada: string;
  passos: string[];
  interpretacao: string;
  observacoes: string[];
  margemErro?: string;
};

type CalcDefinition = {
  id: CalculatorId;
  titulo: string;
  descricao: string;
  categoria: 'Pesagem & Carcaça' | 'Desempenho & Sanidade' | 'Gestão & Logística';
  icon: React.ComponentType<{ className?: string }>;
};

const calculators: CalcDefinition[] = [
  {
    id: 'peso_perimetro_comprimento',
    titulo: 'Peso — Perímetro + Comprimento',
    descricao: 'Estimativa de peso vivo usando fita e medida do corpo.',
    categoria: 'Pesagem & Carcaça',
    icon: Scale,
  },
  {
    id: 'peso_perimetro',
    titulo: 'Peso — Apenas Perímetro Torácico',
    descricao: 'Estimativa rápida usando apenas a fita no tórax.',
    categoria: 'Pesagem & Carcaça',
    icon: Scale,
  },
  {
    id: 'rendimento_carcaca',
    titulo: 'Rendimento de Carcaça',
    descricao: 'Estimativa de peso de carcaça com base no rendimento (%).',
    categoria: 'Pesagem & Carcaça',
    icon: Beef,
  },
  {
    id: 'gmd',
    titulo: 'GMD (Ganho Médio Diário)',
    descricao: 'Ganho de peso por dia (kg/dia).',
    categoria: 'Desempenho & Sanidade',
    icon: TrendingUp,
  },
  {
    id: 'conversao_alimentar',
    titulo: 'Conversão Alimentar (CA)',
    descricao: 'Eficiência: consumo de MS por kg de ganho.',
    categoria: 'Desempenho & Sanidade',
    icon: RotateCw,
  },
  {
    id: 'dosagem_vermifugo',
    titulo: 'Dosagem de Vermífugo',
    descricao: 'Cálculo de dose (mL) a partir do peso e rótulo.',
    categoria: 'Desempenho & Sanidade',
    icon: Pill,
  },
  {
    id: 'conversao_arroba_kg',
    titulo: 'Conversão @ ↔ kg',
    descricao: '1 arroba = 15 kg.',
    categoria: 'Gestão & Logística',
    icon: Calculator,
  },
  {
    id: 'capacidade_suporte',
    titulo: 'Capacidade de Suporte do Pasto',
    descricao: 'Estimativa de lotação a partir de produção de MS.',
    categoria: 'Gestão & Logística',
    icon: Sprout,
  },
  {
    id: 'custo_por_animal',
    titulo: 'Custo de Produção por Animal',
    descricao: 'Divide custos totais pelo número de animais.',
    categoria: 'Gestão & Logística',
    icon: PiggyBank,
  },
  {
    id: 'mortalidade_impacto',
    titulo: 'Mortalidade + Impacto Financeiro',
    descricao: 'Impacto financeiro: mortes × valor médio por cabeça.',
    categoria: 'Gestão & Logística',
    icon: Skull,
  },
  {
    id: 'iep',
    titulo: 'Intervalo Entre Partos (IEP)',
    descricao: 'Diferença entre datas de parto (em meses).',
    categoria: 'Gestão & Logística',
    icon: CalendarClock,
  },
  {
    id: 'loteamento',
    titulo: 'Loteamento / Divisão de Caminhões',
    descricao: 'Distribui animais em caminhões de forma equilibrada.',
    categoria: 'Gestão & Logística',
    icon: Truck,
  },
];

function parseNumber(value: string): number | null {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return n;
}

function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatCurrency(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function diffMonths(older: Date, newer: Date): number {
  const ms = newer.getTime() - older.getTime();
  const days = ms / (1000 * 60 * 60 * 24);
  return days / 30.4375;
}

function calcPesoPerimetroComprimento(perimetroCm: number, comprimentoCm: number): CalcResult {
  const peso = (perimetroCm ** 2 * comprimentoCm) / 10840;
  const margem = peso * 0.07;
  return {
    titulo: 'Peso estimado (Perímetro + Comprimento)',
    calculoFinal: `${formatNumber(peso, 1)} kg (≈ ${formatNumber(peso - margem, 1)} a ${formatNumber(peso + margem, 1)} kg)`,
    formulaAplicada: 'Peso (kg) = (Perímetro² × Comprimento) / 10840',
    passos: [
      `Perímetro = ${formatNumber(perimetroCm, 0)} cm`,
      `Comprimento = ${formatNumber(comprimentoCm, 0)} cm`,
      `Peso = (${formatNumber(perimetroCm, 0)}² × ${formatNumber(comprimentoCm, 0)}) / 10840 = ${formatNumber(peso, 1)} kg`,
    ],
    interpretacao: 'Esse valor é uma estimativa de peso vivo para manejo (dose, venda, metas de ganho).',
    observacoes: [
      'Meça o perímetro torácico logo atrás da paleta, com a fita justa (sem apertar).',
      'O comprimento deve seguir do ponto do ombro até a ponta da garupa (conforme seu padrão de campo).',
      'Em animais muito gordos ou muito magros, a estimativa pode variar.',
    ],
    margemErro: 'Margem típica de erro (estimativa por medidas): ~±7% (pode variar por raça, condição corporal e técnica de medição).',
  };
}

function calcPesoPerimetro(perimetroCm: number): CalcResult {
  const perimetroM = perimetroCm / 100;
  const peso = 88.4 * (perimetroM ** 2) - 28;
  const margem = Math.abs(peso) * 0.08;
  return {
    titulo: 'Peso estimado (Apenas Perímetro)',
    calculoFinal: `${formatNumber(peso, 1)} kg (≈ ${formatNumber(peso - margem, 1)} a ${formatNumber(peso + margem, 1)} kg)`,
    formulaAplicada: 'Peso (kg) = 88,4 × (Perímetro em metros)² − 28',
    passos: [
      `Perímetro = ${formatNumber(perimetroCm, 0)} cm = ${formatNumber(perimetroM, 2)} m`,
      `Peso = 88,4 × (${formatNumber(perimetroM, 2)}²) − 28 = ${formatNumber(peso, 1)} kg`,
    ],
    interpretacao: 'Boa para estimativa rápida em rotina. Use como referência para manejo e decisões no curral.',
    observacoes: [
      'Se o peso estimado ficar muito baixo/alto para a categoria, confira se a fita estava nivelada e na posição correta.',
      'Em bezerros muito jovens, a precisão tende a cair.',
    ],
    margemErro: 'Margem típica de erro: ~±8% (depende do biotipo e da consistência da medida).',
  };
}

function calcGmd(pesoInicialKg: number, pesoFinalKg: number, dias: number): CalcResult {
  const gmd = (pesoFinalKg - pesoInicialKg) / dias;
  return {
    titulo: 'GMD (Ganho Médio Diário)',
    calculoFinal: `${formatNumber(gmd, 3)} kg/dia`,
    formulaAplicada: 'GMD = (Peso final − Peso inicial) ÷ Número de dias',
    passos: [
      `Peso inicial = ${formatNumber(pesoInicialKg, 1)} kg`,
      `Peso final = ${formatNumber(pesoFinalKg, 1)} kg`,
      `Dias = ${formatNumber(dias, 0)}`,
      `GMD = (${formatNumber(pesoFinalKg, 1)} − ${formatNumber(pesoInicialKg, 1)}) ÷ ${formatNumber(dias, 0)} = ${formatNumber(gmd, 3)} kg/dia`,
    ],
    interpretacao:
      gmd >= 0.8
        ? 'GMD alto: indica bom desempenho (confira se dieta, sanidade e manejo estão consistentes).'
        : gmd >= 0.4
          ? 'GMD moderado: pode ser adequado dependendo do sistema (pasto, suplementação, fase).'
          : 'GMD baixo: vale investigar dieta, oferta de pasto, lotação, sanidade e estresse.',
    observacoes: [
      'Para comparar lotes, use o mesmo método de pesagem e intervalos parecidos.',
      'Se houve jejum diferente entre pesagens, o GMD pode ficar distorcido.',
    ],
  };
}

function calcConversaoAlimentar(consumoMsKgDia: number, gmdKgDia: number): CalcResult {
  const ca = consumoMsKgDia / gmdKgDia;
  return {
    titulo: 'Conversão Alimentar (CA)',
    calculoFinal: `${formatNumber(ca, 2)} kg MS / kg ganho`,
    formulaAplicada: 'CA = Consumo de matéria seca ÷ GMD',
    passos: [
      `Consumo MS = ${formatNumber(consumoMsKgDia, 2)} kg/dia`,
      `GMD = ${formatNumber(gmdKgDia, 3)} kg/dia`,
      `CA = ${formatNumber(consumoMsKgDia, 2)} ÷ ${formatNumber(gmdKgDia, 3)} = ${formatNumber(ca, 2)}`,
    ],
    interpretacao:
      ca <= 6
        ? 'CA baixa (melhor eficiência): bom aproveitamento da dieta.'
        : ca <= 8
          ? 'CA intermediária: pode estar ok dependendo do sistema e categoria.'
          : 'CA alta (pior eficiência): revise dieta, desperdício, sanidade e conforto.',
    observacoes: [
      'Use consumo de matéria seca (MS), não matéria natural.',
      'Se o GMD for baixo por estresse/sanidade, a CA piora mesmo com boa dieta.',
    ],
  };
}

function calcConversaoArrobaKg(valor: number, direcao: 'arroba_para_kg' | 'kg_para_arroba'): CalcResult {
  const fator = 15;
  const convertido = direcao === 'arroba_para_kg' ? valor * fator : valor / fator;
  return {
    titulo: 'Conversão @ ↔ kg',
    calculoFinal: direcao === 'arroba_para_kg'
      ? `${formatNumber(convertido, 2)} kg`
      : `${formatNumber(convertido, 2)} @`,
    formulaAplicada: '1 arroba = 15 kg',
    passos: [
      direcao === 'arroba_para_kg'
        ? `kg = @ × 15 = ${formatNumber(valor, 2)} × 15 = ${formatNumber(convertido, 2)} kg`
        : `@ = kg ÷ 15 = ${formatNumber(valor, 2)} ÷ 15 = ${formatNumber(convertido, 2)} @`,
    ],
    interpretacao: 'Use para padronizar cotações e metas (compra/venda) entre arroba e quilo.',
    observacoes: ['Se sua região trabalhar com arroba diferente por costume, ajuste a referência antes de padronizar.'],
  };
}

function calcRendimentoCarcaca(pesoVivoKg: number, rendimentoPercent: number): CalcResult {
  const carcaca = pesoVivoKg * (rendimentoPercent / 100);
  return {
    titulo: 'Rendimento de Carcaça',
    calculoFinal: `${formatNumber(carcaca, 1)} kg de carcaça`,
    formulaAplicada: 'Carcaça (kg) = Peso vivo × rendimento (%)',
    passos: [
      `Peso vivo = ${formatNumber(pesoVivoKg, 1)} kg`,
      `Rendimento = ${formatNumber(rendimentoPercent, 1)}%`,
      `Carcaça = ${formatNumber(pesoVivoKg, 1)} × ${formatNumber(rendimentoPercent, 1)}% = ${formatNumber(carcaca, 1)} kg`,
    ],
    interpretacao: 'Estimativa útil para comparar lotes e alinhar expectativa com o frigorífico.',
    observacoes: [
      'Rendimento varia por raça, acabamento, jejum, categoria e padrão de abate.',
      'Exemplo (Nelore): comumente 52%–54% (varia por sistema).',
    ],
  };
}

function calcCapacidadeSuporte(producaoMsKgHaPeriodo: number, areaHa: number, demandaMsKgAnimalDia: number, periodoDias: number): CalcResult {
  const producaoTotal = producaoMsKgHaPeriodo * areaHa;
  const demandaPorAnimal = demandaMsKgAnimalDia * periodoDias;
  const lotacaoAnimais = producaoTotal / demandaPorAnimal;

  return {
    titulo: 'Capacidade de Suporte do Pasto',
    calculoFinal: `${formatNumber(lotacaoAnimais, 2)} animais no período (estimativa)`,
    formulaAplicada: 'Taxa de Lotação = Produção de MS ÷ Demanda animal',
    passos: [
      `Produção de MS = ${formatNumber(producaoMsKgHaPeriodo, 0)} kg/ha no período`,
      `Área = ${formatNumber(areaHa, 2)} ha`,
      `Produção total = ${formatNumber(producaoMsKgHaPeriodo, 0)} × ${formatNumber(areaHa, 2)} = ${formatNumber(producaoTotal, 0)} kg MS`,
      `Demanda por animal = ${formatNumber(demandaMsKgAnimalDia, 2)} kg MS/dia × ${formatNumber(periodoDias, 0)} dias = ${formatNumber(demandaPorAnimal, 1)} kg MS`,
      `Lotação = ${formatNumber(producaoTotal, 0)} ÷ ${formatNumber(demandaPorAnimal, 1)} = ${formatNumber(lotacaoAnimais, 2)} animais`,
    ],
    interpretacao: 'Use como referência para ajustar lotação, suplementação e rotação de piquetes.',
    observacoes: [
      'Inclua uma margem de segurança (perdas, pisoteio, seletividade) ao definir a lotação real.',
      'Se você já trabalha com UA (unidade animal), dá para converter depois pelo peso médio do lote.',
    ],
    margemErro: 'Margem prática: a lotação real pode variar bastante; recomenda-se trabalhar com “folga” e monitorar altura/oferta do pasto.',
  };
}

function calcDosagemVermifugo(pesoKg: number, doseMlPorKg: number): CalcResult {
  const dose = pesoKg * doseMlPorKg;
  return {
    titulo: 'Dosagem de Vermífugo',
    calculoFinal: `${formatNumber(dose, 2)} mL`,
    formulaAplicada: 'Dose (mL) = Peso estimado × dose por kg (rótulo)',
    passos: [
      `Peso = ${formatNumber(pesoKg, 1)} kg`,
      `Dose do rótulo = ${formatNumber(doseMlPorKg, 4)} mL/kg`,
      `Dose total = ${formatNumber(pesoKg, 1)} × ${formatNumber(doseMlPorKg, 4)} = ${formatNumber(dose, 2)} mL`,
    ],
    interpretacao: 'Dose calculada para aplicação individual (por animal).',
    observacoes: [
      'Sempre confirme a dose no rótulo e a via de aplicação (oral, injetável, pour-on).',
      'Evite subdosagem (favorece resistência) e respeite carência.',
    ],
  };
}

function calcCustoPorAnimal(custoTotal: number, numeroAnimais: number): CalcResult {
  const custo = custoTotal / numeroAnimais;
  return {
    titulo: 'Custo de Produção por Animal',
    calculoFinal: `${formatCurrency(custo)} por animal`,
    formulaAplicada: 'Custo por animal = Custo total ÷ número de animais',
    passos: [
      `Custo total = ${formatCurrency(custoTotal)}`,
      `Número de animais = ${formatNumber(numeroAnimais, 0)}`,
      `Custo/animal = ${formatCurrency(custoTotal)} ÷ ${formatNumber(numeroAnimais, 0)} = ${formatCurrency(custo)}`,
    ],
    interpretacao: 'Ajuda a comparar lotes, fases (cria/recria/engorda) e identificar gargalos de custo.',
    observacoes: ['Se você quiser, depois dá para detalhar por categorias: ração, sanidade, mão de obra, combustível, etc.'],
  };
}

function calcMortalidadeImpacto(mortes: number, valorMedioCabeca: number): CalcResult {
  const impacto = mortes * valorMedioCabeca;
  return {
    titulo: 'Mortalidade + Impacto Financeiro',
    calculoFinal: `${formatCurrency(impacto)} de impacto estimado`,
    formulaAplicada: 'Impacto = número de mortes × valor médio por cabeça',
    passos: [
      `Mortes = ${formatNumber(mortes, 0)}`,
      `Valor médio/cabeça = ${formatCurrency(valorMedioCabeca)}`,
      `Impacto = ${formatNumber(mortes, 0)} × ${formatCurrency(valorMedioCabeca)} = ${formatCurrency(impacto)}`,
    ],
    interpretacao: 'Mostra rapidamente o custo direto da mortalidade no caixa do sistema.',
    observacoes: [
      'Considere também custos indiretos (tratamentos, tempo, perda de ganho, reposição) para uma visão completa.',
    ],
  };
}

function calcIep(dataPartoAnterior: Date, dataUltimoParto: Date): CalcResult {
  const meses = diffMonths(dataPartoAnterior, dataUltimoParto);
  return {
    titulo: 'Intervalo Entre Partos (IEP)',
    calculoFinal: `${formatNumber(meses, 1)} meses`,
    formulaAplicada: 'IEP = data do último parto − data do parto anterior (em meses)',
    passos: [
      `Parto anterior = ${dataPartoAnterior.toLocaleDateString('pt-BR')}`,
      `Último parto = ${dataUltimoParto.toLocaleDateString('pt-BR')}`,
      `IEP ≈ ${formatNumber(meses, 1)} meses (média de 30,44 dias/mês)`,
    ],
    interpretacao:
      meses <= 13
        ? 'IEP bom: indica reprodução eficiente (dentro do esperado para sistemas bem ajustados).'
        : meses <= 15
          ? 'IEP intermediário: avalie condição corporal, sanidade, manejo pós-parto e estação de monta.'
          : 'IEP alto: sinal de alerta para fertilidade e manejo (nutrição, pós-parto, touros, exames).',
    observacoes: [
      'Use séries históricas por matriz para ter diagnóstico mais preciso.',
      'Em sistemas com estação de monta, o IEP pode refletir a estratégia do calendário.',
    ],
  };
}

function calcLoteamento(pesoTotalLoteKg: number, totalAnimais: number, capacidadeAnimaisPorCaminhao: number): CalcResult {
  const caminhoes = Math.ceil(totalAnimais / capacidadeAnimaisPorCaminhao);
  const base = Math.floor(totalAnimais / caminhoes);
  const resto = totalAnimais % caminhoes;
  const pesoMedio = pesoTotalLoteKg / totalAnimais;

  const distribuicao = Array.from({ length: caminhoes }).map((_, i) => {
    const animais = base + (i < resto ? 1 : 0);
    const peso = animais * pesoMedio;
    return { i: i + 1, animais, peso };
  });

  return {
    titulo: 'Loteamento / Divisão de Caminhões',
    calculoFinal: `${caminhoes} caminhão(ões) com distribuição equilibrada`,
    formulaAplicada: 'Divisão equilibrada por número de animais; peso por caminhão estimado por peso médio',
    passos: [
      `Total de animais = ${formatNumber(totalAnimais, 0)}`,
      `Capacidade (animais/caminhão) = ${formatNumber(capacidadeAnimaisPorCaminhao, 0)}`,
      `Caminhões = teto(${formatNumber(totalAnimais, 0)} ÷ ${formatNumber(capacidadeAnimaisPorCaminhao, 0)}) = ${formatNumber(caminhoes, 0)}`,
      `Peso total do lote = ${formatNumber(pesoTotalLoteKg, 1)} kg`,
      `Peso médio estimado = ${formatNumber(pesoMedio, 1)} kg/animal`,
      ...distribuicao.map((d) => `Caminhão ${d.i}: ${formatNumber(d.animais, 0)} animais (≈ ${formatNumber(d.peso, 0)} kg)`),
    ],
    interpretacao: 'Ajuda a organizar embarque e reduzir diferença de carga entre caminhões.',
    observacoes: [
      'Se houver grande variação de peso no lote, a divisão por cabeça pode não equilibrar o peso real. Nesse caso, agrupe por faixas de peso.',
      'Sempre respeite a capacidade legal do veículo e bem-estar (densidade).',
    ],
  };
}

function getCalcById(id: CalculatorId): CalcDefinition {
  const found = calculators.find((c) => c.id === id);
  if (!found) {
    return calculators[0];
  }
  return found;
}

function CategorySection({
  categoria,
  items,
  onSelect,
  isMobile,
}: {
  categoria: CalcDefinition['categoria'];
  items: CalcDefinition[];
  onSelect: (id: CalculatorId) => void;
  isMobile: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className={cn('font-display', isMobile ? 'text-base' : 'text-lg')}>{categoria}</h2>
        <span className="text-xs text-muted-foreground">{items.length} opções</span>
      </div>

      <div className={cn('grid gap-3', isMobile ? 'grid-cols-1' : 'grid-cols-2 xl:grid-cols-3')}>
        {items.map((calc) => {
          const Icon = calc.icon;
          return (
            <button
              key={calc.id}
              onClick={() => onSelect(calc.id)}
              className={cn('text-left', 'active:scale-[0.99] transition-transform')}
            >
              <Card className={cn(isMobile ? 'rounded-2xl' : '')}>
                <CardHeader className={cn(isMobile ? 'p-4' : '')}>
                  <div className="flex items-start gap-3">
                    <div className={cn('shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center', isMobile ? 'w-12 h-12' : 'w-10 h-10 rounded-xl')}>
                      <Icon className={cn(isMobile ? 'w-6 h-6 text-primary' : 'w-5 h-5 text-primary')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className={cn('leading-tight', isMobile ? 'text-base' : 'text-lg')}>{calc.titulo}</CardTitle>
                      <CardDescription className={cn(isMobile ? 'text-sm' : '')}>{calc.descricao}</CardDescription>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Calculadoras() {
  const isMobile = useIsMobile();
  const [selected, setSelected] = React.useState<CalculatorId | null>(null);
  const [result, setResult] = React.useState<CalcResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [pesoPerimetroCm, setPesoPerimetroCm] = React.useState('');
  const [pesoComprimentoCm, setPesoComprimentoCm] = React.useState('');

  const [gmdPesoInicial, setGmdPesoInicial] = React.useState('');
  const [gmdPesoFinal, setGmdPesoFinal] = React.useState('');
  const [gmdDias, setGmdDias] = React.useState('');

  const [caConsumoMs, setCaConsumoMs] = React.useState('');
  const [caGmd, setCaGmd] = React.useState('');

  const [convValor, setConvValor] = React.useState('');
  const [convDirecao, setConvDirecao] = React.useState<'arroba_para_kg' | 'kg_para_arroba'>('arroba_para_kg');

  const [rendPesoVivo, setRendPesoVivo] = React.useState('');
  const [rendPercent, setRendPercent] = React.useState('');

  const [capProdMs, setCapProdMs] = React.useState('');
  const [capArea, setCapArea] = React.useState('');
  const [capDemanda, setCapDemanda] = React.useState('');
  const [capDias, setCapDias] = React.useState('');

  const [vermPeso, setVermPeso] = React.useState('');
  const [vermDose, setVermDose] = React.useState('');

  const [custoTotal, setCustoTotal] = React.useState('');
  const [custoAnimais, setCustoAnimais] = React.useState('');

  const [mortMortes, setMortMortes] = React.useState('');
  const [mortValor, setMortValor] = React.useState('');

  const [iepAnterior, setIepAnterior] = React.useState('');
  const [iepUltimo, setIepUltimo] = React.useState('');

  const [lotPesoTotal, setLotPesoTotal] = React.useState('');
  const [lotTotalAnimais, setLotTotalAnimais] = React.useState('');
  const [lotCapacidade, setLotCapacidade] = React.useState('');

  const grouped = React.useMemo(() => {
    const byCat: Record<CalcDefinition['categoria'], CalcDefinition[]> = {
      'Pesagem & Carcaça': [],
      'Desempenho & Sanidade': [],
      'Gestão & Logística': [],
    };
    calculators.forEach((c) => byCat[c.categoria].push(c));
    return byCat;
  }, []);

  function resetStateForNewCalc() {
    setResult(null);
    setError(null);

    setPesoPerimetroCm('');
    setPesoComprimentoCm('');

    setGmdPesoInicial('');
    setGmdPesoFinal('');
    setGmdDias('');

    setCaConsumoMs('');
    setCaGmd('');

    setConvValor('');
    setConvDirecao('arroba_para_kg');

    setRendPesoVivo('');
    setRendPercent('');

    setCapProdMs('');
    setCapArea('');
    setCapDemanda('');
    setCapDias('');

    setVermPeso('');
    setVermDose('');

    setCustoTotal('');
    setCustoAnimais('');

    setMortMortes('');
    setMortValor('');

    setIepAnterior('');
    setIepUltimo('');

    setLotPesoTotal('');
    setLotTotalAnimais('');
    setLotCapacidade('');
  }

  function chooseCalc(id: CalculatorId) {
    setSelected(id);
    resetStateForNewCalc();
  }

  function backToMenu() {
    setSelected(null);
    resetStateForNewCalc();
  }

  function setInvalid(msg: string) {
    setResult(null);
    setError(msg);
  }

  function calcular() {
    if (!selected) {
      setInvalid('Escolha uma calculadora no menu para continuar.');
      return;
    }

    setError(null);

    if (selected === 'peso_perimetro_comprimento') {
      const p = parseNumber(pesoPerimetroCm);
      const c = parseNumber(pesoComprimentoCm);
      if (p === null || p <= 0) return setInvalid('Informe um perímetro torácico válido (em cm).');
      if (c === null || c <= 0) return setInvalid('Informe um comprimento válido (em cm).');
      setResult(calcPesoPerimetroComprimento(p, c));
      return;
    }

    if (selected === 'peso_perimetro') {
      const p = parseNumber(pesoPerimetroCm);
      if (p === null || p <= 0) return setInvalid('Informe um perímetro torácico válido (em cm).');
      setResult(calcPesoPerimetro(p));
      return;
    }

    if (selected === 'gmd') {
      const pi = parseNumber(gmdPesoInicial);
      const pf = parseNumber(gmdPesoFinal);
      const d = parseNumber(gmdDias);
      if (pi === null || pi <= 0) return setInvalid('Informe um peso inicial válido (kg).');
      if (pf === null || pf <= 0) return setInvalid('Informe um peso final válido (kg).');
      if (d === null || d <= 0) return setInvalid('Informe um número de dias válido.');
      setResult(calcGmd(pi, pf, d));
      return;
    }

    if (selected === 'conversao_alimentar') {
      const cons = parseNumber(caConsumoMs);
      const g = parseNumber(caGmd);
      if (cons === null || cons <= 0) return setInvalid('Informe um consumo de MS válido (kg/dia).');
      if (g === null || g <= 0) return setInvalid('Informe um GMD válido (kg/dia).');
      setResult(calcConversaoAlimentar(cons, g));
      return;
    }

    if (selected === 'conversao_arroba_kg') {
      const v = parseNumber(convValor);
      if (v === null || v <= 0) return setInvalid('Informe um valor válido (maior que zero).');
      setResult(calcConversaoArrobaKg(v, convDirecao));
      return;
    }

    if (selected === 'rendimento_carcaca') {
      const pv = parseNumber(rendPesoVivo);
      const r = parseNumber(rendPercent);
      if (pv === null || pv <= 0) return setInvalid('Informe um peso vivo válido (kg).');
      if (r === null || r <= 0 || r > 100) return setInvalid('Informe um rendimento válido (% entre 0 e 100).');
      setResult(calcRendimentoCarcaca(pv, r));
      return;
    }

    if (selected === 'capacidade_suporte') {
      const prod = parseNumber(capProdMs);
      const area = parseNumber(capArea);
      const dem = parseNumber(capDemanda);
      const dias = parseNumber(capDias);
      if (prod === null || prod <= 0) return setInvalid('Informe uma produção de MS válida (kg/ha no período).');
      if (area === null || area <= 0) return setInvalid('Informe uma área válida (ha).');
      if (dem === null || dem <= 0) return setInvalid('Informe uma demanda válida (kg MS/animal/dia).');
      if (dias === null || dias <= 0) return setInvalid('Informe um período válido (dias).');
      setResult(calcCapacidadeSuporte(prod, area, dem, dias));
      return;
    }

    if (selected === 'dosagem_vermifugo') {
      const peso = parseNumber(vermPeso);
      const dose = parseNumber(vermDose);
      if (peso === null || peso <= 0) return setInvalid('Informe um peso válido (kg).');
      if (dose === null || dose <= 0) return setInvalid('Informe uma dose válida (mL/kg).');
      setResult(calcDosagemVermifugo(peso, dose));
      return;
    }

    if (selected === 'custo_por_animal') {
      const total = parseNumber(custoTotal);
      const n = parseNumber(custoAnimais);
      if (total === null || total <= 0) return setInvalid('Informe um custo total válido (R$).');
      if (n === null || n <= 0) return setInvalid('Informe um número de animais válido.');
      setResult(calcCustoPorAnimal(total, n));
      return;
    }

    if (selected === 'mortalidade_impacto') {
      const mortes = parseNumber(mortMortes);
      const valor = parseNumber(mortValor);
      if (mortes === null || mortes <= 0) return setInvalid('Informe um número de mortes válido.');
      if (valor === null || valor <= 0) return setInvalid('Informe um valor médio válido (R$).');
      setResult(calcMortalidadeImpacto(mortes, valor));
      return;
    }

    if (selected === 'iep') {
      if (!iepAnterior) return setInvalid('Informe a data do parto anterior.');
      if (!iepUltimo) return setInvalid('Informe a data do último parto.');
      const d1 = new Date(iepAnterior);
      const d2 = new Date(iepUltimo);
      if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return setInvalid('Informe datas válidas.');
      if (d2.getTime() <= d1.getTime()) return setInvalid('A data do último parto precisa ser posterior ao parto anterior.');
      setResult(calcIep(d1, d2));
      return;
    }

    if (selected === 'loteamento') {
      const pesoTotal = parseNumber(lotPesoTotal);
      const totalAnim = parseNumber(lotTotalAnimais);
      const cap = parseNumber(lotCapacidade);
      if (pesoTotal === null || pesoTotal <= 0) return setInvalid('Informe um peso total válido (kg).');
      if (totalAnim === null || totalAnim <= 0) return setInvalid('Informe o total de animais válido.');
      if (cap === null || cap <= 0) return setInvalid('Informe a capacidade por caminhão válida (animais).');
      if (cap < 1) return setInvalid('A capacidade por caminhão precisa ser pelo menos 1 animal.');
      setResult(calcLoteamento(pesoTotal, totalAnim, cap));
      return;
    }

    setInvalid('Calculadora inválida. Volte e escolha novamente.');
  }

  const pageTitle = 'Calculadoras';

  const selectedDef = selected ? getCalcById(selected) : null;

  return (
    <div className={cn('mx-auto w-full max-w-6xl', isMobile ? 'px-4 py-4' : 'p-6')}>
      <div className={cn('flex items-center justify-between', isMobile ? 'mb-4' : 'mb-6')}>
        <div>
          <h1 className={cn('font-display', isMobile ? 'text-2xl' : 'text-3xl')}>{pageTitle}</h1>
          <p className={cn('text-muted-foreground', isMobile ? 'text-sm' : '')}>
            Escolha uma calculadora e informe apenas o necessário.
          </p>
        </div>
        {selected && (
          <Button variant="outline" onClick={backToMenu} className={cn(isMobile && 'rounded-full')}>
            Voltar ao menu
          </Button>
        )}
      </div>

      {!selected && (
        <div className="space-y-8">
          <CategorySection
            categoria="Pesagem & Carcaça"
            items={grouped['Pesagem & Carcaça']}
            onSelect={chooseCalc}
            isMobile={isMobile}
          />
          <CategorySection
            categoria="Desempenho & Sanidade"
            items={grouped['Desempenho & Sanidade']}
            onSelect={chooseCalc}
            isMobile={isMobile}
          />
          <CategorySection
            categoria="Gestão & Logística"
            items={grouped['Gestão & Logística']}
            onSelect={chooseCalc}
            isMobile={isMobile}
          />
        </div>
      )}

      {selected && selectedDef && (
        <div className={cn('grid gap-4', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
          <Card className={cn(isMobile ? 'rounded-2xl' : '')}>
            <CardHeader className={cn(isMobile ? 'p-4' : '')}>
              <CardTitle className={cn(isMobile ? 'text-lg' : '')}>{selectedDef.titulo}</CardTitle>
              <CardDescription className={cn(isMobile ? 'text-sm' : '')}>{selectedDef.descricao}</CardDescription>
            </CardHeader>
            <CardContent className={cn('space-y-3', isMobile ? 'p-4 pt-0' : '')}>
              {selected === 'peso_perimetro_comprimento' && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Perímetro torácico (cm)</label>
                    <Input inputMode="decimal" placeholder="Ex: 170" value={pesoPerimetroCm} onChange={(e) => setPesoPerimetroCm(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Comprimento corporal (cm)</label>
                    <Input inputMode="decimal" placeholder="Ex: 140" value={pesoComprimentoCm} onChange={(e) => setPesoComprimentoCm(e.target.value)} />
                  </div>
                </>
              )}

              {selected === 'peso_perimetro' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Perímetro torácico (cm)</label>
                  <Input inputMode="decimal" placeholder="Ex: 170" value={pesoPerimetroCm} onChange={(e) => setPesoPerimetroCm(e.target.value)} />
                </div>
              )}

              {selected === 'gmd' && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Peso inicial (kg)</label>
                    <Input inputMode="decimal" placeholder="Ex: 280" value={gmdPesoInicial} onChange={(e) => setGmdPesoInicial(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Peso final (kg)</label>
                    <Input inputMode="decimal" placeholder="Ex: 320" value={gmdPesoFinal} onChange={(e) => setGmdPesoFinal(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Número de dias</label>
                    <Input inputMode="numeric" placeholder="Ex: 45" value={gmdDias} onChange={(e) => setGmdDias(e.target.value)} />
                  </div>
                </>
              )}

              {selected === 'conversao_alimentar' && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Consumo de MS (kg/dia)</label>
                    <Input inputMode="decimal" placeholder="Ex: 8,5" value={caConsumoMs} onChange={(e) => setCaConsumoMs(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">GMD (kg/dia)</label>
                    <Input inputMode="decimal" placeholder="Ex: 0,95" value={caGmd} onChange={(e) => setCaGmd(e.target.value)} />
                  </div>
                </>
              )}

              {selected === 'conversao_arroba_kg' && (
                <>
                  <div className={cn('grid gap-3', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Direção</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={convDirecao === 'arroba_para_kg' ? 'default' : 'outline'}
                          onClick={() => setConvDirecao('arroba_para_kg')}
                        >
                          @ → kg
                        </Button>
                        <Button
                          type="button"
                          variant={convDirecao === 'kg_para_arroba' ? 'default' : 'outline'}
                          onClick={() => setConvDirecao('kg_para_arroba')}
                        >
                          kg → @
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Valor</label>
                      <Input inputMode="decimal" placeholder={convDirecao === 'arroba_para_kg' ? 'Ex: 18' : 'Ex: 270'} value={convValor} onChange={(e) => setConvValor(e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {selected === 'rendimento_carcaca' && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Peso vivo (kg)</label>
                    <Input inputMode="decimal" placeholder="Ex: 520" value={rendPesoVivo} onChange={(e) => setRendPesoVivo(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Rendimento (%)</label>
                    <Input inputMode="decimal" placeholder="Ex: 53" value={rendPercent} onChange={(e) => setRendPercent(e.target.value)} />
                  </div>
                </>
              )}

              {selected === 'capacidade_suporte' && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Produção de MS (kg/ha no período)</label>
                    <Input inputMode="decimal" placeholder="Ex: 2400" value={capProdMs} onChange={(e) => setCapProdMs(e.target.value)} />
                  </div>
                  <div className={cn('grid gap-3', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Área (ha)</label>
                      <Input inputMode="decimal" placeholder="Ex: 18" value={capArea} onChange={(e) => setCapArea(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Período (dias)</label>
                      <Input inputMode="numeric" placeholder="Ex: 30" value={capDias} onChange={(e) => setCapDias(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Demanda (kg MS/animal/dia)</label>
                    <Input inputMode="decimal" placeholder="Ex: 8" value={capDemanda} onChange={(e) => setCapDemanda(e.target.value)} />
                  </div>
                </>
              )}

              {selected === 'dosagem_vermifugo' && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Peso estimado (kg)</label>
                    <Input inputMode="decimal" placeholder="Ex: 320" value={vermPeso} onChange={(e) => setVermPeso(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Dose do rótulo (mL/kg)</label>
                    <Input inputMode="decimal" placeholder="Ex: 0,02" value={vermDose} onChange={(e) => setVermDose(e.target.value)} />
                  </div>
                </>
              )}

              {selected === 'custo_por_animal' && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Custo total (R$)</label>
                    <Input inputMode="decimal" placeholder="Ex: 12500" value={custoTotal} onChange={(e) => setCustoTotal(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Número de animais</label>
                    <Input inputMode="numeric" placeholder="Ex: 50" value={custoAnimais} onChange={(e) => setCustoAnimais(e.target.value)} />
                  </div>
                </>
              )}

              {selected === 'mortalidade_impacto' && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Número de mortes</label>
                    <Input inputMode="numeric" placeholder="Ex: 2" value={mortMortes} onChange={(e) => setMortMortes(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Valor médio por cabeça (R$)</label>
                    <Input inputMode="decimal" placeholder="Ex: 3200" value={mortValor} onChange={(e) => setMortValor(e.target.value)} />
                  </div>
                </>
              )}

              {selected === 'iep' && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Data do parto anterior</label>
                    <Input type="date" value={iepAnterior} onChange={(e) => setIepAnterior(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Data do último parto</label>
                    <Input type="date" value={iepUltimo} onChange={(e) => setIepUltimo(e.target.value)} />
                  </div>
                </>
              )}

              {selected === 'loteamento' && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Peso total do lote (kg)</label>
                    <Input inputMode="decimal" placeholder="Ex: 15600" value={lotPesoTotal} onChange={(e) => setLotPesoTotal(e.target.value)} />
                  </div>
                  <div className={cn('grid gap-3', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Total de animais</label>
                      <Input inputMode="numeric" placeholder="Ex: 48" value={lotTotalAnimais} onChange={(e) => setLotTotalAnimais(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Capacidade (animais/caminhão)</label>
                      <Input inputMode="numeric" placeholder="Ex: 16" value={lotCapacidade} onChange={(e) => setLotCapacidade(e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className={cn('flex gap-2 pt-2', isMobile ? 'flex-col' : 'flex-row')}>
                <Button onClick={calcular} className={cn(isMobile && 'rounded-2xl h-12 text-base')}>Calcular</Button>
                <Button variant="outline" onClick={resetStateForNewCalc} className={cn(isMobile && 'rounded-2xl h-12 text-base')}>
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(isMobile ? 'rounded-2xl' : '')}>
            <CardHeader className={cn(isMobile ? 'p-4' : '')}>
              <CardTitle className={cn(isMobile ? 'text-lg' : '')}>Resultado</CardTitle>
              <CardDescription className={cn(isMobile ? 'text-sm' : '')}>
                {result ? 'Pronto. Confira o cálculo e a interpretação.' : 'Faça o cálculo para ver o resultado.'}
              </CardDescription>
            </CardHeader>
            <CardContent className={cn('space-y-4', isMobile ? 'p-4 pt-0' : '')}>
              {!result && (
                <div className={cn('rounded-xl border bg-muted/30 p-4', isMobile ? 'text-sm' : '')}>
                  Dica: use vírgula ou ponto para decimais.
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className={cn('text-sm text-muted-foreground')}>Cálculo final</p>
                    <p className={cn('font-display', isMobile ? 'text-2xl' : 'text-2xl')}>{result.calculoFinal}</p>
                    {result.margemErro && (
                      <p className={cn('mt-2 text-xs text-muted-foreground')}>{result.margemErro}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Fórmula aplicada</p>
                    <div className="rounded-lg border p-3 text-sm bg-background">
                      {result.formulaAplicada}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Passos utilizados</p>
                    <div className="rounded-lg border p-3 text-sm bg-background">
                      <div className="space-y-1">
                        {result.passos.map((p, idx) => (
                          <div key={idx} className="text-muted-foreground">{p}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Interpretação prática</p>
                    <div className="rounded-lg border p-3 text-sm bg-background text-muted-foreground">
                      {result.interpretacao}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Observações</p>
                    <div className="rounded-lg border p-3 text-sm bg-background">
                      <div className="space-y-1">
                        {result.observacoes.map((o, idx) => (
                          <div key={idx} className="text-muted-foreground">{o}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
