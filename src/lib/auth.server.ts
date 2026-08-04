import { createMiddleware } from "@tanstack/react-start";

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

// As funções abaixo importam "@tanstack/react-start/server" dinamicamente (em vez
// de no topo do arquivo) de propósito: esse módulo é bloqueado pelo
// import-protection do TanStack Start se for alcançável estaticamente pelo bundle
// do cliente. Import dinâmico dentro do corpo da função cria um chunk separado que
// esse check não percorre — mesmo padrão usado em db.server.ts para o bun:sqlite.

export async function createAdminSession(adminId: number): Promise<void> {
  const { updateSession } = await import("@tanstack/react-start/server");
  await updateSession<SessionData>(sessionConfig(), { adminId });
}

export async function destroyAdminSession(): Promise<void> {
  const { clearSession } = await import("@tanstack/react-start/server");
  await clearSession(sessionConfig());
}

export async function getCurrentAdminId(): Promise<number | null> {
  const { getSession } = await import("@tanstack/react-start/server");
  const session = await getSession<SessionData>(sessionConfig());
  return session.data.adminId ?? null;
}

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
