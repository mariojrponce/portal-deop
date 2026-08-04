import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifyPassword, createAdminSession, destroyAdminSession, getCurrentAdminId } from "@/lib/auth.server";
import type { AdminRow } from "@/lib/db.server";

export const login = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ email: z.string().trim().toLowerCase().email(), senha: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db.server");
    const admin = db
      .query("SELECT * FROM admins WHERE email = ?")
      .get(data.email) as AdminRow | undefined;
    if (!admin) throw new Error("E-mail ou senha inválidos.");

    const ok = await verifyPassword(data.senha, admin.password_hash);
    if (!ok) throw new Error("E-mail ou senha inválidos.");

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
    .query("SELECT id, email, nome FROM admins WHERE id = ?")
    .get(adminId) as Pick<AdminRow, "id" | "email" | "nome"> | undefined;
  return admin ?? null;
});
