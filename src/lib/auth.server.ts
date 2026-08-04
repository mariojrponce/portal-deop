import { createMiddleware, createServerOnlyFn } from "@tanstack/react-start";

type SessionData = { adminId: number };

function sessionConfig() {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error(
      "SESSION_SECRET ausente ou curto demais (mínimo 32 caracteres). Configure no .env.",
    );
  }
  return {
    password,
    name: "portal_admin_session",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    cookie: { httpOnly: true, sameSite: "lax" as const, secure: true, path: "/" },
  };
}

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

// As funções abaixo usam createServerOnlyFn porque requireAdminAuth (que depende
// delas) precisa ser importável estaticamente por módulos client-reachable (é
// passado como valor em `.middleware([requireAdminAuth])` na definição de server
// functions) — então o arquivo inteiro entra no grafo estático do cliente. Sem
// createServerOnlyFn, o import de "@tanstack/react-start/server" abaixo seria
// alcançável pelo bundle do cliente e barrado pelo import-protection do
// TanStack Start; com createServerOnlyFn, o compilador remove a implementação
// do bundle do cliente (e lança erro se for chamada por engano no cliente).

export const createAdminSession = createServerOnlyFn(async (adminId: number): Promise<void> => {
  const { updateSession } = await import("@tanstack/react-start/server");
  await updateSession<SessionData>(sessionConfig(), { adminId });
});

export const destroyAdminSession = createServerOnlyFn(async (): Promise<void> => {
  const { clearSession } = await import("@tanstack/react-start/server");
  await clearSession(sessionConfig());
});

export const getCurrentAdminId = createServerOnlyFn(async (): Promise<number | null> => {
  const { getSession } = await import("@tanstack/react-start/server");
  const session = await getSession<SessionData>(sessionConfig());
  return session.data.adminId ?? null;
});

/** Middleware pra server functions que exigem admin logado. */
export const requireAdminAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const adminId = await getCurrentAdminId();
    if (!adminId) {
      throw new Error("Unauthorized: sessão de admin não encontrada.");
    }
    return next({ context: { adminId } });
  },
);
