import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { addMonths } from 'date-fns';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { EpidemiologyAnswer, EpidemiologySurveyDTO } from '@/types';
import { toast } from 'sonner';
import { ArrowRight, ClipboardList, History } from 'lucide-react';
import { notifyFirstFormError } from '@/lib/form-errors';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido').optional().or(z.literal('')),
  telefone: z.string().optional().or(z.literal('')),

  areaPastagemCultivadaHa: z.coerce.number().min(0, 'Informe um valor válido').optional(),
  areaPastagemNaturalHa: z.coerce.number().min(0, 'Informe um valor válido').optional(),
  quantidadeVacasLeiteiras: z.coerce.number().min(0, 'Informe um valor válido').optional(),

  finalidadeCriacaoBovinos: z.enum(['leite', 'corte', 'mista', 'nao_se_aplica']),
  ordenha: z.enum(['manual', 'mecanica', 'nao_se_aplica']),
  ordenhaVezesAoDia: z.enum(['uma', 'duas', 'tres', 'nao_se_aplica']),

  contatoComJavalis: z.enum(['sim', 'nao']),

  avesAcessoAgua: z.enum(['sim', 'nao']),
  avesContatoSilvestres: z.enum(['sim', 'nao']),

  mordeduraMorcegoUltimos6Meses: z.enum(['sim', 'nao']),
});

type FormValues = z.infer<typeof schema>;

function toAnswerList(values: FormValues): EpidemiologyAnswer[] {
  return [
    { fieldId: 'a_email', value: values.email ?? '' },
    { fieldId: 'a_telefone', value: values.telefone ?? '' },

    { fieldId: 'b_area_pastagem_cultivada_ha', value: values.areaPastagemCultivadaHa ?? '' },
    { fieldId: 'b_area_pastagem_natural_ha', value: values.areaPastagemNaturalHa ?? '' },
    { fieldId: 'b_quantidade_vacas_leiteiras', value: values.quantidadeVacasLeiteiras ?? '' },
    { fieldId: 'b_finalidade_criacao_bovinos', value: values.finalidadeCriacaoBovinos },
    { fieldId: 'b_ordenha', value: values.ordenha },
    { fieldId: 'b_ordenha_vezes_ao_dia', value: values.ordenhaVezesAoDia },

    { fieldId: 'c_contato_com_javalis', value: values.contatoComJavalis },

    { fieldId: 'd_aves_acesso_agua', value: values.avesAcessoAgua },
    { fieldId: 'd_aves_contato_silvestres', value: values.avesContatoSilvestres },

    { fieldId: 'e_mordedura_morcego_ultimos_6_meses', value: values.mordeduraMorcegoUltimos6Meses },
  ];
}

function formatPtBrDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function QuestionarioEpidemiologico() {
  const { selectedProperty } = useAuth();
  const navigate = useNavigate();

  const [latest, setLatest] = useState<EpidemiologySurveyDTO | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(false);

  useEffect(() => {
    const loadLatest = async () => {
      if (!selectedProperty?.id) {
        setLatest(null);
        return;
      }

      try {
        setLoadingLatest(true);
        const data = await apiClient.get<EpidemiologySurveyDTO | null>('/questionario-epidemiologico/latest');
        setLatest(data);
      } catch (error) {
        console.error('Erro ao carregar último questionário:', error);
        setLatest(null);
      } finally {
        setLoadingLatest(false);
      }
    };

    void loadLatest();
  }, [selectedProperty?.id]);

  const status = useMemo(() => {
    if (!latest) {
      return { label: 'Pendente', variant: 'destructive' as const, helper: 'Nenhuma resposta registrada ainda.' };
    }

    const now = new Date();
    const due = new Date(latest.nextDueAt);
    if (now > due) {
      return {
        label: 'Pendente',
        variant: 'destructive' as const,
        helper: `Última resposta: ${formatPtBrDateTime(latest.submittedAt)}. Venceu em ${formatPtBrDateTime(latest.nextDueAt)}.`,
      };
    }

    return {
      label: 'Em dia',
      variant: 'secondary' as const,
      helper: `Última resposta: ${formatPtBrDateTime(latest.submittedAt)}. Próxima até ${formatPtBrDateTime(latest.nextDueAt)}.`,
    };
  }, [latest]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      telefone: '',
      areaPastagemCultivadaHa: undefined,
      areaPastagemNaturalHa: undefined,
      quantidadeVacasLeiteiras: undefined,
      finalidadeCriacaoBovinos: 'nao_se_aplica',
      ordenha: 'nao_se_aplica',
      ordenhaVezesAoDia: 'nao_se_aplica',
      contatoComJavalis: 'nao',
      avesAcessoAgua: 'nao',
      avesContatoSilvestres: 'nao',
      mordeduraMorcegoUltimos6Meses: 'nao',
    },
    mode: 'onBlur',
  });

  const onInvalid = () => {
    const { toastMessage } = notifyFirstFormError(form.formState.errors as any, {
      setFocus: form.setFocus,
      title: 'Ops! Tem um detalhe para ajustar:',
    });
    toast.error(toastMessage);
  };

  const finalidade = form.watch('finalidadeCriacaoBovinos');

  const onSubmit = (values: FormValues) => {
    if (!selectedProperty?.id) {
      toast.error('Selecione uma propriedade para responder o questionário');
      return;
    }

    if (finalidade !== 'leite') {
      form.setValue('ordenha', 'nao_se_aplica');
      form.setValue('ordenhaVezesAoDia', 'nao_se_aplica');
    }

    const normalizedValues = form.getValues();

    if (normalizedValues.finalidadeCriacaoBovinos === 'leite') {
      if (normalizedValues.ordenha === 'nao_se_aplica') {
        toast.error('Informe como é feita a ordenha');
        return;
      }
      if (normalizedValues.ordenhaVezesAoDia === 'nao_se_aplica') {
        toast.error('Informe quantas vezes por dia realiza a ordenha');
        return;
      }
    }

    const submit = async () => {
      try {
        const answers = toAnswerList(normalizedValues);
        const saved = await apiClient.post<EpidemiologySurveyDTO>('/questionario-epidemiologico', {
          answers,
        });

        setLatest(saved);
        toast.success('Questionário salvo com sucesso');
        navigate(`/questionario-epidemiologico/historico/${saved.id}`);
      } catch (error) {
        console.error('Erro ao salvar questionário:', error);
        toast.error('Não foi possível salvar o questionário');
      }
    };

    void submit();
  };

  const nextDuePreview = useMemo(() => {
    const now = new Date();
    return addMonths(now, 6).toLocaleDateString('pt-BR');
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary" />
            Questionário Epidemiológico
          </h1>
          <p className="text-muted-foreground">
            Atualização semestral (a cada 6 meses) para comunicação social em saúde animal
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => navigate('/questionario-epidemiologico/historico')}
            className="w-full sm:w-auto">
            <History className="w-4 h-4 mr-2" />
            Ver histórico
          </Button>
          <Badge variant={status.variant} className={cn('w-fit', status.variant === 'secondary' && 'bg-success/15 text-success border border-success/20')}>
            {status.label}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>{loadingLatest ? 'Carregando status...' : status.helper}</CardDescription>
        </CardHeader>
      </Card>

      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>A) Atualização de dados para comunicação social em saúde animal</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                placeholder="seuemail@exemplo.com"
                {...form.register('email')}
              />
              {form.formState.errors.email?.message && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input placeholder="(00) 00000-0000" {...form.register('telefone')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>B) Atualização de Exploração Pecuária de bovídeos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Área de pastagem cultivada (ha)</Label>
                <Input type="number" min={0} step={0.01} placeholder="0" {...form.register('areaPastagemCultivadaHa')} />
              </div>
              <div className="space-y-2">
                <Label>Área de pastagem natural (ha)</Label>
                <Input type="number" min={0} step={0.01} placeholder="0" {...form.register('areaPastagemNaturalHa')} />
              </div>
              <div className="space-y-2">
                <Label>Quantidade de vacas leiteiras (secas + lactação)</Label>
                <Input type="number" min={0} step={1} placeholder="0" {...form.register('quantidadeVacasLeiteiras')} />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Finalidade da criação de bovinos</Label>
              <RadioGroup
                value={form.watch('finalidadeCriacaoBovinos')}
                onValueChange={(v) => form.setValue('finalidadeCriacaoBovinos', v as FormValues['finalidadeCriacaoBovinos'])}
                className="grid gap-3 md:grid-cols-4"
              >
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="leite" />
                  Leite
                </label>
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="corte" />
                  Corte
                </label>
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="mista" />
                  Mista
                </label>
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="nao_se_aplica" />
                  Não se aplica
                </label>
              </RadioGroup>
            </div>

            <div className={cn('space-y-6', finalidade !== 'leite' && 'opacity-60')}>
              <div className="space-y-3">
                <Label>4.1. Se a finalidade for LEITE, como é feita a ordenha?</Label>
                <RadioGroup
                  value={form.watch('ordenha')}
                  onValueChange={(v) => form.setValue('ordenha', v as FormValues['ordenha'])}
                  className="grid gap-3 md:grid-cols-3"
                  disabled={finalidade !== 'leite'}
                >
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="manual" />
                    Ordenha manual
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="mecanica" />
                    Ordenhadeira mecânica
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="nao_se_aplica" />
                    Não se aplica
                  </label>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>4.2. Quantas vezes por dia realiza a ordenha?</Label>
                <RadioGroup
                  value={form.watch('ordenhaVezesAoDia')}
                  onValueChange={(v) => form.setValue('ordenhaVezesAoDia', v as FormValues['ordenhaVezesAoDia'])}
                  className="grid gap-3 md:grid-cols-4"
                  disabled={finalidade !== 'leite'}
                >
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="uma" />
                    Uma
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="duas" />
                    Duas
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="tres" />
                    Três
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="nao_se_aplica" />
                    Não se aplica
                  </label>
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>C) Suínos não tecnificados (subsistência)</CardTitle>
            <CardDescription>Preencher caso exista suínos de subsistência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>
              A criação permite contato com suínos asselvajados de vida livre (javalis e cruzados)?
            </Label>
            <RadioGroup
              value={form.watch('contatoComJavalis')}
              onValueChange={(v) => form.setValue('contatoComJavalis', v as FormValues['contatoComJavalis'])}
              className="grid gap-3 md:grid-cols-2"
            >
              <label className="flex items-center gap-2">
                <RadioGroupItem value="sim" />
                Sim
              </label>
              <label className="flex items-center gap-2">
                <RadioGroupItem value="nao" />
                Não
              </label>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>D) Aves não comerciais (subsistência)</CardTitle>
            <CardDescription>Preencher caso exista aves de subsistência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>As aves têm acesso a açude, tanque escavado, lagoa, rio ou outro espelho d’água?</Label>
              <RadioGroup
                value={form.watch('avesAcessoAgua')}
                onValueChange={(v) => form.setValue('avesAcessoAgua', v as FormValues['avesAcessoAgua'])}
                className="grid gap-3 md:grid-cols-2"
              >
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="sim" />
                  Sim
                </label>
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="nao" />
                  Não
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>As aves domésticas têm contato com aves de vida livre/silvestres?</Label>
              <RadioGroup
                value={form.watch('avesContatoSilvestres')}
                onValueChange={(v) => form.setValue('avesContatoSilvestres', v as FormValues['avesContatoSilvestres'])}
                className="grid gap-3 md:grid-cols-2"
              >
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="sim" />
                  Sim
                </label>
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="nao" />
                  Não
                </label>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>E) Raiva dos herbívoros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Observou animal com mordedura por morcego hematófago nos últimos 6 meses?</Label>
            <RadioGroup
              value={form.watch('mordeduraMorcegoUltimos6Meses')}
              onValueChange={(v) => form.setValue('mordeduraMorcegoUltimos6Meses', v as FormValues['mordeduraMorcegoUltimos6Meses'])}
              className="grid gap-3 md:grid-cols-2"
            >
              <label className="flex items-center gap-2">
                <RadioGroupItem value="sim" />
                Sim
              </label>
              <label className="flex items-center gap-2">
                <RadioGroupItem value="nao" />
                Não
              </label>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="font-medium">Ao salvar, o sistema registra no histórico da propriedade.</p>
              <p className="text-sm text-muted-foreground">Próxima data prevista: {nextDuePreview}.</p>
            </div>
            <Button type="submit" className="w-full md:w-auto">
              Salvar questionário
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
