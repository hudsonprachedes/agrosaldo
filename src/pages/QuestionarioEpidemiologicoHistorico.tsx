import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getEpidemiologySurveyHistory, StoredEpidemiologySurvey } from '@/lib/indexeddb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, ClipboardList } from 'lucide-react';

export default function QuestionarioEpidemiologicoHistorico() {
  const { selectedProperty } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [surveys, setSurveys] = useState<StoredEpidemiologySurvey[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!selectedProperty) return;
      setIsLoading(true);
      try {
        const list = await getEpidemiologySurveyHistory(selectedProperty.id);
        const ordered = [...list].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setSurveys(ordered);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [selectedProperty]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
          <p>Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-green-700 flex items-center gap-2">
              <ClipboardList className="w-7 h-7" /> Histórico do Questionário
            </h1>
            <p className="text-gray-600">Consulte os envios anteriores do questionário epidemiológico</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
          </div>
        </div>

        {surveys.length === 0 ? (
          <Alert className="mb-6">
            <AlertDescription>
              Nenhum histórico encontrado para esta propriedade.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {surveys.map((s) => (
              <Card key={s.id} className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-base text-green-700 flex items-center justify-between">
                    <span>Envio em {new Date(s.submittedAt).toLocaleDateString('pt-BR')}</span>
                    <span className="text-xs font-normal text-green-800/80">Versão {s.version}</span>
                  </CardTitle>
                  <CardDescription>
                    Próxima avaliação: {new Date(s.nextDueAt).toLocaleDateString('pt-BR')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {s.answers.length} respostas registradas
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
