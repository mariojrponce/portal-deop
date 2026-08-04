import { createFileRoute, Link } from "@tanstack/react-router";
import { listLinks } from "@/lib/links.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

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

function PortalPage() {
  const links = Route.useLoaderData();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-6 py-8 text-center sm:py-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Portal de Sistemas DEOP</h1>
        <p className="mt-2 text-muted-foreground">Acesso centralizado aos sistemas da equipe</p>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {links.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhum sistema cadastrado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {links.map((link) => (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">
                <Card className="h-full border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lg hover:shadow-primary/10">
                  <CardContent className="flex flex-col items-start gap-3 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                      {link.icone || iniciais(link.titulo)}
                    </div>
                    <div>
                      <h2 className="font-semibold leading-tight">{link.titulo}</h2>
                      {link.descricao && (
                        <p className="mt-1 text-sm text-muted-foreground">{link.descricao}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}
      </main>

      <Link
        to="/login"
        className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground shadow-lg hover:text-foreground"
      >
        <Settings className="h-3.5 w-3.5" /> Área administrativa
      </Link>
    </div>
  );
}
