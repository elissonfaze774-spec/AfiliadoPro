import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Command,
  DollarSign,
  Gift,
  Lock,
  Megaphone,
  MessageSquareText,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

type FeatureItem = {
  title: string;
  description: string;
  icon: any;
  actionLabel: string;
  badge?: string;
  featured?: boolean;
};

function FeatureCard({
  item,
  onAction,
}: {
  item: FeatureItem;
  onAction: (title: string, description: string) => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onAction(item.title, item.description)}
      className={`group relative w-full overflow-hidden rounded-[28px] border p-5 text-left transition duration-300 hover:-translate-y-1 ${
        item.featured
          ? 'border-emerald-500/25 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_40%),linear-gradient(180deg,rgba(4,18,12,0.96)_0%,rgba(5,5,5,0.98)_100%)] shadow-[0_18px_50px_rgba(16,185,129,0.12)]'
          : 'border-white/10 bg-black/30 hover:border-emerald-500/20 hover:bg-black/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
            item.featured
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
              : 'border-white/10 bg-white/5 text-emerald-300'
          }`}
        >
          <Icon className="h-6 w-6" />
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

      <h3 className="mt-5 text-xl font-black text-white">{item.title}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{item.description}</p>

      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
        {item.actionLabel}
        <ChevronRight className="h-4 w-4" />
      </div>
    </button>
  );
}

export default function BotTelegram() {
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const openDevelopmentModal = (title: string, description: string) => {
    setActiveModal({
      title,
      description,
    });
  };

  const coreModules = useMemo<FeatureItem[]>(
    () => [
      {
        title: 'Postagens automáticas',
        description:
          'Automação de campanhas, ofertas do dia e sequências de divulgação direto no Telegram.',
        icon: Send,
        actionLabel: 'Ativar módulo',
        badge: 'premium',
        featured: true,
      },
      {
        title: 'Comandos do admin',
        description:
          'Área para o admin controlar campanhas, links, promoções e status do bot sem complicação.',
        icon: Command,
        actionLabel: 'Ver comandos',
      },
      {
        title: 'Painel do super admin',
        description:
          'Controle global para liberar recursos, enviar avisos e acompanhar utilização das lojas.',
        icon: ShieldCheck,
        actionLabel: 'Abrir painel',
      },
      {
        title: 'Alertas inteligentes',
        description:
          'Avisos de campanha, lembretes de divulgação e notificações leves para aumentar constância.',
        icon: Bell,
        actionLabel: 'Ver fluxo',
      },
    ],
    [],
  );

  const adminCommands = useMemo<FeatureItem[]>(
    () => [
      {
        title: '/status',
        description: 'Mostra o resumo do bot, campanhas ativas e situação atual da automação.',
        icon: BarChart3,
        actionLabel: 'Testar comando',
      },
      {
        title: '/ofertas',
        description: 'Abre a área de ofertas prontas para divulgação em grupos e canais.',
        icon: Megaphone,
        actionLabel: 'Abrir comando',
      },
      {
        title: '/campanha',
        description: 'Cria campanhas rápidas para um produto, nicho ou ação específica.',
        icon: Rocket,
        actionLabel: 'Montar campanha',
      },
      {
        title: '/link',
        description: 'Entrega rapidamente o link da loja, produtos e páginas estratégicas.',
        icon: MessageSquareText,
        actionLabel: 'Visualizar resposta',
      },
      {
        title: '/bonus',
        description: 'Área futura para campanhas-relâmpago, sorteios e ofertas especiais.',
        icon: Gift,
        actionLabel: 'Ver recurso',
      },
      {
        title: '/suporte',
        description: 'Canal rápido para pedir ajuda ou consultar instruções dentro do módulo.',
        icon: Users,
        actionLabel: 'Abrir suporte',
      },
    ],
    [],
  );

  const superAdminCommands = useMemo<FeatureItem[]>(
    () => [
      {
        title: 'Liberar módulo por loja',
        description: 'Ativação individual do BotTelegram para admins premium.',
        icon: Lock,
        actionLabel: 'Configurar liberação',
      },
      {
        title: 'Disparar aviso oficial',
        description: 'Mensagem oficial do AfiliadoPRO para novidades, melhorias e manutenção.',
        icon: Bell,
        actionLabel: 'Enviar aviso',
      },
      {
        title: 'Gerenciar comandos',
        description: 'Painel para editar respostas, estrutura de fluxo e prioridades do módulo.',
        icon: Workflow,
        actionLabel: 'Gerenciar estrutura',
      },
      {
        title: 'Acompanhar valor gerado',
        description: 'Visão estratégica do impacto do módulo na retenção e percepção de valor.',
        icon: DollarSign,
        actionLabel: 'Ver métricas',
      },
    ],
    [],
  );

  const futureBenefits = useMemo(
    () => [
      {
        title: 'Mais valor percebido',
        description: 'O admin sente que está usando um produto muito maior e mais profissional.',
        icon: Sparkles,
      },
      {
        title: 'Mais retenção',
        description: 'Módulos visíveis e avançados ajudam o cliente a querer continuar pagando.',
        icon: CheckCircle2,
      },
      {
        title: 'Mais constância',
        description: 'O bot ajudará o admin a divulgar com mais frequência e menos travamento.',
        icon: Clock3,
      },
      {
        title: 'Mais escala',
        description: 'No futuro o super admin poderá liberar, limitar e vender o recurso como extra.',
        icon: ShieldCheck,
      },
    ],
    [],
  );

  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.08),_transparent_20%),linear-gradient(180deg,_#020202_0%,_#050505_46%,_#08120d_100%)] text-white">
        <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                    novo módulo
                  </span>
                  <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300">
                    em desenvolvimento
                  </span>
                </div>

                <h1 className="text-3xl font-black md:text-4xl">BotTelegram</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
                  Uma área premium para transformar o AfiliadoPRO em algo ainda maior.
                  Visual profissional, comandos estratégicos, automações futuras e muito mais valor percebido.
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
                    openDevelopmentModal(
                      'Ativação do BotTelegram',
                      'A ativação ainda está em desenvolvimento. A estrutura visual já foi preparada para aumentar o valor percebido do módulo.',
                    )
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
            <Card className="overflow-hidden border-emerald-500/20 bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1.2fr)_380px] md:p-8">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
                    <Bot className="h-4 w-4" />
                    Telegram + automação + escala
                  </div>

                  <h2 className="max-w-3xl text-3xl font-black leading-tight md:text-5xl">
                    Uma área que faz o admin sentir que está dentro de um produto gigante
                  </h2>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
                    O módulo BotTelegram foi pensado para elevar a percepção de valor do AfiliadoPRO,
                    preparando espaço para automação profissional, comandos visuais, acompanhamento estratégico
                    e futuras liberações premium por admin.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button
                      className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 font-bold text-black hover:from-emerald-400 hover:to-green-400"
                      onClick={() =>
                        openDevelopmentModal(
                          'Conectar bot',
                          'A conexão oficial com Telegram ainda está em desenvolvimento, mas a estrutura premium do módulo já está pronta.',
                        )
                      }
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Conectar bot
                    </Button>

                    <Button
                      variant="outline"
                      className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                      onClick={() =>
                        openDevelopmentModal(
                          'Ver comandos',
                          'Os comandos visuais do admin e do super admin ainda estão em desenvolvimento.',
                        )
                      }
                    >
                      <Command className="mr-2 h-4 w-4" />
                      Ver comandos
                    </Button>

                    <Button
                      variant="outline"
                      className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                      onClick={() =>
                        openDevelopmentModal(
                          'Roadmap do módulo',
                          'O roadmap completo do BotTelegram ainda está em desenvolvimento.',
                        )
                      }
                    >
                      <Workflow className="mr-2 h-4 w-4" />
                      Ver roadmap
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-1">
                  <div className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
                      status atual
                    </p>
                    <p className="mt-3 text-2xl font-black text-white">Interface premium pronta</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      Estrutura visual forte para agregar valor agora e liberar a automação depois.
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-black/30 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-300">
                      objetivo
                    </p>
                    <p className="mt-3 text-2xl font-black text-white">Retenção + percepção</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Mais presença de produto, mais diferencial e mais motivo para o admin valorizar o SaaS.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {coreModules.map((item) => (
              <FeatureCard
                key={item.title}
                item={item}
                onAction={openDevelopmentModal}
              />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Command className="h-5 w-5 text-emerald-400" />
                  Comandos visuais do admin
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Tudo pensado para facilitar a divulgação e acelerar a rotina do admin.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {adminCommands.map((item) => (
                  <FeatureCard
                    key={item.title}
                    item={item}
                    onAction={openDevelopmentModal}
                  />
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  Comandos do super admin
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Estrutura futura para controle global do módulo dentro do AfiliadoPRO.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {superAdminCommands.map((item) => (
                  <FeatureCard
                    key={item.title}
                    item={item}
                    onAction={openDevelopmentModal}
                  />
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  Benefícios futuros do módulo
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Não é só um bot. É um diferencial de produto.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {futureBenefits.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-[28px] border border-white/10 bg-black/20 p-5"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-emerald-300">
                        <Icon className="h-5 w-5" />
                      </div>

                      <h3 className="mt-4 text-lg font-black text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{item.description}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_35%),linear-gradient(180deg,rgba(4,18,12,0.98)_0%,rgba(5,5,5,0.98)_100%)]">
              <CardHeader>
                <CardTitle className="text-white">Resumo do módulo</CardTitle>
                <CardDescription className="text-zinc-300">
                  Posição atual do BotTelegram dentro do produto.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {[
                  'Página premium pronta para agregar valor imediato',
                  'Comandos visuais planejados para admin e super admin',
                  'Todos os botões preparados com fluxo de desenvolvimento',
                  'Estrutura pronta para futura ativação profissional',
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
                    openDevelopmentModal(
                      'Próxima etapa do BotTelegram',
                      'A próxima etapa oficial ainda está em desenvolvimento. A base visual e estratégica do módulo já está pronta no painel.',
                    )
                  }
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  Ver próxima etapa
                </Button>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>

      {activeModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-[32px] border border-emerald-500/20 bg-[#07110c] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              <Bot className="h-8 w-8" />
            </div>

            <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
              Em desenvolvimento
            </span>

            <h3 className="mt-4 text-2xl font-black text-white">{activeModal.title}</h3>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              {activeModal.description}
            </p>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-sm leading-6 text-zinc-400">
                Esta funcionalidade ainda está em desenvolvimento, mas a área já foi posicionada
                no AfiliadoPRO para aumentar o valor percebido do produto e preparar a ativação profissional futuramente.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 font-bold text-black hover:from-emerald-400 hover:to-green-400"
                onClick={() => setActiveModal(null)}
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