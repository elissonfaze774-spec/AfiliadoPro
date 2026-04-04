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
  XCircle,
  Zap,
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
        title: 'Começar',
        description: 'Entre no bot e tenha um ponto central para organizar sua rotina de divulgação.',
        icon: PlayCircle,
        badge: 'essencial',
        featured: true,
      },
      {
        title: 'Menu rápido',
        description: 'Acesso fácil às funções principais para você agir mais rápido no dia a dia.',
        icon: LayoutGrid,
      },
      {
        title: 'Seu identificador',
        description: 'Consulte rapidamente as informações da sua conta dentro do bot.',
        icon: Hash,
      },
      {
        title: 'Ajuda rápida',
        description: 'Orientações simples para você não travar e conseguir usar tudo com mais segurança.',
        icon: HelpCircle,
      },
      {
        title: 'Resultados',
        description: 'Veja o desempenho das ações feitas no bot e acompanhe melhor sua divulgação.',
        icon: BarChart3,
      },
      {
        title: 'Grupos e categorias',
        description: 'Organize melhor para enviar a mensagem certa, no lugar certo, com mais consistência.',
        icon: Layers3,
      },
    ],
    [],
  );

  const ofertas = useMemo<BotAction[]>(
    () => [
      {
        title: 'Importar por link',
        description: 'Ganhe tempo tentando montar uma oferta a partir de um link, sem começar do zero.',
        icon: Link2,
        badge: 'tempo',
        featured: true,
      },
      {
        title: 'Criar oferta guiada',
        description: 'Monte ofertas com mais clareza e rapidez para divulgar melhor seus produtos.',
        icon: Sparkles,
      },
      {
        title: 'Minhas ofertas',
        description: 'Tenha suas ofertas organizadas para reutilizar, revisar e divulgar sem bagunça.',
        icon: Search,
      },
      {
        title: 'Editar oferta',
        description: 'Ajuste título, descrição, preço, cupom, link e imagem sempre que precisar.',
        icon: PenSquare,
      },
      {
        title: 'Duplicar oferta',
        description: 'Reaproveite ofertas que já funcionaram e publique mais rápido.',
        icon: Copy,
      },
      {
        title: 'Apagar oferta',
        description: 'Remova o que não faz mais sentido e mantenha sua área sempre limpa e prática.',
        icon: Trash2,
      },
    ],
    [],
  );

  const disparos = useMemo<BotAction[]>(
    () => [
      {
        title: 'Enviar oferta',
        description: 'Divulgue para grupos ativos com mais velocidade e menos esforço manual.',
        icon: Send,
        badge: 'escala',
        featured: true,
      },
      {
        title: 'Anúncio simples',
        description: 'Envie comunicados rápidos para manter presença constante nos grupos.',
        icon: Megaphone,
      },
      {
        title: 'Agendar oferta',
        description: 'Deixe divulgações programadas para não depender de lembrar tudo na hora.',
        icon: CalendarClock,
      },
      {
        title: 'Agendar anúncio',
        description: 'Mantenha constância nas postagens mesmo nos dias mais corridos.',
        icon: Clock3,
      },
      {
        title: 'Meus agendamentos',
        description: 'Tenha controle do que já está programado para não se perder.',
        icon: Zap,
      },
      {
        title: 'Cancelar agendamento',
        description: 'Ajuste sua estratégia com liberdade sempre que quiser mudar um envio.',
        icon: XCircle,
      },
    ],
    [],
  );

  const highlights = useMemo(
    () => [
      {
        title: 'Mais constância',
        description: 'Você consegue divulgar mais vezes sem depender só da força de vontade do momento.',
      },
      {
        title: 'Mais organização',
        description: 'Ofertas, grupos e envios ficam mais fáceis de controlar no dia a dia.',
      },
      {
        title: 'Mais velocidade',
        description: 'Menos tempo montando tudo manualmente e mais tempo focando em vender.',
      },
      {
        title: 'Mais chance de resultado',
        description: 'Quanto mais frequência e organização, maior a chance de gerar cliques e comissão.',
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

                <h1 className="text-3xl font-black md:text-4xl">BotTelegram</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
                  Uma área pensada para ajudar você a divulgar com mais frequência, organizar melhor suas ofertas
                  e ganhar tempo no processo.
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
                        'Quando esse recurso for liberado, você poderá agilizar sua divulgação, manter mais constância e organizar melhor suas ações.',
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
                    divulgação mais prática
                  </div>

                  <h2 className="max-w-3xl text-3xl font-black leading-tight md:text-5xl">
                    Menos correria para divulgar. Mais constância para vender.
                  </h2>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
                    O BotTelegram foi pensado para ajudar você a ganhar tempo, manter suas ofertas organizadas
                    e deixar sua divulgação muito mais prática no dia a dia.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button
                      className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 font-bold text-black hover:from-emerald-400 hover:to-green-400"
                      onClick={() =>
                        setSelectedAction({
                          title: 'Funções principais',
                          description:
                            'Essa área vai ajudar você a começar mais rápido, entender melhor o uso e acompanhar seus resultados.',
                          icon: LayoutGrid,
                        })
                      }
                    >
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      Ver funções principais
                    </Button>

                    <Button
                      variant="outline"
                      className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                      onClick={() =>
                        setSelectedAction({
                          title: 'Área de ofertas',
                          description:
                            'Aqui você poderá criar, editar e organizar ofertas para divulgar com mais rapidez e clareza.',
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
                          title: 'Disparos e agenda',
                          description:
                            'Essa área vai ajudar você a manter consistência nas divulgações, inclusive nos dias mais corridos.',
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
                      ganho principal
                    </p>
                    <p className="mt-3 text-2xl font-black text-white">Mais tempo para focar no que importa</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      Menos esforço repetitivo e mais facilidade para divulgar seus produtos.
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-black/30 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-300">
                      objetivo
                    </p>
                    <p className="mt-3 text-2xl font-black text-white">Ajudar você a divulgar com constância</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Organização e frequência podem aumentar muito sua chance de resultado.
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
                  <LayoutGrid className="h-5 w-5 text-emerald-400" />
                  Funções principais
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Recursos para ajudar você a começar, acompanhar e manter tudo sob controle.
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
                <CardTitle className="text-white">O que isso vai trazer para você</CardTitle>
                <CardDescription className="text-zinc-300">
                  Benefícios pensados para o seu dia a dia.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {[
                  'Mais facilidade para organizar ofertas',
                  'Mais rapidez para divulgar produtos',
                  'Mais constância nas postagens',
                  'Mais controle sobre envios e agendamentos',
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
                      title: 'Próximos benefícios',
                      description:
                        'Quando esse módulo for liberado, ele vai ajudar você a divulgar com mais consistência, economizar tempo e manter tudo mais organizado.',
                      icon: Rocket,
                    })
                  }
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  Ver benefícios
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
                  Recursos para criar, ajustar e reaproveitar ofertas sem perder tempo.
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
                  Recursos para ajudar você a divulgar mais, esquecer menos e manter frequência.
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
                  Por que isso pode fazer diferença
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Quanto mais organização e constância, maior a chance de crescer.
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
                  Entradas pensadas para facilitar seu uso.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <Button
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 font-bold text-black hover:from-emerald-400 hover:to-green-400"
                  onClick={() =>
                    setSelectedAction({
                      title: 'Ativação do BotTelegram',
                      description:
                        'Quando esse recurso estiver liberado, você poderá ter uma rotina de divulgação mais prática e organizada.',
                      icon: Bot,
                    })
                  }
                >
                  <Bot className="mr-2 h-4 w-4" />
                  Ativar módulo
                </Button>

                <Button
                  variant="outline"
                  className="h-12 w-full rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                  onClick={() =>
                    setSelectedAction({
                      title: 'Visão geral',
                      description:
                        'Essa área vai reunir funções que ajudam você a divulgar melhor e manter mais consistência.',
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
                Este recurso ainda está em desenvolvimento. Quando for liberado, a ideia é ajudar você
                a divulgar com mais frequência, ganhar tempo e manter tudo mais organizado.
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