import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { EpidemiologySurveyDTO } from '@/types';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import PageSkeleton from '@/components/PageSkeleton';

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

const FIELD_LABELS: Record<string, string> = {
  a_email: 'A) E-mail',
  a_telefone: 'A) Telefone',

  b_area_pastagem_cultivada_ha: 'B) Área de pastagem cultivada (ha)',
  b_area_pastagem_natural_ha: 'B) Área de pastagem natural (ha)',
  b_quantidade_vacas_leiteiras: 'B) Quantidade de vacas leiteiras (secas + lactação)',
  b_finalidade_criacao_bovinos: 'B) Finalidade da criação de bovinos',
  b_ordenha: 'B) Se LEITE: como é feita a ordenha',
  b_ordenha_vezes_ao_dia: 'B) Se LEITE: quantas vezes por dia realiza a ordenha',

  c_contato_com_javalis: 'C) Contato com javalis/cruzados',

  d_aves_acesso_agua: 'D) Aves com acesso a espelho d’água',
  d_aves_contato_silvestres: 'D) Contato com aves silvestres',

  e_mordedura_morcego_ultimos_6_meses: 'E) Mordedura por morcego hematófago (últimos 6 meses)',
};

function formatValue(value: unknown) {
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string') {
    if (value === 'sim') return 'Sim';
    if (value === 'nao') return 'Não';
    if (value === 'leite') return 'Leite';
    if (value === 'corte') return 'Corte';
    if (value === 'mista') return 'Mista';
    if (value === 'nao_se_aplica') return 'Não se aplica';
    if (value === 'manual') return 'Ordenha manual';
    if (value === 'mecanica') return 'Ordenhadeira mecânica';
    if (value === 'uma') return 'Uma';
    if (value === 'duas') return 'Duas';
    if (value === 'tres') return 'Três';
    return value;
  }
  return String(value ?? '');
}

export default function QuestionarioEpidemiologicoDetalhe() {
  const { selectedProperty } = useAuth();
  const navigate = useNavigate();
  const params = useParams();

  const [survey, setSurvey] = useState<EpidemiologySurveyDTO | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!selectedProperty?.id || !params.id) {
        setSurvey(null);
        return;
      }

      try {
        setLoading(true);
        const data = await apiClient.get<EpidemiologySurveyDTO>(`/questionario-epidemiologico/${params.id}`);
        setSurvey(data);
      } catch (error) {
        console.error('Erro ao carregar detalhe do questionário:', error);
        setSurvey(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [params.id, selectedProperty?.id]);

  const status = useMemo(() => {
    if (!survey) return null;
    const now = new Date();
    const due = new Date(survey.nextDueAt);
    const isOverdue = now > due;
    return {
      isOverdue,
      label: isOverdue ? 'Vencido' : 'Em dia',
    };
  }, [survey]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Carregando...</h1>
          <Button variant="outline" onClick={() => navigate('/questionario-epidemiologico/historico')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
        <PageSkeleton header={false} cards={0} lines={10} />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Resposta não encontrada</h1>
          <Button variant="outline" onClick={() => navigate('/questionario-epidemiologico/historico')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Não foi possível localizar esse registro no histórico desta propriedade.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary" />
            Resposta do Questionário
          </h1>
          <p className="text-muted-foreground">Registro gravado no histórico da propriedade</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/questionario-epidemiologico/historico')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao histórico
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <span>Metadados</span>
            {status && (
              <Badge
                variant={status.isOverdue ? 'destructive' : 'secondary'}
                className={cn(!status.isOverdue && 'bg-success/15 text-success border border-success/20')}
              >
                {status.label}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Enviado em {formatPtBrDateTime(survey.submittedAt)} | Próxima até {formatPtBrDateTime(survey.nextDueAt)}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Respostas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {survey.answers.map((a) => {
            const label = FIELD_LABELS[a.fieldId] ?? a.fieldId;
            return (
              <div key={a.fieldId} className="space-y-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{formatValue(a.value)}</p>
                <Separator />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
