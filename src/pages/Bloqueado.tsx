import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, MessageCircle, CreditCard, Copy, QrCode } from 'lucide-react';
import { mockPixConfig } from '@/mocks/mock-admin';
import { toast } from '@/hooks/use-toast';

export default function Bloqueado() {
  const { user } = useAuth();

  const handleWhatsAppSupport = () => {
    const userIdentifier = user?.cpfCnpj || 'Usuário não identificado';
    const message = encodeURIComponent(
      `Olá, sou ${user?.name} (${userIdentifier}). Minha conta está bloqueada por falta de pagamento e gostaria de regularizar minha situação.`
    );
    
    // Número do suporte (substitua pelo número real)
    const whatsappNumber = '5565999999999';
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(mockPixConfig.pixKey);
    toast({
      title: 'Chave PIX Copiada',
      description: 'A chave PIX foi copiada para a área de transferência.',
    });
  };

  // Valor fictício baseado no plano do usuário
  const planPrices: Record<string, number> = {
    porteira: 29.90,
    piquete: 69.90,
    retiro: 129.90,
    estancia: 249.90,
    barao: 399.90,
  };

  const amountDue = 69.90; // Valor exemplo

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-16 h-16 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Acesso Bloqueado
          </h1>
          <p className="text-gray-600">
            Sua conta está temporariamente suspensa
          </p>
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
                  Há faturas vencidas que precisam ser regularizadas para continuar usando o AgroSaldo.
                </p>
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Detalhes da Pendência</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CPF/CNPJ:</span>
                  <span className="font-medium">{user?.cpfCnpj}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor devido:</span>
                  <span className="text-lg font-bold text-red-600">
                    R$ {amountDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Como regularizar?
            </CardTitle>
            <CardDescription>
              Escolha uma das opções abaixo para efetuar o pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* PIX */}
            <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-600 rounded-lg">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Pagamento via PIX</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Forma mais rápida - Liberação automática em até 10 minutos
                  </p>

                  <div className="bg-white border border-green-300 rounded-lg p-3 mb-3">
                    <Label className="text-xs text-gray-600 block mb-1">Chave PIX:</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm font-mono bg-gray-100 p-2 rounded">
                        {mockPixConfig.pixKey}
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

                  {mockPixConfig.qrCodeImage && (
                    <div className="bg-white border border-green-300 rounded-lg p-3">
                      <Label className="text-xs text-gray-600 block mb-2">
                        Ou escaneie o QR Code:
                      </Label>
                      <div className="flex justify-center">
                        <img
                          src={mockPixConfig.qrCodeImage}
                          alt="QR Code PIX"
                          className="w-48 h-48 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Outras formas de pagamento */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Outras formas de pagamento</h4>
              <p className="text-sm text-gray-600 mb-3">
                Entre em contato com o suporte para outras opções (boleto, cartão, etc.)
              </p>

              <Button
                className="w-full"
                variant="outline"
                onClick={handleWhatsAppSupport}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Falar com Suporte no WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Precisa de ajuda?
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Nossa equipe está pronta para ajudar a regularizar sua situação
                </p>
                <Button onClick={handleWhatsAppSupport}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chamar Suporte no WhatsApp
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>
            Após o pagamento, envie o comprovante pelo WhatsApp para liberação imediata do acesso.
          </p>
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
