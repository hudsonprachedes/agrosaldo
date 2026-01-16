import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { EpidemiologySurveyDTO } from '@/types';
import { ArrowLeft, ClipboardList, Eye } from 'lucide-react';

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

export default function QuestionarioEpidemiologicoHistorico() {
  const { selectedProperty } = useAuth();
  const navigate = useNavigate();

  const [surveys, setSurveys] = useState<EpidemiologySurveyDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!selectedProperty?.id) {
        setSurveys([]);
        return;
      }

      try {
        setLoading(true);
        const data = await apiClient.get<EpidemiologySurveyDTO[]>('/questionario-epidemiologico');
        setSurveys(data);
      } catch (error) {
        console.error('Erro ao carregar histórico do questionário:', error);
        setSurveys([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [selectedProperty?.id]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary" />
            Histórico do Questionário
          </h1>
          <p className="text-muted-foreground">Acesse respostas anteriores registradas para esta propriedade.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => navigate('/questionario-epidemiologico')} className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={() => navigate('/questionario-epidemiologico')} className="w-full sm:w-auto">
            Responder agora
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Respostas registradas</CardTitle>
          <CardDescription>
            {loading
              ? 'Carregando registros...'
              : surveys.length === 0
              ? 'Nenhuma resposta foi registrada ainda.'
              : `${surveys.length} registro(s) encontrado(s).`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="rounded-lg border p-6 text-center">
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : surveys.length === 0 ? (
            <div className="rounded-lg border p-6 text-center">
              <p className="font-medium">Você ainda não respondeu este questionário.</p>
              <p className="text-sm text-muted-foreground mt-1">Clique em “Responder agora” para criar o primeiro registro.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data de envio</TableHead>
                    <TableHead>Próxima (6 meses)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveys.map((s) => {
                    const now = new Date();
                    const due = new Date(s.nextDueAt);
                    const isOverdue = now > due;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{formatPtBrDateTime(s.submittedAt)}</TableCell>
                        <TableCell>{formatPtBrDateTime(s.nextDueAt)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={isOverdue ? 'destructive' : 'secondary'}
                            className={cn(!isOverdue && 'bg-success/15 text-success border border-success/20')}
                          >
                            {isOverdue ? 'Vencido' : 'Em dia'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/questionario-epidemiologico/historico/${s.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
