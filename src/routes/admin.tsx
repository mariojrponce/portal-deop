import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { getSessionAdmin, logout } from "@/lib/auth.functions";
import {
  listLinks,
  listAdmins,
  createLink,
  updateLink,
  deleteLink,
  moveLink,
  createAdmin,
} from "@/lib/links.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, ArrowUp, ArrowDown, LogOut, UserPlus } from "lucide-react";

type LinkRow = {
  id: number;
  titulo: string;
  url: string;
  descricao: string | null;
  icone: string | null;
  ordem: number;
};

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Painel administrativo — Portal DEOP" }] }),
  beforeLoad: async () => {
    const admin = await getSessionAdmin();
    if (!admin) throw redirect({ to: "/login" });
    return { admin };
  },
  loader: async () => {
    const [links, admins] = await Promise.all([listLinks(), listAdmins()]);
    return { links, admins };
  },
  component: AdminPage,
});

function AdminPage() {
  const router = useRouter();
  const { admin } = Route.useRouteContext();
  const { links, admins } = Route.useLoaderData();

  const logoutFn = useServerFn(logout);
  const deleteFn = useServerFn(deleteLink);
  const moveFn = useServerFn(moveLink);

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LinkRow | null>(null);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = () => router.invalidate();

  const onLogout = async () => {
    await logoutFn();
    window.location.href = "/login";
  };

  const onDelete = async (link: LinkRow) => {
    if (!window.confirm(`Remover o link "${link.titulo}" do portal?`)) return;
    setBusyId(link.id);
    try {
      await deleteFn({ data: { id: link.id } });
      toast.success("Link removido.");
      await refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao remover link.");
    }
    setBusyId(null);
  };

  const onMove = async (link: LinkRow, direction: "up" | "down") => {
    setBusyId(link.id);
    try {
      await moveFn({ data: { id: link.id, direction } });
      await refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao reordenar.");
    }
    setBusyId(null);
  };

  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
        <div>
          <h1 className="text-xl font-bold">Painel administrativo</h1>
          <p className="text-sm text-muted-foreground">Logado como {admin.nome}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle>Links do portal</CardTitle>
            <Dialog
              open={linkDialogOpen}
              onOpenChange={(v) => {
                setLinkDialogOpen(v);
                if (!v) setEditing(null);
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setEditing(null)}>
                  <Plus className="h-4 w-4" /> Novo link
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editing ? "Editar link" : "Novo link"}</DialogTitle>
                </DialogHeader>
                <LinkForm
                  initial={editing}
                  onDone={async () => {
                    setLinkDialogOpen(false);
                    setEditing(null);
                    await refresh();
                  }}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-2">
            {links.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum link cadastrado ainda.</p>
            ) : (
              links.map((link: LinkRow, i: number) => (
                <div
                  key={link.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/40 p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium">{link.titulo}</div>
                    <div className="truncate text-xs text-muted-foreground">{link.url}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={i === 0 || busyId === link.id}
                      onClick={() => onMove(link, "up")}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={i === links.length - 1 || busyId === link.id}
                      onClick={() => onMove(link, "down")}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setEditing(link);
                        setLinkDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      disabled={busyId === link.id}
                      onClick={() => onDelete(link)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle>Administradores</CardTitle>
            <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <UserPlus className="h-4 w-4" /> Novo admin
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo administrador</DialogTitle>
                </DialogHeader>
                <AdminForm
                  onDone={async () => {
                    setAdminDialogOpen(false);
                    await refresh();
                  }}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-2">
            {admins.map((a: { id: number; email: string; nome: string }) => (
              <div
                key={a.id}
                className="rounded-lg border border-border bg-background/40 p-3 text-sm"
              >
                <span className="font-medium">{a.nome}</span>{" "}
                <span className="text-muted-foreground">— {a.email}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function LinkForm({
  initial,
  onDone,
}: {
  initial: LinkRow | null;
  onDone: () => void | Promise<void>;
}) {
  const createFn = useServerFn(createLink);
  const updateFn = useServerFn(updateLink);
  const [titulo, setTitulo] = useState(initial?.titulo ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [icone, setIcone] = useState(initial?.icone ?? "");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initial) {
        await updateFn({ data: { id: initial.id, titulo, url, descricao, icone } });
        toast.success("Link atualizado.");
      } else {
        await createFn({ data: { titulo, url, descricao, icone } });
        toast.success("Link criado.");
      }
      await onDone();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar link.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Título*</Label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={100} />
      </div>
      <div className="space-y-1.5">
        <Label>URL*</Label>
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>Descrição</Label>
        <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={300} />
      </div>
      <div className="space-y-1.5">
        <Label>Ícone (emoji, opcional)</Label>
        <Input value={icone} onChange={(e) => setIcone(e.target.value)} maxLength={10} placeholder="🔗" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
      </Button>
    </form>
  );
}

function AdminForm({ onDone }: { onDone: () => void | Promise<void> }) {
  const createFn = useServerFn(createAdmin);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createFn({ data: { email, nome, senha } });
      toast.success("Administrador criado.");
      setEmail("");
      setNome("");
      setSenha("");
      await onDone();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar admin.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Nome*</Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>E-mail*</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>Senha* (mínimo 8 caracteres)</Label>
        <Input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          minLength={8}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Criar administrador
      </Button>
    </form>
  );
}
