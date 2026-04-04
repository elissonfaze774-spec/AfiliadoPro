import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Hash,
  HelpCircle,
  LayoutGrid,
  Layers3,
  Link2,
  Megaphone,
  PenSquare,
  PlayCircle,
  Rocket,
  Search,
  Send,
  Sparkles,
  Tags,
  Trash2,
  Users,
  XCircle,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

type BotAction = {
  title: string;
  description: string;
  icon: any;
  badge?: string;
  featured?: boolean;
};

function ActionCard({
  item,
  onClick,
}: {
  item: BotAction;
  onClick: (item: BotAction) => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={`group relative w-full overflow-hidden rounded-[26px] border p-5 text-left transition duration-300 hover:-translate-y-1 ${
        item.featured
          ? 'border-emerald-500/25 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_42%),linear-gradient(180deg,rgba(4,18,12,0.96)_0%,rgba(5,5,5,0.98)_100%)] shadow-[0_18px_50px_rgba(16,185,129,0.10)]'
          : 'border-white/10 bg-black/25 hover:border-emerald-500/20 hover:bg-black/35'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
            item.featured
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
              : 'border-white/10 bg-white/5 text-emerald-300'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex items-center gap-2">
          {item.badge ? (
            <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
              {item.badge}
            </span>
          ) : null}

          <ChevronRight className="h-5 w-5 text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
        </div>
      </div>

      <h3 className="mt-4 text-lg font-black text-white">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{item.description}</p>
    </button>
  );
}

export default function BotTelegram() {
  const navigate = useNavigate();
  const [selectedAction, setSelectedAction] = useState<BotAction | null>(null);

  const principais = useMemo<BotAction[]>(
    () => [
      {
        title: 'Iniciar bot',
        description: 'Entrada principal para ativar a estrutura do bot e começar a usar a automação.',
        icon: PlayCircle,
        badge: 'principal',
        featured: true,
      },
      {
        title: 'Abrir menu',
        description: 'Mostra o menu visual com as funções organizadas de forma simples e rápida.',
        icon: LayoutGrid,
      },
      {
        title: 'Ver meu ID',
        description: 'Área para consultar o identificador do usuário dentro da estrutura do bot.',
        icon: Hash,
      },
      {
        title: 'Ajuda rápida',
        description: 'Explicações curtas para orientar o admin sem bagunça e sem travar o uso.',
        icon: HelpCircle,
      },
      {
        title: 'Painel e estatísticas',
        description: 'Resumo do desempenho, visão geral do bot e indicadores importantes.',
        icon: BarChart3,
      },
      {
        title: 'Grupos e categorias',
        description: 'Visualização de grupos ativos e categorias organizadas para envio inteligente.',
        icon: Layers3,
      },
    ],
    [],
  );

  const ofertas = useMemo<BotAction[]>(
    () => [
      {
        title: 'Importar por link',
        description: 'Tenta montar uma oferta automaticamente usando apenas o link informado.',
        icon: Link2,
        badge: 'ofertas',
        featured: true,
      },
      {
        title: 'Criar oferta guiada',
        description: 'Fluxo visual para montar uma oferta bonita, clara e pronta para divulgar.',
        icon: Sparkles,
      },
      {
        title: 'Biblioteca de ofertas',
        description: 'Lista das ofertas criadas, com visual limpo para organizar e consultar tudo.',
        icon: Search,
      },
      {
        title: 'Editar oferta',
        description: 'Permite ajustar título, descrição, preço, cupom, link, imagem e chamada final.',
        icon: PenSquare,
      },
      {
        title: 'Duplicar oferta',
        description: 'Cria uma cópia rápida de uma oferta já existente para ganhar velocidade.',
        icon: Copy,
      },
      {
        title: 'Apagar oferta',
        description: 'Remove uma oferta da estrutura quando não fizer mais sentido manter ativa.',
        icon: Trash2,
      },
    ],
    [],
  );

  const disparos = useMemo<BotAction[]>(
    () => [
      {
        title: 'Disparar oferta',
        description: 'Envio visual da oferta para grupos ativos, com foco em praticidade e escala.',
        icon: Send,
        badge: 'automação',
        featured: true,
      },
      {
        title: 'Anúncio simples',
        description: 'Mensagem rápida para divulgação geral, sem precisar montar uma oferta completa.',
        icon: Megaphone,
      },
      {
        title: 'Agendar oferta',
        description: 'Agenda envios futuros para manter constância e não depender só do manual.',
        icon: CalendarClock,
      },
      {
        title: 'Agendar anúncio',
        description: 'Programa mensagens simples para horários estratégicos de divulgação.',
        icon: Clock3,
      },
      {
        title: 'Agenda ativa',
        description: 'Visualização dos agendamentos pendentes, organizados de forma profissional.',
        icon: Zap,
      },
      {
        title: 'Cancelar agendamento',
        description: 'Cancela um envio pendente com segurança e organização.',
        icon: XCircle,
      },
    ],
    [],
  );

  const highlights = useMemo(
    () => [
      {
        title: 'Mais valor percebido',
        description: 'O admin enxerga um produto maior, mais avançado e mais premium.',
      },
      {
        title: 'Mais retenção',
        description: 'Uma área forte como essa aumenta o desejo de continuar usando a plataforma.',
      },
      {
        title: 'Mais escala futura',
        description: 'A estrutura já fica pronta para ativação profissional quando você decidir.',
      },
      {
        title: 'Mais cara de dinheiro',
        description: 'Visual green premium pensado para transmitir crescimento, resultado e valor.',
      },
    ],
    [],
  );

  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.08),_transparent_20%),linear-gradient(180deg,_#020202_0%,_#050505_48%,_#08120d_100%)] text-white">
        <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                    BotTelegram
                  </span>
                  <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300">
                    em desenvolvimento
                  </span>
                </div>

                <h1 className="text-3xl font-black md:text-4xl">Central BotTelegram</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
                  Uma página premium, visual e organizada para transformar o bot em um diferencial forte dentro do AfiliadoPRO.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                  onClick={() => navigate('/painel')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao painel
                </Button>

                <Button
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 font-bold text-black hover:from-emerald-400 hover:to-green-400"
                  onClick={() =>
                    setSelectedAction({
                      title: 'Ativar BotTelegram',
                      description:
                        'A ativação profissional do módulo ainda está em desenvolvimento, mas a área já foi preparada para aumentar o valor percebido do AfiliadoPRO.',
                      icon: Bot,
                    })
                  }
                >
                  <Bot className="mr-2 h-4 w-4" />
                  Ativar módulo
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:space-y-8 md:py-8">
          <section>
            <Card className="overflow-hidden border-emerald-500/20 bg-black/35 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1.2fr)_360px] md:p-8">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
                    <Bot className="h-4 w-4" />
                    módulo visual + automação futura
                  </div>

                  <h2 className="max-w-3xl text-3xl font-black leading-tight md:text-5xl">
                    Botões bonitos, organização forte e visual de produto grande
                  </h2>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
                    Nada de poluição visual com barras e comandos jogados. Aqui o módulo foi organizado em ações premium,
                    com áreas separadas para comandos principais, ofertas e disparos.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button
                      className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 font-bold text-black hover:from-emerald-400 hover:to-green-400"
                      onClick={() =>
                        setSelectedAction({
                          title: 'Ver estrutura principal',
                          description:
                            'A estrutura completa do BotTelegram ainda está em desenvolvimento, mas a organização visual já foi preparada.',
                          icon: LayoutGrid,
                        })
                      }
                    >
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      Ver estrutura
                    </Button>

                    <Button
                      variant="outline"
                      className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                      onClick={() =>
                        setSelectedAction({
                          title: 'Abrir visão de ofertas',
                          description:
                            'O fluxo completo de ofertas ainda está em desenvolvimento, com foco em praticidade e automação futura.',
                          icon: Sparkles,
                        })
                      }
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Ver ofertas
                    </Button>

                    <Button
                      variant="outline"
                      className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                      onClick={() =>
                        setSelectedAction({
                          title: 'Abrir disparos e agenda',
                          description:
                            'A parte de disparos e agendamentos ainda está em desenvolvimento, mas a área já foi pensada para escala.',
                          icon: Send,
                        })
                      }
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Ver disparos
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
                      visual atual
                    </p>
                    <p className="mt-3 text-2xl font-black text-white">Premium e organizado</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      Página desenhada para aumentar valor percebido e transmitir força de produto.
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-black/30 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-300">
                      direção
                    </p>
                    <p className="mt-3 text-2xl font-black text-white">Averdado que vende</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Preto + verde, sensação de automação, dinheiro, crescimento e valor premium.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
            <Card className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  Comandos principais
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Base visual do módulo, sem poluição e sem lista feia de comandos.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {principais.map((item) => (
                  <ActionCard key={item.title} item={item} onClick={setSelectedAction} />
                ))}
              </CardContent>
            </Card>

            <Card className="border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_40%),linear-gradient(180deg,rgba(4,18,12,0.98)_0%,rgba(5,5,5,0.98)_100%)]">
              <CardHeader>
                <CardTitle className="text-white">Resumo do módulo</CardTitle>
                <CardDescription className="text-zinc-300">
                  Estrutura pronta para crescer no futuro.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {[
                  'Botões visuais no lugar de comandos bagunçados',
                  'Separação clara entre principais, ofertas e disparos',
                  'Página alinhada ao visual premium do AfiliadoPRO',
                  'Base pronta para ativação profissional depois',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <p className="text-sm leading-6 text-zinc-300">{item}</p>
                  </div>
                ))}

                <Button
                  className="mt-2 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 font-bold text-black hover:from-emerald-400 hover:to-green-400"
                  onClick={() =>
                    setSelectedAction({
                      title: 'Próxima evolução do módulo',
                      description:
                        'A próxima etapa do BotTelegram ainda está em desenvolvimento, mas a estrutura visual estratégica já está pronta.',
                      icon: Rocket,
                    })
                  }
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  Ver próxima etapa
                </Button>
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Tags className="h-5 w-5 text-emerald-400" />
                  Ofertas
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Tudo pensado para criação, edição e organização de ofertas de forma profissional.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {ofertas.map((item) => (
                  <ActionCard key={item.title} item={item} onClick={setSelectedAction} />
                ))}
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Send className="h-5 w-5 text-emerald-400" />
                  Disparos e agendamentos
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Área visual para escalar envios, anúncios e horários estratégicos sem bagunça.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {disparos.map((item) => (
                  <ActionCard key={item.title} item={item} onClick={setSelectedAction} />
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  Valor percebido do BotTelegram
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Não é só um módulo. É um diferencial forte dentro do produto.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {highlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[26px] border border-white/10 bg-black/20 p-5"
                  >
                    <h3 className="text-lg font-black text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{item.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="text-white">Acesso rápido</CardTitle>
                <CardDescription className="text-zinc-400">
                  Botões estratégicos para reforçar a sensação de produto premium.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <Button
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 font-bold text-black hover:from-emerald-400 hover:to-green-400"
                  onClick={() =>
                    setSelectedAction({
                      title: 'Ativação premium',
                      description:
                        'A ativação premium do BotTelegram ainda está em desenvolvimento.',
                      icon: Bot,
                    })
                  }
                >
                  <Bot className="mr-2 h-4 w-4" />
                  Ativação premium
                </Button>

                <Button
                  variant="outline"
                  className="h-12 w-full rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                  onClick={() =>
                    setSelectedAction({
                      title: 'Abrir visão geral',
                      description:
                        'A visão geral completa ainda está em desenvolvimento.',
                      icon: ExternalLink,
                    })
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visão geral
                </Button>

                <Button
                  variant="outline"
                  className="h-12 w-full rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                  onClick={() => navigate('/painel')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao painel
                </Button>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>

      {selectedAction ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedAction(null)}
        >
          <div
            className="w-full max-w-lg rounded-[32px] border border-emerald-500/20 bg-[#07110c] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              <selectedAction.icon className="h-8 w-8" />
            </div>

            <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
              Em desenvolvimento
            </span>

            <h3 className="mt-4 text-2xl font-black text-white">{selectedAction.title}</h3>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              {selectedAction.description}
            </p>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-sm leading-6 text-zinc-400">
                Esta funcionalidade ainda está em desenvolvimento, mas a estrutura visual já foi preparada
                para elevar o valor percebido do AfiliadoPRO e abrir espaço para uma ativação profissional no futuro.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 font-bold text-black hover:from-emerald-400 hover:to-green-400"
                onClick={() => setSelectedAction(null)}
              >
                Entendi
              </Button>

              <Button
                variant="outline"
                className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                onClick={() => navigate('/painel')}
              >
                Voltar ao painel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}