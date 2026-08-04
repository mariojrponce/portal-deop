import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminAuth, hashPassword } from "@/lib/auth.server";
import type { LinkRow, AdminRow } from "@/lib/db.server";

/** Pública — sem auth. Usada pela página inicial e pelo painel admin. */
export const listLinks = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("@/lib/db.server");
  return db.query("SELECT * FROM links ORDER BY ordem ASC, id ASC").all() as LinkRow[];
});

export const createLink = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input) =>
    z
      .object({
        titulo: z.string().trim().min(1).max(100),
        url: z.string().trim().url().max(500),
        descricao: z.string().trim().max(300).optional(),
        icone: z.string().trim().max(10).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { db } = await import("@/lib/db.server");
    const maxOrdem = db.query("SELECT COALESCE(MAX(ordem), -1) AS m FROM links").get() as {
      m: number;
    };
    db.query(
      "INSERT INTO links (titulo, url, descricao, icone, ordem, criado_por) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(
      data.titulo,
      data.url,
      data.descricao || null,
      data.icone || null,
      maxOrdem.m + 1,
      context.adminId,
    );
    return { ok: true };
  });

export const updateLink = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.number().int(),
        titulo: z.string().trim().min(1).max(100),
        url: z.string().trim().url().max(500),
        descricao: z.string().trim().max(300).optional(),
        icone: z.string().trim().max(10).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db.server");
    db.query(
      "UPDATE links SET titulo = ?, url = ?, descricao = ?, icone = ?, updated_at = datetime('now') WHERE id = ?",
    ).run(data.titulo, data.url, data.descricao || null, data.icone || null, data.id);
    return { ok: true };
  });

export const deleteLink = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input) => z.object({ id: z.number().int() }).parse(input))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db.server");
    db.query("DELETE FROM links WHERE id = ?").run(data.id);
    return { ok: true };
  });

/** Troca a 'ordem' do link com o vizinho (pra cima ou pra baixo). */
export const moveLink = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input) =>
    z.object({ id: z.number().int(), direction: z.enum(["up", "down"]) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db.server");
    const current = db.query("SELECT id, ordem FROM links WHERE id = ?").get(data.id) as
      | { id: number; ordem: number }
      | undefined;
    if (!current) throw new Error("Link não encontrado.");

    const neighbor = db
      .query(
        data.direction === "up"
          ? "SELECT id, ordem FROM links WHERE ordem < ? ORDER BY ordem DESC LIMIT 1"
          : "SELECT id, ordem FROM links WHERE ordem > ? ORDER BY ordem ASC LIMIT 1",
      )
      .get(current.ordem) as { id: number; ordem: number } | undefined;
    if (!neighbor) return { ok: true }; // já é o primeiro/último, nada a fazer

    const tx = db.transaction(() => {
      db.query("UPDATE links SET ordem = ? WHERE id = ?").run(neighbor.ordem, current.id);
      db.query("UPDATE links SET ordem = ? WHERE id = ?").run(current.ordem, neighbor.id);
    });
    tx();
    return { ok: true };
  });

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    const { db } = await import("@/lib/db.server");
    return db
      .query("SELECT id, login, nome, created_at FROM admins ORDER BY created_at ASC")
      .all() as Omit<AdminRow, "password_hash">[];
  });

export const createAdmin = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input) =>
    z
      .object({
        login: z
          .string()
          .trim()
          .toLowerCase()
          .min(3)
          .max(50)
          .regex(/^[a-z0-9._-]+$/, "Use apenas letras, números, ponto, hífen ou underline."),
        nome: z.string().trim().min(1).max(200),
        senha: z.string().min(8).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db.server");
    const existing = db.query("SELECT id FROM admins WHERE login = ?").get(data.login);
    if (existing) throw new Error("Já existe um admin com esse login.");

    const password_hash = await hashPassword(data.senha);
    db.query("INSERT INTO admins (login, nome, password_hash) VALUES (?, ?, ?)").run(
      data.login,
      data.nome,
      password_hash,
    );
    return { ok: true };
  });
