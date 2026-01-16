import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, type Control, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { completeOnboarding, saveInitialStockEntry } from '@/lib/indexeddb';
import { AGE_GROUP_BRACKETS } from '@/lib/age-groups';
import { cn } from '@/lib/utils';

type SpeciesType = 'bovino' | 'bubalino';

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

const speciesSchema = z.object({
  bovino: z.boolean(),
  bubalino: z.boolean(),
}).refine(
  data => data.bovino || data.bubalino,
  { message: 'Selecione pelo menos uma espécie', path: ['bovino'] }
);

const stockSchema = z.object({
  bovino_male_0_4m: z.number().min(0),
  bovino_male_5_12m: z.number().min(0),
  bovino_male_13_24m: z.number().min(0),
  bovino_male_25_36m: z.number().min(0),
  bovino_male_36m: z.number().min(0),
  bovino_female_0_4m: z.number().min(0),
  bovino_female_5_12m: z.number().min(0),
  bovino_female_13_24m: z.number().min(0),
  bovino_female_25_36m: z.number().min(0),
  bovino_female_36m: z.number().min(0),
  bubalino_male_0_4m: z.number().min(0),
  bubalino_male_5_12m: z.number().min(0),
  bubalino_male_13_24m: z.number().min(0),
  bubalino_male_25_36m: z.number().min(0),
  bubalino_male_36m: z.number().min(0),
  bubalino_female_0_4m: z.number().min(0),
  bubalino_female_5_12m: z.number().min(0),
  bubalino_female_13_24m: z.number().min(0),
  bubalino_female_25_36m: z.number().min(0),
  bubalino_female_36m: z.number().min(0),
});

// ============================================================================
// COMPONENTES
// ============================================================================

type StockFormValues = z.infer<typeof stockSchema>;

interface StockInputProps {
  species: SpeciesType;
  sex: 'male' | 'female';
  ageGroupId: string;
  label: string;
  control: Control<StockFormValues>;
  errors?: Record<string, unknown>;
}

function StockInput({ species, sex, ageGroupId, label, control, errors }: StockInputProps) {
  const fieldName = `${species}_${sex}_${ageGroupId.replace(/\D/g, '')}` as keyof StockFormValues;

  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm">{label}</FormLabel>
          <FormControl>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => field.onChange(Math.max(0, (field.value ?? 0) - 1))}
                aria-label="Diminuir"
              >
                −
              </Button>
              <Input
                type="number"
                placeholder="0"
                {...field}
                value={field.value ?? 0}
                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                className="text-center flex-1 min-w-0"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => field.onChange((field.value ?? 0) + 1)}
                aria-label="Aumentar"
              >
                +
              </Button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface SpeciesTableProps {
  species: SpeciesType;
  control: Control<StockFormValues>;
  errors?: Record<string, unknown>;
  speciesLabel: string;
}

function SpeciesTable({ species, control, errors, speciesLabel }: SpeciesTableProps) {
  const sexes: Array<{ key: 'male' | 'female'; label: string }> = [
    { key: 'male', label: 'Macho' },
    { key: 'female', label: 'Fêmea' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-green-700">{speciesLabel}</h3>

      {sexes.map(sex => (
        <div key={sex.key}>
          <h4 className="text-sm font-medium text-gray-700 mb-2">{sex.label}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {AGE_GROUP_BRACKETS.map(bracket => (
              <StockInput
                key={`${species}-${sex.key}-${bracket.id}`}
                species={species}
                sex={sex.key}
                ageGroupId={bracket.id}
                label={bracket.label}
                control={control}
                errors={errors}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// PÁGINA ONBOARDING
// ============================================================================

const Onboarding: React.FC = () => {
  const { selectedProperty, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedSpecies, setSelectedSpecies] = useState<{ bovino: boolean; bubalino: boolean }>({
    bovino: true,
    bubalino: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Validar se user e property estão presentes
  useEffect(() => {
    if (!user || !selectedProperty) {
      toast.error('Erro: Usuário ou propriedade não encontrados');
      navigate('/login');
    }
  }, [user, selectedProperty, navigate]);

  // Form para espécies
  const speciesForm = useForm<{ bovino: boolean; bubalino: boolean }>({
    resolver: zodResolver(speciesSchema),
    defaultValues: selectedSpecies,
  });

  // Form para estoque inicial
  const stockForm = useForm<StockFormValues>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      bovino_male_0_4m: 0,
      bovino_male_5_12m: 0,
      bovino_male_13_24m: 0,
      bovino_male_25_36m: 0,
      bovino_male_36m: 0,
      bovino_female_0_4m: 0,
      bovino_female_5_12m: 0,
      bovino_female_13_24m: 0,
      bovino_female_25_36m: 0,
      bovino_female_36m: 0,
      bubalino_male_0_4m: 0,
      bubalino_male_5_12m: 0,
      bubalino_male_13_24m: 0,
      bubalino_male_25_36m: 0,
      bubalino_male_36m: 0,
      bubalino_female_0_4m: 0,
      bubalino_female_5_12m: 0,
      bubalino_female_13_24m: 0,
      bubalino_female_25_36m: 0,
      bubalino_female_36m: 0,
    },
  });

  // ========== STEP 1: BEM-VINDO ==========
  const handleStep1Next = () => {
    if (!user?.name || !selectedProperty?.name) {
      toast.error('Informações incompletas');
      return;
    }
    setStep(2);
  };

  // ========== STEP 2: ESCOLHER ESPÉCIES ==========
  const handleStep2Next = (data: z.infer<typeof speciesSchema>) => {
    const newState: { bovino: boolean; bubalino: boolean } = {
      bovino: Boolean(data.bovino),
      bubalino: Boolean(data.bubalino),
    };
    setSelectedSpecies(newState);
    setStep(3);
  };

  // ========== STEP 3: PREENCHER ESTOQUE INICIAL ==========
  const handleStep3Submit = async (data: z.infer<typeof stockSchema>) => {
    if (!selectedProperty) return;

    setIsLoading(true);
    try {
      // Salvar cada entrada de estoque inicial
      const entries = [];

      for (const [key, value] of Object.entries(data)) {
        if (typeof value !== 'number' || value === 0) continue;

        const [species, sex, ageGroupId] = parseStockKey(key);

        if (!selectedSpecies[species as SpeciesType]) continue;

        const entry = await saveInitialStockEntry({
          propertyId: selectedProperty.id,
          species: species as SpeciesType,
          sex: sex as 'male' | 'female',
          ageGroupId,
          quantity: value,
        });

        entries.push(entry);
      }

      // Marcar onboarding como completo
      await completeOnboarding(selectedProperty.id, selectedSpecies);

      toast.success('Onboarding concluído com sucesso! 🎉');

      // Redirecionar para dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Erro ao salvar estoque inicial:', error);
      toast.error('Erro ao salvar dados do onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-start justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-2xl lg:max-w-5xl">
        {/* ===== STEP 1: BEM-VINDO ===== */}
        {step === 1 && (
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
              <CardTitle className="text-3xl">🎉 Bem-vindo ao AgroSaldo!</CardTitle>
              <CardDescription className="text-green-100">
                Vamos começar configurando seu saldo inicial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Produtor</p>
                  <p className="text-xl font-semibold text-gray-800">{user?.name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Propriedade</p>
                  <p className="text-xl font-semibold text-gray-800">{selectedProperty?.name}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    ℹ️ Esta tela aparecerá apenas neste primeiro acesso. Você vai preencher o saldo
                    inicial de bovinos e bubalinos (se aplicável) por sexo e faixa etária.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900">
                    ⏱️ O sistema acompanhará a evolução automática dos seus animais de acordo com
                    a idade. Todos os lançamentos diários (nascimento, venda, morte) também serão
                    considerados.
                  </p>
                </div>
              </div>

              <Button onClick={handleStep1Next} size="lg" className="w-full bg-green-600 hover:bg-green-700">
                Próximo →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ===== STEP 2: ESCOLHER ESPÉCIES ===== */}
        {step === 2 && (
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <CardTitle>Qual espécie você produz?</CardTitle>
              <CardDescription className="text-blue-100">
                Selecione uma ou ambas (você poderá alterar depois em Configurações)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <Form {...speciesForm}>
                <form
                  onSubmit={speciesForm.handleSubmit(handleStep2Next)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    {/* BOVINO */}
                    <FormField
                      control={speciesForm.control}
                      name="bovino"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                          <FormControl>
                            <Checkbox
                              checked={Boolean(field.value)}
                              onCheckedChange={(next) => field.onChange(next === true)}
                            />
                          </FormControl>
                          <div className="space-y-1 flex-1">
                            <FormLabel className="text-lg font-semibold cursor-pointer">
                              🐄 Bovinos
                            </FormLabel>
                            <p className="text-sm text-gray-600">Gado de corte ou leite</p>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* BUBALINO */}
                    <FormField
                      control={speciesForm.control}
                      name="bubalino"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                          <FormControl>
                            <Checkbox
                              checked={Boolean(field.value)}
                              onCheckedChange={(next) => field.onChange(next === true)}
                            />
                          </FormControl>
                          <div className="space-y-1 flex-1">
                            <FormLabel className="text-lg font-semibold cursor-pointer">
                              🐃 Bubalinos
                            </FormLabel>
                            <p className="text-sm text-gray-600">Búfalos</p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormMessage>{speciesForm.formState.errors.bovino?.message}</FormMessage>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      onClick={() => setStep(1)}
                    >
                      ← Voltar
                    </Button>
                    <Button type="submit" size="lg" className="flex-1 bg-blue-600 hover:bg-blue-700">
                      Próximo →
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* ===== STEP 3: PREENCHER ESTOQUE INICIAL ===== */}
        {step === 3 && (
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
              <CardTitle>Saldo Inicial de Animais</CardTitle>
              <CardDescription className="text-purple-100">
                Preencha a quantidade atual por sexo e faixa etária
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...stockForm}>
                <form
                  onSubmit={stockForm.handleSubmit(handleStep3Submit)}
                  className="flex flex-col max-h-[75vh] lg:max-h-none"
                >
                  <div className="space-y-6 overflow-y-auto overflow-x-hidden pr-1 lg:overflow-visible lg:pr-0">
                    {selectedSpecies.bovino && (
                      <SpeciesTable
                        species="bovino"
                        control={stockForm.control}
                        speciesLabel="🐄 Bovinos"
                        errors={stockForm.formState.errors}
                      />
                    )}

                    {selectedSpecies.bubalino && (
                      <SpeciesTable
                        species="bubalino"
                        control={stockForm.control}
                        speciesLabel="🐃 Bubalinos"
                        errors={stockForm.formState.errors}
                      />
                    )}

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600">
                        💡 Você pode deixar em branco (zero) para faixas que não existem em sua
                        propriedade. Esses dados são importantes para o cálculo correto da evolução
                        do seu rebanho.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full py-2 text-sm sm:flex-1 sm:text-base"
                      onClick={() => setStep(2)}
                      disabled={isLoading}
                    >
                      ← Voltar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="w-full bg-purple-600 py-2 text-sm hover:bg-purple-700 sm:flex-1 sm:text-base"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Salvando...' : 'Finalizar Onboarding ✓'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* ===== INDICADOR DE PROGRESSO ===== */}
        <div className="mt-6 flex justify-center gap-2">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={cn(
                'h-2 rounded-full transition-all',
                s <= step ? 'bg-green-600 w-8' : 'bg-gray-300 w-2'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Parseia o nome da chave do formulário para extrair espécie, sexo e faixa etária
 */
function parseStockKey(key: string): [string, string, string] {
  const parts = key.split('_');
  const species = parts[0]; // bovino ou bubalino
  const sex = parts[1]; // male ou female
  const ageGroupId = `${parts[2]}-${parts[3]}m`; // ex: 0-4m

  return [species, sex, ageGroupId];
}

export default Onboarding;
