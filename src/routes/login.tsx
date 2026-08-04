import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { login, getSessionAdmin } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login administrativo — Portal DEOP" }] }),
  beforeLoad: async () => {
    const admin = await getSessionAdmin();
    if (admin) throw redirect({ to: "/admin" });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const loginFn = useServerFn(login);
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginFn({ data: { login: usuario, senha } });
      navigate({ to: "/admin" });
    } catch (err: any) {
      toast.error(err.message ?? "E-mail ou senha inválidos.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader>
          <CardTitle className="text-center text-xl">Área administrativa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Usuário</Label>
              <Input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Senha</Label>
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
