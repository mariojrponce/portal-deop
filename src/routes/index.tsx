import { createFileRoute, Link } from "@tanstack/react-router";
import { listLinks } from "@/lib/links.functions";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, Settings } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Portal de Sistemas DEOP" }] }),
  loader: async () => listLinks(),
  component: PortalPage,
});

function iniciais(titulo: string): string {
  return titulo
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/* Ciclo de acentos por card (hex conferidos em layout/cores/Cores Energisa 1.xlsx):
   Verde Água, Azul, Laranja[Logo] e Verde — dá variedade visual ao grid mesmo
   sem um campo de categoria no banco, inspirado nas tarjas coloridas do
   layout/principal/image.png. */
const ACCENTS = ["#00A6A5", "#009FC2", "#F37021", "#71BF54"];

function PortalPage() {
  const links = Route.useLoaderData();

  return (
    <div className="min-h-screen">
      <header className="px-6 py-12 text-center sm:py-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-secondary">
          DEOP
        </span>
        <h1 className="mt-4 bg-gradient-to-r from-primary via-orange-300 to-secondary bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
          Portal de Sistemas
        </h1>
        <p className="mt-2 text-muted-foreground">Acesso centralizado aos sistemas da equipe</p>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {links.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhum sistema cadastrado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {links.map((link, i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <Card className="h-full overflow-hidden border-white/10 transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl">
                    <div className="h-1 w-full" style={{ backgroundColor: accent }} />
                    <CardContent className="flex h-full flex-col gap-4 p-5">
                      <div className="flex items-start justify-between">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold"
                          style={{ backgroundColor: `${accent}26`, color: accent }}
                        >
                          {link.icone || iniciais(link.titulo)}
                        </div>
                        <ArrowUpRight
                          className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                          style={{ color: accent }}
                        />
                      </div>

                      <div>
                        <h2 className="font-semibold leading-tight">{link.titulo}</h2>
                        {link.descricao && (
                          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                            {link.descricao}
                          </p>
                        )}
                      </div>

                      <div
                        className="mt-auto flex items-center gap-1.5 pt-1 text-xs font-semibold"
                        style={{ color: accent }}
                      >
                        Acessar sistema
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </CardContent>
                  </Card>
                </a>
              );
            })}
          </div>
        )}
      </main>

      <Link
        to="/login"
        className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full border border-white/10 bg-card/70 px-4 py-2 text-xs text-muted-foreground shadow-lg backdrop-blur-md hover:text-foreground"
      >
        <Settings className="h-3.5 w-3.5" /> Área administrativa
      </Link>
    </div>
  );
}
