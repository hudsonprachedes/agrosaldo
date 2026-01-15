import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { 
  saveEpidemiologySurvey, 
  getLastEpidemiologySurvey,
  getOnboardingStatus 
} from '@/lib/indexeddb';
import { AlertCircle, CheckCircle } from 'lucide-react';
import type { StoredEpidemiologySurvey } from '@/lib/indexeddb';

// ============================================================================
// DEFINIÇÃO DO QUESTIONÁRIO
// ============================================================================

interface EpidemiologyQuestion {
  id: string;
  section: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  options?: { label: string; value: string }[];
  hint?: string;
  placeholder?: string;
}

const EPIDEMIOLOGY_QUESTIONS: EpidemiologyQuestion[] = [
  // SEÇÃO 1: INFORMAÇÕES GERAIS
  {
    id: 'property_health_status',
    section: 'Informações Gerais',
    label: 'Qual é o status sanitário atual da propriedade?',
    type: 'select',
    required: true,
    options: [
      { label: 'Sem problemas aparentes', value: 'healthy' },
      { label: 'Casos suspeitos em investigação', value: 'suspicious' },
      { label: 'Casos confirmados', value: 'confirmed' },
      { label: 'Recovido de doença recente', value: 'recovering' },
    ],
  },
  {
    id: 'last_disease_date',
    section: 'Informações Gerais',
    label: 'Data do último caso de doença (se houver)',
    type: 'date',
    required: false,
  },
  {
    id: 'quarantine_status',
    section: 'Informações Gerais',
    label: 'Há isolamento ou quarentena de animais?',
    type: 'checkbox',
    required: false,
  },

  // SEÇÃO 2: VACINAÇÕES
  {
    id: 'vaccinations_up_to_date',
    section: 'Vacinações',
    label: 'Todas as vacinações obrigatórias estão em dia?',
    type: 'checkbox',
    required: true,
  },
  {
    id: 'recent_vaccinations',
    section: 'Vacinações',
    label: 'Descreva as vacinações realizadas nos últimos 6 meses',
    type: 'textarea',
    required: false,
    placeholder: 'ex: Febre aftosa (03/2025), Clostridioses (01/2025), ...',
  },
  {
    id: 'external_animals_introduced',
    section: 'Vacinações',
    label: 'Animais externos foram introduzidos na propriedade?',
    type: 'checkbox',
    required: false,
  },

  // SEÇÃO 3: MANEJO E HIGIENE
  {
    id: 'water_source_quality',
    section: 'Manejo e Higiene',
    label: 'Qualidade da fonte de água',
    type: 'select',
    required: true,
    options: [
      { label: 'Excelente - testada regularmente', value: 'excellent' },
      { label: 'Boa - visualmente limpa', value: 'good' },
      { label: 'Aceitável - com alguns problemas', value: 'acceptable' },
      { label: 'Precisa melhorias', value: 'poor' },
    ],
  },
  {
    id: 'facilities_sanitation',
    section: 'Manejo e Higiene',
    label: 'Como é a limpeza e desinfecção das instalações?',
    type: 'textarea',
    required: false,
    placeholder: 'Frequência, produtos utilizados, áreas prioritárias...',
  },
  {
    id: 'pest_control_program',
    section: 'Manejo e Higiene',
    label: 'Há programa de controle de pragas (insetos, roedores)?',
    type: 'checkbox',
    required: false,
  },

  // SEÇÃO 4: MORTALIDADE E MORBIDADE
  {
    id: 'unusual_mortality',
    section: 'Mortalidade e Morbidade',
    label: 'Há aumento inusitado na mortalidade?',
    type: 'checkbox',
    required: true,
  },
  {
    id: 'mortality_rate_percent',
    section: 'Mortalidade e Morbidade',
    label: 'Taxa de mortalidade estimada (%)',
    type: 'number',
    required: false,
    placeholder: '0',
  },
  {
    id: 'illness_symptoms',
    section: 'Mortalidade e Morbidade',
    label: 'Quais sintomas foram observados nos animais doentes?',
    type: 'textarea',
    required: false,
    placeholder: 'ex: diarréia, tosse, febre, apatia, lesões, ...',
  },

  // SEÇÃO 5: RASTREABILIDADE
  {
    id: 'traceability_system',
    section: 'Rastreabilidade',
    label: 'Há sistema de rastreabilidade dos animais?',
    type: 'select',
    required: true,
    options: [
      { label: 'Sim, sistema eletrônico completo', value: 'electronic' },
      { label: 'Parcial (alguns animais marcados)', value: 'partial' },
      { label: 'Apenas registros em papel', value: 'paper' },
      { label: 'Não há rastreamento', value: 'none' },
    ],
  },
  {
    id: 'gta_compliance',
    section: 'Rastreabilidade',
    label: 'Todos os deslocamentos são documentados com GTA?',
    type: 'checkbox',
    required: true,
  },

  // SEÇÃO 6: OBSERVAÇÕES GERAIS
  {
    id: 'additional_comments',
    section: 'Observações Gerais',
    label: 'Comentários adicionais ou preocupações',
    type: 'textarea',
    required: false,
    placeholder: 'Qualquer informação relevante sobre saúde animal ou biosegurança...',
  },
];

// ============================================================================
// SCHEMA ZOD
// ============================================================================

const questionSchemaFields: Record<string, z.ZodTypeAny> = {};
EPIDEMIOLOGY_QUESTIONS.forEach(q => {
  if (q.type === 'checkbox' || q.type === 'select') {
    questionSchemaFields[q.id] = z.unknown().optional();
  } else if (q.type === 'number') {
    questionSchemaFields[q.id] = z.number().optional();
  } else {
    questionSchemaFields[q.id] = z.string().optional();
  }

  if (q.required) {
    if (q.type === 'checkbox' || q.type === 'select') {
      questionSchemaFields[q.id] = z.unknown();
    } else if (q.type === 'number') {
      questionSchemaFields[q.id] = z.number();
    } else {
      questionSchemaFields[q.id] = z.string().min(1, 'Campo obrigatório');
    }
  }
});

const surveySchema = z.object(questionSchemaFields);

// ============================================================================
// PÁGINA QUESTIONÁRIO
// ============================================================================

const QuestionarioEpidemiologico: React.FC = () => {
  const { selectedProperty } = useAuth();
  const navigate = useNavigate();
  const [lastSubmission, setLastSubmission] = useState<StoredEpidemiologySurvey | null>(null);
  const [daysUntilDue, setDaysUntilDue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof surveySchema>>({
    resolver: zodResolver(surveySchema),
    defaultValues: Object.fromEntries(
      EPIDEMIOLOGY_QUESTIONS.map(q => [q.id, q.type === 'checkbox' ? false : ''])
    ),
  });

  // Carregar última submissão
  useEffect(() => {
    if (!selectedProperty) return;

    const loadLastSubmission = async () => {
      setIsLoading(true);
      try {
        const last = await getLastEpidemiologySurvey(selectedProperty.id);
        if (last) {
          setLastSubmission(last);

          const nextDue = new Date(last.nextDueAt);
          const today = new Date();
          const daysLeft = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          setDaysUntilDue(daysLeft);
        }
      } catch (error) {
        console.error('Erro ao carregar última submissão:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLastSubmission();
  }, [selectedProperty]);

  const onSubmit = async (data: z.infer<typeof surveySchema>) => {
    if (!selectedProperty) return;

    setSubmitting(true);
    try {
      const answers = Object.entries(data).map(([fieldId, value]) => ({
        fieldId,
        value,
      }));

      const nextDueDate = new Date();
      nextDueDate.setMonth(nextDueDate.getMonth() + 6);

      await saveEpidemiologySurvey({
        propertyId: selectedProperty.id,
        version: 1,
        answers,
        submittedAt: new Date().toISOString(),
        nextDueAt: nextDueDate.toISOString(),
      });

      toast.success('✅ Questionário epidemiológico salvo com sucesso!');
      toast.info('Próxima avaliação será em ' + nextDueDate.toLocaleDateString('pt-BR'));

      // Redirecionar após 2s
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Erro ao salvar questionário:', error);
      toast.error('Erro ao salvar questionário');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
          <p>Carregando questionário...</p>
        </div>
      </div>
    );
  }

  // Agrupar perguntas por seção
  const groupedQuestions = EPIDEMIOLOGY_QUESTIONS.reduce((acc, question) => {
    if (!acc[question.section]) {
      acc[question.section] = [];
    }
    acc[question.section].push(question);
    return acc;
  }, {} as Record<string, EpidemiologyQuestion[]>);

  return (
    <div className="py-8 px-4 max-w-3xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-700 mb-2">
            📋 Questionário Epidemiológico
          </h1>
          <p className="text-gray-600">
            Avaliação semestral de saúde animal e biossegurança da propriedade
          </p>
        </div>

        <div className="mb-6 flex justify-end">
          <Button
            variant="outline"
            onClick={() => navigate('/questionario-epidemiologico/historico')}
          >
            Ver histórico
          </Button>
        </div>

        {/* INFORMAÇÃO DE ÚLTIMA SUBMISSÃO */}
        {lastSubmission && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="ml-2 text-blue-900">
              <strong>Última submissão:</strong> {new Date(lastSubmission.submittedAt).toLocaleDateString('pt-BR')}
              {daysUntilDue !== null && (
                <>
                  {' | '}
                  <strong>
                    {daysUntilDue > 0
                      ? `Próxima devida em ${daysUntilDue} dias`
                      : 'Já vencida - atualize o questionário'}
                  </strong>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* ALERTA DE RESPONSABILIDADE */}
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="ml-2 text-amber-900">
            Este questionário é importante para o acompanhamento sanitário da propriedade.
            Responda com precisão e honestidade. Os dados serão armazenados para futuras
            consultas.
          </AlertDescription>
        </Alert>

        {/* FORMULÁRIO */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {Object.entries(groupedQuestions).map(([section, questions]) => (
              <Card key={section} className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg text-green-700">{section}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {questions.map(question => (
                    <FormField
                      key={question.id}
                      control={form.control}
                      name={question.id as keyof z.infer<typeof surveySchema>}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <FormLabel className="text-base font-medium">
                                {question.label}
                                {question.required && <span className="text-red-600 ml-1">*</span>}
                              </FormLabel>
                              {question.hint && (
                                <p className="text-sm text-gray-500 mt-1">{question.hint}</p>
                              )}
                            </div>
                          </div>

                          <FormControl>
                            {question.type === 'checkbox' ? (
                              <Checkbox
                                checked={Boolean(field.value)}
                                onCheckedChange={(next) => field.onChange(next === true)}
                              />
                            ) : question.type === 'select' ? (
                              <select
                                {...field}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              >
                                <option value="">Selecione...</option>
                                {question.options?.map(opt => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : question.type === 'textarea' ? (
                              <Textarea
                                {...field}
                                placeholder={question.placeholder}
                                className="min-h-24"
                              />
                            ) : question.type === 'number' ? (
                              <Input
                                type="number"
                                {...field}
                                placeholder={question.placeholder || '0'}
                                onChange={e =>
                                  field.onChange(e.target.value ? Number(e.target.value) : '')
                                }
                              />
                            ) : (
                              <Input
                                type={question.type}
                                {...field}
                                placeholder={question.placeholder}
                              />
                            )}
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* BOTÕES */}
            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Salvar Questionário ✓'}
              </Button>
            </div>
          </form>
        </Form>
    </div>
  );
};

export default QuestionarioEpidemiologico;
