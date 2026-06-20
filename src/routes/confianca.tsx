import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Lock, Database, UserCog, Mail } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/confianca")({
  head: () => ({
    meta: [
      { title: "Confiança & Privacidade — Destilados & Coquetéis" },
      {
        name: "description",
        content:
          "Como protegemos os dados do catálogo de coquetéis: autenticação, controle de acesso, armazenamento e privacidade.",
      },
      { property: "og:title", content: "Confiança & Privacidade — Destilados & Coquetéis" },
      {
        property: "og:description",
        content:
          "Como protegemos os dados do catálogo de coquetéis: autenticação, controle de acesso, armazenamento e privacidade.",
      },
    ],
  }),
  component: TrustPage,
});

function TrustPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Confiança</p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground">
            Segurança & Privacidade
          </h1>
          <p className="text-sm text-muted-foreground">
            Esta página é mantida pelos responsáveis do <strong>Destilados & Coquetéis</strong>{" "}
            para responder dúvidas comuns sobre como o catálogo é operado. O conteúdo descreve
            práticas atuais do aplicativo e não constitui certificação independente.
          </p>
        </header>

        <Section
          icon={<UserCog className="h-5 w-5" />}
          title="Acesso e autenticação"
        >
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Visitantes navegam o catálogo em <strong>modo somente leitura</strong>, sem necessidade
              de cadastro.
            </li>
            <li>
              Edição de drinks, ingredientes e categorias exige login e papel de{" "}
              <strong>editor</strong> ou <strong>administrador</strong>.
            </li>
            <li>
              Login via e-mail e senha ou Google. Senhas nunca trafegam em texto claro e são
              gerenciadas pelo provedor de identidade (Lovable Cloud / Supabase Auth).
            </li>
            <li>
              Gestão de usuários e papéis é restrita a administradores.
            </li>
          </ul>
        </Section>

        <Section
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Controle de acesso aos dados"
        >
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Row-Level Security (RLS) está ativa em todas as tabelas do aplicativo.
            </li>
            <li>
              Cada usuário só consegue ler o próprio perfil. E-mails de outros usuários não são
              expostos para usuários comuns.
            </li>
            <li>
              Operações de criação, edição e exclusão são bloqueadas para quem não tem permissão,
              tanto no banco quanto nas funções de servidor.
            </li>
          </ul>
        </Section>

        <Section
          icon={<Database className="h-5 w-5" />}
          title="Dados que coletamos"
        >
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Conta:</strong> e-mail, nome de exibição e papel atribuído.
            </li>
            <li>
              <strong>Conteúdo:</strong> drinks, ingredientes, categorias e imagens cadastradas
              pelos editores.
            </li>
            <li>
              Não coletamos dados de pagamento e não vendemos informações a terceiros.
            </li>
          </ul>
        </Section>

        <Section
          icon={<Lock className="h-5 w-5" />}
          title="Armazenamento e infraestrutura"
        >
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Banco de dados e autenticação rodam sobre Lovable Cloud (Supabase), com tráfego em
              HTTPS.
            </li>
            <li>
              Imagens dos drinks ficam em um bucket privado e são exibidas por meio de URLs
              assinadas de curta duração.
            </li>
            <li>
              Apenas editores autenticados podem enviar, substituir ou remover imagens.
            </li>
          </ul>
        </Section>

        <Section
          icon={<Mail className="h-5 w-5" />}
          title="Contato e remoção de dados"
        >
          <p>
            Para solicitar exclusão da sua conta, correção de dados ou reportar um problema de
            segurança, fale com o responsável pelo aplicativo. Trataremos a solicitação assim que
            possível.
          </p>
        </Section>

        <p className="text-xs text-muted-foreground pt-4 border-t border-border">
          Última revisão: junho de 2026. Voltar para a{" "}
          <Link to="/" className="text-primary underline">página inicial</Link>.
        </p>
      </main>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-3">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <h2 className="font-serif text-xl text-foreground">{title}</h2>
      </div>
      <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}
