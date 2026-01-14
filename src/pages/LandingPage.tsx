import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Beef,
  BarChart3,
  Shield,
  Smartphone,
  FileCheck,
  Clock,
  CheckCircle,
  Star,
  ArrowRight,
  Menu,
  X,
  ChevronRight,
  Download,
  UserPlus,
  Upload,
  TrendingUp,
  FileText,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  Send,
  HelpCircle,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { plans } from '@/mocks/mock-auth';
import { 
  addNewsletterSubscriber, 
  getNewsletterCount,
  isEmailSubscribed 
} from '@/lib/indexeddb';

const features = [
  {
    icon: BarChart3,
    title: 'Dashboard Inteligente',
    description: 'Visualize o saldo do seu rebanho em tempo real, com gráficos e indicadores de compliance.',
  },
  {
    icon: Shield,
    title: 'Compliance Sanitária',
    description: 'Mantenha sua fazenda em dia com as exigências do INDEA, IAGRO e ADAPAR.',
  },
  {
    icon: Smartphone,
    title: 'App Mobile Offline',
    description: 'Lance nascimentos, mortes e vendas mesmo sem internet. Sincroniza automaticamente.',
  },
  {
    icon: FileCheck,
    title: 'Declaração Oficial',
    description: 'Gere a declaração no formato oficial com um clique. Envie por WhatsApp.',
  },
  {
    icon: Clock,
    title: 'Evolução Automática',
    description: 'O sistema evolui as faixas etárias automaticamente. Sem trabalho manual.',
  },
  {
    icon: Beef,
    title: 'Multi-espécies',
    description: 'Gerencie bovinos, equinos, ovinos, suínos e aves em um só lugar.',
  },
];

const testimonials = [
  {
    name: 'João Pedro Mendes',
    role: 'Proprietário',
    property: 'Fazenda Santa Maria',
    location: 'Campo Grande, MS',
    content: 'Acabou a dor de cabeça com planilha. Antes eu perdia horas conferindo dados e mesmo assim tinha erro. Com o AgroSaldo, meu saldo bate com o INDEA sempre. A evolução automática de faixas etárias me economiza um dia inteiro por mês.',
    metric: 'Reduzi 40% do tempo em controles',
    rating: 5,
    photo: 'https://ui-avatars.com/api/?name=João+Pedro+Mendes&size=128&background=10b981&color=fff',
  },
  {
    name: 'Maria Clara Santos',
    role: 'Gerente Operacional',
    property: 'Agropecuária Bela Vista',
    location: 'Dourados, MS',
    content: 'O app mobile é tão simples que até nossos colaboradores em campo conseguem lançar nascimentos e mortalidade pelo celular. Não preciso mais ir até a fazenda todo dia para atualizar os dados. A sincronização offline salvou nossa operação.',
    metric: 'Economizei R$ 8.000/ano em deslocamentos',
    rating: 5,
    photo: 'https://ui-avatars.com/api/?name=Maria+Clara+Santos&size=128&background=3b82f6&color=fff',
  },
  {
    name: 'Carlos Eduardo Silva',
    role: 'Proprietário',
    property: 'Rancho Ouro Verde',
    location: 'Três Lagoas, MS',
    content: 'Reduzi o tempo de declaração de 2 dias para 5 minutos. Antes era um inferno: conferir planilha, calcular idades, preencher formulário... Agora clico em "Gerar PDF" e envio direto para o INDEA. Sensacional! Nunca mais levei multa por prazo.',
    metric: 'Zero multas em 18 meses de uso',
    rating: 5,
    photo: 'https://ui-avatars.com/api/?name=Carlos+Eduardo+Silva&size=128&background=f59e0b&color=fff',
  },
  {
    name: 'Ana Paula Oliveira',
    role: 'Gestora de Rebanho',
    property: 'Fazenda São José',
    location: 'Corumbá, MS',
    content: 'Minha propriedade tem 2.800 cabeças. Antes eu tinha 3 planilhas desatualizadas e nunca sabia o saldo real. Com o AgroSaldo, controlo nascimentos, vendas e mortalidade em tempo real. O dashboard me dá visão completa do negócio.',
    metric: 'Aumento de 25% na precisão de estoque',
    rating: 5,
    photo: 'https://ui-avatars.com/api/?name=Ana+Paula+Oliveira&size=128&background=ec4899&color=fff',
  },
  {
    name: 'Roberto Almeida',
    role: 'Pecuarista',
    property: 'Estância Paraíso',
    location: 'Aquidauana, MS',
    content: 'O sistema offline é perfeito para quem trabalha em região sem internet. Lanço tudo no app durante a semana e quando volto para cidade ele sincroniza automático. Nunca perdi um dado. A câmera integrada facilita muito o registro visual.',
    metric: 'Eliminei 100% das anotações em papel',
    rating: 5,
    photo: 'https://ui-avatars.com/api/?name=Roberto+Almeida&size=128&background=8b5cf6&color=fff',
  },
  {
    name: 'Fernanda Costa',
    role: 'Médica Veterinária',
    property: 'Consultoria Boi Forte',
    location: 'Sidrolândia, MS',
    content: 'Recomendo o AgroSaldo para todos os meus clientes. O controle sanitário com registro de vacinas e a validação automática de GTA facilitam muito meu trabalho. A interface é limpa e os relatórios são completos. Suporte técnico nota 10!',
    metric: 'Atendo 30% mais clientes com melhor controle',
    rating: 5,
    photo: 'https://ui-avatars.com/api/?name=Fernanda+Costa&size=128&background=06b6d4&color=fff',
  },
  {
    name: 'Marcos Vinícius Souza',
    role: 'Administrador Rural',
    property: 'Grupo Pantanal Agro',
    location: 'Miranda, MS',
    content: 'Gerencio 5 propriedades diferentes. O sistema multi-tenant do AgroSaldo me permite trocar entre fazendas com um clique. Consigo comparar performance, acompanhar indicadores e gerar relatórios consolidados. Ferramenta indispensável para quem tem múltiplas operações.',
    metric: 'Centralizei controle de 12.000 cabeças',
    rating: 5,
    photo: 'https://ui-avatars.com/api/?name=Marcos+Vinicius+Souza&size=128&background=14b8a6&color=fff',
  },
  {
    name: 'Juliana Ferreira',
    role: 'Zootecnista',
    property: 'Fazenda Esperança',
    location: 'Coxim, MS',
    content: 'A análise de índices zootécnicos me ajudou a identificar gargalos na produção. Com os gráficos de evolução do rebanho, consegui otimizar manejo e reduzir mortalidade. O WhatsApp compartilhamento facilita comunicação com o proprietário que mora em outra cidade.',
    metric: 'Reduzi 18% da taxa de mortalidade',
    rating: 5,
    photo: 'https://ui-avatars.com/api/?name=Juliana+Ferreira&size=128&background=f43f5e&color=fff',
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [newsletterEmail, setNewsletterEmail] = React.useState('');
  const [faqOpen, setFaqOpen] = React.useState<number | null>(null);
  const [subscriberCount, setSubscriberCount] = useState(0);

  useEffect(() => {
    // Carrega contador de inscritos
    getNewsletterCount().then(setSubscriberCount).catch(() => setSubscriberCount(0));
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) {
      toast.error('Digite um email válido');
      return;
    }

    try {
      const isSubscribed = await isEmailSubscribed(newsletterEmail);
      if (isSubscribed) {
        toast.error('Este email já está cadastrado!');
        return;
      }

      await addNewsletterSubscriber(newsletterEmail, 'landing_page');
      const newCount = await getNewsletterCount();
      setSubscriberCount(newCount);
      
      toast.success('Inscrição realizada! Você receberá novidades em breve.');
      setNewsletterEmail('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao realizar inscrição';
      toast.error(message);
    }
  };

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img
                src="/agrosaldo-logo.png"
                alt="AgroSaldo"
                className="h-8 w-auto object-contain"
                loading="eager"
              />
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#funcionalidades" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Funcionalidades
              </a>
              <a href="#planos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Planos
              </a>
              <a href="#depoimentos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Depoimentos
              </a>
              <Link to="/login">
                <Button variant="outline" size="sm">Entrar</Button>
              </Link>
              <Link to="/login">
                <Button size="sm">Criar Conta</Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border p-4 space-y-4">
            <a href="#funcionalidades" className="block text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Funcionalidades
            </a>
            <a href="#planos" className="block text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Planos
            </a>
            <a href="#depoimentos" className="block text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Depoimentos
            </a>
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="flex-1">
                <Button variant="outline" className="w-full">Entrar</Button>
              </Link>
              <Link to="/login" className="flex-1">
                <Button className="w-full">Criar Conta</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 animate-fade-in">
              ✨ Novo: App Mobile com modo offline
            </Badge>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in">
              Controle oficial do seu rebanho,{' '}
              <span className="gradient-text">sem planilha.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in max-w-2xl mx-auto" style={{ animationDelay: '100ms' }}>
              O AgroSaldo é o sistema de gestão pecuária que garante que seu saldo físico bata com o oficial. 
              Simples para o peão, completo para o dono.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold">
                  Começar Grátis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#funcionalidades">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg">
                  Ver Funcionalidades
                </Button>
              </a>
            </div>

            <p className="text-sm text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
              ✓ 7 dias grátis &nbsp; ✓ Sem cartão de crédito &nbsp; ✓ Cancele quando quiser
            </p>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-16 relative animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="relative mx-auto max-w-5xl">
              <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
                <div className="bg-muted h-8 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-error/50" />
                  <div className="w-3 h-3 rounded-full bg-warning/50" />
                  <div className="w-3 h-3 rounded-full bg-success/50" />
                </div>
                <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <div className="text-center">
                    <Beef className="w-24 h-24 text-primary/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Preview do Dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                Quem Somos
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                O AgroSaldo nasceu da necessidade real de pecuaristas que perdiam horas 
                reconciliando planilhas com declarações oficiais. Desenvolvido por quem 
                entende do campo.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Missão</h3>
                    <p className="text-muted-foreground">Simplificar a gestão pecuária e garantir compliance sanitária para todos.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Visão</h3>
                    <p className="text-muted-foreground">Ser a plataforma #1 de gestão pecuária do Brasil até 2026.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Valores</h3>
                    <p className="text-muted-foreground">Simplicidade, transparência e foco no produtor rural.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl flex items-center justify-center">
                <Beef className="w-32 h-32 text-primary/40" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como Funciona
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              5 passos simples para ter seu rebanho 100% controlado
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {[
              {
                step: 1,
                icon: UserPlus,
                title: 'Crie sua conta',
                description: '7 dias grátis sem cartão de crédito',
              },
              {
                step: 2,
                icon: Upload,
                title: 'Importe o estoque',
                description: 'Cole seu saldo atual ou importe planilha',
              },
              {
                step: 3,
                icon: Smartphone,
                title: 'Lance movimentações',
                description: 'Nascimentos, vendas, mortes pelo celular',
              },
              {
                step: 4,
                icon: TrendingUp,
                title: 'Acompanhe evolução',
                description: 'Faixas etárias atualizam automaticamente',
              },
              {
                step: 5,
                icon: FileText,
                title: 'Gere declarações',
                description: 'Formato oficial INDEA/IAGRO em 1 clique',
              },
            ].map((item, index) => (
              <div 
                key={item.step}
                className="relative animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-9 h-9 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                {index < 4 && (
                  <div className="hidden md:block absolute top-10 left-full w-full">
                    <ArrowRight className="w-6 h-6 text-primary/30 -translate-x-1/2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              O Sistema
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para manter o controle do seu rebanho, em qualquer lugar.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className="hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Depoimentos
            </h2>
            <p className="text-lg text-muted-foreground">
              Mais de 500 pecuaristas já transformaram sua gestão com AgroSaldo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={testimonial.name}
                className="animate-fade-in hover:shadow-card-hover transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <img 
                      src={testimonial.photo} 
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground leading-tight">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      <p className="text-xs text-primary font-medium">{testimonial.property}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {testimonial.location}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                  
                  <p className="text-sm text-foreground mb-4 leading-relaxed">"{testimonial.content}"</p>
                  
                  <div className="pt-3 border-t border-border">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {testimonial.metric}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Planos
            </h2>
            <p className="text-lg text-muted-foreground">
              Escolha o plano ideal para o tamanho do seu rebanho
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...plans].sort((a, b) => a.price - b.price).map((plan, index) => (
              <Card 
                key={plan.id}
                className={`relative animate-fade-in ${plan.id === 'retiro' ? 'border-primary border-2 shadow-lg' : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.id === 'retiro' && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Mais Popular
                  </Badge>
                )}
                <CardContent className="p-6 text-center">
                  <h3 className="font-display font-bold text-xl text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-foreground">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    {plan.maxCattle === Infinity ? 'Ilimitado' : `Até ${plan.maxCattle.toLocaleString()} cabeças`}
                  </p>
                  <Link to="/login">
                    <Button 
                      variant={plan.id === 'retiro' ? 'default' : 'outline'}
                      className="w-full"
                    >
                      Escolher
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-muted-foreground">
              Tire suas dúvidas sobre o AgroSaldo
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: 'Como funciona o período de teste gratuito?',
                answer: 'Você tem 7 dias completos para testar todas as funcionalidades do AgroSaldo sem custo. Não pedimos cartão de crédito no cadastro e você pode cancelar a qualquer momento.',
              },
              {
                question: 'O app funciona sem internet?',
                answer: 'Sim! O app mobile foi desenvolvido com tecnologia offline-first. Você pode lançar nascimentos, mortes, vendas e vacinas mesmo sem conexão. Quando conectar novamente, os dados sincronizam automaticamente.',
              },
              {
                question: 'Posso migrar minha planilha atual para o sistema?',
                answer: 'Sim! Você pode importar seu estoque atual via planilha Excel ou inserir manualmente o saldo por faixa etária. Nossa equipe também oferece suporte gratuito na primeira importação.',
              },
              {
                question: 'O sistema garante compliance com INDEA/IAGRO?',
                answer: 'Sim! O AgroSaldo gera declarações no formato oficial exigido pelos órgãos sanitários estaduais. As faixas etárias seguem as regras de evolução oficial e você pode exportar relatórios em PDF a qualquer momento.',
              },
              {
                question: 'Quantos usuários podem acessar minha fazenda?',
                answer: 'Todos os planos incluem usuários ilimitados. Você pode convidar proprietários, gerentes e peões, cada um com permissões específicas. O sistema é multi-tenant e garante isolamento total dos dados.',
              },
              {
                question: 'Como funciona a GTA eletrônica?',
                answer: 'O AgroSaldo valida o formato correto da GTA por estado (MS, MT, GO, SP, MG, RS, etc). Ao lançar uma venda, você informa o número da GTA e o sistema valida se está no padrão correto e dentro do prazo de validade.',
              },
              {
                question: 'Posso cancelar minha assinatura a qualquer momento?',
                answer: 'Sim! Não há fidelidade. Você pode cancelar quando quiser e seus dados ficam disponíveis por 90 dias para exportação. Não há multa ou cobrança adicional.',
              },
              {
                question: 'O que acontece se eu exceder o limite de cabeças do meu plano?',
                answer: 'O sistema enviará um alerta quando você atingir 80% do limite. Se exceder, você terá 15 dias para fazer upgrade. Durante esse período, pode continuar usando normalmente sem bloqueios.',
              },
              {
                question: 'Vocês oferecem treinamento?',
                answer: 'Sim! Oferecemos vídeos tutoriais, documentação completa e suporte via WhatsApp. Para clientes dos planos Estância e Barão, oferecemos treinamento personalizado online.',
              },
              {
                question: 'Como funciona o suporte?',
                answer: 'Oferecemos suporte via WhatsApp em horário comercial (seg-sex 8h-18h). Clientes dos planos superiores têm prioridade no atendimento e acesso a um gerente de conta dedicado.',
              },
            ].map((faq, index) => (
              <Card 
                key={index}
                className="cursor-pointer hover:shadow-md transition-shadow animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => toggleFaq(index)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <HelpCircle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-semibold text-foreground">{faq.question}</h3>
                        <ChevronRight 
                          className={`w-5 h-5 text-muted-foreground transition-transform shrink-0 ${
                            faqOpen === index ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                      {faqOpen === index && (
                        <p className="text-muted-foreground mt-3 animate-fade-in">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
            Pronto para simplificar sua gestão?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Comece agora e tenha 7 dias grátis para testar todas as funcionalidades.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold">
                Criar Conta Grátis
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                  <Beef className="w-5 h-5 text-foreground" />
                </div>
                <span className="font-display font-bold text-lg">AgroSaldo</span>
              </div>
              <p className="text-sm opacity-70 mb-6">
                Controle oficial do seu rebanho, sem planilha. Simples para o peão, completo para o dono.
              </p>
              <div className="flex gap-3">
                <a 
                  href="https://linkedin.com/company/agrosaldo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a 
                  href="https://instagram.com/agrosaldo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="https://wa.me/5567999999999" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-3 text-sm opacity-70">
                <li><a href="#funcionalidades" className="hover:opacity-100 transition-opacity">Funcionalidades</a></li>
                <li><a href="#planos" className="hover:opacity-100 transition-opacity">Planos</a></li>
                <li><Link to="/blog" className="hover:opacity-100 transition-opacity">Blog</Link></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Atualizações</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-4">Recursos</h3>
              <ul className="space-y-3 text-sm opacity-70">
                <li><a href="#" className="hover:opacity-100 transition-opacity">Documentação</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Tutoriais</a></li>
                <li><Link to="/contato" className="hover:opacity-100 transition-opacity">Contato</Link></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Suporte</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Newsletter</h3>
                {subscriberCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {subscriberCount} inscritos
                  </Badge>
                )}
              </div>
              <p className="text-sm opacity-70 mb-4">
                Receba dicas de gestão pecuária e novidades do AgroSaldo
              </p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <Input 
                  type="email"
                  placeholder="seu@email.com"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-background/10 border-background/20 text-background placeholder:text-background/50"
                  required
                />
                <Button 
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Inscrever
                </Button>
              </form>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-background/10">
            <div className="flex gap-6 text-sm opacity-70">
              <a href="#" className="hover:opacity-100 transition-opacity">Termos de Uso</a>
              <a href="#" className="hover:opacity-100 transition-opacity">Privacidade</a>
              <a href="#" className="hover:opacity-100 transition-opacity">LGPD</a>
            </div>
            <div className="text-sm opacity-70">
              © {new Date().getFullYear()} AgroSaldo. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
