import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Beef,
  CheckCircle,
  ChevronRight,
  Clock,
  FileCheck,
  FileText,
  HelpCircle,
  Leaf,
  LineChart,
  Linkedin,
  MapPin,
  Menu,
  Phone,
  Send,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { plans } from '@/lib/plans';
import { addNewsletterSubscriber, getNewsletterCount, isEmailSubscribed } from '@/lib/indexeddb';
import heroBackground from '@/assets/hero-background.jpg';
import usePageMeta from '@/hooks/usePageMeta';
import { getFaqPageSchema, getSoftwareApplicationSchema, organizationSchema } from '@/lib/seo';

const heroHighlights = [
  {
    icon: LineChart,
    title: 'Indicadores vivos',
    description: 'Alertas proativos e evolução por faixa etária.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance nativo',
    description: 'Relatórios oficiais e auditoria completa.',
  },
  {
    icon: Sparkles,
    title: 'Onboarding humano',
    description: 'Equipe acompanha seus primeiros 30 dias.',
  },
  {
    icon: Leaf,
    title: 'Operação sustentável',
    description: 'GTA validada e rastreabilidade ambiental.',
  },
];

const features = [
  {
    icon: BarChart3,
    title: 'Dashboard inteligente',
    description: 'Saldo físico x oficial em tempo real, com gráficos e alertas.',
  },
  {
    icon: Shield,
    title: 'Compliance sanitário',
    description: 'Fluxo nativo para INDEA, IAGRO, ADAPAR e demais órgãos.',
  },
  {
    icon: Smartphone,
    title: 'App offline',
    description: 'Lance nascimentos, mortes e vendas sem internet.',
  },
  {
    icon: FileCheck,
    title: 'Declaração oficial',
    description: 'PDF pronto em 1 clique para enviar ao órgão sanitarista.',
  },
  {
    icon: Clock,
    title: 'Evolução automática',
    description: 'Faixas etárias atualizadas diariamente sem planilha.',
  },
  {
    icon: Beef,
    title: 'Multi-espécies',
    description: 'Bovinos, equinos, ovinos, suínos e aves em um só painel.',
  },
];

const testimonials = [
  {
    name: 'João Pedro Mendes',
    role: 'Proprietário · Fazenda Santa Maria',
    location: 'Campo Grande, MS',
    content:
      'Acabou a dor de cabeça com planilha. Meu saldo bate com o INDEA sempre e a evolução automática me economiza um dia inteiro por mês.',
    metric: 'Reduzi 40% do tempo em controles',
    rating: 5,
    photo: 'https://ui-avatars.com/api/?name=João+Pedro+Mendes&size=128&background=10b981&color=fff',
  },
  {
    name: 'Maria Clara Santos',
    role: 'Gerente Operacional · Agropecuária Bela Vista',
    location: 'Dourados, MS',
    content:
      'O app é tão simples que nossos vaqueiros lançam pelo celular. A sincronização offline salvou nossa operação no campo.',
    metric: 'Economizei R$ 8.000/ano em deslocamentos',
    rating: 5,
    photo: 'https://ui-avatars.com/api/?name=Maria+Clara+Santos&size=128&background=3b82f6&color=fff',
  },
  {
    name: 'Carlos Eduardo Silva',
    role: 'Proprietário · Rancho Ouro Verde',
    location: 'Três Lagoas, MS',
    content:
      'Declaração oficial caiu de 2 dias para 5 minutos. Hoje clico em gerar PDF e envio direto para o INDEA.',
    metric: 'Zero multas em 18 meses',
    rating: 5,
    photo: 'https://ui-avatars.com/api/?name=Carlos+Eduardo+Silva&size=128&background=f59e0b&color=fff',
  },
  {
    name: 'Ana Paula Oliveira',
    role: 'Gestora de Rebanho · Fazenda São José',
    location: 'Corumbá, MS',
    content:
      'Controlo 2.800 cabeças em tempo real. O dashboard me dá visão completa e confiança para decidir rápido.',
    metric: 'Aumento de 25% na precisão de estoque',
    rating: 5,
    photo: 'https://ui-avatars.com/api/?name=Ana+Paula+Oliveira&size=128&background=ec4899&color=fff',
  },
];

const steps = [
  {
    step: 1,
    icon: UserPlus,
    title: 'Crie sua conta',
    description: '7 dias grátis · sem cartão',
  },
  {
    step: 2,
    icon: Upload,
    title: 'Importe o estoque',
    description: 'Planilha ou inserção assistida',
  },
  {
    step: 3,
    icon: Smartphone,
    title: 'Lance movimentações',
    description: 'Aplicativo offline-first',
  },
  {
    step: 4,
    icon: TrendingUp,
    title: 'Acompanhe indicadores',
    description: 'Faixas etárias e alertas automáticos',
  },
  {
    step: 5,
    icon: FileText,
    title: 'Gere declarações',
    description: 'PDF oficial pronto em 1 clique',
  },
];

const faqs = [
  {
    question: 'Como funciona o período de teste gratuito?',
    answer:
      'Você tem 7 dias completos para testar todas as funcionalidades sem custo. Não pedimos cartão no cadastro e você pode cancelar a qualquer momento.',
  },
  {
    question: 'O app funciona sem internet?',
    answer:
      'Sim! O aplicativo foi desenhado com tecnologia offline-first. Lance tudo no campo e sincronize automaticamente quando voltar ao sinal.',
  },
  {
    question: 'Posso migrar minha planilha atual?',
    answer:
      'É só importar seu estoque via Excel ou copiar/colar seus dados. Nossa equipe ajuda gratuitamente na primeira carga.',
  },
  {
    question: 'O sistema garante compliance com órgãos estaduais?',
    answer:
      'Sim. Seguimos as mesmas regras de evolução e formatos exigidos por INDEA, IAGRO, ADAPAR e demais órgãos. Relatórios exportados em PDF oficial.',
  },
  {
    question: 'Quantos usuários posso cadastrar?',
    answer:
      'Usuários ilimitados em todos os planos. Defina permissões para proprietários, gerentes e peões com isolamento total de dados.',
  },
  {
    question: 'Posso cancelar quando quiser?',
    answer:
      'Sem fidelidade. Você cancela quando desejar e ainda tem 90 dias para exportar seus dados, sem multas ou taxas extras.',
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getNewsletterCount().then(setSubscriberCount).catch(() => setSubscriberCount(0));
  }, []);

  const structuredData = useMemo(
    () => [
      { id: 'organization-schema', data: organizationSchema },
      { id: 'software-schema', data: getSoftwareApplicationSchema() },
      {
        id: 'landing-faq-schema',
        data: getFaqPageSchema(faqs, {
          url: 'https://agrosaldo.com/#faq',
          name: 'Perguntas frequentes AgroSaldo',
        }),
      },
    ],
    []
  );

  usePageMeta({ page: 'home', structuredData });

  const handleNewsletterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error('Digite um email válido.');
      return;
    }

    try {
      const alreadySubscribed = await isEmailSubscribed(newsletterEmail);
      if (alreadySubscribed) {
        toast.error('Este email já está cadastrado!');
        return;
      }
      await addNewsletterSubscriber(newsletterEmail, 'landing_page');
      const count = await getNewsletterCount();
      setSubscriberCount(count);
      toast.success('Inscrição realizada! Em breve enviaremos novidades.');
      setNewsletterEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar email';
      toast.error(message);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#031006] text-white">
      <div className="absolute inset-0">
        <img src={heroBackground} alt="Produtor no campo" className="h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#031006] via-[#072312] to-[#0b3a1f] opacity-95" />
        <div className="absolute -top-24 right-0 h-[28rem] w-[28rem] rounded-full bg-emerald-400/25 blur-[220px]" />
        <div className="absolute bottom-0 -left-12 h-[26rem] w-[26rem] rounded-full bg-lime-400/15 blur-[220px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <img
                src="/agrosaldo-logo.png"
                alt="AgroSaldo"
                className="h-10 w-10 rounded-full border border-white/20 object-cover shrink-0"
              />
              <span className="hidden font-display text-lg font-semibold tracking-wide text-white/90 sm:inline">
                AgroSaldo
              </span>
            </div>

            <div className="hidden items-center gap-8 md:flex">
              <a href="#funcionalidades" className="text-sm font-medium text-white/70 hover:text-white">
                Funcionalidades
              </a>
              <a href="#planos" className="text-sm font-medium text-white/70 hover:text-white">
                Planos
              </a>
              <a href="#depoimentos" className="text-sm font-medium text-white/70 hover:text-white">
                Depoimentos
              </a>
              <Link to="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10"
                >
                  Entrar
                </Button>
              </Link>
              <Link to="/cadastro">
                <Button size="sm" className="bg-white text-emerald-900 hover:bg-white/90">
                  Criar Conta
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <Link to="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-white/40 bg-transparent px-3 text-xs text-white hover:bg-white/10"
                >
                  Entrar
                </Button>
              </Link>
              <Link to="/cadastro">
                <Button size="sm" className="h-9 bg-white px-3 text-xs text-emerald-900 hover:bg-white/90">
                  Criar
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                onClick={() => setMobileMenuOpen(prev => !prev)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-white md:hidden hidden"
              onClick={() => setMobileMenuOpen(prev => !prev)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-white/10 bg-black/80 px-4 py-4 md:hidden">
              <div className="flex flex-col gap-4 text-sm font-medium text-white">
                <a
                  href="#funcionalidades"
                  className="block rounded-full px-4 py-2 hover:bg-white/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Funcionalidades
                </a>
                <a
                  href="#planos"
                  className="block rounded-full px-4 py-2 hover:bg-white/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Planos
                </a>
                <a
                  href="#depoimentos"
                  className="block rounded-full px-4 py-2 hover:bg-white/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Depoimentos
                </a>
              </div>
            </div>
          )}
        </nav>

        <main className="flex-1 pt-24">
          <section className="overflow-hidden pb-20 pt-16">
            <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-6 animate-slide-in-left">
                <Badge className="w-fit border border-white/30 bg-white/10 text-[0.65rem] uppercase tracking-[0.35em] text-white">
                  Nova experiência
                </Badge>
                <h1 className="font-display text-4xl leading-tight text-white md:text-5xl lg:text-6xl">
                  Controle oficial do seu rebanho com uma atmosfera feita para inspirar confiança todos os dias.
                </h1>
                <p className="text-lg text-white/75">
                  O AgroSaldo entrega indicadores vivos, compliance automático e um visual imersivo. Você acorda com clareza,
                  delega com precisão e dorme tranquilo sabendo que seu saldo físico bate com o oficial.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {heroHighlights.map(({ icon: Icon, title, description }) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur transition hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-white/10 p-2">
                          <Icon className="h-5 w-5 text-emerald-100" />
                        </div>
                        <p className="font-semibold text-white">{title}</p>
                      </div>
                      <p className="mt-2 text-sm text-white/70">{description}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link to="/login" className="flex-1">
                    <Button className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-lg font-semibold text-white shadow-lg shadow-emerald-500/30 hover:brightness-110">
                      Começar agora
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="flex flex-1 items-center justify-center rounded-full border-white/40 bg-transparent text-white hover:bg-white/10"
                    onClick={() => navigate('/contato')}
                  >
                    Falar com especialista
                  </Button>
                </div>
                <p className="text-sm text-white/60">✓ 7 dias grátis · ✓ Sem cartão · ✓ Aprovação segura</p>
              </div>

              <div className="animate-slide-in-right">
                <div className="rounded-[32px] border border-white/20 bg-white/10 p-6 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
                  <div className="rounded-3xl bg-gradient-to-br from-white/70 to-white/40 p-6 text-emerald-900 shadow-inner">
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-[0.4em] text-emerald-900/70">Painel diário</p>
                      <h3 className="font-display text-2xl">AgroSaldo Insight</h3>
                    </div>
                    <div className="mt-6 space-y-4 text-sm font-medium text-emerald-900/80">
                      <div className="rounded-2xl border border-emerald-900/10 bg-white/85 p-4">
                        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-emerald-900/70">
                          <span>Saldo oficial</span>
                          <span>+3.2% vs mês anterior</span>
                        </div>
                        <p className="mt-2 text-4xl font-bold text-emerald-900">2.814 cabeças</p>
                        <p className="text-xs text-emerald-900/60">Atualizado às 05h12 por AgroSaldo Sync</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-white/40 bg-white/70 p-4">
                          <p className="text-xs uppercase tracking-wide text-emerald-900/70">Aptos ao abate</p>
                          <p className="mt-1 text-2xl font-semibold text-emerald-900">512</p>
                          <span className="text-xs text-emerald-900/60">+96 em 30 dias</span>
                        </div>
                        <div className="rounded-2xl border border-white/40 bg-white/70 p-4">
                          <p className="text-xs uppercase tracking-wide text-emerald-900/70">Nascentes (30d)</p>
                          <p className="mt-1 text-2xl font-semibold text-emerald-900">148</p>
                          <span className="text-xs text-emerald-900/60">Checklist em dia</span>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/40 bg-white/80 p-4">
                        <p className="text-xs uppercase tracking-wide text-emerald-900/70">Próximos alertas</p>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            Revisar GTA — 12 propriedades
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="h-2 w-2 rounded-full bg-amber-500" />
                            Vacinação aftosa termina em 08 dias
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="h-2 w-2 rounded-full bg-emerald-300" />
                            4 técnicos em campo agora
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-white/40 bg-white/90 p-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-emerald-900/70">+2.500 propriedades</p>
                          <p className="text-lg font-semibold text-emerald-900">Monitoradas em tempo real</p>
                        </div>
                        <Sparkles className="h-8 w-8 text-amber-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="quem-somos" className="py-20">
            <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
              <div className="space-y-6">
                <Badge className="bg-white/10 text-white">Quem somos</Badge>
                <h2 className="font-display text-4xl text-white">Tecnologia criada por pecuaristas, para pecuaristas.</h2>
                <p className="text-lg text-white/75">
                  Nasceu em Campo Grande para resolver a dor real de conciliar saldos oficiais com o que acontece no campo.
                  Traduzimos processos complexos em fluxos simples, com um time que vive a pecuária diariamente.
                </p>
                <div className="space-y-4">
                  {[
                    { title: 'Missão', description: 'Simplificar a gestão pecuária e garantir compliance sanitário.' },
                    { title: 'Visão', description: 'Ser a plataforma nº1 de gestão pecuária do Brasil até 2030.' },
                    { title: 'Valores', description: 'Simplicidade, transparência e foco no produtor.' },
                  ].map(item => (
                    <div key={item.title} className="flex gap-4">
                      <div className="mt-1 rounded-xl bg-emerald-400/20 p-2">
                        <CheckCircle className="h-5 w-5 text-emerald-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                        <p className="text-sm text-white/70">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/30 to-teal-500/10 p-8 text-white shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
                      <Beef className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-wide text-white/70">Impacto 2025</p>
                      <h3 className="text-3xl font-bold">+2.500 fazendas</h3>
                    </div>
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-2xl font-semibold text-white">12.4K</p>
                      <p className="text-white/70">GTAs validadas</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-white">98%</p>
                      <p className="text-white/70">satisfação no suporte</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-white">840</p>
                      <p className="text-white/70">declarações/mês</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-white">15</p>
                      <p className="text-white/70">estados atendidos</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-emerald-400/30 blur-3xl" />
              </div>
            </div>
          </section>

          <section id="como-funciona" className="bg-white/5 py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="text-center">
                <Badge className="bg-white/10 text-white">Fluxo guiado</Badge>
                <h2 className="mt-4 font-display text-4xl text-white">5 passos para ter saldos oficiais em dia</h2>
                <p className="mt-2 text-lg text-white/70">Onboarding assistido por especialistas e tecnologia offline-first.</p>
              </div>
              <div className="mt-12 grid gap-8 md:grid-cols-5">
                {steps.map((item, index) => (
                  <div
                    key={item.step}
                    className="relative rounded-3xl border border-white/10 bg-black/20 p-6 text-white animate-slide-in-left"
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <div className="absolute -top-3 right-6 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold">
                      Passo {item.step}
                    </div>
                    <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                      <item.icon className="h-6 w-6 text-emerald-200" />
                    </div>
                    <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-white/70">{item.description}</p>
                    {index < steps.length - 1 && (
                      <div className="pointer-events-none absolute top-1/2 right-[-18px] hidden h-px w-12 bg-white/20 md:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="funcionalidades" className="py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="text-center">
                <Badge className="bg-white/10 text-white">O sistema</Badge>
                <h2 className="mt-4 font-display text-4xl text-white">Tudo que você precisa em um único painel</h2>
                <p className="mt-2 text-lg text-white/70">
                  Recursos pensados para proprietários, gestores e equipes de campo trabalharem em sintonia.
                </p>
              </div>
              <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {features.map(feature => (
                  <Card key={feature.title} className="border-white/10 bg-white/5 text-white backdrop-blur-md transition hover:-translate-y-1 hover:border-white/20">
                    <CardContent className="p-6">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                        <feature.icon className="h-6 w-6 text-emerald-200" />
                      </div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="mt-2 text-sm text-white/70">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section id="depoimentos" className="bg-white py-20 text-slate-900">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="text-center">
                <Badge className="bg-emerald-100 text-emerald-900">Depoimentos</Badge>
                <h2 className="mt-4 font-display text-4xl">Produtores que já vivem o AgroSaldo</h2>
                <p className="mt-2 text-lg text-slate-600">Mais de 500 pecuaristas transformaram sua operação.</p>
              </div>
              <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {testimonials.map((testimonial, index) => (
                  <Card
                    key={testimonial.name}
                    className="border-slate-100 bg-white shadow-lg transition hover:-translate-y-1"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <img src={testimonial.photo} alt={testimonial.name} className="h-14 w-14 rounded-full object-cover" />
                        <div>
                          <p className="font-semibold leading-tight text-slate-900">{testimonial.name}</p>
                          <p className="text-xs text-slate-500">{testimonial.role}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3" />
                            {testimonial.location}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-1">
                        {[...Array(testimonial.rating)].map((_, starIndex) => (
                          <Star key={starIndex} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="mt-3 text-sm text-slate-700">"{testimonial.content}"</p>
                      <div className="mt-4 border-t pt-3">
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

          <section id="planos" className="py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="text-center">
                <Badge className="bg-white/10 text-white">Planos</Badge>
                <h2 className="mt-4 font-display text-4xl text-white">Escolha o plano ideal para o seu rebanho</h2>
                <p className="mt-2 text-lg text-white/70">Usuários ilimitados e suporte humano em todos os planos.</p>
              </div>
              <div className="mt-12 grid gap-6 md:grid-cols-3 lg:grid-cols-5">
                {[...plans].sort((a, b) => a.price - b.price).map((plan, index) => (
                  <Card
                    key={plan.id}
                    className={`border-white/10 bg-white/5 text-white backdrop-blur ${
                      plan.id === 'retiro' ? 'border-emerald-300 bg-white/10 shadow-xl' : ''
                    } animate-slide-in-left`}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <CardContent className="p-6 text-center">
                      {plan.id === 'retiro' && <Badge className="mb-3 bg-emerald-200 text-emerald-900">Mais Popular</Badge>}
                      <h3 className="font-display text-xl">{plan.name}</h3>
                      <div className="mt-4">
                        <span className="text-3xl font-bold">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                        <span className="text-sm text-white/70">/mês</span>
                      </div>
                      <p className="mt-3 text-sm text-white/70">
                        {plan.maxCattle === Infinity ? 'Ilimitado' : `Até ${plan.maxCattle.toLocaleString()} cabeças`}
                      </p>
                      <Link to="/login">
                        <Button
                          className={`mt-5 w-full font-semibold ${
                            plan.id === 'retiro'
                              ? 'bg-emerald-400 text-emerald-950 hover:bg-emerald-300'
                              : 'bg-emerald-100 text-emerald-950 hover:bg-emerald-50 border border-emerald-200'
                          }`}
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

          <section className="py-20">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <div className="text-center">
                <Badge className="bg-white/10 text-white">FAQ</Badge>
                <h2 className="mt-4 font-display text-4xl text-white">Perguntas frequentes</h2>
              </div>
              <div className="mt-10 space-y-4">
                {faqs.map((faq, index) => (
                  <Card
                    key={faq.question}
                    className="cursor-pointer border-white/10 bg-white/5 text-white transition hover:border-white/30"
                    onClick={() => setFaqOpen(prev => (prev === index ? null : index))}
                  >
                    <CardContent className="flex items-start gap-4 p-6">
                      <HelpCircle className="h-6 w-6 shrink-0 text-emerald-200" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-semibold">{faq.question}</h3>
                          <ChevronRight
                            className={`h-5 w-5 text-white/60 transition-transform ${faqOpen === index ? 'rotate-90' : ''}`}
                          />
                        </div>
                        {faqOpen === index && <p className="mt-3 text-sm text-white/70">{faq.answer}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-r from-emerald-500 to-teal-500 py-20 text-white">
            <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
              <h2 className="font-display text-3xl md:text-4xl">Pronto para simplificar sua gestão?</h2>
              <p className="mt-4 text-lg opacity-90">Comece agora e tenha 7 dias grátis para testar tudo, sem cartão.</p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link to="/login">
                  <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-semibold text-emerald-700">
                    Criar Conta Grátis
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 text-lg border-white/40 bg-transparent text-white hover:bg-white/10"
                  >
                    Já tenho conta
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </main>

        <footer className="bg-white text-slate-900">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="grid gap-10 md:grid-cols-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5">
                    <Beef className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="font-display text-lg font-semibold">AgroSaldo</span>
                </div>
                <p className="text-sm text-slate-600">
                  Controle oficial do seu rebanho, sem planilha. Simples para o peão, completo para o dono.
                </p>
                <div className="flex gap-3">
                  <a
                    href="https://linkedin.com/company/agrosaldo"
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a
                    href="https://instagram.com/agrosaldo"
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100"
                  >
                    <Sparkles className="h-5 w-5" />
                  </a>
                  <a
                    href="https://wa.me/5567999999999"
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100"
                  >
                    <Phone className="h-5 w-5" />
                  </a>
                </div>
              </div>

              <div>
                <h3 className="font-semibold">Produto</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li>
                    <a href="#funcionalidades" className="hover:text-slate-900">
                      Funcionalidades
                    </a>
                  </li>
                  <li>
                    <a href="#planos" className="hover:text-slate-900">
                      Planos
                    </a>
                  </li>
                  <li>
                    <Link to="/blog" className="hover:text-slate-900">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="hover:text-slate-900">
                      Atualizações
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold">Recursos</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li>
                    <a href="#" className="hover:text-slate-900">
                      Documentação
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-slate-900">
                      Tutoriais
                    </a>
                  </li>
                  <li>
                    <Link to="/contato" className="hover:text-slate-900">
                      Contato
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="hover:text-slate-900">
                      Suporte
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Newsletter</h3>
                  {subscriberCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {subscriberCount} inscritos
                    </Badge>
                  )}
                </div>
                <p className="mt-3 text-sm text-slate-600">Receba dicas de gestão pecuária e novidades do AgroSaldo.</p>
                <form onSubmit={handleNewsletterSubmit} className="mt-4 space-y-2">
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={newsletterEmail}
                    onChange={event => setNewsletterEmail(event.target.value)}
                    required
                  />
                  <Button type="submit" size="sm" className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Inscrever
                  </Button>
                </form>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-6">
                <a href="#" className="hover:text-slate-900">
                  Termos de Uso
                </a>
                <a href="#" className="hover:text-slate-900">
                  Privacidade
                </a>
                <a href="#" className="hover:text-slate-900">
                  LGPD
                </a>
              </div>
              <p>© {new Date().getFullYear()} AgroSaldo. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
