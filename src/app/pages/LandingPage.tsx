import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Store,
  Package,
  Share2,
  DollarSign,
  Check,
  BarChart3,
  Palette,
  MessageSquare,
  Menu,
  X,
  Rocket,
  ShieldCheck,
  Link2,
  Wand2,
  ArrowRight,
  Star,
  Target,
  MonitorSmartphone,
  Crown,
  Clock3,
  Zap,
  BadgeCheck,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const WHATSAPP_NUMBER = '5582987227433';

  const whatsappMessage =
    'Olá! Vi a página do AfiliadoPro e quero obter acesso. Tenho interesse real em começar a divulgar produtos e ganhar dinheiro pela internet, mas preciso de uma estrutura pronta, fácil e profissional. Pode me passar as informações para entrar?';

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const handleGetAccess = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const benefits = [
    {
      icon: Store,
      title: 'Loja própria com link exclusivo',
      description:
        'Tenha seu próprio espaço para divulgar produtos de forma profissional, sem depender de páginas genéricas.',
    },
    {
      icon: BarChart3,
      title: 'Painel simples e organizado',
      description:
        'Acompanhe sua loja, seus produtos e seu conteúdo em um painel fácil de entender.',
    },
    {
      icon: Palette,
      title: 'Personalização de verdade',
      description:
        'Escolha nome, banner, logo e deixe sua loja com a sua identidade.',
    },
    {
      icon: Wand2,
      title: 'Conteúdo pronto para divulgar',
      description:
        'Receba ideias e textos para postar, divulgar e atrair mais atenção para seus links.',
    },
    {
      icon: Package,
      title: 'Cadastro simples de produtos',
      description:
        'Organize seus produtos de forma bonita, clara e profissional.',
    },
    {
      icon: Share2,
      title: 'Divulgação mais fácil',
      description:
        'Compartilhe seu link com mais praticidade e deixe tudo pronto para apresentar melhor.',
    },
    {
      icon: MessageSquare,
      title: 'Feito para iniciantes',
      description:
        'Mesmo quem está começando do zero consegue usar com facilidade.',
    },
    {
      icon: Target,
      title: 'Estrutura pensada para resultado',
      description:
        'Tudo foi pensado para facilitar sua divulgação e aumentar suas chances de ganhar dinheiro.',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Receba seu acesso',
      description: 'Entre na plataforma e tenha acesso ao seu painel profissional.',
      icon: ShieldCheck,
    },
    {
      step: '02',
      title: 'Monte sua loja',
      description: 'Defina nome, banner, logo, cores e deixe tudo do seu jeito.',
      icon: Store,
    },
    {
      step: '03',
      title: 'Adicione seus produtos',
      description: 'Cadastre seus produtos e organize tudo de forma simples.',
      icon: Package,
    },
    {
      step: '04',
      title: 'Gere conteúdo para divulgar',
      description: 'Use ideias prontas para postar e atrair mais cliques.',
      icon: Wand2,
    },
    {
      step: '05',
      title: 'Compartilhe e comece',
      description: 'Envie seu link e comece a divulgar de forma profissional.',
      icon: Share2,
    },
  ];

  const plans = [
    {
      name: 'Inicial',
      price: 'R$ 47',
      period: '/mês',
      description: 'Ideal para quem quer começar com estrutura profissional',
      features: [
        'Até 50 produtos',
        'Loja própria personalizada',
        'Painel completo',
        'Conteúdo pronto para divulgar',
        'Link exclusivo da sua loja',
      ],
      popular: false,
    },
    {
      name: 'Pro',
      price: 'R$ 97',
      period: '/mês',
      description: 'Para quem quer crescer com mais força',
      features: [
        'Até 200 produtos',
        'Todos os recursos do Inicial',
        'Mais personalização visual',
        'Mais espaço para expansão',
        'Mais liberdade para divulgar',
        'Suporte prioritário',
      ],
      popular: true,
    },
    {
      name: 'Premium',
      price: 'R$ 197',
      period: '/mês',
      description: 'Máximo potencial para uma operação maior',
      features: [
        'Produtos ilimitados',
        'Todos os recursos do Pro',
        'Mais poder de personalização',
        'Mais liberdade de crescimento',
        'Estrutura avançada',
        'Suporte VIP',
      ],
      popular: false,
    },
  ];

  const faq = [
    {
      question: 'Preciso saber programar?',
      answer:
        'Não. O AfiliadoPro foi pensado para pessoas comuns, inclusive quem está começando do zero.',
    },
    {
      question: 'Vou ter minha própria loja?',
      answer:
        'Sim. Você terá sua própria loja com seu nome, seu visual e seu link exclusivo.',
    },
    {
      question: 'Posso personalizar minha loja?',
      answer:
        'Sim. Você poderá configurar nome, banner, logo, cores e deixar tudo com a sua cara.',
    },
    {
      question: 'Como faço para entrar?',
      answer:
        'É só clicar nos botões da página e falar no WhatsApp para receber as informações de acesso.',
    },
  ];

  const testimonials = [
    {
      name: 'Mariana',
      text: 'O que mais gostei foi já ter uma estrutura pronta. Isso me fez ganhar tempo e começar mais rápido.',
    },
    {
      name: 'Carlos',
      text: 'Eu não entendia nada de loja online, mas consegui organizar tudo de um jeito profissional.',
    },
    {
      name: 'Fernanda',
      text: 'A parte de personalizar a loja e gerar conteúdo facilitou muito minha divulgação.',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.08),transparent_25%)]" />
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            <button onClick={() => scrollToSection('inicio')} className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20">
                <DollarSign className="h-6 w-6 text-white" />
              </div>

              <div className="text-left">
                <div className="text-xl font-extrabold tracking-tight">AfiliadoPro</div>
                <div className="text-xs text-emerald-400">Sua estrutura para começar online</div>
              </div>
            </button>

            <nav className="hidden items-center gap-7 md:flex">
              <button
                onClick={() => scrollToSection('inicio')}
                className="text-sm text-zinc-300 transition hover:text-white"
              >
                Início
              </button>
              <button
                onClick={() => scrollToSection('como-funciona')}
                className="text-sm text-zinc-300 transition hover:text-white"
              >
                Como funciona
              </button>
              <button
                onClick={() => scrollToSection('beneficios')}
                className="text-sm text-zinc-300 transition hover:text-white"
              >
                Benefícios
              </button>
              <button
                onClick={() => scrollToSection('planos')}
                className="text-sm text-zinc-300 transition hover:text-white"
              >
                Planos
              </button>

              <Button
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() => navigate('/login')}
              >
                Entrar
              </Button>

              <Button
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 hover:from-emerald-600 hover:to-emerald-700"
                onClick={handleGetAccess}
              >
                Obter acesso
              </Button>
            </nav>

            <button
              className="text-white md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-white/10 pb-5 pt-4 md:hidden">
              <nav className="flex flex-col gap-3">
                <button
                  onClick={() => scrollToSection('inicio')}
                  className="text-left text-zinc-300 transition hover:text-white"
                >
                  Início
                </button>
                <button
                  onClick={() => scrollToSection('como-funciona')}
                  className="text-left text-zinc-300 transition hover:text-white"
                >
                  Como funciona
                </button>
                <button
                  onClick={() => scrollToSection('beneficios')}
                  className="text-left text-zinc-300 transition hover:text-white"
                >
                  Benefícios
                </button>
                <button
                  onClick={() => scrollToSection('planos')}
                  className="text-left text-zinc-300 transition hover:text-white"
                >
                  Planos
                </button>

                <Button
                  variant="ghost"
                  className="justify-start px-0 text-white hover:bg-transparent"
                  onClick={() => navigate('/login')}
                >
                  Entrar
                </Button>

                <Button
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                  onClick={handleGetAccess}
                >
                  Obter acesso
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10">
        <section id="inicio" className="overflow-hidden pt-10 md:pt-14">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-6 max-w-5xl">
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-2.5 text-center text-xs font-medium text-yellow-300 md:text-sm">
                Atenção: se você quer começar online com mais organização, essa é a estrutura certa para acelerar seu início.
              </div>
            </div>

            <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="pb-10 lg:pb-16">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">
                    Estrutura completa para começar do jeito certo
                  </span>
                </div>

                <h1 className="max-w-4xl text-4xl font-black leading-[0.98] tracking-tight text-white md:text-6xl xl:text-[78px]">
                  Crie sua loja de afiliados e comece a ganhar dinheiro
                  <span className="mt-2 block bg-gradient-to-r from-emerald-400 to-yellow-400 bg-clip-text text-transparent">
                    mesmo sem experiência
                  </span>
                </h1>

                <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 md:text-[22px] md:leading-9">
                  Receba acesso, personalize sua loja, adicione produtos, gere conteúdo pronto
                  para divulgar e tenha uma estrutura profissional para começar com mais segurança.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    Sem precisar programar
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    Loja própria com link exclusivo
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    Fácil para quem está começando
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Button
                    size="lg"
                    className="h-auto rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-5 text-base font-semibold shadow-2xl shadow-emerald-500/20 hover:from-emerald-600 hover:to-emerald-700"
                    onClick={handleGetAccess}
                  >
                    <Rocket className="mr-2 h-5 w-5" />
                    Quero obter acesso
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="h-auto rounded-2xl border-white/15 bg-white/5 px-8 py-5 text-base text-white hover:bg-white/10"
                    onClick={() => scrollToSection('como-funciona')}
                  >
                    Ver como funciona
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <Card className="border-white/10 bg-zinc-950/80">
                    <CardContent className="pt-6 text-center">
                      <div className="flex items-center justify-center gap-2 text-3xl font-black text-emerald-400">
                        <BadgeCheck className="h-6 w-6" />
                        100%
                      </div>
                      <p className="mt-2 text-sm text-zinc-400">Sem precisar programar</p>
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-zinc-950/80">
                    <CardContent className="pt-6 text-center">
                      <div className="flex items-center justify-center gap-2 text-3xl font-black text-yellow-400">
                        <Clock3 className="h-6 w-6" />
                        5min
                      </div>
                      <p className="mt-2 text-sm text-zinc-400">Para começar a configurar</p>
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-zinc-950/80">
                    <CardContent className="pt-6 text-center">
                      <div className="flex items-center justify-center gap-2 text-3xl font-black text-emerald-400">
                        <TrendingUp className="h-6 w-6" />
                        24h
                      </div>
                      <p className="mt-2 text-sm text-zinc-400">Para começar a divulgar</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="relative lg:pt-6">
                <div className="absolute -left-8 top-10 hidden h-28 w-28 rounded-full bg-emerald-500/20 blur-3xl lg:block" />
                <div className="absolute -right-8 bottom-0 hidden h-32 w-32 rounded-full bg-yellow-500/10 blur-3xl lg:block" />

                <div className="relative mx-auto max-w-[520px] rounded-[30px] border border-white/10 bg-gradient-to-b from-zinc-900 to-black p-4 shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
                  <div className="rounded-[24px] border border-white/10 bg-zinc-950 p-4">
                    <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/60 px-4 py-3">
                      <div>
                        <p className="text-sm text-zinc-400">Painel da sua loja</p>
                        <h3 className="text-lg font-bold text-white">
                          Sua estrutura está pronta para crescer
                        </h3>
                      </div>
                      <div className="rounded-xl bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                        Ativa
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Package className="h-5 w-5 text-emerald-400" />
                          <span className="text-sm font-medium text-white">Produtos</span>
                        </div>
                        <div className="text-2xl font-black text-white">48</div>
                        <p className="text-xs text-zinc-400">Produtos cadastrados</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-yellow-400" />
                          <span className="text-sm font-medium text-white">Cliques</span>
                        </div>
                        <div className="text-2xl font-black text-white">1.284</div>
                        <p className="text-xs text-zinc-400">Movimento da sua loja</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Wand2 className="h-5 w-5 text-emerald-400" />
                          <span className="text-sm font-medium text-white">Conteúdo</span>
                        </div>
                        <div className="text-2xl font-black text-white">12</div>
                        <p className="text-xs text-zinc-400">Ideias prontas para divulgar</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Link2 className="h-5 w-5 text-yellow-400" />
                          <span className="text-sm font-medium text-white">Link próprio</span>
                        </div>
                        <div className="break-all text-base font-bold text-white">
                          afiliadopro.com/minha-loja
                        </div>
                        <p className="text-xs text-zinc-400">Seu espaço exclusivo para divulgar</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Button className="h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                        Adicionar produto
                      </Button>
                      <Button
                        variant="outline"
                        className="h-12 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                      >
                        Gerar conteúdo
                      </Button>
                    </div>
                  </div>

                  <div className="pointer-events-none absolute -bottom-10 left-8 right-8 h-16 rounded-full bg-emerald-500/10 blur-3xl" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-6">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-6xl gap-4 rounded-[28px] border border-white/10 bg-gradient-to-r from-zinc-950 to-black p-5 md:grid-cols-4">
              {[
                {
                  icon: Crown,
                  title: 'Estrutura própria',
                  desc: 'Cada pessoa com sua própria operação',
                },
                {
                  icon: Palette,
                  title: 'Visual personalizado',
                  desc: 'Logo, banner, cores e estilo da loja',
                },
                {
                  icon: MonitorSmartphone,
                  title: 'Painel profissional',
                  desc: 'Bonito, moderno e fácil de usar',
                },
                {
                  icon: Target,
                  title: 'Foco em resultado',
                  desc: 'Ferramentas para ajudar você a ganhar dinheiro',
                },
              ].map((item, index) => (
                <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <item.icon className="mb-3 h-5 w-5 text-emerald-400" />
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-2">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">Fluxo simples e poderoso</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                Como funciona na prática
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                O objetivo é simples: te colocar para agir rápido com uma estrutura pronta.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-5">
              {steps.map((item) => (
                <Card key={item.step} className="border-white/10 bg-zinc-950/70">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="rounded-xl bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-400">
                        {item.step}
                      </div>
                      <item.icon className="h-5 w-5 text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-b from-black to-zinc-950 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                Feito para quem quer começar
                <span className="block bg-gradient-to-r from-emerald-400 to-yellow-400 bg-clip-text text-transparent">
                  sem depender de conhecimento técnico
                </span>
              </h2>
              <p className="mt-5 text-lg text-zinc-400">
                Você não precisa ser programador, designer ou especialista para usar.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
              {[
                'Sem precisar programar',
                'Sem precisar criar site do zero',
                'Sem precisar entender de design',
                'Sem precisar usar ferramentas complicadas',
                'Sem depender de soluções confusas',
                'Sem misturar sua loja com a de outras pessoas',
              ].map((item, index) => (
                <Card key={index} className="border-emerald-500/15 bg-zinc-950/80">
                  <CardContent className="flex items-center gap-4 p-6">
                    <Check className="h-6 w-6 shrink-0 text-emerald-400" />
                    <p className="text-base font-medium text-white">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="beneficios" className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                Tudo que você precisa para crescer
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                Estrutura profissional, personalização real e ferramentas pensadas para facilitar sua jornada.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit, index) => (
                <Card
                  key={index}
                  className="border-white/10 bg-zinc-950/80 transition duration-300 hover:-translate-y-1 hover:border-emerald-500/40"
                >
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700">
                      <benefit.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-white">{benefit.title}</CardTitle>
                    <CardDescription className="leading-6 text-zinc-400">
                      {benefit.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-b from-zinc-950 to-black py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
                <Zap className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Mais confiança para decidir</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                Por que tanta gente procura uma estrutura pronta?
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                Porque começar sozinho do zero costuma atrasar tudo. Com uma base profissional, você economiza tempo e já entra melhor posicionado.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
              {[
                {
                  title: 'Mais rapidez',
                  desc: 'Você para de perder tempo tentando montar tudo sozinho.',
                  icon: Clock3,
                },
                {
                  title: 'Mais organização',
                  desc: 'Sua loja, seus produtos e sua divulgação ficam em um só lugar.',
                  icon: BadgeCheck,
                },
                {
                  title: 'Mais presença',
                  desc: 'Você passa uma imagem mais profissional para quem vê sua loja.',
                  icon: TrendingUp,
                },
              ].map((item, index) => (
                <Card key={index} className="border-white/10 bg-zinc-950/80">
                  <CardContent className="p-6">
                    <item.icon className="mb-4 h-8 w-8 text-emerald-400" />
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                    <p className="mt-3 leading-7 text-zinc-400">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                O que as pessoas mais gostam
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                Uma estrutura bonita, organizada e fácil de usar faz toda diferença para quem está começando.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
              {testimonials.map((item, index) => (
                <Card key={index} className="border-white/10 bg-zinc-950/80">
                  <CardContent className="p-6">
                    <div className="mb-4 flex gap-1 text-yellow-400">
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                    <p className="leading-7 text-zinc-300">“{item.text}”</p>
                    <p className="mt-4 text-sm font-semibold text-white">{item.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="planos" className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                Escolha o plano ideal
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                Comece com a estrutura certa e avance no seu ritmo.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-6xl gap-8 md:grid-cols-3">
              {plans.map((plan, index) => (
                <Card
                  key={index}
                  className={`relative overflow-hidden border-2 bg-zinc-950/85 ${
                    plan.popular
                      ? 'scale-[1.02] border-emerald-500 shadow-2xl shadow-emerald-500/10'
                      : 'border-white/10'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1 text-xs font-bold text-white">
                      MAIS ESCOLHIDO
                    </div>
                  )}

                  <CardHeader className="pb-6 pt-10 text-center">
                    <CardTitle className="text-2xl font-black text-white">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-4xl font-black text-white">{plan.price}</span>
                      <span className="text-zinc-400">{plan.period}</span>
                    </div>
                    <CardDescription className="mt-2 text-zinc-400">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                          <span className="text-zinc-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`mt-8 h-12 w-full rounded-xl ${
                        plan.popular
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                          : 'bg-white/10 hover:bg-white/15'
                      }`}
                      onClick={handleGetAccess}
                    >
                      Obter acesso
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-b from-black to-zinc-950 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                Perguntas frequentes
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                Respostas rápidas para quem quer começar com clareza.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-4xl gap-5">
              {faq.map((item, index) => (
                <Card key={index} className="border-white/10 bg-zinc-950/80">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-white">{item.question}</h3>
                    <p className="mt-2 leading-7 text-zinc-400">{item.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl rounded-[32px] border border-white/10 bg-gradient-to-r from-emerald-500/10 via-black to-yellow-500/10 px-6 py-14 text-center md:px-12">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">
                  Comece com estrutura profissional
                </span>
              </div>

              <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                Dê o primeiro passo e comece sua estrutura hoje
              </h2>

              <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-zinc-300">
                Loja própria, painel completo, personalização real e ferramentas para facilitar sua divulgação mesmo começando do zero.
              </p>

              <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
                Quanto mais você demora para começar, mais tempo perde sem estrutura e sem presença profissional.
              </div>

              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="h-auto rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-5 text-base font-semibold hover:from-emerald-600 hover:to-emerald-700"
                  onClick={handleGetAccess}
                >
                  <DollarSign className="mr-2 h-5 w-5" />
                  Quero meu acesso
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="h-auto rounded-2xl border-white/15 bg-white/5 px-8 py-5 text-base text-white hover:bg-white/10"
                  onClick={() => navigate('/login')}
                >
                  Entrar agora
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white">AfiliadoPro</div>
                </div>
              </div>
              <p className="text-sm leading-6 text-zinc-400">
                Estrutura profissional para criar sua própria loja e começar a divulgar com mais facilidade.
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-bold text-white">Produto</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>
                  <button
                    onClick={() => scrollToSection('como-funciona')}
                    className="transition hover:text-white"
                  >
                    Como funciona
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('beneficios')}
                    className="transition hover:text-white"
                  >
                    Benefícios
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('planos')}
                    className="transition hover:text-white"
                  >
                    Planos
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-bold text-white">Acesso</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>
                  <button onClick={() => navigate('/login')} className="transition hover:text-white">
                    Entrar no painel
                  </button>
                </li>
                <li>
                  <button onClick={handleGetAccess} className="transition hover:text-white">
                    Obter acesso
                  </button>
                </li>
                <li>
                  <span>Atendimento pelo WhatsApp</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-bold text-white">Base</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>Loja com link próprio</li>
                <li>Painel individual</li>
                <li>Personalização completa</li>
              </ul>
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-6xl border-t border-white/10 pt-6 text-center text-sm text-zinc-500">
            © 2026 AfiliadoPro. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}