import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, MessageCircle, Copy, QrCode } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PixConfig } from '@/services/api.service';
import { apiClient } from '@/lib/api-client';
import { PropertyDTO } from '@/types';

type PlanId = 'porteira' | 'piquete' | 'retiro' | 'estancia' | 'barao';

type PlanCatalogItem = {
  id: PlanId;
  name: string;
  price: number;
  maxCattle: number;
};

type SubscriptionDTO = {
  id: string;
  usuarioId: string;
  plano: PlanId;
  status: 'ativa' | 'cancelada' | 'inadimplente' | string;
  valorMensal?: number | null;
  inicioEm: string;
  fimEm?: string | null;
  criadoEm: string;
  atualizadoEm: string;
} | null;

export default function Bloqueado() {
  const { user, selectedProperty } = useAuth();
  const [pixConfig, setPixConfig] = useState<PixConfig | null>(null);
  const [pixLoading, setPixLoading] = useState(true);
  const [pixError, setPixError] = useState(false);

  const [plansCatalog, setPlansCatalog] = useState<PlanCatalogItem[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionDTO>(null);
  const [properties, setProperties] = useState<PropertyDTO[]>([]);
  const [loadingInfo, setLoadingInfo] = useState(true);

  useEffect(() => {
    const loadPix = async () => {
      try {
        setPixLoading(true);
        setPixError(false);
        const config = await apiClient.get<PixConfig | null>('/financeiro/pix-config');
        setPixConfig(config);
      } catch (error) {
        console.error('Erro ao carregar configuração PIX:', error);
        setPixConfig(null);
        setPixError(true);
      }
      setPixLoading(false);
    };

    void loadPix();
  }, []);

  useEffect(() => {
    const loadInfo = async () => {
      try {
        setLoadingInfo(true);
        const [catalog, sub, props] = await Promise.all([
          apiClient.get<PlanCatalogItem[]>('/planos'),
          apiClient.get<SubscriptionDTO>('/assinaturas/minha'),
          apiClient.get<PropertyDTO[]>('/propriedades/minhas'),
        ]);
        setPlansCatalog(catalog);
        setSubscription(sub);
        setProperties(props);
      } catch (error) {
        console.error('Erro ao carregar dados de plano/assinatura:', error);
        setPlansCatalog([]);
        setSubscription(null);
        setProperties([]);
      } finally {
        setLoadingInfo(false);
      }
    };

    if (user?.id) {
      void loadInfo();
    }
  }, [user?.id]);

  const effectivePixKey = useMemo(() => {
    return pixConfig?.pixKey;
  }, [pixConfig?.pixKey]);

  const effectiveQrCodeImage = useMemo(() => {
    return pixConfig?.qrCodeImage;
  }, [pixConfig?.qrCodeImage]);

  const totalCattleAllProperties = useMemo(() => {
    return properties.reduce((total, prop) => total + (prop.cattleCount ?? 0), 0);
  }, [properties]);

  const subscriptionPlanId: PlanId | null = subscription?.plano ?? null;
  const currentPlan = subscriptionPlanId
    ? (plansCatalog.find((p) => p.id === subscriptionPlanId) ?? null)
    : null;

  const effectiveMonthlyAmount = useMemo(() => {
    if (typeof subscription?.valorMensal === 'number') return subscription.valorMensal;
    if (currentPlan) return currentPlan.price;
    return null;
  }, [subscription?.valorMensal, currentPlan]);

  const dueDateText = useMemo(() => {
    const dateStr = subscription?.fimEm;
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('pt-BR');
  }, [subscription?.fimEm]);

  const handleWhatsAppSupport = () => {
    const userIdentifier = user?.cpfCnpj || 'Usuário não identificado';
    const message = encodeURIComponent(
      `Olá, sou ${user?.name} (${userIdentifier}). Minha conta está bloqueada por falta de pagamento e gostaria de regularizar minha situação.`
    );
    
    // Número do suporte (substitua pelo número real)
    const whatsappNumber = '5544991147084';
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const handleCopyPixKey = () => {
    if (!effectivePixKey) {
      toast({
        title: 'PIX indisponível',
        description: 'Não foi possível carregar a chave PIX no momento. Tente novamente.',
      });
      return;
    }
    navigator.clipboard.writeText(effectivePixKey);
    toast({
      title: 'Chave PIX Copiada',
      description: 'A chave PIX foi copiada para a área de transferência.',
    });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-red-50 to-orange-100 overflow-y-auto overflow-x-hidden">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-16 h-16 text-red-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Acesso Bloqueado
            </h1>
            <p className="text-gray-600">Sua conta está temporariamente suspensa</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Por que minha conta foi bloqueada?</CardTitle>
              <CardDescription>
                Identificamos pendências financeiras em sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Pagamento em atraso</strong>
                  <p className="mt-1">
                    Para liberar o acesso, efetue o pagamento e envie o comprovante no WhatsApp.
                  </p>
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Plano e Status</h3>
                {loadingInfo ? (
                  <p className="text-sm text-gray-600">Carregando dados do plano...</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plano atual:</span>
                      <span className="font-medium">{currentPlan?.name ?? subscription?.plano ?? '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor mensal:</span>
                      <span className="font-medium">
                        {typeof effectiveMonthlyAmount === 'number'
                          ? `R$ ${effectiveMonthlyAmount.toFixed(2).replace('.', ',')}`
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vencimento:</span>
                      <span className="font-medium">{dueDateText ?? '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cabeças atuais:</span>
                      <span className="font-medium">{totalCattleAllProperties.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Dados do Cliente</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium">{user?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CPF/CNPJ:</span>
                    <span className="font-medium">{user?.cpfCnpj}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Pagamento via PIX
              </CardTitle>
              <CardDescription>
                Faça o PIX e envie o comprovante no WhatsApp para liberação manual pelo suporte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pixLoading ? (
                <div className="bg-white border border-green-300 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Carregando dados do PIX...</p>
                </div>
              ) : pixError ? (
                <div className="bg-white border border-destructive/30 rounded-lg p-3">
                  <p className="text-sm text-destructive">
                    Não foi possível carregar os dados do PIX via backend.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tente novamente mais tarde ou entre em contato com o suporte.
                  </p>
                </div>
              ) : effectivePixKey ? (
                <div className="bg-white border border-green-300 rounded-lg p-3">
                  <Label className="text-xs text-gray-600 block mb-1">Chave PIX:</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-gray-100 p-2 rounded">
                      {effectivePixKey}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyPixKey}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : null}

              {!!effectiveQrCodeImage && !pixLoading && !pixError && (
                <div className="bg-white border border-green-300 rounded-lg p-3">
                  <Label className="text-xs text-gray-600 block mb-2">
                    Ou escaneie o QR Code:
                  </Label>
                  <div className="flex justify-center">
                    <img
                      src={effectiveQrCodeImage}
                      alt="QR Code PIX"
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleWhatsAppSupport}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar comprovante no WhatsApp
              </Button>
            </CardContent>
          </Card>

          <div className="text-center mt-6 text-sm text-gray-500">
            <p>
              O acesso será liberado manualmente após o envio do comprovante no WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={className} {...props}>
      {children}
    </label>
  );
}
