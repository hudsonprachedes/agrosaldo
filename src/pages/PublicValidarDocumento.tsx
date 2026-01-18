import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';

type ValidationResponse = {
  valid: boolean;
  documentNumber: string | null;
};

export default function PublicValidarDocumento() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canValidate = useMemo(() => token.length > 0, [token.length]);

  useEffect(() => {
    if (!canValidate) {
      setResult(null);
      setError('Token não informado');
      return;
    }

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<ValidationResponse>(`/documentos-publicos/validar?token=${encodeURIComponent(token)}`);
        setResult(res);
      } catch (e) {
        setResult(null);
        setError('Não foi possível validar este documento');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [canValidate, token]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Validação de Documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Esta validação retorna apenas o número do documento e seu status (válido/inválido).
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase text-muted-foreground">Documento Nº</div>
              <div className="text-lg font-semibold">
                {loading ? 'Validando…' : (result?.documentNumber ?? '-')}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase text-muted-foreground">Status</div>
              {loading ? (
                <Badge variant="secondary">Carregando</Badge>
              ) : result ? (
                <Badge variant={result.valid ? 'secondary' : 'destructive'}>
                  {result.valid ? 'Válido' : 'Inválido'}
                </Badge>
              ) : (
                <Badge variant="destructive">Indisponível</Badge>
              )}
            </div>

            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}

            <div className="pt-2">
              <Button variant="outline" onClick={() => window.location.assign('/')}>Voltar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
