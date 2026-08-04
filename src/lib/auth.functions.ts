import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  verifyPassword,
  hashPassword,
  createAdminSession,
  destroyAdminSession,
  getCurrentAdminId,
  requireAdminAuth,
} from "@/lib/auth.server";
import type { AdminRow } from "@/lib/db.server";

const loginSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(50)
  .regex(/^[a-z0-9._-]+$/, "Use apenas letras, números, ponto, hífen ou underline.");

export const login = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ login: loginSchema, senha: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db.server");
    const admin = db
      .query("SELECT * FROM admins WHERE login = ?")
      .get(data.login) as AdminRow | undefined;
    if (!admin) throw new Error("Usuário ou senha inválidos.");

    const ok = await verifyPassword(data.senha, admin.password_hash);
    if (!ok) throw new Error("Usuário ou senha inválidos.");

    await createAdminSession(admin.id);
    return { ok: true, nome: admin.nome };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  await destroyAdminSession();
  return { ok: true };
});

export const getSessionAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const adminId = await getCurrentAdminId();
  if (!adminId) return null;
  const { db } = await import("@/lib/db.server");
  const admin = db
    .query("SELECT id, login, nome FROM admins WHERE id = ?")
    .get(adminId) as Pick<AdminRow, "id" | "login" | "nome"> | undefined;
  return admin ?? null;
});

export const changeMyPassword = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input) =>
    z
      .object({
        senhaAtual: z.string().min(1),
        senhaNova: z.string().min(8).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { db } = await import("@/lib/db.server");
    const admin = db
      .query("SELECT * FROM admins WHERE id = ?")
      .get(context.adminId) as AdminRow | undefined;
    if (!admin) throw new Error("Admin não encontrado.");

    const ok = await verifyPassword(data.senhaAtual, admin.password_hash);
    if (!ok) throw new Error("Senha atual incorreta.");

    const password_hash = await hashPassword(data.senhaNova);
    db.query("UPDATE admins SET password_hash = ? WHERE id = ?").run(password_hash, admin.id);
    return { ok: true };
  });
