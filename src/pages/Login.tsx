import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import InputMask from 'react-input-mask';
import { Beef, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Login() {
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isCnpj = cpfCnpj.replace(/\D/g, '').length > 11;
  const mask = isCnpj ? '99.999.999/9999-99' : '999.999.999-999';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = await login(cpfCnpj, password);
    
    if (success) {
      toast.success('Login realizado com sucesso!');
      navigate('/selecionar-propriedade');
    } else {
      toast.error('CPF/CNPJ ou senha inválidos');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Beef className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">AgroSaldo</h1>
          <p className="text-muted-foreground mt-1">Controle oficial do seu rebanho, sem planilha.</p>
        </div>

        {/* Login Card */}
        <Card className="animate-scale-in shadow-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-display text-xl">Entrar</CardTitle>
            <CardDescription>
              Acesse sua conta para gerenciar seu rebanho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
                <InputMask
                  mask={mask}
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  maskChar=""
                >
                  {(inputProps: any) => (
                    <Input
                      {...inputProps}
                      id="cpfCnpj"
                      placeholder="000.000.000-00"
                      className="h-12"
                      autoComplete="username"
                    />
                  )}
                </InputMask>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="h-12 pr-12"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-semibold text-base"
                disabled={isLoading || !cpfCnpj || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <a href="#" className="text-sm text-primary hover:underline">
                Esqueci minha senha
              </a>
            </div>

            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground text-center mb-2">
                Credenciais de demonstração:
              </p>
              <div className="text-xs text-center space-y-1">
                <p><strong>Produtor:</strong> 123.456.789-00 / 123456</p>
                <p><strong>Admin:</strong> 00.000.000/0001-00 / admin123</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Não tem conta?{' '}
          <a href="/" className="text-primary font-medium hover:underline">
            Conheça o AgroSaldo
          </a>
        </p>
      </div>
    </div>
  );
}
